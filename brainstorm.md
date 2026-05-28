# LIENG (Liên) — Brainstorm

> Status: Draft | Created: 2026-05-29

## Overview
**Lieng** is a Vietnamese multi-player card game combining strategy, betting, and luck. 2–4 players compete in real-time rounds: each receives cards, bets on hand strength, and either raises, calls, or folds. The survivor with the strongest hand wins the pot. Fast sessions (5–10 min), no account required — just enter a room and play.

---

## Game Concept

- **Genre**: Card game / gambling-sim (social betting)
- **Platform**: Web browser — desktop primary, mobile responsive
- **Session length**: Quick rounds, 5–10 min per game; unlimited games in a room
- **Multiplayer**: Real-time 2–4 player rooms with WebSocket sync (no spectators at MVP)
- **Account required**: No — anonymous play using a random nickname and avatar (stored in localStorage)

---

## Target Audience

- Vietnamese players (native or diaspora) familiar with Lieng
- Casual gamers who enjoy card games with betting mechanics (Texas Hold'em style but local rules)
- Social play: friends gathering online, not ranked/competitive

---

## Core Gameplay Loop

1. **Join Room** — Player picks a room code or creates a new one. Gets assigned a seat.
2. **Deal** — Each player receives 5 cards (or 3 depending on phase). Community cards may be involved.
3. **Betting Phase 1** — Pre-flop: players view cards, place bets (bet/raise/call/fold).
4. **Second Deal** — Some games involve drawing or revealing community cards.
5. **Betting Phase 2** — Final round of betting.
6. **Showdown** — Remaining players reveal cards. Best hand wins the pot.
7. **Next Round** — Dealer role rotates. Fresh deal.

**What makes it satisfying:**
- The tension of betting on an unknown hand
- reading opponents (timing of bets, amounts)
- the dramatic showdown reveal
- quick restart for "one more round"

---

## Features

### Must-Have (MVP)
- [ ] Create / join room by 4–6 digit code
- [ ] Real-time card dealing with WebSocket sync
- [ ] 5-card hand evaluation (standard Lieng ranking)
- [ ] Betting: bet, raise, call, fold actions
- [ ] Turn indicator and active player highlighting
- [ ] Pot display (total chips in play)
- [ ] Winner determination and showdown animation
- [ ] Nickname + auto-generated avatar per session
- [ ] Responsive layout (desktop + mobile)
- [ ] First-time tooltip / rule overlay

### Nice-to-Have (Post-MVP)
- [ ] Spectator mode (observe a room without playing)
- [ ] Chat in room
- [ ] Bot players (AI) for solo practice
- [ ] Chip txns history
- [ ] Sound effects (card flip, chip clink, win fanfare)
- [ ] Achievements / win streaks

### Out of Scope (explicitly excluded)
- [ ] Account system / login — anonymous only
- [ ] Real-money betting — chips are virtual, no real currency.
- [ ] Matchmaking ladder / ranking system
- [ ] Cross-room chat

---

## User Experience Goals

- **Time to first game**: Target < 30 seconds from landing page to seated at a table with cards dealt. No signup.
- **Onboarding**: Rule overlay (modal, skippable) on first visit. In-game betting buttons clearly labelled.
- **Mobile**: Card hand displayed in a row; large touch targets for bet/fold/call.
- **Accessibility**: Keyboard-navigable buttons; sufficient color contrast on card suits.

---

## Social & Virality Features

- Share link with room code (e.g. `lieng-trung.vercel.app/room/482931`)
- Public lobby showing open rooms and player count
- "Invite Friends" button copies room link to clipboard

---

## Data to Persist

| Data | Storage |
|---|---|
| Player nickname + avatar seed | localStorage |
| Room state (players, cards, pot, turn) | MongoDB (server-authoritative) |
| Game history (winner, pot, timestamp) | MongoDB |
| Move / betting log per round | MongoDB |

---

## Technical Feasibility Assessment

### Straightforward
- Room management via WebSocket rooms
- Card deck shuffling and dealing (deterministic server-side)
- Hand evaluation using standard poker-like ranking
- Simple betting logic (bet/raise/call/fold state machine)
- Responsive CSS grid card layout

### Complex or Risky
- **Real-time WebSocket sync** — must confirm all clients see the same state; handle reconnect gracefully
- **Simultaneous play** — multiple players betting at once: need turn-lock (only active player acts)
- **Card deck state** — should be server-authoritative (cards should not be sent to client until showdown)
- **Room expiry** — empty rooms should expire after N minutes

### Open Questions
- Is Lieng strictly 5-card stud (each gets 5 private cards, no community), or does it include community cards like Texas Hold'em? Confirm in design phase.
- What is the exact betting order and limit structure (no-limit, pot-limit, fixed-limit)? Need to pin down rules precisely.
- Minimum number of players to start a round (2? 3?).

---

## Competitive Landscape

- **Tiến Lên Miền Nam** (tien-len-mien-nam in this repo) — similar Vietnamese card game but no betting, faster, different rules.
- **Zynga Poker** / **888poker** — real-money poker platforms, polished but require account.
- **Lieng online** — few Vietnamese websites exist, mostly desktop executables, often clunky UI.

**Differentiation**: Fast, browser-native, anonymous, mobile-first social Lieng with a polished modern UI and zero friction start.
