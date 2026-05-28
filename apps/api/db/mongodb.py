import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://10.60.184.61:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "LiengCardGame")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[MONGODB_DB_NAME]

rooms = db["rooms"]
games_db = db["games"]
sessions = db["sessions"]


async def init_indexes():
    await rooms.create_index("code", unique=True)
    await rooms.create_index("status")
    await rooms.create_index("created_at")
    await games_db.create_index("room_id")
    await games_db.create_index("started_at")
    await sessions.create_index("id", unique=True)


async def get_room_by_code(code: str):
    return await rooms.find_one({"code": code})


async def create_room(code: str, name: str, host_id: str, host_name: str, max_players: int, is_private: bool):
    room_doc = {
        "code": code,
        "name": name,
        "host_id": host_id,
        "max_players": max_players,
        "is_private": is_private,
        "players": [{"id": host_id, "name": host_name, "connected": True, "joined_at": datetime.utcnow()}],
        "game_id": None,
        "status": "lobby",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await rooms.insert_one(room_doc)
    room_doc["_id"] = str(result.inserted_id)
    return room_doc
