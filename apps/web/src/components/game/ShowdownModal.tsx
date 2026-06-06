"use client";
import React from "react";
import { Modal, Button } from "@/components/ui";
import { CardHand } from "./CardHand";
import { evaluate } from "@/lib/hand_eval";

interface PlayerHand {
  playerId: string;
  name: string;
  cards: string[];
  rank: number;
  handName: string;
  isWinner: boolean;
}

interface ShowdownModalProps {
  isOpen: boolean;
  winnerId: string;
  hands: Record<string, string[]>;
  players: { id: string; name: string }[];
  pot: number;
  onRematch: () => void;
  onLeave: () => void;
}

const HAND_NAMES: Record<number, string> = {
  9: "Tứ Quý", 8: "Sảnh Rồng", 7: "Sảnh", 6: "Ba Túc",
  5: "Bộ Đôi", 4: "Một Đôi", 3: "Mậu Thầu",
};

export function ShowdownModal({
  isOpen, winnerId, hands, players, pot, onRematch, onLeave
}: ShowdownModalProps) {
  const winner = players.find(p => p.id === winnerId);

  return (
    <Modal isOpen={isOpen} onClose={() => {}} size="lg">
      <div className="text-center">
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="font-display text-3xl font-bold text-accent-gold mb-1">{winner?.name || "Ai đó"} thắng!</h2>
        <p className="text-accent-gold text-lg mb-6">+{pot} chip</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {players.map(p => {
          const cards = hands[p.id] || [];
          const myCards = evaluate(cards);
          const isFolded = cards.length === 0;
          return (
            <div
              key={p.id}
              className={`bg-bg-page rounded-lg p-3 text-center ${p.id === winnerId ? "border border-accent-gold" : ""}`}
            >
              <div className="font-semibold text-sm mb-2">{p.name}{p.id === winnerId ? " 🏆" : ""}</div>
              {!isFolded && cards.length === 5 ? (
                <>
                  <CardHand cards={cards} size="sm" />
                  <div className="text-xs text-accent-primary mt-2">{HAND_NAMES[myCards[0]] || "Khác"}</div>
                </>
              ) : (
                <div className="py-3">
                  <div className="flex gap-1 justify-center">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-10 card-facedown rounded" />
                    ))}
                  </div>
                  <div className="text-xs text-text-muted mt-2">💤 Đã bỏ bài</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="primary" size="lg" onClick={onRematch}>Chơi lại</Button>
        <Button variant="ghost" size="lg" onClick={onLeave}>Rời phòng</Button>
      </div>
    </Modal>
  );
}
