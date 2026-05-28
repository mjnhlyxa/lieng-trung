"""Room API router."""
from fastapi import APIRouter, HTTPException
from apps.api.models.room import (
    CreateRoomRequest, JoinRoomRequest,
    RoomResponse, RoomListResponse
)
from apps.api.services.room_service import (
    create_room, find_room, find_room_by_code,
    list_open_rooms, join_room, leave_room
)

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.post("", response_model=RoomResponse)
async def api_create_room(req: CreateRoomRequest):
    room, error = await create_room(
        name=req.name,
        host_id=req.host_id,
        host_name=req.host_name,
        max_players=req.max_players,
        is_private=req.is_private
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    share_url = f"https://lieng-trung.vercel.app/room/{room['code']}"
    return {**room, "share_url": share_url}


@router.get("", response_model=RoomListResponse)
async def api_list_rooms():
    rooms_list = await list_open_rooms()
    return {"rooms": rooms_list}


@router.get("/{room_id}")
async def api_get_room(room_id: str):
    room = await find_room(room_id)
    if not room:
        # Try by code
        room = await find_room_by_code(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="ROOM_NOT_FOUND")
    share_url = f"https://lieng-trung.vercel.app/room/{room['code']}"
    return {**room, "share_url": share_url}


@router.post("/{room_id}/join")
async def api_join_room(room_id: str, req: JoinRoomRequest):
    room, error = await join_room(room_id, req.player_id, req.player_name)
    if error == "ROOM_NOT_FOUND":
        raise HTTPException(status_code=404, detail="ROOM_NOT_FOUND")
    if error == "ROOM_FULL":
        raise HTTPException(status_code=409, detail="ROOM_FULL")
    if error == "PLAYER_ALREADY_JOINED":
        raise HTTPException(status_code=409, detail="PLAYER_ALREADY_JOINED")
    share_url = f"https://lieng-trung.vercel.app/room/{room['code']}"
    return {"success": True, "room": {**room, "share_url": share_url}}


@router.delete("/{room_id}/leave")
async def api_leave_room(room_id: str, req: JoinRoomRequest):
    success = await leave_room(room_id, req.player_id)
    if not success:
        raise HTTPException(status_code=404, detail="ROOM_NOT_FOUND")
    return {"success": True}
