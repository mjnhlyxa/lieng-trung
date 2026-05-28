"use client";
import React from "react";
import { parseCard } from "@/types";

interface CardProps {
  rank: string;
  suit: string;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function PlayingCard({ rank, suit, faceDown = false, size = "md", onClick }: CardProps) {
  const dimensions = { sm: "w-[52px] h-[78px]", md: "w-[64px] h-[96px]", lg: "w-[72px] h-[108px]" };
  const fontSize = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };
  const suitSize = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  if (faceDown) {
    return (
      <div
        className={`card-facedown rounded-lg ${dimensions[size]} shadow-card flex items-center justify-center cursor-pointer`}
        onClick={onClick}
      >
        <div className="w-full h-full rounded-lg" style={{
          background: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.06) 12px)",
        }} />
      </div>
    );
  }

  const { symbol, color } = parseCard(`${rank}${suit}`);

  return (
    <div
      className={`bg-white rounded-lg shadow-card flex flex-col items-center justify-center relative ${dimensions[size]} ${onClick ? "cursor-pointer hover:brightness-95" : ""}`}
      onClick={onClick}
    >
      <span className={`absolute top-1 left-2 font-display font-bold ${fontSize[size]}`} style={{ color }}>{rank}</span>
      <span className={`${suitSize[size]}`} style={{ color }}>{symbol}</span>
      <span className={`absolute bottom-1 right-2 font-display font-bold ${fontSize[size]} rotate-180`} style={{ color }}>{rank}</span>
    </div>
  );
}
