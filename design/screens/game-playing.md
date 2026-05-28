# Game Room — Playing

**Route**: `/room/[roomId]`
**Purpose**: Active gameplay — betting rounds, card reveal, showdown

## Layout (Desktop)

```
+──────────────────────────────────────────────────────────────────┐
│  ← [Quay lại]   Phòng: 482931   Vòng: 1/2   Pot: 240  🪙       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  +-------------------+                           +-------------+ │
│  │ 🧑 Minh (HOST)    │     ┌─────────────┐      │ 🧑 Lan      │ │
│  │ ● Đang chơi       │     │   POT: 240  │      │ ● Đang chơi │ │
│  │ Mã bet: 20        │     │   🪙 chips │      │ Mã bet: —   │ │
│  │ [💰 120]          │     └─────────────┘      │ [💰 80]     │ │
│  └───────────────────┘                          └─────────────┘ │
│                                                                  │
│               ┌─────────┐                                          │
│               │ 7 ♠     │ ← MY CARDS (player at bottom)             │
│               │ K ♦     │                                          │
│               │ 2 ♥     │                                          │
│               │ 9 ♣     │                                          │
│               │ A ♠     │                                          │
│               └─────────┘                                          │
│                                                                  │
│  +-------------------+                           +-------------+ │
│  │ 🧑 Hùng          │     ┌─────────────┐      │ 🧑 Hoa      │ │
│  │ 💤 Đã bỏ bài     │     │  Lượt của  │      │ 💤 Đã bỏ   │ │
│  │ [💰 0]           │     │  Minh      │      │ [💰 0]     │ │
│  └───────────────────┘     └─────────────┘      └─────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Cược: 20    [Cược 10] [Theo 20] [Tăng 40] [Bỏ bài]           │
│  Ít nhất 10 chip để cược                                         │
└──────────────────────────────────────────────────────────────────┘
```

## Layout (Mobile 375px)

```
┌─────────────────────────────────┐
│ ←  482931  Pot:240  Vòng:1/2   │
├─────────────────────────────────┤
│  ┌───────────────────────────┐ │
│  │    POT: 240 🪙            │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  [Hùng] 💤  [Lan] 💤           │
│  [Hoa] 💤                       │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │  MY CARDS:               │  │
│  │  [7♠] [K♦] [2♥] [9♣] [A♠]│  │
│  │  ─── ─── ─── ─── ───     │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Lượt của: Minh                 │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ [Cược] [Theo] [Tăng] [Bỏ]│  │
│  └───────────────────────────┘  │
│  Cược tối thiểu: 10             │
└─────────────────────────────────┘
```

Card hand scrolls horizontally on mobile.

## Elements

| Element | Description | Behavior |
|---------|-------------|----------|
| BackBtn | "← Quay lại" | Leave room (fold if playing) |
| PotDisplay | Chip pile animation + amount | Updates with slide-in animation |
| RoundIndicator | "Vòng: 1/2" | Shows current betting round |
| PlayerPanel | Name, avatar, status, bet contribution | Glowing ring when active turn |
| CardHand | 5 cards in horizontal row | My cards face-up; others' cards face-down |
| TurnIndicator | "Lượt của: [Name]" | Shows whose turn |
| BettingControls | 4 action buttons | Enabled only for active player |
| WinModal | Showdown announcement | Shows all hands + winner |
| RulesBtn | "?" top-right | Opens rules reference |

## Card States

- **My cards (face-up)**: Show actual rank + suit
- **Opponent cards (face-down)**: Navy back with diamond pattern
- **Showdown reveal**: Cards flip with animation to show real cards

## Betting Controls (BettingControls)

| Button | Label | Enables when |
|--------|-------|-------------|
| Bet | "Cược [min]" | No bet yet this round |
| Call | "Theo [amount]" | Someone bet, not yet called |
| Raise | "Tăng [amount+min]" | Already in a bet |
| Fold | "Bỏ bài" | In any bet state (lose ante) |

All buttons disabled when not your turn. Raise shows chip input dialog.

## States

- **Betting 1** (pre-flop): My cards visible, no community cards
- **Betting 2** (if applicable): Same cards, second betting round
- **Showdown**: All cards revealed, winner modal appears
- **Waiting for turn**: Betting controls disabled, gray shimmer
- **Folded**: Player folded, hand shown face-down, "💤 Đã bỏ bài"
- **Folded by all others**: Automatic win, skip showdown

## Key Interactions

- **Click Bet/Call/Raise/Fold** → validate → Socket emit → server validates → broadcast
- **Enter raise amount** → modal with number input + slider
- **Turn change** → TurnIndicator updates + active panel glows
- **Pot change** → PotDisplay chips slide in
- **Showdown trigger** → ShowdownModal slides up with card flip animation
- **Rematch** → new game started, modals close
- **Leave** → confirm dialog → return to lobby
