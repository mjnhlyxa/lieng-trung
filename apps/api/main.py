"""FastAPI + Socket.IO server for Lieng card game."""
import os
import socketio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.db.mongodb import init_indexes
from apps.api.routers import rooms_router, games_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_indexes()
    yield


app = FastAPI(title="Lieng API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms_router)
app.include_router(games_router)

# Socket.IO server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    ping_timeout=30,
    ping_interval=25,
)

# Socket.IO event handlers
@sio.event
async def create_room(sid, data):
    from apps.api.services.room_service import create_room as svc_create_room
    room = await svc_create_room(
        name=data.get("name", "Phòng không tên"),
        host_id=data["playerId"],
        host_name=data["playerName"],
        max_players=data.get("maxPlayers", 4),
        is_private=data.get("isPrivate", False),
    )
    share_url = f"https://lieng-trung.vercel.app/room/{room['code']}"
    await sio.emit("room_joined", {**room, "share_url": share_url}, room=sid)
    return {"room": {**room, "share_url": share_url}, "roomCode": room["code"]}


@sio.event
async def join_room(sid, data):
    from apps.api.services.room_service import find_room_by_code, join_room as svc_join_room
    code = data["roomCode"]
    player_id = data["playerId"]
    player_name = data["playerName"]
    room = await find_room_by_code(code)
    if not room:
        await sio.emit("error", {"code": "ROOM_NOT_FOUND", "message": "Phòng không tồn tại"}, to=sid)
        return {"error": "ROOM_NOT_FOUND"}
    room, join_err = await svc_join_room(code, player_id, player_name)
    if join_err:
        await sio.emit("error", {"code": join_err, "message": f"Lỗi: {join_err}"}, to=sid)
        return {"error": join_err}
    await sio.enter_room(sid, code)
    await sio.emit("room_update", room, room=code)
    await sio.emit("room_joined", room, to=sid)
    return {"room": room, "roomCode": code}


@sio.event
async def leave_room(sid, data):
    from apps.api.services.room_service import leave_room as svc_leave_room
    code = data["roomCode"]
    player_id = data["playerId"]
    await svc_leave_room(code, player_id)
    await sio.leave_room(sid, code)
    await sio.emit("room_update", {"code": code}, room=code)


@sio.event
async def start_game(sid, data):
    from apps.api.services.room_service import find_room_by_code
    from apps.api.services.game_service import start_game as svc_start_game
    code = data["roomCode"]
    player_id = data["playerId"]
    room = await find_room_by_code(code)
    if not room:
        await sio.emit("error", {"code": "ROOM_NOT_FOUND", "message": "Phòng không tồn tại"}, to=sid)
        return
    if room.get("host_id") != player_id:
        await sio.emit("error", {"code": "NOT_HOST", "message": "Chỉ chủ phòng mới có thể bắt đầu"}, to=sid)
        return
    game, error = await svc_start_game(code)
    if error:
        await sio.emit("error", {"code": error, "message": f"Lỗi: {error}"}, to=sid)
        return
    await sio.emit("game_started", game, room=code)


@sio.event
async def player_action(sid, data):
    from apps.api.services.game_service import apply_action as svc_apply_action
    game_id = data["gameId"]
    player_id = data["playerId"]
    action = data["action"]
    amount = data.get("amount")
    room_code = data.get("roomCode", "")

    game, error, action_result = await svc_apply_action(game_id, player_id, action, amount)
    if error:
        await sio.emit("error", {"code": error, "message": f"Lỗi: {error}"}, to=sid)
        return
    await sio.emit("game_state_update", game, room=room_code)
    return {"success": True, "game": game, "action_result": action_result}


@sio.event
async def rematch(sid, data):
    from apps.api.services.game_service import rematch as svc_rematch, get_game
    room_id = data["roomId"]
    game = await get_game(data.get("gameId"))
    if not game:
        await sio.emit("error", {"code": "GAME_NOT_FOUND", "message": "Không tìm thấy game"}, to=sid)
        return
    new_game, error = await svc_rematch(room_id)
    if error:
        await sio.emit("error", {"code": error, "message": f"Lỗi: {error}"}, to=sid)
        return
    from apps.api.services.room_service import find_room
    room = await find_room(room_id)
    if room:
        await sio.emit("game_started", new_game, room=room["code"])


@sio.event
async def disconnect(sid):
    pass


# Mount Socket.IO with FastAPI
app = socketio.ASGIApp(sio, app)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
