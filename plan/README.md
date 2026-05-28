# Lieng — Technical Plan

> **Status**: Draft | Created: 2026-05-29 | Last Updated: 2026-05-29
> **C4 Level**: 1 — Context Overview

## 1. Game Overview

### 1.1 Game Concept
**Lieng** (also spelled Liên) is a Vietnamese multi-player card game with betting mechanics. 2–4 players join a room, receive private cards, bet on hand strength, and compete in betting rounds. The player with the best hand after all betting rounds wins the pot. Fast, anonymous, browser-based play with zero friction entry.

### 1.2 Game Type
- **Genre**: Card game / social betting (like Texas Hold'em but Vietnamese Lieng rules)
- **Platform**: Web browser — desktop primary, mobile responsive
- **Session Length**: Quick rounds, 5–10 min per game; unlimited games in a room
- **Multiplayer Model**: Real-time 2–4 player rooms with WebSocket (Socket.IO via FastAPI)
- **Account Required**: No — anonymous play using random nickname and auto-generated avatar stored in localStorage

### 1.3 Target Audience
- Vietnamese players (native speakers or diaspora) familiar with Lieng card game
- Casual gamers who enjoy card games with betting mechanics but don't want account sign-up
- Social play: friends gathering online for quick rounds, not ranked/competitive

---

## 2. System Context (C4 L1)

### 2.1 User Interactions

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐   │
│   │  Desktop        │    │  Mobile          │    │  Future: Admin         │   │
│   │  Browser        │    │  Browser         │    │  Dashboard             │   │
│   └───────┬─────────┘    └───────┬─────────┘    └───────────┬─────────────┘   │
└───────────┼──────────────────────┼──────────────────────────┼─────────────────┘
            │                      │                          │
            ▼                      ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Lieng Card Game                                           │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  Frontend: Next.js 14 (apps/web) — Bun monorepo                          │   │
│  │  - Lobby page (SSG for SEO)                                               │   │
│  │  - Game room page (CSR, real-time via Socket.IO client)                  │   │
│  │  - Pure JS game engine (no React dependency for rules)                   │   │
│  └─────────────────────────────────┬──────────────────────────────────────────┘   │
│                                    │                                             │
│                                    │ HTTP REST + Socket.IO                      │
│                                    ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │  Backend: FastAPI (apps/api) — Bun monorepo                               │    │
│  │  - POST/GET /api/rooms — Room CRUD                                       │    │
│  │  - POST/GET /api/games — Game CRUD                                       │    │
│  │  - POST /api/games/[id]/move — Move submission                           │    │
│  │  - Socket.IO: room events, turn sync, showdown                           │    │
│  │  - WebSocket upgrade on same port                                        │    │
│  └─────────────────────────────────┬──────────────────────────────────────────┘    │
│                                    │                                             │
│                                    │ MongoDB Protocol                           │
│                                    ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │  MongoDB 10.60.184.61:27017 (LiengCardGame DB)                           │    │
│  │  - rooms collection (lobby state, player list)                            │    │
│  │  - games collection (game state, moved history, betting log)              │    │
│  │  - player_sessions collection (nickname, avatar seed, w/l)                │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 External System Integrations
| External System | Purpose | Integration Method |
|-----------------|---------|-------------------|
| MongoDB 10.60.184.61:27017 | Persistent game data (server-authoritative) | PyMongo / Motor (async) |
| Vercel (apps/web) | Frontend hosting | Auto-deploy on GitHub push |
| Railway/Render (apps/api) | FastAPI backend hosting | Auto-deploy on git push |
| GitHub (mjnhlyxa) | Source code hosting | git push |

### 2.3 Data Flow Overview

1. **Player opens URL** → Lobby page loads → generates anonymous UUID + nickname stored in localStorage
2. **User creates/joins room** → API call to FastAPI → MongoDB room document created/updated
3. **FastAPI deals cards** → Server-side deck shuffle → cards NOT sent to clients until showdown
4. **Betting round** → Each player submits bet action via Socket.IO event → server validates → broadcasts new state
5. **Real-time sync** → Socket.IO emits `game_state_update` to all players in room
6. **Showdown** → Server evaluates hands → winner determined → result saved toMongoDB → broadcast
7. **Game ends** → Players can rematch (dealer rotates) or leave

### 2.4 Key Non-Functional Requirements
- **Performance**: First contentful paint < 2s, time to interactive < 3s on desktop
- **Scalability**: Support 50 concurrent games (200 concurrent players)
- **Real-time latency**: Socket.IO round-trip < 200ms on same-region deployment
- **Data persistence**: All game data persists across page refresh (games stored in MongoDB)
- **Mobile support**: Full gameplay at 375px viewport, cards scrollable horizontally

---

## 3. Technology Stack Summary

| Layer | Technology | Version | Notes |
|-------|-----------|--------|-------|
| Frontend | Next.js | 14+ | App Router, Bun runtime |
| Language | TypeScript | 5.x | Strict mode |
| Styling | Tailwind CSS | 3.x | Mobile-first responsive |
| State | Zustand | 4.x | Client game state |
| Real-time | Socket.IO Client | 4.x | Socket.IO client |
| Backend | FastAPI | 0.100+ | Python async |
| Language | Python | 3.11+ | type-annotated |
| Database Driver | Motor | 3.x | Async MongoDB driver |
| Database | MongoDB | 6.x | 10.60.184.61:27017 |
| Hosting (web) | Vercel | — | Auto-deploy |
| Hosting (api) | Railway/Render | — | FastAPI worker |
| Package Manager | Bun | 1.x | Monorepo tooling |

---

## 4. Lieng Card Game Rules (Simplified for MVP)

### 4.1 Hand Ranking (best to worst)
1. **Tứ Quý** — Four of a kind
2. **Sảnh Rồng** (Dragon straight) — A, 2, 3, 4, 5 suited
3. **Sảnh** (Straight) — 5 consecutive cards, any suit
4. **Ba Túc** (Full house) — Three of a kind + a pair
5. **Bộ Đôi** (Two pair) — Any two pairs
6. **Một Đôi** (One pair) — Any single pair
7. **Mậu Thầu** (High card) — No combination, highest card wins

*Suit order for tiebreaker: ♦ < ♣ < ♥ < ♠ (spades highest)*

### 4.2 Game Flow
1. **Ante** — All players place equal ante into pot
2. **Deal** — Each player receives 5 private cards (server deals from shuffled 52-card deck)
3. **Betting Round 1** — Starting from left of dealer, players bet/raise/call/fold
4. **Draw Phase** (optional in some variants) — Players may exchange up to 3 cards
5. **Betting Round 2** — Final betting round
6. **Showdown** — Remaining players reveal cards. Best hand wins pot.

### 4.3 Betting Actions
- **Bet** — First action: place chips into pot
- **Call** — Match current highest bet
- **Raise** — Increase current bet above previous raise
- **Fold** — Discard hand, forfeit round, lose ante

---

## 5. Security Considerations
- Anonymous player IDs (UUID v4) — no PII stored
- Server-authoritative cards: client never sees other players' private cards until showdown
- No authentication; room codes act as session tokens
- Input validation on all API endpoints (Pydantic models)
- WebSocket events validated server-side before broadcast

---

## 6. Cost Projection (Free Tier)

| Service | Free Tier Limit | Projected Usage | Buffer |
|---------|-----------------|-----------------|--------|
| Vercel (web) | 100GB bandwidth/mo | ~5GB | OK |
| Railway (api) | $5 credit/mo | ~$2 | OK |
| MongoDB Atlas M0 | 512MB, shared | ~50MB estimated | OK |
| GitHub | Unlimited | — | OK |

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MongoDB connection limit | Low | High | Use connection pooling via Motor |
| Socket.IO disconnections | Medium | Medium | Auto-reconnect with exponential backoff; treated as "disconnected" but keep seat |
| FastAPI cold start on Railway | Medium | Low | Keep-alive ping |
| Cheating: client card reading | High | High | Server-authoritative game state — cards never sent to client until showdown |
| Room collision (same code) | Low | Low | 6-digit codes with collision check + re-generate |
