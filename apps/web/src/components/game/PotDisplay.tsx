"use client";
import React from "react";

interface PotDisplayProps {
  pot: number;
}

export function PotDisplay({ pot }: PotDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1 text-3xl">🪙</div>
      <div className="font-display font-bold text-3xl text-accent-gold" style={{ textShadow: "0 0 12px rgba(245,158,11,0.5)" }}>
        {pot}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-text-muted">Pot</div>
    </div>
  );
}
