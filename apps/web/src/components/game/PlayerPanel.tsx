"use client";
import React from "react";
import { Avatar, Badge } from "@/components/ui";

interface PlayerPanelProps {
  name: string;
  seed?: string;
  isHost?: boolean;
  isCurrentTurn?: boolean;
  status?: "active" | "folded" | "called" | "all_in";
  betThisRound?: number;
  totalBet?: number;
  position?: "top" | "bottom" | "left" | "right";
  onClick?: () => void;
}

export function PlayerPanel({
  name, seed, isHost, isCurrentTurn, status = "active",
  betThisRound = 0, totalBet = 0, position = "top", onClick
}: PlayerPanelProps) {
  const isFolded = status === "folded";
  const isAllIn = status === "all_in";

  return (
    <div
      className={`
        bg-black/30 rounded-xl p-3 flex items-center gap-3 border-2 transition-all duration-300
        ${isCurrentTurn ? "border-accent-primary active-glow" : "border-transparent"}
        ${isFolded ? "opacity-50" : ""}
        ${isAllIn ? "border-accent-gold" : ""}
        cursor-pointer hover:bg-black/40
      `}
      onClick={onClick}
    >
      <Avatar name={name} seed={seed} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{name}</span>
          {isHost && <Badge variant="warning">HOST</Badge>}
        </div>
        <div className="flex gap-2 text-xs text-text-secondary mt-0.5">
          {totalBet > 0 && <span>Mã: {totalBet}</span>}
          {isFolded && <Badge variant="muted">Đã bỏ bài</Badge>}
          {isAllIn && <Badge variant="warning">All-in</Badge>}
        </div>
      </div>
      {isCurrentTurn && (
        <span className="text-xs font-semibold text-accent-primary animate-pulse">●</span>
      )}
    </div>
  );
}
