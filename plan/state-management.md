# Lieng — State Management Design

> **C4 Level**: 3 — State Management Components

## 1. State Categories

### 1.1 Server State (Persisted — MongoDB)
- Room state (players, host, maxPlayers, status)
- Game state (deck, players[].hand, pot, currentBet, phase, actions/log)
- Player session stats (games won/lost)

### 1.2 Client State (Zustand — In-Memory)
- UI overlay state (modals, rulesVisible, showdownModal)
- My current betting input amount
- Connection status (connected/disconnected)
- Animation triggers

### 1.3 URL State
- Room code (`/room/482931`) — for shareability

---

## 2. Zustand Store (apps/web/src/store/gameStore.ts)

```typescript
interface GameState {
  // Core
  roomId: string | null;
  roomCode: string | null;
  gameId: string | null;
  playerId: string | null;

  // Players
  players: Player[];

  // Cards — NEVER revealed to other players
  myCards: string[];

  // Betting
  currentBet: number;    // amount to call
  myBetInput: number;   // user's draft bet amount
  pot: number;

  // Game flow
  phase: 'lobby' | 'betting1' | 'dealing' | 'betting2' | 'showdown';
  currentTurnIndex: number;
  dealerIndex: number;
  winner: string | null;  // playerId

  // UI
  connectedRules: boolean;
  showRules: boolean;
  showShowdown: boolean;
  toasts: Toast[];
}

interface GameActions {
  setRoom: (room: Room) => void;
  setGameFull: (game: GameState) => void;
  onReceiveStateUpdate: (game: GameState) => void;
  setMyCards: (cards: string[]) => void;
  setMyBetInput: (amount: number) => void;
  showShowdown: (winnerId: string, hands: Hand[]) => void;
  hideShowdown: () => void;
  toggleRules: () => void;
  addToast: (msg: string, type: 'success'|'error'|'info') => void;
  reset: () => void;
}
```

> **Security note**: `myCards` must never be shared via Socket.IO events with OTHER clients. Only set via `onReceiveStateUpdate` for the correct playerId.

---

## 3. React Query — Server State

```typescript
// Room polling (lobby)
const { data: rooms } = useQuery({
  queryKey: ['rooms'],
  queryFn: () => api.get('/rooms'),
  refetchInterval: 5000,
});

// Game state fetch (fallback if Socket.IO disconnects)
const { data: game } = useQuery({
  queryKey: ['game', gameId],
  queryFn: () => api.get(`/games/${gameId}`),
  refetchInterval: 3000,
  enabled: !!gameId,
});
```

---

## 4. Data Flow Summary

```
User action → Zustand dispatch → Socket.IO emit → server validates
                                                         ↓
                                            MongoDB write + broadcast
                                                         ↓
                              All clients receive game_state_update
                                    → React Query invalidation
                                            → Zustand onReceiveStateUpdate
                                            → UI re-renders
```
