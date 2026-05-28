"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { getOrCreatePlayerId, getOrCreatePlayerName, isRulesAccepted, acceptRules } from "@/lib/player";
import { useGameStore } from "@/store/gameStore";
import { Button, Avatar, Badge } from "@/components/ui";
import { CardHand, PlayerPanel, PotDisplay, BettingControls, ShowdownModal, RulesOverlay } from "@/components/game";
import type { Room, Game } from "@/types";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.roomId as string;
  const playerId = getOrCreatePlayerId();
  const playerName = getOrCreatePlayerName();
  const store = useGameStore();

  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [myCards, setMyCards] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [joined, setJoined] = useState(false);
  const gameStartRef = useRef(false);

  // Join room via Socket.IO on mount
  useEffect(() => {
    if (!roomCode || !playerId) return;
    const socket = getSocket();

    const joinRoom = async () => {
      socket.emit("join_room", {
        roomCode,
        playerId,
        playerName,
      }, (res: any) => {
        if (res?.error) {
          toast.error(res.error);
          router.push("/");
          return;
        }
        if (res?.room) {
          setRoom(res.room);
          setJoined(true);
        }
      });
    };

    socket.on("room_update", (updatedRoom: any) => {
      setRoom(updatedRoom);
    });

    socket.on("game_started", (g: Game) => {
      setGame(g);
      store.setGame(g);
      // Extract my cards
      const myPlayer = g.players.find(p => p.id === playerId);
      if (myPlayer?.hand?.length) {
        setMyCards(myPlayer.hand);
      }
      gameStartRef.current = true;
    });

    socket.on("game_state_update", (g: Game) => {
      setGame(g);
      const myPlayer = g.players.find(p => p.id === playerId);
      if (myPlayer?.hand?.length) {
        setMyCards(myPlayer.hand);
      }
      if (g.phase === "showdown" && g.result) {
        store.showWinner(g.result.winner_id || "", g.result);
      }
    });

    socket.on("error", (err: { code: string; message: string }) => {
      toast.error(err.message);
    });

    joinRoom();

    return () => {
 socket.off("room_update");
 socket.off("game_started");
 socket.off("game_state_update");
 socket.off("error");
    };
  }, [roomCode, playerId, playerName]);

  // Show rules if not accepted
  useEffect(() => {
    if (!isRulesAccepted()) setShowRules(true);
  }, []);

  const handleStartGame = useCallback(async () => {
    if (!room) return;
    const socket = getSocket();
    socket.emit("start_game", { roomCode, playerId });
  }, [roomCode, playerId, room]);

  const handleAction = useCallback(async (action: string, amount?: number) => {
    if (!game) return;
    const socket = getSocket();
    socket.emit("player_action", {
      gameId: game.id,
      playerId,
      action,
      amount,
      roomCode,
    });
  }, [game, playerId, roomCode]);

  const handleRematch = useCallback(async () => {
    if (!game) return;
    const socket = getSocket();
    socket.emit("rematch", {
      gameId: game.id,
      roomId: game.room_id,
    });
    store.setShowShowdown(false);
    setMyCards([]);
    gameStartRef.current = false;
  }, [game, store]);

  const handleLeave = useCallback(async () => {
    const socket = getSocket();
    socket.emit("leave_room", { roomCode, playerId });
    router.push("/");
  }, [roomCode, playerId, router]);

  const isHost = room?.host_id === playerId;
  const isMyTurn = game?.players?.[game.current_turn_index]?.id === playerId;
  const isPlaying = game?.phase !== "waiting" && game?.phase !== "lobby";
  const showdownOpen = game?.phase === "showdown" && store.showShowdown;
  const myPlayer = game?.players.find(p => p.id === playerId);
  const minBet = game?.min_bet || 10;
  const currentBet = game?.current_bet || 0;
  const myLastBet = myPlayer?.bet_this_round || 0;
  const canBet = currentBet === 0;
  const canCall = currentBet > 0 && !canBet;
  const canRaise = currentBet > 0;

  // === WAITING STATE ===
  if (!game || !isPlaying) {
    return (
      <div className="min-h-screen bg-bg-table flex flex-col">
        {/* Header */}
        <header className="bg-black/25 px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleLeave}>← Quay lại</Button>
          <span className="text-text-secondary text-sm">Phòng:</span>
          <span className="font-mono font-bold bg-white/10 px-3 py-1 rounded text-sm">{roomCode}</span>
          <div style={{ flex: 1 }} />
          <span className="text-xs text-text-secondary truncate">{room?.name}</span>
          <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`)}>
            📋 Mời bạn
          </Button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h1 className="font-display text-2xl font-bold mb-8">PHÒNG CHỜ</h1>

          {/* Seats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map(i => {
              const occupant = room?.players?.[i];
              return (
                <div
                  key={i}
                  className={`w-24 h-28 rounded-xl flex flex-col items-center justify-center gap-2 border-2 ${
                    occupant ? "border-accent-primary bg-accent-primary/10" : "border-dashed border-white/20"
                  }`}
                >
                  {occupant ? (
                    <>
                      <Avatar name={occupant.name} seed={occupant.id} size="lg" />
                      <span className="text-xs font-semibold text-center">{occupant.name}</span>
                      {occupant.id === room?.host_id && <Badge variant="warning">HOST</Badge>}
                    </>
                  ) : (
                    <span className="text-text-muted text-xs">ghế trống</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-text-secondary text-sm mb-6">
            {room?.players?.length < 2 ? "Đang chờ người chơi..." : "Sẵn sàng bắt đầu!"}
          </p>

          {isHost ? (
            <Button
              variant="primary"
              size="lg"
              disabled={(room?.players?.length || 0) < 2}
              onClick={handleStartGame}
            >
              {(room?.players?.length || 0) < 2 ? "Chờ thêm..." : "Bắt đầu!"}
            </Button>
          ) : (
            <Badge variant="warning">Đang chờ chủ phòng bắt đầu...</Badge>
          )}

          <p className="text-text-muted text-xs mt-6">
            lieng-trung.vercel.app/room/{roomCode}
          </p>
        </div>
      </div>
    );
  }

  // === PLAYING STATE ===
  return (
    <div className="min-h-screen bg-bg-table flex flex-col">
      {/* Top bar */}
      <header className="bg-black/25 px-4 py-2 flex items-center gap-3 text-sm">
        <Button variant="ghost" size="sm" onClick={handleLeave}>←</Button>
        <span className="font-mono text-xs">Phòng: {roomCode}</span>
        <div style={{ flex: 1 }} />
        <PotDisplay pot={game?.pot || 0} />
        <span className="text-text-secondary text-xs">
          Vòng: {game?.phase === "betting2" ? "2/2" : "1/2"}
        </span>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Top two players */}
        <div className="grid grid-cols-2 gap-3">
          {game?.players.slice(0, 2).map((p, i) => (
            <PlayerPanel
              key={p.id}
              name={p.name}
              seed={p.id}
              isHost={p.id === room?.host_id}
              isCurrentTurn={game.current_turn_index === i && isMyTurn}
              status={p.status as any}
              totalBet={p.total_bet}
              position="top"
            />
          ))}
        </div>

        {/* Center: My cards + pot */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex gap-2">
            <span className="text-text-muted text-xs uppercase tracking-widest">Bài của tôi</span>
          </div>
          <CardHand cards={myCards} size="md" />
          {isMyTurn ? (
            <p className="text-accent-primary font-semibold text-sm animate-pulse">Lượt của bạn!</p>
          ) : (
            <p className="text-text-secondary text-xs">
              Lượt của: <strong>{game?.players?.[game.current_turn_index]?.name || "—"}</strong>
            </p>
          )}
        </div>

        {/* Bottom two players */}
        <div className="grid grid-cols-2 gap-3">
          {game?.players.slice(2).map((p, i) => {
            const actualIdx = i + 2;
            return (
              <PlayerPanel
                key={p.id}
                name={p.name}
                seed={p.id}
                isHost={p.id === room?.host_id}
                isCurrentTurn={game.current_turn_index === actualIdx && isMyTurn}
                status={p.status as any}
                totalBet={p.total_bet}
                position="bottom"
              />
            );
          })}
        </div>
      </div>

      {/* Betting controls */}
      <div className="p-4">
        <BettingControls
          currentBet={currentBet}
          minBet={minBet}
          myLastBet={myLastBet}
          canBet={canBet}
          canCall={canCall}
          canRaise={canRaise}
          onAction={handleAction}
          disabled={!isMyTurn}
        />
      </div>

      {/* Showdown modal */}
      <ShowdownModal
        isOpen={showdownOpen}
        winnerId={game.result?.winner_id || ""}
        hands={game.result?.hands || {}}
        players={game.players.map(p => ({ id: p.id, name: p.name }))}
        pot={game.pot || 0}
        onRematch={handleRematch}
        onLeave={handleLeave}
      />
      <RulesOverlay isOpen={showRules} onClose={() => { acceptRules(); setShowRules(false); }} />
    </div>
  );
}
