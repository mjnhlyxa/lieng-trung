"""Card deck service — server-side only. Cards are NEVER sent to clients until showdown."""
import secrets
from typing import List


RANKS = "234567891JQKA"
SUITS = ["c", "d", "h", "s"]


def create_deck() -> List[str]:
    """Returns a shuffled 52-card deck."""
    deck = [f"{rank}{suit}" for suit in SUITS for rank in RANKS]
    for i in range(len(deck) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        deck[i], deck[j] = deck[j], deck[i]
    return deck


def deal_cards(deck: List[str], n: int) -> tuple[List[str], List[str]]:
    """Deals n cards from deck. Returns (hand, remaining_deck)."""
    hand = deck[:n]
    remaining = deck[n:]
    return hand, remaining


def deal_to_players(deck: List[str], player_count: int, cards_per_player: int = 5) -> tuple[dict[str, List[str]], List[str]]:
    """
    Deals cards to multiple players.
    Returns ({player_index: hand}, remaining_deck).
    """
    hands: dict[str, List[str]] = {}
    for i in range(player_count):
        hand, deck = deal_cards(deck, cards_per_player)
        hands[str(i)] = hand
    return hands, deck


RANKS_DISPLAY = {
    "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
    "8": "8", "9": "9", "10": "10", "J": "J", "Q": "Q", "K": "K", "A": "A"
}
SUIT_SYMBOLS = {"c": "♣", "d": "♦", "h": "♥", "s": "♠"}


def card_to_display(card: str) -> dict:
    suit_code = card[-1]
    rank_str = card[:-1]
    rank = rank_str
    suit = SUIT_SYMBOLS[suit_code]
    return {"rank": rank, "suit": suit, "raw": card}
