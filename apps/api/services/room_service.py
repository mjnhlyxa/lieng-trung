"""Room service — CRUD operations for rooms."""
import secrets
from typing import Optional
from datetime import datetime
from bson import ObjectId

from apps.api.db.mongodb import rooms, get_room_by_code


def generate_code() -> str:
    """Generate a unique 6-digit room code."""
    return str(secrets.randbelow(900000) + 100000)


async def create_room(name: str, host_id: str, host_name: str, max_players: int = 4, is_private: bool = False) -> dict:
    """Create a new room with unique 6-digit code."""
    # Ensure code is unique
    while True:
        code = generate_code()
        existing = await rooms.find_one({"code": code})
        if not existing:
            break

    room_doc = {
        "code": code,
        "name": name,
        "host_id": host_id,
        "max_players": max_players,
        "is_private": is_private,
        "players": [{
            "id": host_id,
            "name": host_name,
            "connected": True,
            "joined_at": datetime.utcnow()
        }],
        "game_id": None,
        "status": "lobby",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await rooms.insert_one(room_doc)
    room_doc["_id"] = result.inserted_id
    return _serialize_room(room_doc)


async def find_room(room_id: str) -> Optional[dict]:
    """Find room by MongoDB _id."""
    try:
        return await rooms.find_one({"_id": ObjectId(room_id)})
    except Exception:
        return await rooms.find_one({"code": room_id})


async def find_room_by_code(code: str) -> Optional[dict]:
    """Find room by 6-digit code."""
    return await rooms.find_one({"code": code})


async def list_open_rooms() -> list[dict]:
    """List public rooms in lobby state."""
    cursor = rooms.find({"is_private": False, "status": "lobby"}).sort("created_at", -1).limit(50)
    room_list = await cursor.to_list(length=50)
    return [_serialize_room(r) for r in room_list]


async def join_room(room_id: str, player_id: str, player_name: str) -> tuple[Optional[dict], Optional[str]]:
    """
    Add player to room. Returns (updated_room, error_code).
    """
    room = await find_room(room_id)
    if not room:
        return None, "ROOM_NOT_FOUND"
    if len(room["players"]) >= room["max_players"]:
        return None, "ROOM_FULL"
    if any(p["id"] == player_id for p in room["players"]):
        return None, "PLAYER_ALREADY_JOINED"
    new_players = room["players"] + [{
        "id": player_id,
        "name": player_name,
        "connected": True,
        "joined_at": datetime.utcnow()
    }]
    new_status = "full" if len(new_players) >= room["max_players"] else "lobby"
    await rooms.update_one(
        {"_id": room["_id"]},
        {"$set": {"players": new_players, "status": new_status, "updated_at": datetime.utcnow()}}
    )
    room["players"] = new_players
    room["status"] = new_status
    return _serialize_room(room), None


async def leave_room(room_id: str, player_id: str) -> bool:
    """Remove player from room. Returns True if successful."""
    room = await find_room(room_id)
    if not room:
        return False
    original_players = room["players"]
    new_players = [p for p in original_players if p["id"] != player_id]
    if len(new_players) == 0:
        await rooms.delete_one({"_id": room["_id"]})
    else:
        new_status = "lobby" if new_players else "lobby"
        await rooms.update_one(
            {"_id": room["_id"]},
            {"$set": {"players": new_players, "status": new_status, "updated_at": datetime.utcnow()}}
        )
    return True


def _serialize_room(room: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    return {
        "id": str(room["_id"]),
        "code": room["code"],
        "name": room["name"],
        "host_id": room["host_id"],
        "max_players": room["max_players"],
        "is_private": room.get("is_private", False),
        "players": room["players"],
        "game_id": str(room["game_id"]) if room.get("game_id") else None,
        "status": room["status"],
        "created_at": room["created_at"].isoformat(),
        "updated_at": room["updated_at"].isoformat(),
    }
