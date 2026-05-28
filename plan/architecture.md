# Lieng — Container Architecture

> **C4 Level**: 2 — Container/Application Architecture

## 1. Monorepo Structure

```
lieng-trung/
├── apps/
│   ├── web/                  # Next.js 14 frontend
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx  # Lobby (SSG)
│   │   │   │   ├── globals.css
│   │   │   │   └── room/
│   │   │   │       └── [roomId]/
│   │   │   │           └── page.tsx  # Game room (client)
│   │   │   ├── components/
│   │   │   │   ├── ui/      # Generic UI primitives
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   └── Avatar.tsx
│   │   │   │   └── game/     # Lieng-specific components
│   │   │   │       ├── GameBoard.tsx       # 5-card display
│   │   │   │       ├── Card.tsx            # Individual card
│   │   │   │       ├── PlayerPanel.tsx     # Player info+status
│   │   │   │       ├── BettingControls.tsx # Bet/Call/Fold/Raise
│   │   │   │       ├── PotDisplay.tsx      # Current pot amount
│   │   │   │       ├── TurnIndicator.tsx   # Active turn
│   │   │   │       ├── RoomCard.tsx        # Lobby room listing
│   │   │   │       └── ShowdownModal.tsx  # Winner reveal
│   │   │   ├── lib/
│   │   │   │   ├── socket.ts              # Socket.IO client singleton
│   │   │   │   ├── player.ts              # Anonymous ID + nickname
│   │   │   │   └── api.ts                 # REST API client (axios)
│   │   │   ├── store/
│   │   │   │   └── gameStore.ts           # Zustand game state store
│   │   │   └── types/
│   │   │       └── index.ts               # Shared TS types
│   │   ├── public/
│   │   └── package.json
│   └── api/                  # FastAPI backend
│       ├── main.py           # FastAPI app entry + Socket.IO
│       ├── models/
│       │   ├── __init__.py
│       │   ├── room.py       # Room Pydantic models
│       │   └── game.py       # Game Pydantic models
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── rooms.py      # /api/rooms endpoints
│       │   └── games.py      # /api/games endpoints
│       ├── services/
│       │   ├── __init__.py
│       │   ├── room_service.py
│       │   ├── game_service.py
│       │   ├── deck_service.py   # Deck shuffle + deal
│       │   └── hand_evaluator.py  # Lieng hand ranking
│       ├── db/
│       │   ├── __init__.py
│       │   └── mongodb.py     # Motor async MongoDB client
│       ├── socket_events.py   # Socket.IO event handlers
│       └── requirements.txt
├── package.json             # Root Bun workspace
├── bun.lockb
├── tsconfig.base.json       # Shared TS configs
└── .gitignore
```

---

## 2. Frontend Architecture (apps/web — Next.js)

### 2.1 Pages/Routes
| Route | Type | Description |
|-------|------|-------------|
| `/` | SSG | Lobby: list public rooms, create/join buttons |
| `/room/[roomId]` | CSR | Main game page (Socket.IO connect on mount) |
| `/api/rooms` | Route Handler | Proxy to FastAPI `/api/rooms` |
| `/api/games/[gameId]` | Route Handler | Proxy to FastAPI `/api/games/[gameId]` |

> **Note**: Next.js web routes proxy REST calls to FastAPI backend to avoid CORS and keep API key secrets server-side. Socket.IO connects directly to FastAPI WebSocket endpoint.

### 2.2 Component Hierarchy

```
components/
├── ui/
│   ├── Button.tsx          # variant: primary|secondary|ghost|danger
│   ├── Modal.tsx           # accessible dialog overlay
│   ├── Card.tsx            # card container with hover states
│   ├── Input.tsx            # text input with label
│   ├── Badge.tsx           # status badge (in|out|playing)
│   └── Avatar.tsx          # auto-generated avatar (initials + color)
└── game/
    ├── GameBoard.tsx        # card hand layout (flex row)
    ├── Card.tsx            # card visual: rank + suit + CSS
    ├── PlayerPanel.tsx      # player name + pot contribution + status
    ├── BettingControls.tsx  # Bet/Call/Raise/Fold buttons
    ├── PotDisplay.tsx      # animated chip pile + pot amount
    ├── TurnIndicator.tsx    # pulsing border on active player panel
    ├── RoomCard.tsx         # lobby: room name, player count, join button
    ├── ShowdownModal.tsx    # reveal hands, announce winner
    ├── RulesOverlay.tsx     # first-time rules modal (skippable)
    └── Lobby.tsx            # main lobby container
```

### 2.3 State Management (Zustand)

```typescript
// store/gameStore.ts
interface GameState {
  roomId: string | null;
  gameId: string | null;
  playerId: string | null;
  players: Player[];
  myCards: string[];          // hidden until showdown
  currentBet: number;
  pot: number;
  phase: 'lobby' | 'betting1' | 'draw' | 'betting2' | 'showdown';
  currentTurnIndex: number;
  winner: number | null;
  lastAction: BetAction | null;
}

interface GameActions {
  setRoom: (roomId: string) => void;
  setGame: (game: GameState) => void;
  applyAction: (action: BetAction, playerId: string) => void;
  revealMyCards: () => void;  // set myCards from server data
  reset: () => void;
}
```

### 2.4 Player Identity Management

```typescript
// lib/player.ts
import { v4 as uuidv4 } from 'uuid';

const PLAYER_ID_KEY = 'lieng_player_id';
const PLAYER_NAME_KEY = 'lieng_player_name';

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getOrCreatePlayerName(): string {
  if (typeof window === 'undefined') return 'Anonymous';
  let name = localStorage.getItem(PLAYER_NAME_KEY);
  if (!name) {
    const adjectives = ['Hồng', 'Xanh', 'Vàng', 'Tím', 'Hổ', 'Rồng', 'Tiên', 'Quỷ'];
    const nouns = ['Mai', 'Lan', 'Hùng', 'Minh', 'Phượng', 'Long', 'Gấu', 'Mèo'];
    name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }
  return name;
}
```

---

## 3. Backend Architecture (apps/api — FastAPI)

### 3.1 REST API Endpoints

#### Room Endpoints
```
POST /api/rooms
  Body: { "name": str, "maxPlayers": 2..4, "isPrivate": bool }
  Returns: { "id": str, "code": str, ... }  // 6-digit room code

GET /api/rooms
  Returns: { "rooms": Room[] }  // public open rooms only

GET /api/rooms/{roomId}
  Returns: Room full detail (players, status, gameId)

POST /api/rooms/{roomId}/join
  Body: { "playerId": str, "playerName": str }
  Returns: { "success": true, "room": Room }

DELETE /api/rooms/{roomId}/leave
  Body: { "playerId": str }
  Returns: { "success": true }
```

#### Game Endpoints
```
POST /api/games
  Body: { "roomId": str }
  Returns: { "id": str, "game": GameState }  // host starts game

GET /api/games/{gameId}
  Returns: GameState (cards hidden — myCards only if my playerId)

POST /api/games/{gameId}/action
  Body: { "playerId": str, "action": "bet"|"call"|"raise"|"fold", "amount"?: number }
  Returns: { "success": true, "game": GameState }
```

### 3.2 Socket.IO Events

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomCode, playerId, playerName }` | Join a room by code |
| `create_room` | `{ playerId, playerName, maxPlayers }` | Create new room |
| `player_action` | `{ gameId, playerId, action, amount? }` | Submit bet action |
| `start_game` | `{ roomCode, playerId }` | Host starts the game |
| `leave_room` | `{ roomCode, playerId }` | Leave room |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `room_joined` | `{ room, playerId }` | Confirms join |
| `room_update` | `{ room }` | Player list changed |
| `game_state_update` | `{ game: GameState }` | Full new state (after each action) |
| `game_started` | `{ game }` | Game has begun |
| `showdown` | `{ winnerId, hands, pot }` | All reveal + winner |
| `error` | `{ code, message }` | Validation/player's error |
| `player_disconnected` | `{ playerId }` | A player lost connection |

### 3.3 Data Models

#### Room (MongoDB Document)
```python
{
  "_id": ObjectId,
  "code": str,               # 6-digit join code, indexed unique
  "name": str,
  "host_id": str,            # player who created
  "max_players": int,        # 2..4
  "players": [
    {
      "id": str,            # UUID from client
      "name": str,
      "connected": bool,
      "joined_at": datetime
    }
  ],
  "game_id": ObjectId | None,
  "status": str,            # "lobby" | "playing"
  "created_at": datetime,
  "updated_at": datetime
}
```

#### Game (MongoDB Document)
```python
{
  "_id": ObjectId,
  "room_id": ObjectId,
  "dealer_index": int,       # index into players array
  "deck": [str],            # remaining cards (server only)
  "players": [
    {
      "id": str,
      "name": str,
      "hand": [str],        # 5 cards, server only — NOT sent to other clients
      "bet_this_round": int,
      "total_bet": int,     # chips committed this game
      "status": str,        # "active" | "folded" | "called" | "all_in"
      "move_count": int
    }
  ],
  "community_cards": [str],  # hole cards in some Lieng variants
  "pot": int,
  "phase": str,             # "betting1" | "dealing" | "betting2" | "showdown"
  "current_turn_index": int,
  "actions_log": [{          # audit trail
    "player_id": str,
    "action": str,
    "amount": int | None,
    "timestamp": datetime
  }],
  "result": {
    "winner_id": str | None,
    "hands": dict | None,   # revealed at showdown
    "reason": str
  } | None,
  "started_at": datetime,
  "updated_at": datetime
}
```

### 3.4 Deck & Card System

- Standard 52-card deck: `2-10, J, Q, K, A` in 4 suits (`♣♦♥♠`)
- Cards encoded as strings: `"7h"`, `"Kd"`, `"As"` (rank + suit lowercase)
- Shuffle: Python's `secrets.randbits` Fisher-Yates
- Deal: Server removes from deck list, stores in player's `hand` array
- **CRITICAL**: `hand` field is NEVER sent to clients — only revealed at showdown

---

## 4. Deployment Architecture

```
┌─────────────────────────────────────────────┐
│  Cloudflare DNS + SSL                       │
│  - lieng-trung.vercel.app (web)            │
│  - lieng-api.uprailway.com (api)           │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴────────────────┐
        ▼                            ▼
┌───────────────────┐      ┌───────────────────────┐
│  Vercel (apps/web)│      │  Railway (apps/api)    │
│  - Next.js SSR     │      │  - FastAPI + Socket.IO │
│  - Static assets   │      │  - uvicorn worker      │
│  - Auto-scale      │      │  - Persistent compute  │
└───────────────────┘      └───────────┬───────────┘
                                       │
                                       ▼
                            ┌───────────────────────┐
                            │  MongoDB 10.60.184.61 │
                            │  :27017               │
                            │  LiengCardGame DB     │
                            └───────────────────────┘
```

### 4.1 Environment Variables
```
# apps/web (.env.local)
NEXT_PUBLIC_API_URL=https://lieng-api.uprailway.com
NEXT_PUBLIC_SOCKET_URL=https://lieng-api.uprailway.com

# apps/api (.env)
MONGODB_URL=mongodb://10.60.184.61:27017
MONGODB_DB_NAME=LiengCardGame
CORS_ORIGIN=https://lieng-trung.vercel.app
```
