from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GamePlayer(BaseModel):
    id: str
    name: str
    hand: list[str] = []
    bet_this_round: int = 0
    total_bet: int = 0
    status: str = "active"
    move_count: int = 0


class ActionLogEntry(BaseModel):
    player_id: str
    action: str
    amount: Optional[int] = None
    timestamp: datetime = datetime.utcnow()


class GameResult(BaseModel):
    winner_id: Optional[str] = None
    hands: Optional[dict] = None
    reason: str = ""


class CreateGameRequest(BaseModel):
    room_id: str


class BetActionRequest(BaseModel):
    player_id: str
    action: str
    amount: Optional[int] = None


class GameStateResponse(BaseModel):
    id: str
    room_id: str
    dealer_index: int
    players: list[GamePlayer]
    community_cards: list[str]
    pot: int
    phase: str
    current_turn_index: int
    current_bet: int
    min_bet: int
    actions_log: list[ActionLogEntry]
    result: Optional[GameResult] = None
    started_at: Optional[datetime] = None
