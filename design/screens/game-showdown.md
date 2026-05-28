# Game Room — Showdown

**Route**: `/room/[roomId]` (same page, modal overlay)
**Purpose**: Winner reveal, all hands shown, pot awarded

## Layout (Modal Overlay)

```
+──────────────────────────────────────────────────────────────┐
│                    KẾT QUẢ VÁNG                              │
│                                                              │
│                    🏆 Minh thắng!                            │
│                    +240 chip                                  │
│                                                              │
│  +────────────────────────────────────────────────────────+  │
│  │                                                          │  │
│  │  Minh              Lan               Hùng           Hoa   │  │
│  │  ┌──────────┐      ┌──────────┐      ┌──────────┐  ┌──┐ │  │
│  │  │ Tứ Quý 7 │      │ Ba Túc K │      │ Bỏ bài   │  │💤│ │  │
│  │  │ 🏆       │      │          │      │          │  └──┘ │  │
│  │  │ 7♠ 7♦    │      │ Kh Kc 9s │      │          │       │  │
│  │  │ 7h 7c    │      │ 6d 3h    │      │          │       │  │
│  │  └──────────┘      └──────────┘      └──────────┘       │  │
│  │                                                          │  │
│  │  Hand rank: #9 Tứ Quý                         ⚡          │  │
│  │                                                          │  │
│  +────────────────────────────────────────────────────────+  │
│                                                              │
│  [Chơi lại]                          [Rời phòng]            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Mobile (375px)

Same modal, cards stack 2×2 or scroll horizontally.

## Elements

| Element | Description | Behavior |
|---------|-------------|----------|
| WinnerBadge | Trophy emoji + "Minh thắng!" | Gold gradient with pulse animation |
| PotGained | "+240 chip" | Large gold text |
| HandPanels | Card display (revealed) | Each shows rank, suit, hand name |
| RankLabel | "Tứ Quý 7" etc. | Small badge under each hand |
| LoserTag | "💤 Đã bỏ bài" | Gray label for folded players |
| RematchBtn | "Chơi lại" | Starts new hand, same players |
| LeaveBtn | "Rời phòng" | Returns to lobby |

## States

- **Default**: All hands revealed with flip animation, winner top-left or center
- **Confetti**: Winning player panel has confetti burst (CSS particles)
- **Rematch loading**: Rematch button shows spinner
- **Rematch confirmed**: Modal closes, new cards dealt

## Key Interactions

- **Click Showdown overlay backdrop** → no close (must choose Rematch or Leave)
- **"Chơi lại"** → Socket emit → `rematch` → server deals new hand → modal closes
- **"Rời phòng"** → Socket emit → `leave_room` → redirect to lobby
