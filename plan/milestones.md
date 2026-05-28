# Lieng — Milestones

## Phase 1: Foundation (MVP)
**Goal**: Playable 2–4 player Lieng, anonymous, browser-based

| # | Task | Details |
|---|------|---------|
| 1 | Monorepo scaffold | Bun workspace, apps/web Next.js + apps/api FastAPI |
| 2 | MongoDB connection | Motor async client, 3 collections, indexes |
| 3 | Room CRUD APIs | create/join/leave/list rooms |
| 4 | Anonymous player identity | UUID v4, random Vietnamese nickname |
| 5 | Socket.IO integration | FastAPI + Socket.IO server, join/create room events |
| 6 | Card deck service | 52-card shuffle, deal, encode/decode |
| 7 | Hand evaluator | Lieng ranking (Tứ Quý > Sảnh > Ba Túc > Bộ Đôi > Một Đôi > Mậu Thầu) |
| 8 | Betting service | bet/call/raise/fold logic, turn enforcement, pot tracking |
| 9 | Game state machine | lobby → betting1 → dealing → betting2 → showdown |
| 10 | Next.js lobby page | Room list, create button, join by code |
| 11 | Next.js game room | Real-time card display, betting controls, player panels |
| 12 | Showdown + winner | Reveal all hands, announce winner |
| 13 | Responsive mobile | 375px playable, horizontal card scroll |
| 14 | Vercel deploy | Connect, set env vars, verify URL works |
| 15 | Railway deploy | Connect, set env vars, verify API works |

**Duration**: ~3–4 days
**Definition of Done**: Two users can create room, play full betting round, see winner

---

## Phase 2: Polish & Social (V1)
**Goal**: Reduce friction, increase virality, improve UX

| # | Task |
|---|------|
| 1 | Share room link — copy to clipboard button |
| 2 | First-time rules overlay (skippable, stored in localStorage) |
| 3 | Rules tab modal: Cards, Betting, Winning |
| 4 | Rematch button (dealer rotates, new hand dealt) |
| 5 | Disconnection handling — 2-min seat hold, mark disconnected |
| 6 | Auto-generate room code without collision |
| 7 | Player avatar (deterministic color + initials) |
| 8 | Pot display animation (chips slide in) |
| 9 | Card flip animations (Framer Motion) |
| 10 | Toast notifications (player joined, action errors) |

**Duration**: ~2 days
**Definition of Done**: Shareable room link works, rules visible on first visit

---

## Phase 3: Persistence & Stats (V1.1)
**Goal**: Player history keeps them coming back

| # | Task |
|---|------|
| 1 | Player session — w/l count, games played |
| 2 | Match history page (last 10 games with outcomes) |
| 3 | Win/loss streak display |
| 4 | Chip stack (virtual, tracked server-side per session) |
| 5 | All-in, side pot support (for all-in scenarios) |
| 6 | Player reconnection — restore seat + hand state |

**Duration**: ~2 days

---

## Phase 4: Fun & Retention (V1.2)
**Goal**: Delight players, increase session length

| # | Task |
|---|------|
| 1 | Bot players (AI) for solo practice |
| 2 | Sound effects — card flip, chip clink, win fanfare |
| 3 | Confetti on showdown winner |
| 4 | Room name + host cankick player |
| 5 | "New round" button (no full rejoin needed) |
| 6 | Minimap showing all 4 positions (mobile small screen) |

**Duration**: ~2 days

---

## Phase 5: Scale (V2 — Future)
| # | Task |
|---|------|
| 1 | Admin dashboard — view active rooms |
| 2 | Tournament mode (bracket, elimination) |
| 3 | Private profile stored in account (optional login) |
| 4 | Leaderboard — top Lieng players |
