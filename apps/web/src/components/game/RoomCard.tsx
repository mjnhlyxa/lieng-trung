"use client";
import React from "react";
import { Room } from "@/types";
import { Avatar, Badge, Button } from "@/components/ui";

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  const isFull = room.status === "full";
  const playerCount = room.players?.length || 0;
  return (
    <div
      className={`bg-sidebar-surface border border-bg-elevated rounded-xl p-4 flex items-center gap-4 hover:border-accent-primary transition-colors ${isFull ? "opacity-60" : ""}`}
    >
      <div className="text-lg">🟢</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{room.name}</div>
        <div className="text-xs text-text-secondary mt-0.5">
          {playerCount}/{room.max_players} người • Host: {room.players?.[0]?.name || "—"}
        </div>
      </div>
      <Badge variant={isFull ? "muted" : "success"}>
        {isFull ? "Đầy" : "Trống"}
      </Badge>
      <Button
        size="sm"
        disabled={isFull}
        onClick={() => onJoin(room.code)}
      >
        Vào
      </Button>
    </div>
  );
}
