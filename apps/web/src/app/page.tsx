"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button, Modal, Input, Avatar } from "@/components/ui";
import { RoomCard, RulesOverlay } from "@/components/game";
import { api } from "@/lib/api";
import { getOrCreatePlayerId, getOrCreatePlayerName, isRulesAccepted, acceptRules } from "@/lib/player";
import { useGameStore } from "@/store/gameStore";
import type { Room } from "@/types";

export default function LobbyPage() {
  const router = useRouter();
  const playerId = getOrCreatePlayerId();
  const playerName = getOrCreatePlayerName();
  const { showRules, setShowRules, setShowCreateModal, setShowJoinModal, showCreateModal, showJoinModal } = useGameStore();

  // Show rules on first visit
  useEffect(() => {
    if (!isRulesAccepted()) setShowRules(true);
  }, [setShowRules]);

  const { data, refetch } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.listRooms(),
    refetchInterval: 5000,
  });

  const [createName, setCreateName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState(playerName);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCreate = async () => {
    if (!createName.trim()) { toast.error("Vui lòng nhập tên phòng"); return; }
    setCreating(true);
    try {
      const data = await api.createRoom({
        name: createName,
        host_id: playerId,
        host_name: playerName,
        max_players: maxPlayers,
        is_private: false,
      });
      setShowCreateModal(false);
      router.push(`/room/${data.code}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Không thể tạo phòng");
    } finally {
      setCreating(false);
    }
  };

  const handleQuickJoin = async () => {
    try {
      const rooms: Room[] = data?.rooms || [];
      if (rooms.length === 0) { toast.error("Không có phòng nào trống"); return; }
      const openRoom = rooms.find(r => r.status !== "full");
      if (!openRoom) { toast.error("Tất cả phòng đã đầy"); return; }
      router.push(`/room/${openRoom.code}`);
    } catch (e) { toast.error("Lỗi khi tìm phòng"); }
  };

  const handleJoinByCode = async () => {
    if (joinCode.length !== 6) { toast.error("Mã phòng phải 6 chữ số"); return; }
    setJoining(true);
    try {
      // Try to get the room by code first
      const roomData = await api.getRoom(joinCode);
      const joined = await api.joinRoom(joinCode, { player_id: playerId, player_name: joinName });
      setShowJoinModal(false);
      router.push(`/room/${joinCode}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Không thể vào phòng");
    } finally {
      setJoining(false);
    }
  };

  const handleJoinRoom = (code: string) => {
    router.push(`/room/${code}`);
  };

  const rooms: Room[] = data?.rooms || [];

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="bg-bg-surface border-b border-bg-elevated px-6 py-4 flex items-center gap-4">
        <div className="font-display text-2xl font-bold">
          🃏 <span className="text-accent-primary">Lieng</span>
        </div>
        <div style={{ flex: 1 }} />
        <button className="text-text-secondary hover:text-text-primary text-sm" onClick={() => setShowRules(true)}>📖 Luật chơi</button>
        <Avatar name={playerName} seed={playerId} size="sm" />
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Create + Join */}
          <div className="space-y-4">
            {/* Create Room */}
            <div className="bg-bg-surface rounded-xl p-5">
              <h2 className="font-display font-semibold text-lg mb-4">👑 Tạo phòng mới</h2>
              <div className="space-y-3">
                <Input
                  label="Tên phòng"
                  placeholder="Phòng của tôi"
                  value={createName}
                  onChange={setCreateName}
                />
                <div>
                  <label className="text-xs text-text-secondary block mb-2">Số người chơi</label>
                  <div className="flex gap-3">
                    {[2, 3, 4].map(n => (
                      <label key={n} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="max" checked={maxPlayers === n} onChange={() => setMaxPlayers(n)} className="accent-accent-primary" />
                        {n} người
                      </label>
                    ))}
                  </div>
                </div>
                <Button variant="primary" size="lg" style={{ width: "100%" }} onClick={handleCreate} loading={creating}>
                  Tạo phòng
                </Button>
              </div>
            </div>

            {/* Join by code */}
            <div className="bg-bg-surface rounded-xl p-5">
              <h2 className="font-display font-semibold text-lg mb-4">🔗 Vào phòng nhanh</h2>
              <div className="space-y-3">
                <Input
                  label="Mã phòng (6 số)"
                  placeholder="___ ___"
                  value={joinCode}
                  onChange={v => setJoinCode(v.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                />
                <Button variant="secondary" size="md" style={{ width: "100%" }} onClick={handleJoinByCode} loading={joining}>
                  Vào phòng
                </Button>
                <Button variant="ghost" size="md" style={{ width: "100%" }} onClick={handleQuickJoin}>
                  ⚡ Chơi nhanh — Vào phòng trống đầu tiên
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Room list */}
          <div className="bg-bg-surface rounded-xl p-5">
            <h2 className="font-display font-semibold text-lg mb-4">
              🟢 Phòng đang mở <span className="font-normal text-text-secondary text-sm">({rooms.length})</span>
            </h2>
            {rooms.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                <div className="text-4xl mb-3">🎴</div>
                <p>Chưa có phòng nào</p>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(true)}>Tạo phòng đầu tiên!</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map(r => (
                  <RoomCard key={r.id} room={r} onJoin={handleJoinRoom} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rules */}
      <RulesOverlay isOpen={showRules} onClose={() => { acceptRules(); setShowRules(false); }} />
    </div>
  );
}
