import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export default client;

// Room API
export const api = {
  // Rooms
  listRooms: () => client.get("/api/rooms").then(r => r.data),
  getRoom: (roomId: string) => client.get(`/api/rooms/${roomId}`).then(r => r.data),
  createRoom: (data: { name: string; host_id: string; host_name: string; max_players: number; is_private: boolean }) =>
    client.post("/api/rooms", data).then(r => r.data),
  joinRoom: (roomId: string, data: { player_id: string; player_name: string }) =>
    client.post(`/api/rooms/${roomId}/join`, data).then(r => r.data),
  leaveRoom: (roomId: string, playerId: string) =>
    client.delete(`/api/rooms/${roomId}/leave`, { data: { player_id: playerId } }).then(r => r.data),

  // Games
  createGame: (roomId: string) => client.post("/api/games", { room_id: roomId }).then(r => r.data),
  getGame: (gameId: string, playerId?: string) =>
    client.get(`/api/games/${gameId}`, { params: playerId ? { player_id: playerId } : {} }).then(r => r.data),
  getGameByRoom: (roomId: string, playerId?: string) =>
    client.get(`/api/games/room/${roomId}`, { params: playerId ? { player_id: playerId } : {} }).then(r => r.data),
  submitAction: (gameId: string, data: { player_id: string; action: string; amount?: number }) =>
    client.post(`/api/games/${gameId}/action`, data).then(r => r.data),
  rematch: (gameId: string) => client.post(`/api/games/${gameId}/rematch`).then(r => r.data),
};
