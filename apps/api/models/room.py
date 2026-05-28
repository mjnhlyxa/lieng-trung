from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PlayerRef(BaseModel):
    id: str
    name: str
    connected: bool = True
    joined_at: datetime = datetime.utcnow()


class CreateRoomRequest(BaseModel):
    name: str
    host_id: str
    host_name: str
    max_players: int = 4
    is_private: bool = False


class JoinRoomRequest(BaseModel):
    player_id: str
    player_name: str


class RoomResponse(BaseModel):
    id: str
    code: str
    name: str
    host_id: str
    max_players: int
    players: list[PlayerRef]
    game_id: Optional[str] = None
    status: str
    share_url: str
    created_at: datetime


class RoomListResponse(BaseModel):
    rooms: list[RoomResponse]
