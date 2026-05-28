# Lobby Screen

**Route**: `/`
**Purpose**: Entry point — list open rooms, create or join, show rules

## Layout (Desktop)

```
+──────────────────────────────────────────────────────────+
│  [Logo / Lieng]   Tìm kiếm...   [Rules] [Avatar]         │
+──────────────────────────────────────────────────────────┤
│                                                          │
│  +──────────────────────+  +──────────────────────────+   │
│  │                      │  │                            │   │
│  │   TẠO PHÒNG          │  │   DANH SÁCH PHÒNG          │   │
│  │   ┌──────────────┐  │  │   ┌────────────────────┐  │   │
│  │   │  Tên phòng   │  │  │   │ 🟢 Phòng Minh     │  │   │
│  │   │              │  │  │   │ 2/4 players        │  │   │
│  │   │  Số người 4  │  │  │   │ [Vào]              │  │   │
│  │   │  ○ riêng tư │  │  │   ├────────────────────┤  │   │
│  │   │  ● công khai│  │  │   │ 🟢 Phòng Lan       │  │   │
│  │   │              │  │  │   │ 3/4 players        │  │   │
│  │   │ [Tạo phòng]  │  │  │   │ [Vào]              │  │   │
│  │   └──────────────┘  │  │   └────────────────────┘  │   │
│  │                      │  │                            │   │
│  │   HOẶC                │  │   [Chưa có phòng nào      │   │
│  │   ┌──────────────┐   │  │    — Tạo phòng đầu tiên!] │   │
│  │   │ Mã phòng     │   │  │                            │   │
│  │   │ [____] [Vào] │  │  │                            │   │
│  │   └──────────────┘   │  │                            │   │
│  │                      │  │                            │   │
│  │   [🔗 Chơi nhanh]   │  │                            │   │
│  │                      │  │                            │   │
│  └──────────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Layout (Mobile 375px)

```
+─────────────────────────────────┐
│  Lieng      [Rules] [Avatar]    │
├─────────────────────────────────┤
│  [Tạo phòng]      [Tham gia]    │
├─────────────────────────────────┤
│  Tìm kiếm...                    │
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ 🟢 Phòng Minh  2/4  [Vào] │  │
│  ├──────────────────────────┤  │
│  │ 🟢 Phòng Lan  3/4  [Vào] │  │
│  └──────────────────────────┘  │
├─────────────────────────────────┤
│  [Chơi nhanh]                  │
│  Vào phòng đầu tiên trống      │
└─────────────────────────────────┘
```

## Elements

| Element | Description | Behavior |
|---------|-------------|----------|
| Logo | "Lieng" text + card suit icon | Click returns to lobby |
| Search input | Filter rooms by name | Live filter on keyup |
| RoomCard | Room name, player count, status | Click "Vào" joins |
| CreateBtn | "Tạo phòng" primary button | Opens create modal |
| JoinBtn | "Tham gia" secondary button | Opens join modal |
| QuickJoinBtn | "Chơi nhanh" outline button | Auto-joins first open room |
| RulesBtn | "?" badge — top right | Opens rules modal |
| Avatar | Player initials circle | Shows nickname tooltip |
| RulesModal | Tabbed: Cards / Betting / Winning | Skippable overlay |

## States

- **Default**: lobby with room list loaded
- **Loading**: skeleton cards while fetching rooms
- **Empty**: illustration + "Chưa có phòng nào — Tạo phòng đầu tiên!" copy
- **Error**: toast "Không tải được danh sách phòng" with retry button
