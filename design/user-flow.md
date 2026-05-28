# Lieng — User Flow

## Screen Map

```
[Lobby / Home]
│
├── "Tạo phòng" (Create Room)
│   └── [Join Code Modal] ────────→ [Game Room — Waiting]
│
├── "Tham gia" (Join by Code)
│   └── [Join Room Modal] ─────────→ [Game Room — Waiting]
│
├── "Chơi nhanh" (Quick Join)
│   └── Joins first open room ────→ [Game Room — Playing]
│
├── [Open Room Card] ─────────────→ [Game Room — Waiting]
│
└── Rules button ─────────────────→ [Rules Modal]
```

```
[Game Room — Waiting]
│
├── Host clicks "Bắt đầu" (Start)
│   └── [Game Room — Playing / Betting Phase 1]
│
├── Others see "Đang chờ chủ phòng..." (Waiting for host)
│
└── Leave button ─────────────────→ [Lobby]
```

```
[Game Room — Playing]
│
├── [Betting Phase 1] ────────────→ [Betting Phase 2] (if all called/folded)
│
├── [Betting Phase 2] ────────────→ [Showdown] (if all called/folded)
│
├── [Showdown] ──────────────────→ [Game Result Modal]
│
│
├── "Chơi lại" (Rematch) ─────────→ [Game Room — Playing] (new hand)
│
└── "Rời phòng" (Leave) ──────────→ [Lobby]
```

---

## Full User Flow (Step-by-Step)

### 1. Landing → Lobby
1. User opens `/` → lobby loads with room list
2. Player ID generated (UUID v4) + random Vietnamese nickname
3. Rules overlay shown on first visit (skippable)

### 2. Create a Room
1. Click "Tạo phòng" → modal appears
2. Enter room name (optional), set max players (2–4)
3. Click "Tạo" → POST /api/rooms → room created
4. Redirect to `/room/482931` → waiting room state
5. Share link auto-copied or click "Mời bạn" to copy manually

### 3. Join a Room
1. Click "Tham gia" → modal appears  
2. Enter 6-digit code + nickname (pre-filled from localStorage)
3. Click "Vào" → POST /api/rooms/{id}/join → joined
4. Redirect to `/room/482931` → waiting room or playing if host already started

### 4. Quick Play → Auto-Join
1. Click "Chơi nhanh" → fetch list of open rooms  
2. Join first room with open slot
3. Redirect to `/room/482931`

### 5. Waiting Room
1. See current players listed with avatars
2. See max players setting
3. Room code prominently displayed
4. "Mời bạn" copies share URL
5. Host sees "Bắt đầu" button when 2+ players

### 6. Game Starts (Host clicks Start)
1. POST /api/games → new game created, cards dealt server-side
2. All clients transition to "Game Room — Playing"
3. Each player sees their own 5 cards (hidden from others)
4. Phase: "Betting 1", pot = 0, current_bet = 0, min_bet = 10

### 7. Betting Flow
**Active player (whose turn it is):**
1. See own cards, BettingControls enabled
2. Click Bet/Call/Raise/Fold
3. If Bet/Raise: enter chip amount → submit
4. Turn passes to next active player

**Other players:**
1. See "Đang chờ..." on BettingControls (disabled)
2. See animated chip/pot when other players bet
3. See turn indicator move to active player

### 8. Showdown
1. All remaining (non-folded) players reveal cards
2. Server evaluates all hands
3. Winner announced in ShowdownModal
4. Pot awarded to winner

### 9. Next Round
1. "Rematch" → new hand dealt, dealer rotates
2. "Rời phòng" → return to lobby

---

## State Transitions

| From State | Action | To State |
|-----------|--------|---------|
| Lobby | create room | Game Room — Waiting |
| Lobby | join by code | open room |
| Lobby | quick join | first open room |
| Waiting | host starts | Playing / Betting 1 |
| Waiting | leave room | Lobby |
| Playing / Betting | all call/fold | Betting 2 or Showdown |
| Betting 2 | all call/fold | Showdown |
| Showdown | rematch | Playing (new hand) |
| Any | error/disconnect | Connection overlay |
