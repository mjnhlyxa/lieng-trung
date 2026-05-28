import { create } from "zustand";
import type { Room, Game } from "@/types";

export interface GameState {
  // Room
  room: Room | null;
  roomCode: string | null;

  // Game
  gameId: string | null;
  phase: "lobby" | "waiting" | "playing" | "betting1" | "betting2" | "showdown" | "finished";
  players: Game["players"];
  pot: number;
  currentBet: number;
  currentTurnIndex: number;
  myCards: string[];
  winnerId: string | null;
  result: Game["result"] | null;

  // UI
  showRules: boolean;
  showCreateModal: boolean;
  showJoinModal: boolean;
  showShowdown: boolean;
  toasts: Array<{ id: string; msg: string; type: "success" | "error" | "info" }>;
}

export interface GameActions {
  setRoom: (room: Room) => void;
  setRoomCode: (code: string) => void;
  setGame: (game: Game) => void;
  setPhase: (phase: GameState["phase"]) => void;
  setMyCards: (cards: string[]) => void;
  setShowRules: (v: boolean) => void;
  setShowCreateModal: (v: boolean) => void;
  setShowJoinModal: (v: boolean) => void;
  setShowShowdown: (v: boolean) => void;
  showWinner: (winnerId: string, result: Game["result"]) => void;
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
  resetGame: () => void;
  resetAll: () => void;
}

const initialState: GameState = {
  room: null,
  roomCode: null,
  gameId: null,
  phase: "lobby",
  players: [],
  pot: 0,
  currentBet: 0,
  currentTurnIndex: 0,
  myCards: [],
  winnerId: null,
  result: null,
  showRules: false,
  showCreateModal: false,
  showJoinModal: false,
  showShowdown: false,
  toasts: [],
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setRoom: (room) => set({ room, roomCode: room.code }),
  setRoomCode: (code) => set({ roomCode: code }),

  setGame: (game) => {
    const playerId = typeof window !== "undefined" ? localStorage.getItem("lieng_player_id") || "" : "";
    const myPlayer = game.players.find(p => p.id === playerId);
    set({
      gameId: game.id,
      phase: game.phase as GameState["phase"],
      players: game.players,
      pot: game.pot,
      currentBet: game.current_bet ?? 0,
      currentTurnIndex: game.current_turn_index,
      myCards: myPlayer?.hand ?? [],
      result: game.result,
    });
  },

  setPhase: (phase) => set({ phase }),

  setMyCards: (cards) => set({ myCards: cards }),

  setShowRules: (v) => set({ showRules: v }),
  setShowCreateModal: (v) => set({ showCreateModal: v }),
  setShowJoinModal: (v) => set({ showJoinModal: v }),
  setShowShowdown: (v) => set({ showShowdown: v }),

  showWinner: (winnerId, result) => set({ winnerId, result, phase: "showdown", showShowdown: true }),

  addToast: (msg, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },

  resetGame: () =>
    set({
      gameId: null,
      phase: "lobby",
      players: [],
      pot: 0,
      currentBet: 0,
      currentTurnIndex: 0,
      myCards: [],
      winnerId: null,
      result: null,
      showShowdown: false,
    }),

  resetAll: () => ({ ...initialState, showRules: get().showRules, showCreateModal: false, showJoinModal: false }),
}));
