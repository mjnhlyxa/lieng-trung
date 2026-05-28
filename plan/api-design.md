# Lieng — Database Schema & API Design

> **C4 Level**: 3 — Database + API Component Specifications

## 1. Database Schema

See `/database-schema.md` for full MongoDB collection schemas with Motor async driver.

## 2. REST API

See `/api-design.md` for full endpoint specs.

## 3. Query Patterns

| Query | Method | Index |
|-------|--------|-------|
| Room by code | GET /rooms/{code} | code (unique) |
| Open rooms list | GET /rooms | status |
| Game by room | GET /games?room_id=ID | room_id |
| Player's game | GET /games/{id} + X-Player-ID header | players.id |

## 4. Backend File Map (apps/api)

```
apps/api/
├── main.py                  # FastAPI app + Socket.IO mounted at "/socket.io"
├── routers/
│   ├── rooms.py             # /api/rooms router
│   └── games.py             # /api/games router
├── services/
│   ├── room_service.py      # create_room(), join_room(), leave_room()
│   ├── game_service.py      # start_game(), apply_action()
│   ├── deck_service.py      # shuffle(), deal_to_player()
│   └── hand_evaluator.py    # evaluate_hand() → ranking
├── models/
│   ├── room.py              # Pydantic Room model
│   └── game.py              # Pydantic Game model
├── db/
│   └── mongodb.py           # Motor client + db references
└── socket_events.py         # Socket.IO event handlers (join, action, leave)
```
