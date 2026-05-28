# Lieng — Database Schema Design

> **C4 Level**: 3 — Component Specification (Database)

## 1. Database Overview

- **Database**: MongoDB 6.x (standalone, not Atlas — IP: 10.60.184.61:27017)
- **Driver**: Motor 3.x (async PyMongo driver for FastAPI)
- **Database Name**: `LiengCardGame`
- **ODM**: Raw PyMongo documents (no Mongoose — this is Python/FastAPI)

### 1.1 Collections Summary
| Collection | Purpose | Est. Doc Size | Growth |
|-----------|---------|---------------|--------|
| `rooms` | Active game rooms | ~800B | ~50/day |
| `games` | Active + recently finished games | ~4KB | ~100/day |
| `players` | Player sessions (w/l, nickname, avatar) | ~200B | ~500/day unique |

## 2. Schema Definitions

### 2.1 Rooms Collection

```python
# apps/api/db/mongodb.py
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://10.60.184.61:27017")
db = client["LiengCardGame"]

rooms_collection = db["rooms"]

# Indexes
await rooms_collection.create_index("code", unique=True)          # 6-digit join code
await rooms_collection.create_index("status")                      # lobby / playing
await rooms_collection.create_index("created_at")                 # TTL cleanup sort
```

```python
# apps/api/models/room.py
from pydantic import BaseModel\nfrom typing import Optional\nfrom datetime import datetime\n\nclass PlayerRef(BaseModel):
    id: str\n    name: str\n    connected: bool = True\n    joined_at: datetime = datetime.utcnow()\n\nclass Room(BaseModel):
    id: Optional[str] = None  # MongoDB _id as string\n    code: str               # 6-digit numeric\n    name: str\n    host_id: str\n    max_players: int = 4\n    players: list[PlayerRef] = []\n    game_id: Optional[str] = None\n    status: str = \"lobby\"   # lobby | playing | finished\n    created_at: datetime = datetime.utcnow()\n    updated_at: datetime = datetime.utcnow()\n\nclass CreateRoomRequest(BaseModel):
    name: str\n    host_id: str\n    host_name: str\n    max_players: int = 4\n    is_private: bool = False"
```

**Document shape in MongoDB:**
```json
{
  "_id": ObjectId("..."),
  "code": "482931",
  "name": "Phòng của Minh",
  "host_id": "uuid-v4",
  "max_players": 4,
  "players": [
    { "id": "uuid", "name": "Minh", "connected": true, "joined_at": ISODate(...) }
  ],
  "game_id": null,
  "status": "lobby",
  "created_at": ISODate("..."),
  "updated_at": ISODate("...")
}
```

### 2.2 Games Collection

```python
# apps/api/models/game.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GamePlayer(BaseModel):
    id: str
    name: str
    hand: list[str] = []         # server-only, never sent to client until showdown
    bet_this_round: int = 0
    total_bet: int = 0
    status: str = "active"        # active | folded | called | all_in
    move_count: int = 0

class ActionLogEntry(BaseModel):
    player_id: str
    action: str                   # bet | call | raise | fold
    amount: Optional[int] = None
    timestamp: datetime = datetime.utcnow()

class GameResult(BaseModel):
    winner_id: Optional[str] = None
    hands: Optional[dict] = None  # player_id -> [card list] revealed at showdown
    reason: str = ""

class Game(BaseModel):
    id: Optional[str] = None
    room_id: str
    dealer_index: int = 0
    deck: list[str] = []          # server-only, remaining cards
    players: list[GamePlayer] = []
    community_cards: list[str] = []  # hole cards (if variant uses them)
    pot: int = 0
    phase: str = "waiting"         # waiting | betting1 | dealing | betting2 | showdown
    current_turn_index: int = 0
    current_bet: int = 0           # amount to call
    min_bet: int = 10              # minimum bet size (ante)
    actions_log: list[ActionLogEntry] = []
    result: Optional[GameResult] = None
    started_at: Optional[datetime] = None
    updated_at: datetime = datetime.utcnow()

class BetActionRequest(BaseModel):
    player_id: str
    action: str                    # bet | call | raise | fold
    amount: Optional[int] = None  # required for bet/raise
```

**Document shape in MongoDB:**
```json
{
  "_id": ObjectId("..."),
  "room_id": ObjectId("..."),
  "dealer_index": 0,
  "deck": ["2c", "5d", "Th", ...],  // server-only — remaining deck
  "players": [
    {
      "id": "uuid",
      "name": "Minh",
      "hand": ["7h", "Kd", "As", "3c", "2d"],  // server-only
      "bet_this_round": 0,
      "total_bet": 0,
      "status": "active",
      "move_count": 0
    }
  ],
  "community_cards": ["Jh", "3s"],
  "pot": 0,
  "phase": "betting1",
  "current_turn_index": 1,
  "current_bet": 0,
  "min_bet": 10,
  "actions_log": [
    { "player_id": "uuid", "action": "bet", "amount": 10, "timestamp": ISODate("...") }
  ],
  "result": null,
  "started_at": null,
  "updated_at": ISODate("...")
}
```

### 2.3 Players Collection

```python
class PlayerSession(BaseModel):
    id: str                           # same as rooms/games player id
    name: str
    avatar_seed: str                  # for auto-generated avatar
    games_played: int = 0
    games_won: int = 0
    total_winnings: int = 0
    created_at: datetime = datetime.utcnow()
    last_seen: datetime = datetime.utcnow()
```

## 3. Query Patterns & Indexes

| Query | Collection | Index |
|-------|-----------|-------|
| Get room by code | rooms | `code` (unique) |
| List open public rooms | rooms | `status=1` (no private filter needed — not returned) |
| Get active game by room | games | `room_id` |
| Count player's games | players | `id` (unique) |

```python
# apps/api/db/mongodb.py — index creation
async def setup_indexes():
    rooms = db["rooms"]
    games = db["games"]
    players = db["players"]

    await rooms.create_index("code", unique=True)
    await rooms.create_index("status")
    await rooms.create_index("created_at")

    await games.create_index("room_id")
    await games.create_index("started_at")

    await players.create_index("id", unique=True)
```

## 4. Data Retention & Cleanup

| Data | Retention | Auto-Delete |
|------|-----------|-------------|
| Active rooms | Until manually closed | No |
| Finished games | 7 days | TTL index on `updated_at` |
| Empty lobby rooms | 1 hour | TTL index on `updated_at` with status=lobby |
| Player sessions | 30 days inactive | TTL on `last_seen` |

---

## API Design

> **C4 Level**: 3 — Component Specification (API)

## 1. API Overview

**REST Base URL**: `https://lieng-api.uprailway.com/api`
**WebSocket**: `wss://lieng-api.uprailway.com`

All REST endpoints return JSON. Anonymous play — no Authorization header required.

## 2. REST Endpoints

### 2.1 Room Endpoints

#### `POST /api/rooms` — Create Room

**Request:**
```json
{
  "name": "Phòng vui vẻ",
  "host_id": "550e8400-e29b-41d4-a716-446655440000",
  "host_name": "Minh",
  "max_players": 4,
  "is_private": false
}
```

**Response `201`:**
```json
{
  "id": "665f1a2b3c4d5e6f7a8b9c0d1",
  "code": "482931",
  "name": "Phòng vui vẻ",
  "host_id": "550e8400-e29b-41d4-a716-446655440000",
  "max_players": 4,
  "players": [
    { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "Minh", "connected": true, "joined_at": "2026-05-29T10:00:00Z" }
  ],
  "game_id": null,
  "status": "lobby",
  "share_url": "https://lieng-trung.vercel.app/room/482931"
}
```

#### `GET /api/rooms` — List Open Public Rooms

**Response `200`:**
```json
{
  "rooms": [
    {
      "id": "665f1a2b3c4d5e6f7a8b9c0d1",
      "code": "482931",
      "name": "Phòng vui vẻ",
      "max_players": 4,
      "players": [ { "id": "...", "name": "Minh", "connected": true } ],
      "status": "lobby"
    }
  ]
}
```

#### `GET /api/rooms/{roomId}` — Get Room

**Response `200`:** Full room object (same shape as create response above).

#### `POST /api/rooms/{roomId}/join` — Join Room

**Request:**
```json
{
  "player_id": "660e8400-e29b-41d4-a716-446655440001",
  "player_name": "Lan"
}
```

**Response `200`:**
```json
{
  "success": true,
  "room": { ...full room object... },
  "player_index": 1
}
```

**Error `409` (room full):**
```json
{
  "success": false,
  "error": "ROOM_FULL",
  "message": "This room is already full"
}
```

#### `DELETE /api/rooms/{roomId}/leave` — Leave Room

**Request:**
```json
{
  "player_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response `200`:**
```json
{
  "success": true
}
```

### 2.2 Game Endpoints

#### `POST /api/games` — Start Game (from room)

**Request:**
```json
{
  "room_id": "665f1a2b3c4d5e6f7a8b9c0d1"
}
```

**Response `201`:**
```json
{
  "id": "675f1a2b3c4d5e6f7a8b9c0d2",
  "room_id": "665f1a2b3c4d5e6f7a8b9c0d1",
  "players": [
    { "id": "550e...", "name": "Minh", "hand": [], "total_bet": 0, "status": "active", "move_count": 0 }
  ],
  "phase": "betting1",
  "pot": 0,
  "current_bet": 0,
  "current_turn_index": 0,
  "min_bet": 10,
  "actions_log": []
}
```

Notes:
- Cards are dealt ON the server at this point — stored in `deck` and each player's `hand`
- Phase set to `betting1`, dealer_index set based on host position
- Room status moved to `playing`

#### `GET /api/games/{gameId}` — Get Game State

**Response `200`:**
```json
{
  "id": "...",
  "room_id": "...",
  "players": [
    {
      "id": "550e...",
      "name": "Minh",
      "hand": [],   // always empty — cards only sent when playerId matches
      "total_bet": 20,
      "status": "active",
      "move_count": 2,
      "bet_this_round": 10
    }
  ],
  "phase": "betting2",
  "pot": 140,
  "current_bet": 20,
  "current_turn_index": 2,
  "min_bet": 10,
  "actions_log": [...]
}
```

**Privacy logic**: Server looks at `X-Player-ID` header. If it matches a player in the game, that player's `hand` is included in the response.

#### `POST /api/games/{gameId}/action` — Submit Betting Action

**Request:**
```json
{
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "call",
  "amount": null
}
```

OR for a bet:
```json
{
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "bet",
  "amount": 20
}
```

**Response `200`:**
```json
{
  "success": true,
  "game": { ...updated game state... },
  "action_result": { "accepted": true, "new_pot": 30, "new_current_bet": 20 }
}
```

**Error `400`:**
```json
{
  "success": false,
  "error": "NOT_YOUR_TURN",
  "message": "It is not your turn to act"
}
```

### 2.3 Error Codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | INVALID_REQUEST | Malformed request body |
| 400 | NOT_YOUR_TURN | Player trying to act out of turn |
| 400 | INSUFFICIENT_CHIPS | Bet amount exceeds player's stack |
| 400 | INVALID_ACTION | Action not valid in current phase |
| 403 | ALREADY_FOLDED | Player already folded |
| 403 | GAME_NOT_ACTIVE | Game already finished |
| 404 | ROOM_NOT_FOUND | Room code/ID doesn't exist |
| 404 | GAME_NOT_FOUND | Game ID doesn't exist |
| 409 | ROOM_FULL | Cannot join — at max players |
| 409 | PLAYER_ALREADY_JOINED | This player already in room |
| 429 | RATE_LIMITED | Too many requests |

### 2.4 Socket.IO Event Reference

#### Client Emits
| Event | Payload | Server Action |
|-------|---------|---------------|
| `join_room` | `{ roomCode, playerId, playerName }` | Verify room, add player, broadcast `room_update` |
| `create_room` | `{ playerId, playerName, maxPlayers, name }` | Create room, emit `room_joined` |
| `start_game` | `{ roomCode, playerId }` | Validates host, deals cards, transitions to `betting1` |
| `player_action` | `{ gameId, playerId, action, amount }` | Validates & applies betting action, broadcasts `game_state_update` |
| `leave_room` | `{ roomCode, playerId }` | Remove player, broadcast `room_update` |

#### Server Emits
| Event | Payload | Trigger |
|-------|---------|---------|
| `room_joined` | `{ room, playerId }` | Player successfully joins |
| `room_update` | `{ room }` | Anyone joins/leaves |
| `game_started` | `{ game }` | Host starts game |
| `game_state_update` | `{ game }` | After every betting action |
| `turn_changed` | `{ currentTurnIndex, playerId }` | Active player's turn changes |
| `showdown` | `{ winnerId, hands: {playerId: [cards]}, pot, reason }` | Showdown phase triggered |
| `error` | `{ code, message }` | Any invalid action |
| `player_disconnected` | `{ playerId }` | Socket.IO disconnect detected |

---

## Component Spec

> **C4 Level**: 3 — Component Specifications

## 1. Atomic UI Components

### 1.1 Button
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```
Style variants:
- `primary`: bg-emerald-600, white text, hover:bg-emerald-700
- `secondary`: bg-slate-700, white text
- `ghost`: transparent bg, hover:bg-slate-800
- `danger`: bg-red-600, white text

### 1.2 Card (game card — playing card)
```typescript
interface CardProps {
  rank: string;    // "2"-"10", "J", "Q", "K", "A"
  suit: string;    // F, ♦, ♥, ♠ as unicode
  faceDown?: boolean;  // shows card back pattern
  size?: 'sm' | 'md' | 'lg';
}
```
Visual: Rounded corners (0.375rem), white bg, rank/suit in corners, colored suit in center. Back pattern: navy blue with Di hexagon repeating.

### 1.3 Modal
Props: `isOpen`, `onClose`, `title`, `children`
Backdrop: `bg-black/60` blur + overlay. Centered, max-w-md, slide-up animation (300ms ease-out).

### 1.4 Avatar
```typescript
interface AvatarProps {
  name: string;
  seed: string;     // used to pick consistent background color
  size?: 'sm' | 'md' | 'lg';
}
```
Visual: Circle with initials from first 2 chars of name. Background color deterministic from seed (use `seed` to pick from 8 predefined bg colors).

### 1.5 Badge
```typescript
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}
```
Style: small pill shape, color-coded background + text.

### 1.6 Input
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  className?: string;
}
```

## 2. Game-Specific Components

### 2.1 GameBoard
Displays all 4 player positions (top/bottom/left/right) with their card hand and player info panels. Center area shows pot and turn indicator.

Props: `players`, `currentTurnIndex`, `phase`, `pot`, `myCards`, `onAction`
Layout: Absolutely positioned player panels around center pot.

### 2.2 CardHand
Displays 5 cards in a horizontal row. Cards slightly overlapped (20px offset) to fit mobile. Tap to expand.
Props: `cards: string[]`, `hidden: boolean`, `onCardClick?: (index) => void`

### 2.3 PlayerPanel
Shows: Avatar + name + stack chips + contribution to pot + turn indicator.
Props: `player`, `isCurrentTurn`, `position: 'top'|'bottom'|'left'|'right'`, `cardsHidden: boolean`

### 2.4 BettingControls
Four buttons: **Bet**, **Call**, **Raise**, **Fold**. Raise shows chip input. Call shows amount needed.
Props: `currentBet`, `minBet`, `canCheck`, `onAction`
Disables buttons not legal in current state.

### 2.5 PotDisplay
Animated chip pile visualization (CSS stacking effect). Large pot number below.
Props: `pot: number`
Animation: Chips slide in from center when pot increases.

### 2.6 TurnIndicator
Pulsing glow ring around active player's panel. Text: "Your turn" on my panel.

### 2.7 RoomCard
Lobby listing: room name, host name, player count, join button.
Props: `room`, `onJoin: (code) => void`

### 2.8 ShowdownModal
Full-screen modal on game end: shows all revealed hands ranked, announces winner with confetti effect, displays winnings.
Props: `hands: {playerId, name, cards}[], winnerId, pot, onClose`

### 2.9 RulesOverlay
Skippable rules modal shown on first visit (stored in localStorage flag `lieng_rules_accepted`). Tabbed: "Cards", "Betting", "Winning".
