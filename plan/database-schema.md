# Lieng — Database Schema Design

> **C4 Level**: 3 — Component Specification (Database)

## 1. Database Overview

- **Database**: MongoDB 6.x standalone at `10.60.184.61:27017`
- **Driver**: Motor 3.x (async PyMongo)
- **Database Name**: `LiengCardGame`
- **No ORM** — raw PyMongo documents + Pydantic models for validation

### 1.1 Collections
| Collection | Purpose | Est. Doc | Growth |
|-----------|---------|---------|--------|
| `rooms` | Active game rooms | ~800B | ~50/day |
| `games` | Active + recent games | ~4KB | ~100/day |
| `sessions` | Player stats (w/l, nickname, avatar seed) | ~200B | ~500/day unique |

---

## 2. Schema Definitions

### 2.1 Rooms Collection

**Indexes:**
```python
await rooms.create_index("code", unique=True)   # 6-digit join code
await rooms.create_index("status")              # lobby / playing
await rooms.create_index("created_at")          # TTL cleanup sort
```

**Document shape:**
```json
{
  "_id": ObjectId("..."),
  "code": "482931",
  "name": "Phòng của Minh",
  "host_id": "uuid-v4",
  "max_players": 4,
  "players": [
    {
      "id": "uuid",
      "name": "Minh",
      "connected": true,
      "joined_at": ISODate("2026-05-29T10:00:00Z")
    }
  ],
  "game_id": null,
  "status": "lobby",
  "created_at": ISODate("2026-05-29T10:00:00Z"),
  "updated_at": ISODate("2026-05-29T10:00:00Z")
}
```

### 2.2 Games Collection

**Indexes:**
```python
await games.create_index("room_id")    # Find game by room
await games.create_index("started_at") # For cleanup / recent games
```

**Document shape:**
```json
{
  "_id": ObjectId("..."),
  "room_id": ObjectId("..."),
  "dealer_index": 0,
  "deck": ["2c", "5d", "Th", ...],
  "players": [
    {
      "id": "uuid",
      "name": "Minh",
      "hand": ["7h", "Kd", "As", "3c", "2d"],
      "bet_this_round": 0,
      "total_bet": 0,
      "status": "active",
      "move_count": 0
    }
  ],
  "community_cards": [],
  "pot": 0,
  "phase": "betting1",
  "current_turn_index": 1,
  "current_bet": 0,
  "min_bet": 10,
  "actions_log": [
    {
      "player_id": "uuid",
      "action": "bet",
      "amount": 10,
      "timestamp": ISODate("2026-05-29T10:00:00Z")
    }
  ],
  "result": null,
  "started_at": ISODate("2026-05-29T10:00:00Z"),
  "updated_at": ISODate("2026-05-29T10:00:00Z")
}
```

### 2.3 Sessions Collection

**Indexes:**
```python
await sessions.create_index("id", unique=True)  # Player UUID
```

---

## 3. Query Patterns & Indexes

| Query | Collection | Index Used |
|-------|-----------|------------|
| Get room by 6-digit code | rooms | `code` (unique) |
| List open public rooms | rooms | `status` |
| Get game by room ID | games | `room_id` |
| Get player's active game | games | `players.id` |
| Recent games | games | `started_at` |

---

## 4. Data Retention

| Data | Retention | Auto-Delete |
|------|-----------|-------------|
| Rooms (empty, lobby) | 1 hour | TTL index (status=lobby, updated_at) |
| Finished games | 7 days | TTL index on `updated_at` |
| Player sessions | 30 days inactive | TTL on `last_seen` |
