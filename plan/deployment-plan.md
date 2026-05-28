# Lieng — Security Considerations

> **C4 Level**: 3 — Security Design Components

## 1. Anonymous Player Identity

- Player ID is UUID v4 generated client-side, stored in localStorage
- No PII: name is user-chosen display name (no email, no phone)
- Player session (w/l record) is keyed by UUID
- No login, no account deletion needed

## 2. Server-Authoritative Game State

**CRITICAL**: The server is the single source of truth for all game state.

- All card dealing, shuffling, hand evaluation happens server-side
- The `deck` array and each player's `hand` array are stored ONLY in MongoDB
- The `hand` field is **NEVER** included in Socket.IO broadcasts or API GET responses
- Exception: at showdown, server sends ALL remaining hands (they're revealed anyway)
- Client `GameBoard` receives `myCards` only for the requesting player's ID

This prevents:
- Clients reading other players' cards via WebSocket inspector
- Card counting / MIT-style cheating
- Manipulating betting amounts client-side

## 3. Input Validation

- All FastAPI endpoints use Pydantic models — invalid payloads return 422
- Betting amounts must be positive integers, not exceeding the game's `current_bet + stack`
- Room codes must be exactly 6 digits
- Socket.IO event payloads validated server-side before processing

```python
# apps/api/services/game_service.py — validate action
async def apply_action(game_id: str, player_id: str, action: str, amount: int | None):
    game = await games.find_one({"_id": ObjectId(game_id)})
    if not game:
        raise GameNotFoundError()

    # Validate it's this player's turn
    current = game["players"][game["current_turn_index"]]
    if current["id"] != player_id:
        raise NotYourTurnError()
    # ...
```

## 4. BettingIntegrity

- Minimum bet size enforced server-side (`min_bet`)
- Player cannot bet more than their total chips (tracked in player session)
- All betting amounts compared against `current_bet` before accepting
- Raise must exceed previous raise by at least `min_bet`

## 5. Rate Limiting

- Socket.IO: max 50 connections per room
- REST API: Vercel's built-in rate limiting on serverless functions
- Railway: similar per-app limits
- Returns HTTP 429 when exceeded

## 6. CORS Configuration

```python
# apps/api/main.py
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lieng-trung.vercel.app"],  # strict origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Deployment Plan

> **C4 Level**: 2+3 — Deployment & Infrastructure

## 1. Infrastructure Overview

### Frontend (apps/web)
- **Platform**: Vercel
- **Repo**: `https://github.com/mjnhlyxa/games` — monorepo
- **Build Command**: `bun --filter web build`
- **Output Directory**: Next.js auto-detected
- **Env Vars**:
  - `NEXT_PUBLIC_API_URL=https://lieng-api.uprailway.com`
  - `NEXT_PUBLIC_SOCKET_URL=https://lieng-api.uprailway.com`
- **Deploy Trigger**: Push to `main` branch

### Backend (apps/api)
- **Platform**: Railway
- **Repo**: linked to GitHub `mjnhlyxa/games`
- **Start Command**: `uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT`
- **Env Vars**:
  - `MONGODB_URL=mongodb://10.60.184.61:27017`
  - `MONGODB_DB_NAME=LiengCardGame`
  - `CORS_ORIGIN=https://lieng-trung.vercel.app`
- **Deploy Trigger**: Push to `main` branch

## 2. MongoDB Setup (Pre-existing)

IP `10.60.184.61:27017` is pre-provisioned. No setup needed beyond connection string.

1. FastAPI connects via `mongodb://10.60.184.61:27017` using Motor
2. No authentication mentioned — assume open (development)
3. Database name: `LiengCardGame`
4. Indexes created on startup via `db.init()` on app startup in `main.py`

## 3. Domain & SSL

- Frontend: `lieng-trung.vercel.app` (auto-SSL)
- Backend: `lieng-api.uprailway.com` (auto-SSL on Railway's default domain)
- Room share URL: `https://lieng-trung.vercel.app/room/{code}`

## 4. Deployment Steps

1. Push monorepo to GitHub (`mjnhlyxa/games`)
2. Connect `apps/web` to Vercel → auto-deploy on push
3. Connect `apps/api` to Railway → auto-deploy on push
4. Verify MongoDB connection by calling `GET /api/rooms` on Railway URL
5. Confirm Socket.IO connection works by joining a test room

## 5. Monitoring & Logs

| Concern | Tool |
|---------|------|
| Vercel logs | Vercel dashboard → Deployments → Runtime logs |
| Railway logs | Railway dashboard → Deployments → Logs |
| MongoDB stats | Connect via `mongosh 10.60.184.60:27017` for local diagnostics |
| Uptime | Vercel + Railway SLA (99.5%+ combined) |

## 6. Cost at MVP Scale

| Service | Usage | Cost |
|---------|-------|------|
| Vercel (web) | ~100 players/day | $0 (free tier) |
| Railway (api) | light traffic | ~$0-2/mo |
| MongoDB 10.60.184.61 | pre-provisioned | $0 (internal) |
