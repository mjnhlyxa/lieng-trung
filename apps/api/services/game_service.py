"""Game service — game lifecycle, betting, and showdown."""
import secrets
from datetime import datetime
from bson import ObjectId
from typing import Optional, Tuple

from apps.api.db.mongodb import games_db
from apps.api.services.deck_service import create_deck, deal_cards
from apps.api.services.hand_evaluator import evaluate_hand, compare_hands, get_hand_name
from apps.api.services.room_service import find_room


async def start_game(room_id: str) -> Tuple[Optional[dict], Optional[str]]:
    """
    Create a new game in a room. Deal cards to players server-side.
    Returns (game_state, error).
    """
    room = await find_room(room_id)
    if not room:
        return None, "ROOM_NOT_FOUND"
    if room["status"] != "lobby":
        return None, "GAME_ALREADY_STARTED"
    if len(room["players"]) < 2:
        return None, "NOT_ENOUGH_PLAYERS"

    # Create shuffled deck and deal cards
    deck = create_deck()
    player_count = len(room["players"])
    player_hands: dict[str, list[str]] = {}
    for i, player in enumerate(room["players"]):
        hand, deck = deal_cards(deck, 5)
        player_hands[player["id"]] = hand

    game_doc = {
        "room_id": ObjectId(room_id),
        "dealer_index": 0,
        "deck": deck,                      # Server-only
        "players": [
            {
                "id": p["id"],
                "name": p["name"],
                "hand": player_hands[p["id"]],  # Server-only
                "bet_this_round": 0,
                "total_bet": 0,
                "status": "active",
                "move_count": 0,
            }
            for p in room["players"]
        ],
        "community_cards": [],
        "pot": 0,
        "phase": "betting1",
        "current_turn_index": 1,  # Start left of dealer
        "current_bet": 0,
        "min_bet": 10,
        "actions_log": [],
        "result": None,
        "started_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await games_db.insert_one(game_doc)
    game_doc["_id"] = result.inserted_id

    # Update room with game_id
    from apps.api.db.mongodb import rooms
    await rooms.update_one(
        {"_id": ObjectId(room_id)},
        {"$set": {"game_id": game_doc["_id"], "status": "playing"}}
    )
    return _serialize_game(game_doc, None), None


async def get_game(game_id: str, player_id: Optional[str] = None) -> Optional[dict]:
    """Get game state. Hide other players' hands unless showdown or player_id matches."""
    try:
        game = await games_db.find_one({"_id": ObjectId(game_id)})
    except Exception:
        return None
    if not game:
        return None
    # Hide hands for non-showdown
    showdown = game.get("phase") == "showdown"
    for p in game["players"]:
        if not showdown and p["id"] != player_id:
            p["hand"] = []
        elif showdown:
            pass  # reveal all
    return _serialize_game(game, player_id)


async def get_game_by_room(room_id: str) -> Optional[dict]:
    """Get the active game for a room by room_id (string or ObjectId)."""
    try:
        oid = ObjectId(room_id)
        game = await games_db.find_one({"room_id": oid, "result": None})
    except Exception:
        game = await games_db.find_one({"room_id": room_id, "result": None})
    if not game:
        return None
    return _serialize_game(game, None)


async def apply_action(game_id: str, player_id: str, action: str, amount: Optional[int] = None) -> Tuple[Optional[dict], Optional[str], Optional[dict]]:
    """
    Apply a betting action. Returns (game_state, error_code, action_result).
    """
    try:
        game = await games_db.find_one({"_id": ObjectId(game_id)})
    except Exception:
        return None, "GAME_NOT_FOUND", None
    if not game:
        return None, "GAME_NOT_FOUND", None
    if game.get("result"):
        return None, "GAME_FINISHED", None

    players = game["players"]
    current_turn = game["current_turn_index"]
    current_player = players[current_turn] if players else None

    if not current_player or current_player["id"] != player_id:
        return None, "NOT_YOUR_TURN", None

    if current_player.get("status") == "folded":
        return None, "PLAYER_FOLDED", None

    phase = game["phase"]
    pot = game["pot"]
    current_bet = game["current_bet"]
    min_bet = game["min_bet"]

    action_result = {"accepted": False, "new_pot": pot, "new_current_bet": current_bet, "new_bet_this_round": 0}

    if action == "bet":
        if current_bet != 0:
            return None, "BET_NOT_ALLOWED", None
        if not amount or amount < min_bet:
            return None, "BET_TOO_LOW", None
        current_player["bet_this_round"] = amount
        current_player["total_bet"] += amount
        pot += amount
        current_bet = amount
        game["current_bet"] = current_bet
        game["pot"] = pot
        action_result = {"accepted": True, "new_pot": pot, "new_current_bet": current_bet, "new_bet_this_round": amount}

    elif action == "call":
        to_call = current_bet - current_player["bet_this_round"]
        if to_call <= 0:
            return None, "NOTHING_TO_CALL", None
        call_amount = min(to_call, current_player.get("stack", 999999))
        current_player["bet_this_round"] = current_bet
        current_player["total_bet"] += call_amount
        pot += call_amount
        game["pot"] = pot
        action_result = {"accepted": True, "new_pot": pot, "new_current_bet": current_bet, "new_bet_this_round": current_bet}

    elif action == "raise":
        if current_bet == 0:
            return None, "NO_BET_TO_RAISE", None
        raise_min = current_bet + min_bet
        if not amount or amount < raise_min:
            return None, "RAISE_TOO_LOW", None
        add_amount = amount - current_player["bet_this_round"]
        current_player["bet_this_round"] = amount
        current_player["total_bet"] += add_amount
        pot += add_amount
        current_bet = amount
        game["current_bet"] = current_bet
        game["pot"] = pot
        action_result = {"accepted": True, "new_pot": pot, "new_current_bet": current_bet, "new_bet_this_round": amount}

    elif action == "fold":
        current_player["status"] = "folded"
        current_player["hand"] = []  # Discard hand
        action_result = {"accepted": True, "new_pot": pot, "new_current_bet": current_bet, "new_bet_this_round": current_player["bet_this_round"]}

    else:
        return None, "INVALID_ACTION", None

    # Log action
    game["actions_log"].append({
        "player_id": player_id,
        "action": action,
        "amount": amount,
        "timestamp": datetime.utcnow(),
    })
    current_player["move_count"] += 1

    # Advance turn: find next active player
    active_indices = [i for i, p in enumerate(players) if p["status"] == "active"]
    if len(active_indices) == 1:
        # Only one left — they win
        winner_idx = active_indices[0]
        return await _finish_game(game, winner_idx, "all_folded"), None, action_result
    if len(active_indices) == 0:
        return None, "NO_ACTIVE_PLAYERS", None

    next_idx = active_indices[(active_indices.index(current_turn) + 1) % len(active_indices)]
    game["current_turn_index"] = next_idx

    # Reset betting for next round if needed
    if phase == "betting1":
        # Check if all active players have called current bet
        active_players = [p for p in players if p["status"] == "active"]
        all_called = all(p["bet_this_round"] == current_bet for p in active_players)
        if all_called:
            game["phase"] = "betting2"
            for p in players:
                p["bet_this_round"] = 0
            game["current_bet"] = 0
            game["current_turn_index"] = active_indices[0]

    game["updated_at"] = datetime.utcnow()
    await games_db.update_one({"_id": ObjectId(game_id)}, {"$set": game})

    return _serialize_game(game, None), None, action_result


async def _finish_game(game: dict, winner_idx: int, reason: str) -> dict:
    """Finish game, evaluate hands, determine winner."""
    players = game["players"]
    winner = players[winner_idx]

    # Evaluate all non-folded hands
    best_idx = winner_idx
    best_score = (-1, [])

    for i, p in enumerate(players):
        if p.get("status") == "folded" or not p.get("hand"):
            continue
        score = evaluate_hand(p["hand"])
        if (score[0], score[1]) > (best_score[0], best_score[1]):
            best_score = score
            best_idx = i

    final_winner = players[best_idx]
    hands_revealed = {p["id"]: p["hand"] for p in players if p.get("hand") and p["status"] != "folded"}

    game["result"] = {
        "winner_id": final_winner["id"],
        "hands": hands_revealed,
        "reason": reason,
    }
    game["phase"] = "showdown"
    game["updated_at"] = datetime.utcnow()

    await games_db.update_one({"_id": game["_id"]}, {"$set": game})
    return _serialize_game(game, None)


async def rematch(room_id: str) -> Tuple[Optional[dict], Optional[str]]:
    """Start a new hand in the same room."""
    game = await get_game_by_room(room_id)
    if not game:
        return None, "GAME_NOT_FOUND"
    # Find room
    room = await find_room(room_id)
    if not room:
        return None, "ROOM_NOT_FOUND"
    # Rotate dealer
    current_dealer = game.get("dealer_index", 0)
    next_dealer = (current_dealer + 1) % len(room["players"])
    return await start_game(room_id)


def _serialize_game(game: dict, player_id: Optional[str]) -> dict:
    """Serialize MongoDB game doc for API response."""
    players_out = []
    showdown = game.get("phase") == "showdown"
    for p in game["players"]:
        hand = p.get("hand", [])
        if not showdown and player_id and p["id"] != player_id:
            hand = []
        players_out.append({
            "id": p["id"],
            "name": p["name"],
            "hand": hand,
            "bet_this_round": p.get("bet_this_round", 0),
            "total_bet": p.get("total_bet", 0),
            "status": p.get("status", "active"),
            "move_count": p.get("move_count", 0),
        })
    return {
        "id": str(game["_id"]),
        "room_id": str(game["room_id"]),
        "dealer_index": game.get("dealer_index", 0),
        "players": players_out,
        "community_cards": game.get("community_cards", []),
        "pot": game.get("pot", 0),
        "phase": game.get("phase", "waiting"),
        "current_turn_index": game.get("current_turn_index", 0),
        "current_bet": game.get("current_bet", 0),
        "min_bet": game.get("min_bet", 10),
        "actions_log": game.get("actions_log", []),
        "result": game.get("result"),
        "started_at": game.get("started_at", "").isoformat() if game.get("started_at") else None,
    }
