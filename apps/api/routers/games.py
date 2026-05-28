"""Games API router."""
from fastapi import APIRouter, HTTPException
from apps.api.models.game import CreateGameRequest, BetActionRequest, GameStateResponse
from apps.api.services.game_service import (
    start_game, get_game, get_game_by_room, apply_action, rematch
)

router = APIRouter(prefix="/api/games", tags=["games"])


@router.post("")
async def api_create_game(req: CreateGameRequest):
    game, error = await start_game(req.room_id)
    if error == "ROOM_NOT_FOUND":
        raise HTTPException(status_code=404, detail="ROOM_NOT_FOUND")
    if error == "NOT_ENOUGH_PLAYERS":
        raise HTTPException(status_code=400, detail="NOT_ENOUGH_PLAYERS")
    if error == "GAME_ALREADY_STARTED":
        raise HTTPException(status_code=409, detail="GAME_ALREADY_STARTED")
    return {"id": game["id"], "game": game}


@router.get("/{game_id}")
async def api_get_game(game_id: str, player_id: str = ""):
    game = await get_game(game_id, player_id or None)
    if not game:
        raise HTTPException(status_code=404, detail="GAME_NOT_FOUND")
    return game


@router.get("/room/{room_id}")
async def api_get_game_by_room(room_id: str, player_id: str = ""):
    game = await get_game_by_room(room_id)
    if not game:
        raise HTTPException(status_code=404, detail="GAME_NOT_FOUND")
    return game


@router.post("/{game_id}/action")
async def api_game_action(game_id: str, req: BetActionRequest):
    game, error, action_result = await apply_action(game_id, req.player_id, req.action, req.amount)
    if error == "NOT_YOUR_TURN":
        raise HTTPException(status_code=400, detail="NOT_YOUR_TURN")
    if error == "GAME_NOT_FOUND":
        raise HTTPException(status_code=404, detail="GAME_NOT_FOUND")
    if error == "GAME_FINISHED":
        raise HTTPException(status_code=403, detail="GAME_FINISHED")
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"success": True, "game": game, "action_result": action_result}


@router.post("/{game_id}/rematch")
async def api_rematch(game_id: str):
    game = await get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="GAME_NOT_FOUND")
    new_game, error = await rematch(game["room_id"])
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"id": new_game["id"], "game": new_game}
