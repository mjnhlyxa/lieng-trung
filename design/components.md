# Lieng — Components

## ui/Button
**Purpose**: Primary interaction element
**Variants**: `primary` (emerald), `secondary` (slate), `ghost` (transparent), `danger` (red)
**Sizes**: `sm` (h-8), `md` (h-10), `lg` (h-12)
**States**: default, hover (+brightness), active (scale 0.97), disabled (opacity 50%, no pointer), loading (spinner replaces text)
**Used on**: Create room, join room, betting actions, all forms

---

## ui/Modal
**Purpose**: Overlay dialog for create/join room, rules, showdown, confirm leave
**Props**: `isOpen`, `onClose`, `title`, `children`, `size?: 'sm'|'md'|'lg'`
**Backdrop**: `bg-black/60 backdrop-blur-sm`
**Animation**: slide-up 300ms ease-out, backdrop fade-in
**Used on**: Lobby (modals), Game (showdown, confirm leave)

---

## ui/Card (Playing Card)
**Purpose**: Individual playing card display
**Props**: `rank: string`, `suit: string`, `faceDown?: boolean`, `size?: 'sm'|'md'|'lg'`
**Visual**: White bg, rounded-lg, rank in corners (top-left + bottom-right), suit symbol large in center
**Face-down**: Navy blue (#1e3a5f) with CSS diamond pattern
**Used on**: GameBoard, Showdown
**Hover**: slight scale-up (1.02) when face-up and interactive

---

## ui/Badge
**Purpose**: Status indicators
**Variants**: `success` (emerald), `warning` (amber), `error` (red), `info` (blue), `muted` (gray)
**Used on**: Room card (player count), player status (in/playing/folded/winner)

---

## ui/Avatar
**Purpose**: Player identifier in room
**Props**: `name: string`, `seed?: string`, `size?: 'sm'|'md'|'lg'`
**Visual**: Circle with initials from first 1–2 chars of name. Background color deterministic from `seed` (8 predefined colors).
**Used on**: Lobby room cards, PlayerPanel in game room

---

## ui/Input
**Purpose**: Text entry for room name, join code, nickname, chip amount
**Props**: `label`, `placeholder`, `value`, `onChange`, `maxLength?`, `type?`, `className?`
**States**: default, focused (emerald ring), error (red ring + error message), disabled
**Used on**: Create room form, join room form, bet amount input

---

## game/Lobby
**Purpose**: Main lobby container, orchestrates all lobby sub-components
**Contains**: Header, CreateRoomModal, JoinRoomModal, RoomCard list, QuickJoin button, RulesBtn

---

## game/RoomCard
**Purpose**: Single room in public lobby list
**Props**: `room: Room`, `onJoin: (roomId) => void`
**Shows**: room name, host name, player count (current/max), join button
**States**: default, hover (slight lift), full (join button disabled)

---

## game/CreateRoomModal
**Purpose**: Form to create a new room
**Props**: `isOpen`, `onClose`, `onCreated: (room) => void`
**Fields**: Room name (optional default to "Phòng {random}"), max players (2/3/4 radio), private toggle
**Used on**: Lobby

---

## game/JoinRoomModal
**Purpose**: Form to join by code
**Props**: `isOpen`, `onClose`, `onJoined: (roomId) => void`
**Fields**: Room code (6-digit, numeric only), nickname (pre-filled)
**Validation**: must be exactly 6 digits
**Error states**: Room not found, Room full, Already joined
**Used on**: Lobby

---

## game/GameBoard
**Purpose**: Main in-game layout — positions all player panels, cards, pot
**Props**: `gameState`, `playerId`, `myCards`, `onAction`
**Contains**: 4 PlayerPanels (absolute positioned at corners), CardHand in center/bottom, PotDisplay, TurnIndicator, BettingControls

---

## game/PlayerPanel
**Purpose**: Single player's info display during gameplay
**Props**: `player: Player`, `isCurrentTurn: boolean`, `position: 'top'|'bottom'|'left'|'right'`, `cardsHidden: boolean`, `stackChips: number`, `potContribution: number`
**States**: waiting (gray), active (emerald glow pulse + "Lượt của bạn"), folded (grayed + "Đã bỏ bài"), winner (gold glow + trophy)
**Used on**: GameBoard

---

## game/CardHand
**Purpose**: Horizontal row of 5 playing cards for one player
**Props**: `cards: string[]`, `hidden: boolean`, `revealed?: boolean`
**Layout**: Cards overlap by 24px (desktop), 16px (mobile), horizontal scroll on overflow
**Used on**: GameBoard, ShowdownModal

---

## game/PotDisplay
**Purpose**: Chip pile visualization with current pot amount
**Props**: `pot: number`
**Visual**: Stacked chip SVG circles (3 layers) + large number in center
**Animation**: chips slide in from center with 300ms delay each when pot increases
**Used on**: GameBoard center area

---

## game/BettingControls
**Purpose**: Bet/call/raise/fold action buttons + raise input
**Props**: `currentBet`, `minBet`, `myLastBet`, `onAction: (action, amount?) => void`, `disabled: boolean`
**Buttons**: Bet (→ enables amount input), Call (shows amount to call), Raise (→ shows slider), Fold
**Raise Modal**: number input + quick buttons (min+10, min+50, all-in)
**Used on**: GameBoard bottom area (desktop) or fixed bottom bar (mobile)

---

## game/TurnIndicator
**Purpose**: Text displaying whose turn it is
**Props**: `playerName: string`, `isMe: boolean`
**When isMe**: "Lượt của bạn!" — emphasized emerald text with pulse animation
**Used on**: GameBoard, above BettingControls

---

## game/ShowdownModal
**Purpose**: Full-screen game-over modal with all hands revealed
**Props**: `hands: {playerId, name, cards, rank, handName}[], `winnerId`, `pot`, `onRematch`, `onLeave`
**Layout**: Header with winner name + pot gained, then all cards in a grid, then two buttons
**Animation**: Cards flip simultaneously, confetti on winner's panel
**Used on**: Game board — overlay on showdown phase

---

## game/RulesOverlay
**Purpose**: First-time rules modal (skippable)
**Props**: `isOpen`, `onClose`
**Tabs**: Cards (hand rankings), Betting (actions explained), Winning (how to win pot)
**Dismissal**: localStorage flag `lieng_rules_accepted`, "Hiểu rồi" button
**Used on**: Lobby (first visit only)

---

## game/ShareRoomButton
**Purpose**: Copy share link to clipboard
**Props**: `roomCode: string`
**Copy**: `window.location.origin + '/room/' + roomCode`
**Feedback**: toast "Đã copy link mời!" on success
**Used on**: Game waiting room, header on game page
