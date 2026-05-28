# Acceptance Criteria — Lieng Card Game

> **Status**: Draft | Created: 2026-05-29 | Based on: plan/ + design/
> **Format**: Given-When-Then (BDD)
> **Total ACs**: 41

---

## Table of Contents
1. [Anonymous Identity](#1-anonymous-identity)
2. [Room Management](#2-room-management)
3. [Core Gameplay — Cards & Deck](#3-core-gameplay--cards--deck)
4. [Core Gameplay — Betting](#4-core-gameplay--betting)
5. [Core Gameplay — Showdown & Winner](#5-core-gameplay--showdown--winner)
6. [Real-time Updates](#6-real-time-updates)
7. [Mobile Experience](#7-mobile-experience)
8. [Error Handling](#8-error-handling)
9. [Data Persistence](#9-data-persistence)

---

## 1. Anonymous Identity

### AC-ID-001: Anonymous player ID is generated on first visit
- **Given**: Player opens the game for the first time (no localStorage data)
- **When**: The lobby page loads
- **Then**: A unique UUID (v4) is generated and stored in localStorage as `lieng_player_id`

### AC-ID-002: Player ID persists across page reloads
- **Given**: Player has a `lieng_player_id` in localStorage
- **When**: Player reloads the page or opens a new tab
- **Then**: The same `lieng_player_id` is retrieved and used for all subsequent requests

### AC-ID-003: DefaultVietnamese player name is generated
- **Given**: Player has no name set in localStorage
- **When**: Player joins a room or creates a game
- **Then**: A random Vietnamese name (adjective + noun, e.g., "Hồng Mai") is generated and stored as `lieng_player_name` and used as the display name

### AC-ID-004: Rules overlay shown on first visit only
- **Given**: Player opens the game for the first time
- **When**: The lobby page loads
- **Then**: A skippable rules overlay appears before gameplay can begin
- **And**: When dismissed, a flag `lieng_rules_accepted` is stored in localStorage
- **And**: On subsequent visits, the overlay does NOT appear again

---

## 2. Room Management

### AC-ROOM-001: Player can create a public room
- **Given**: Player is on the lobby page
- **When**: Player clicks "Tạo phòng" and enters a room name "Phòng Test"
- **Then**: A new public room named "Phòng Test" is created, player becomes host, and is redirected to `/room/{code}`

### AC-ROOM-002: Room name is required (max 50 chars)
- **Given**: Player is on the lobby page and opens the "Create Room" dialog
- **When**: Player clicks "Tạo phòng" without entering a room name
- **Then**: Error message "Vui lòng nhập tên phòng" appears below the input field, room is not created
- **And**: If name exceeds 50 characters, input is rejected at 50 characters

### AC-ROOM-003: Created room appears in public room list
- **Given**: Player just created a public room named "Phòng Test"
- **When**: The room list refreshes (every 5 seconds or after creation)
- **Then**: "Phòng Test" appears in the public rooms list with status "🟢 Đang chờ" and correct player count

### AC-ROOM-004: 6-digit room code is unique and shareable
- **Given**: Player creates a new room
- **When**: The room is successfully created
- **Then**: A unique 6-digit numeric code is generated and displayed as share URL
- **And**: The share URL format is `https://lieng-trung.vercel.app/room/{code}`

### AC-ROOM-005: Private room does NOT appear in public list
- **Given**: Player creates a new room with "Riêng tư" (private) checkbox selected
- **When**: Other players view the public room list
- **Then**: The private room is NOT visible in the public room list

### AC-ROOM-006: Player can join room via share link
- **Given**: Player 1 created a room with code "482931"
- **When**: Player 2 opens the URL `https://lieng-trung.vercel.app/room/482931`
- **Then**: Player 2 joins the room and sees the current room state (waiting or playing)

### AC-ROOM-007: Room shows correct player count (current/max)
- **Given**: A room has maxPlayers=4 and currently has 2 players
- **When**: The room list displays
- **Then**: The room displays "2/4 người chơi"

### AC-ROOM-008: Host can start game with 2+ players
- **Given**: A room has 2 or more players in the waiting state
- **When**: The host clicks "Bắt đầu"
- **Then**: A new game is started, all players receive the `game_started` Socket event, and the game screen loads with cards dealt

### AC-ROOM-009: Non-host cannot start game
- **Given**: A room is in waiting state with 2+ players
- **When**: A non-host player clicks "Bắt đầu"
- **Then**: The button is not rendered for that player, or if an API call is made, error "NOT_HOST" is returned

### AC-ROOM-010: Player can leave room from waiting state
- **Given**: Player is in a room's waiting room
- **When**: Player clicks " Quay lại" (back button) or "Rời phòng"
- **Then**: Player is removed from room and redirected to lobby
- **And**: Room's player list updates for all remaining players

---

## 3. Core Gameplay — Cards & Deck

### AC-CARD-001: Each player receives exactly 5 cards
- **Given**: A game has started with N players (2–4)
- **When**: The `game_started` event is received
- **Then**: Every connected player has exactly 5 cards in their hand (server-side only until showdown)

### AC-CARD-002: Server deals cards — client never receives other players' private cards
- **Given**: A game is in progress
- **When**: Any client receives a `game_state_update` or `GET /api/games/{id}` response
- **Then**: Other players' `hand` arrays are empty arrays `[]`, not containing actual card values
- **And**: `myCards` (for the requesting player only) contains the 5 actual card strings

### AC-CARD-003: Card strings are valid 52-card deck encodings
- **Given**: A game starts
- **When**: Cards are dealt
- **Then**: All card strings follow the format `{rank}{suit}` where rank is `2-10JQKA` and suit is `c/d/h/s`
- **And**: No card appears more than once across all players' hands

### AC-CARD-004: Hand rankings are correctly evaluated
- **Given**: Player A has ["7h", "7d", "7s", "4c", "2h"] (Three Sevens)
- **And**: Player B has ["Kh", "Kc", "9s", "6d", "3h"] (One Pair of Kings)
- **When**: Showdown occurs
- **Then**: Player A's hand is evaluated as rank 6 (Ba Túc / Full House)
- **And**: Player B's hand is evaluated as rank 4 (Một Đôi / One Pair)
- **And**: Player A wins the pot

### AC-CARD-005: Tiebreaker resolved by highest kicker
- **Given**: Player A has ["Ah", "Kh", "Qh", "Jh", "10h"] ( Straight Flush A-high)
- **And**: Player B has ["Ad", "Kd", "Qd", "Jd", "10d"] ( Straight Flush A-high, different suit)
- **When**: Showdown evaluates both
- **Then**: Both have equal rank (straight flush) and equal high card (A); pot is split (or tiebreaker goes to spade suit — highest suit wins)

### AC-CARD-006: Folded players' cards are shown face-down at showdown
- **Given**: Player A has folded during betting
- **When**: Showdown occurs
- **Then**: Player A's cards are displayed face-down (card back pattern) in the showdown modal
- **And**: "Đã bỏ bài" label appears under Player A's hand

---

## 4. Core Gameplay — Betting

### AC-BET-001: Minimum bet is 10 chips (ante)
- **Given**: A betting round starts (phase = "betting1")
- **When**: A player attempts to place a bet
- **Then**: The minimum bet amount is enforced as 10 chips server-side

### AC-BET-002: Bet action creates pot contribution
- **Given**: Player is active in betting round with currentBet=0 and minBet=10
- **When**: Player submits `bet` action with amount=20
- **Then**: Player's `betThisRound` = 20, `totalBet` = 20, `currentBet` (global) = 20, and pot = 20

### AC-BET-003: Call action matches current bet
- **Given**: Another player has bet 20, and currentBet=20
- **When**: Player submits `call` action (no amount needed)
- **Then**: Player's `betThisRound` = 20, `totalBet` increases by 20, and pot increases by 20

### AC-BET-004: Raise action must exceed current bet by at least minBet
- **Given**: currentBet=20 and minBet=10
- **When**: Player submits `raise` action with amount=25
- **Then**: The raise is rejected with error "INVALID_RAISE_AMOUNT" because 25 is not at least 20+10=30

### AC-BET-005: Valid raise updates currentBet and pot
- **Given**: currentBet=20, minBet=10
- **When**: Player submits `raise` action with amount=35
- **Then**: Player's totalBet += 35, pot += 35, and currentBet = 35

### AC-BET-006: Fold action removes player from betting
- **Given**: Player has bet 10 in the current round and submits `fold`
- **When**: Fold is accepted
- **Then**: Player's `status` changes to "folded", hand remains hidden, player cannot act further this round

### AC-BET-007: Turn enforcement — only active player can act
- **Given**: It is Player 2's turn (currentTurnIndex=1)
- **When**: Player 1 submits any betting action
- **Then**: The action is rejected with error "NOT_YOUR_TURN"

### AC-BET-008: Turn advances after bet/call/raise/fold
- **Given**: currentTurnIndex=0, pot=20, 2 active players remain
- **When**: Player at index 0 submits a bet of 20
- **Then**: currentTurnIndex advances to 1, and the other player's BettingControls become enabled

### AC-BET-009: All-in is supported when player has insufficient chips
- **Given**: Player has total chips = 50, and the current bet required to call is 80
- **When**: Player submits `bet` or `call` with amount > remaining chips
- **Then**: Player can choose "All-in" which puts all remaining chips in pot, and `status` becomes "all_in"

### AC-BET-010: Phase transitions — betting1 → betting2 when all called/folded
- **Given**: Phase is "betting1", all active players have either called the current bet or folded
- **When**: The last player's action is processed
- **Then**: Phase transitions to "betting2" or directly to "showdown" if only one player remains active

### AC-BET-011: Betting controls reflect correct actions per game state
- **Given**: currentBet=0 (no bet yet)
- **When**: BettingControls render
- **Then**: "Cược" button is shown (to place first bet), "Theo" button is disabled, "Tăng" button is disabled
- **And**: When currentBet>0, "Cược" is disabled, "Theo" becomes enabled

---

## 5. Core Gameplay — Showdown & Winner

### AC-SHOW-001: Showdown triggered when all players have acted and at least 1 remains non-folded
- **Given**: Phase is "betting2", all active players have matched the currentBet, no further raises
- **When**: The last player's action is processed
- **Then**: Phase transitions to "showdown" and `showdown` Socket event is emitted with all hands

### AC-SHOW-002: Winner receives full pot
- **Given**: Pot = 240, Player A is the only non-folded player at showdown
- **When**: Showdown resolves with Player A having highest hand
- **Then**: Player A's `games_won` stat increments, and the pot of 240 is awarded

### AC-SHOW-003: Showdown event includes all hands revealed
- **Given**: Showdown occurs with 4 players (some folded, some active)
- **When**: The `showdown` event is emitted to all clients
- **Then**: Each non-folded player's 5 cards are revealed, and folded players' cards are marked hidden

### AC-SHOW-004: ShowdownModal displays correct hand ranking for each player
- **Given**: Player A has hand ["7h", "7d", "7s", "4c", "2h"]
- **When**: ShowdownModal opens
- **Then**: Player A's section shows "Tứ Quý 7" as the hand name (rank 9, Tứ Quý)

### AC-SHOW-005: Rematch starts new hand without leaving room
- **Given**: Game is in showdown phase
- **When**: Host clicks "Chơi lại"
- **Then**: New cards are dealt to all players, phase returns to "betting1", pot resets to 0, dealer_index rotates

### AC-SHOW-006: Single remaining player wins by default if all others fold
- **Given**: 3 of 4 players have folded, only Player B remains active
- **When**: All folds are processed
- **Then**: Game transitions to showdown immediately, Player B wins the pot, no card reveal needed

---

## 6. Real-time Updates

### AC-REALT-001: Room join/update visible within 2 seconds
- **Given**: Player A is in a room waiting
- **When**: Player B joins the same room via code
- **Then**: Player A sees Player B appear in the player list within 2 seconds via Socket event

### AC-REALT-002: Betting action broadcast to all room members within 500ms
- **Given**: All 4 players are in an active game
- **When**: Player 1 submits a bet action and it is validated
- **Then**: All other 3 players receive `game_state_update` within 500ms

### AC-REALT-003: Disconnection indicator shown within 10 seconds
- **Given**: A player loses network connectivity (tab closed, internet lost)
- **When**: Socket.IO server detects the disconnection
- **Then**: All other players in the room receive `player_disconnected` event within 10 seconds, showing an offline indicator

### AC-REALT-004: Reconnect restores room and game state
- **Given**: Player was in a game room with playerId="uuid123"
- **When**: Player refreshes the page (simulating reconnect)
- **Then**: The same room is re-joined via Socket with the same `playerId`, and the current game state is fetched and displayed

### AC-REALT-005: No duplicate actions if Socket event arrives twice
- **Given**: Player submits a bet action
- **When**: The same `game_state_update` event arrives twice (network duplicate)
- **Then**: The game state is idempotent — applying it twice produces the same state as applying it once

---

## 7. Mobile Experience

### AC-MOB-001: Game is playable at 375px viewport width without horizontal scroll
- **Given**: Player opens the game on a mobile device at 375px width
- **When**: Player navigates through the full game flow (lobby → room → playing)
- **Then**: No horizontal scrolling is needed; all elements fit within 375px width

### AC-MOB-002: Card hand scrolls horizontally on mobile
- **Given**: Player is on a mobile device and has 5 cards in hand
- **When**: Cards are displayed
- **Then**: Cards render in a horizontal row with horizontal scroll enabled if needed
- **And**: Cards remain at least 52×78px (readable at mobile size)

### AC-MOB-003: Touch targets are at least 44×44px
- **Given**: Player is on a mobile device
- **When**: Player taps any interactive element (buttons, cards)
- **Then**: All interactive elements meet minimum touch target size of 44×44px

### AC-MOB-004: Betting controls fixed at bottom on mobile
- **Given**: Player is on a mobile device in the playing state
- **When**: Player scrolls down or plays
- **Then**: Betting action buttons remain visible at the bottom of the viewport (sticky position)

---

## 8. Error Handling

### AC-ERR-001: Network error shows retry option
- **Given**: Player loses internet connectivity
- **When**: An API call to `/api/rooms` or `/api/games` fails
- **Then**: A toast message "Mất kết nối. Vui lòng thử lại." appears with a Retry button

### AC-ERR-002: Invalid room code shows appropriate message
- **Given**: Player opens a link to a non-existent room `https://lieng-trung.vercel.app/room/999999`
- **When**: The system tries to load the room
- **Then**: Message "Phòng không tồn tại hoặc đã bị xóa" appears with a " Quay về sảnh" (back to lobby) button

### AC-ERR-003: Room full rejection
- **Given**: A room has maxPlayers=4 and 4 players are already in it
- **When**: A 5th player tries to join via share link
- **Then**: Error "Phòng đã đầy" is shown (HTTP 409), player is not joined, redirected to lobby silently

### AC-ERR-004: Loading states during async room creation
- **Given**: Player clicks "Tạo phòng"
- **When**: The API call to create the room is in flight
- **Then**: A loading spinner is shown on the button (button disabled, text changes to "Đang tạo...")

### AC-ERR-005: Duplicate player join rejected
- **Given**: Player A has already joined room "482931" with playerId "uuid-123"
- **When**: Player A tries to join the same room again
- **Then**: Error "PLAYER_ALREADY_JOINED" is returned, and the client does not create a duplicate entry

### AC-ERR-006: Invalid bet amount rejected
- **Given**: Phase is "betting1", minBet=10, currentBet=0
- **When**: Player submits a `bet` action with amount=5 (below minimum)
- **Then**: The action is rejected with error "BET_TOO_LOW", game state unchanged

---

## 9. Data Persistence

### AC-PERS-001: Game state survives page refresh (no localStorage clear)
- **Given**: A game is in progress at phase "betting1" with pot=240
- **When**: Player refreshes the browser page (without clearing localStorage)
- **Then**: The player reconnects to the same room and sees the same game state with pot=240

### AC-PERS-002: Completed game record stored in MongoDB
- **Given**: A game has ended with a winner
- **When**: The `showdown` phase completes
- **Then**: The game document in MongoDB has `status: "finished"` with `result.winner_id` and `result.pot` recorded with timestamp

### AC-PERS-003: Player session stats persist (w/l count)
- **Given**: Player has previously won 3 games and lost 2
- **When**: Player wins another game
- **Then**: The `games_won` field in the player's session document increments to 4

---

## AC Summary

| AC ID | Feature | Priority | Tested |
|-------|---------|----------|--------|
| AC-ID-001 | Anonymous ID generation | Must Have | ❌ |
| AC-ID-002 | ID persistence | Must Have | ❌ |
| AC-ID-003 | Default Vietnamese name | Must Have | ❌ |
| AC-ID-004 | Rules overlay shown once | Must Have | ❌ |
| AC-ROOM-001 | Create public room | Must Have | ❌ |
| AC-ROOM-002 | Room name validation | Must Have | ❌ |
| AC-ROOM-003 | Room appears in list | Must Have | ❌ |
| AC-ROOM-004 | 6-digit room code | Must Have | ❌ |
| AC-ROOM-005 | Private room hidden | Must Have | ❌ |
| AC-ROOM-006 | Join via share link | Must Have | ❌ |
| AC-ROOM-007 | Player count display | Must Have | ❌ |
| AC-ROOM-008 | Host starts game | Must Have | ❌ |
| AC-ROOM-009 | Non-host cannot start | Must Have | ❌ |
| AC-ROOM-010 | Leave room | Must Have | ❌ |
| AC-CARD-001 | 5 cards dealt | Must Have | ❌ |
| AC-CARD-002 | Server-authoritative cards | Must Have | ❌ |
| AC-CARD-003 | Valid 52-card encodings | Must Have | ❌ |
| AC-CARD-004 | Hand ranking evaluation | Must Have | ❌ |
| AC-CARD-005 | Tiebreaker resolution | Must Have | ❌ |
| AC-CARD-006 | Folded cards face-down | Must Have | ❌ |
| AC-BET-001 | Minimum bet 10 chips | Must Have | ❌ |
| AC-BET-002 | Bet action | Must Have | ❌ |
| AC-BET-003 | Call action | Must Have | ❌ |
| AC-BET-004 | Raise validation | Must Have | ❌ |
| AC-BET-005 | Valid raise | Must Have | ❌ |
| AC-BET-006 | Fold action | Must Have | ❌ |
| AC-BET-007 | Turn enforcement | Must Have | ❌ |
| AC-BET-008 | Turn advance after action | Must Have | ❌ |
| AC-BET-009 | All-in support | Should Have | ❌ |
| AC-BET-010 | Phase transitions | Must Have | ❌ |
| AC-BET-011 | Betting controls state | Must Have | ❌ |
| AC-SHOW-001 | Showdown trigger | Must Have | ❌ |
| AC-SHOW-002 | Winner receives pot | Must Have | ❌ |
| AC-SHOW-003 | Showdown reveals hands | Must Have | ❌ |
| AC-SHOW-004 | Hand ranking displayed | Must Have | ❌ |
| AC-SHOW-005 | Rematch new hand | Must Have | ❌ |
| AC-SHOW-006 | Auto-win by folding | Must Have | ❌ |
| AC-REALT-001 | Room updates <2s | Must Have | ❌ |
| AC-REALT-002 | Betting broadcast <500ms | Must Have | ❌ |
| AC-REALT-003 | Disconnect detection <10s | Must Have | ❌ |
| AC-REALT-004 | Reconnect restores state | Must Have | ❌ |
| AC-REALT-005 | Idempotent state updates | Must Have | ❌ |
| AC-MOB-001 | No horizontal scroll 375px | Must Have | ❌ |
| AC-MOB-002 | Card hand scrolls | Must Have | ❌ |
| AC-MOB-003 | Touch targets 44px | Must Have | ❌ |
| AC-MOB-004 | Sticky betting controls | Must Have | ❌ |
| AC-ERR-001 | Network error retry | Must Have | ❌ |
| AC-ERR-002 | Invalid room message | Must Have | ❌ |
| AC-ERR-003 | Room full rejection | Must Have | ❌ |
| AC-ERR-004 | Loading states | Must Have | ❌ |
| AC-ERR-005 | Duplicate join rejected | Must Have | ❌ |
| AC-ERR-006 | Invalid bet rejected | Must Have | ❌ |
| AC-PERS-001 | Game state refresh | Must Have | ❌ |
| AC-PERS-002 | Game record in MongoDB | Must Have | ❌ |
| AC-PERS-003 | Player w/l persistence | Should Have | ❌ |
