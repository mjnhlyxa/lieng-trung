# Lieng — Hand Evaluator

> **C4 Level**: 3 — Hand Ranking & Evaluation

## 1. Card System

### 1.1 Encoding
- Rank: `2 3 4 5 6 7 8 9 10 J Q K A` (14 values, A is highest)
- Suits: `clubs: ♣`, `diamonds: ♦`, `hearts: ♥`, `spades: ♠`
- Visual string: `7h` (= rank "7", suit "hearts"), `Kd` (= "K", "diamonds"), `As`

### 1.2 Rank Values (for comparison)
```
2=2, 3=3, 4=4, 5=5, 6=6, 7=7, 8=8, 9=9, 10=10, J=11, Q=12, K=13, A=14
```

### 1.3 Suit Values (tiebreaker — spades highest)
```
clubs=0, diamonds=1, hearts=2, spades=3
```

---

## 2. Hand Types (Best to Worst)

| Rank | Name | Description | Tiebreaker |
|------|------|-------------|------------|
| 9 | **Tứ Quý** (Four of a kind) | 4 cards same rank | Rank of the 4 |
| 8 | **Sảnh Rồng** (Dragon straight) | A-2-3-4-5 of same suit | Tie rare |
| 7 | **Sảnh** (Straight) | 5 consecutive any suit | Highest card |
| 6 | **Ba Túc** (Full house) | 3 of kind + 1 pair | Rank of 3 |
| 5 | **Bộ Đôi** (Two pair) | 2 different pairs | Higher pair rank |
| 4 | **Một Đôi** (One pair) | 2 cards same rank | Pair rank, then kickers |
| 3 | **Mậu Thầu** (High card) | No combination | Highest card, then kickers |

---

## 3. Evaluation Algorithm

```python
# apps/api/services/hand_evaluator.py

RANKS = "234567891JQKA"  # 2-14 (A high)
RANK_MAP = {r: i+2 for i, r in enumerate("234567891JQKA")}
SUIT_MAP = {"c": 0, "d": 1, "h": 2, "s": 3}

def parse_card(card_str: str) -> tuple[int, int]:
    """Returns (rank_value 2-14, suit_value 0-3)"""
    suit = SUIT_MAP[card_str[-1]]
    rank_str = card_str[:-1]
    rank = RANK_MAP[rank_str]
    return rank, suit

def evaluate_hand(cards: list[str]) -> tuple[int, list[int]]:
    """
    Returns (rank_value 3-9, tiebreaker_values).
    Higher rank = better hand.
    """
    rank_counts: dict[int, int] = {}
    suit_counts: dict[int, int] = {}
    ranks = []
    suits = []

    for card in cards:
        rank, suit = parse_card(card)
        ranks.append(rank)
        suits.append(suit)
        rank_counts[rank] = rank_counts.get(rank, 0) + 1

    # Count occurrences for each rank
    counts = sorted(rank_counts.values(), reverse=True)  # e.g. [4] or [3,2] or [2,1,1,1]
    distinct_ranks = sorted(rank_counts.keys(), key=lambda r: rank_counts[r] * 100 + r, reverse=True)

    # Check for straight (5 consecutive)
    sorted_ranks = sorted(set(ranks))
    straight = False
    straight_high = 0
    for i in range(len(sorted_ranks) - 4):
        if sorted_ranks[i+4] - sorted_ranks[i] == 4:
            straight = True
            straight_high = sorted_ranks[i+4]
    # Wheel straight A-2-3-4-5
    if set(sorted_ranks) == {14, 2, 3, 4, 5}:
        straight = True
        straight_high = 5

    ranked_ranks = [rank_counts[r] for r in distinct_ranks]
    unique_count = len(set(ranks))

    # Tứ Quý (Four of a kind)
    if counts == [4, 1]:
        four_rank = [r for r in distinct_ranks if rank_counts[r] == 4][0]
        kicker = [r for r in distinct_ranks if rank_counts[r] == 1][0]
        return (9, [four_rank, kicker])

    # Sảnh Rồng (A-2-3-4-5 same suit)
    if straight and len(set(suits)) == 1 and straight_high == 14:
        # Actually wheel: A is 14 but 5 is high card in wheel
        return (8, [5])

    # Sảnh (Straight)
    if straight:
        return (7, [straight_high])

    # Ba Túc (Full house)
    if counts == [3, 2]:
        three_rank = [r for r in distinct_ranks if rank_counts[r] == 3][0]
        pair_rank = [r for r in distinct_ranks if rank_counts[r] == 2][0]
        return (6, [three_rank, pair_rank])

    # Bộ Đôi (Two pair)
    if counts == [2, 2, 1]:
        pairs = [r for r in distinct_ranks if rank_counts[r] == 2]
        kicker = [r for r in distinct_ranks if rank_counts[r] == 1][0]
        return (5, sorted(pairs, reverse=True) + [kicker])

    # Một Đôi (One pair)
    if counts == [2, 1, 1, 1]:
        pair_rank = [r for r in distinct_ranks if rank_counts[r] == 2][0]
        kickers = sorted([r for r in distinct_ranks if rank_counts[r] == 1], reverse=True)
        return (4, [pair_rank] + kickers)

    # Mậu Thầu (High card)
    kickers = sorted(ranks, reverse=True)
    return (3, kickers)
```

---

## 4. Showdown Comparison

```python
def compare_hands(hand1: list[str], hand2: list[str]) -> int:
    """Returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie"""
    score1 = evaluate_hand(hand1)
    score2 = evaluate_hand(hand2)

    if score1[0] != score2[0]:
        return 1 if score1[0] > score2[0] else -1

    # Same hand type — compare tiebreaker
    for i in range(len(score1[1])):
        if score1[1][i] != score2[1][i]:
            return 1 if score1[1][i] > score2[1][i] else -1
    return 0
```

---

## 5. Example Showdown

```
Player 1 hand: ["7h", "7d", "Js", "4c", "2h"]   → Một Đôi 7  (rank 4, [7, 11, 4, 2])
Player 2 hand: ["Kh", "Kc", "9s", "6d", "3h"]  → Mậu Thầu K (rank 3, [13, 9, 6, 3, 2])
Result: Player 1 wins (pair beats high card)
```
