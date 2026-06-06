"use client";
import React from "react";
import { PlayingCard } from "@/components/ui/Card";

interface CardHandProps {
  cards: string[];
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
  scrollable?: boolean;
}

export function CardHand({ cards, hidden = false, size = "md", scrollable = false }: CardHandProps) {
  // hidden: show face-down cards only (no actual cards to display)
  if (hidden) {
    return (
      <div className={`flex gap-1 ${scrollable ? "overflow-x-auto" : "flex-wrap"}`}>
        {[0, 1, 2, 3, 4].map(i => (
          <PlayingCard key={i} rank="" suit="" faceDown size={size} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-1 ${scrollable ? "overflow-x-auto pb-2" : "flex-wrap justify-center"}`}>
      {cards.slice(0, 5).map((card, i) => {
        const suitCode = card[card.length - 1];
        const rank = card.slice(0, -1);
        return <PlayingCard key={i} rank={rank} suit={suitCode} size={size} />;
      })}
    </div>
  );
}
