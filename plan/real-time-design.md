# Lieng — Real-time Communication Design

> **C4 Level**: 3 — Real-time Component Design

## 1. Chosen Approach: Socket.IO (Primary) + Polling (Fallback)

### Why Socket.IO
- Persistent connections survive page refresh within the same room
- Room-based multiplexing — server can broadcast to specific room
- Automatic reconnection with exponential backoff
- Works behind Vercel's serverless functions (via Railway)

### Why NOT SSE
- SSE is one-directional (server→client only) — need POST for betting actions anyway
- Socket.IO gives us bidirectional real-time without polling overhead

### Fallback: React Query Polling (3s interval)
- If Socket.IO disconnects unexpectedly, React Query kicks in
- Game state refetched every 3 seconds as backup

---

## 2. Socket.IO Connection Flow

```
1. User opens /room/482931
2. page.tsx mounts → useEffect → socket.connect()
3. socket.emit('join_room', { roomCode: '482931', playerId, playerName })
4. Server validates → emits 'room_joined' (confirm) or 'error'
5. socket.on('game_state_update', (game) => store.onReceiveStateUpdate(game))
6. socket.on('showdown', ({ winnerId, hands, pot }) → store.showShowdown(...))
7. On unmount / navigate away → socket.disconnect()
```

---

## 3. Room Isolation

- Each Socket.IO room maps 1:1 to a game room
- Server-side `socket.rooms` tracks active connections
- When a player disconnects: mark `connected: false`, emit `player_disconnected`
- When they reconnect: mark `connected: true`, emit `player_reconnected`
- Disconnected players retain their seat (don't fold automatically) for 2 minutes

---

## 4. Connection Stability

```typescript
// socket.ts — reconnection with exponential backoff
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,       // 1s, 2s, 4s, 8s...
  reconnectionDelayMax: 30000,
  timeout: 10000,
});

// Heartbeat: server sends 'ping' every 30s, client responds 'pong'
// If 3 missed pings → treat as disconnected, attempt reconnect
```

---

## 5. Event Flow — Full Round

```
Client                     Server                      MongoDB
  │                           │                           │
  │ create_room() ─────────►  │                           │
  │                     new Room ─────────────────────►  │
  │                           │                           │
  │ join_room()  ───────────► │                           │
  │                           │ update room ────────────► │
  │<─── room_joined ──────────│                           │
  │                           │                           │
  │ start_game() ───────────► │                           │
  │                     deal cards ───────────────────►  │
  │                     phase='betting1' ────────────►  │
  │<─── game_started ─────────│                           │
  │                           │                           │
  │ player_action(bet, 20) ─► │                           │
  │                     validate + apply ───────────►   ├──► updates game doc
  │<─── game_state_update ────│                           │
  │                           │                           │
  │ player_action(call) ─────►│                           │
  │<─── game_state_update ────│                           │
  │                           │                           │
  │ player_action(fold) ─────►│                           │
  │<─── game_state_update ────│                           │
  │                           │                           │
  │ (remaining players bet) ─►│                           │
  │<─── game_state_update ────│                           │
  │                           │                           │
  │ (all called / showdown) ─►│                           │
  │                     evaluate hands ───────────────►   │
  │                     result written ──────────────►   │
  │<─── showdown ─────────────│                           │
```
