// ============================================================
// SHARED TYPES — Lieng Card Game
// ============================================================

export interface PlayerRef {
  id: string;
  name: string;
  connected: boolean;
  joined_at?: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  host_id: string;
  max_players: number;
  is_private: boolean;
  players: PlayerRef[];
  game_id: string | null;
  status: "lobby" | "playing" | "full" | "finished";
  share_url: string;
  created_at: string;
}

export interface GamePlayer {
  id: string;
  name: string;
  hand: string[];         // hidden until showdown or own cards
  bet_this_round: number;
  total_bet: number;
  status: "active" | "folded" | "called" | "all_in";
  move_count: number;
}

export interface ActionLogEntry {
  player_id: string;
  action: string;
  amount: number | null;
  timestamp: string;
}

export interface GameResult {
  winner_id: string;
  hands: Record<string, string[]>;
  reason: string;
}

export interface Game {
  id: string;
  room_id: string;
  dealer_index: number;
  players: GamePlayer[];
  community_cards: string[];
  pot: number;
  phase: "waiting" | "betting1" | "betting2" | "showdown" | "finished";
  current_turn_index: number;
  current_bet: number;
  min_bet: number;
  actions_log: ActionLogEntry[];
  result: GameResult | null;
  started_at: string | null;
}

// Socket.IO event payloads
export interface SocketEvents {
  room_joined: { room: Room; roomCode: string };
  room_update: Room;
  game_started: Game;
  game_state_update: Game;
  showdown: { winnerId: string; hands: Record<string, string[]>; pot: number };
  error: { code: string; message: string };
  player_disconnected: { playerId: string };
}

// Card display helper
export const SUIT_SYMBOLS: Record<string, string> = {
  c: "♣", d: "♦", h: "♥", s: "♠",
};

export const SUIT_COLORS: Record<string, string> = {
  c: "#6b7280", d: "#ef4444", h: "#ef4444", s: "#1f2937",
};

export function parseCard(card: string): { rank: string; suit: string; symbol: string; color: string } {
  const suitCode = card[card.length - 1];
  const rank = card.slice(0, -1);
  return {
    rank,
    suit: suitCode,
    symbol: SUIT_SYMBOLS[suitCode] || suitCode,
    color: SUIT_COLORS[suitCode] || "#000",
  };
}

export function getAvatarColor(seed: string): string {
  const colors = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6", "#f97316"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  let parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
