"use client";
import React from "react";
import { Modal, Button, Input } from "@/components/ui";

interface RulesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const RANKINGS = [
  ["Tứ Quý", "4 lá cùng rank"],
  ["Sảnh Rồng", "A-2-3-4-5 đồng chất"],
  ["Sảnh", "5 lá liên tiếp, bất kỳ chất"],
  ["Ba Túc", "3-of-a-kind + 1 đôi"],
  ["Bộ Đôi", "2 đôi khác nhau"],
  ["Một Đôi", "1 đôi duy nhất"],
  ["Mậu Thầu", "Không gì — cao nhất thắng"],
];

export function RulesOverlay({ isOpen, onClose }: RulesOverlayProps) {
  const [tab, setTab] = React.useState<"cards" | "betting" | "winning">("cards");
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📖 Luật chơi Lieng" size="lg">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(["cards", "betting", "winning"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? "bg-accent-primary text-white" : "bg-bg-elevated text-text-secondary"}`}
            >
              {t === "cards" ? "Bài" : t === "betting" ? "Cược" : "Thắng"}
            </button>
          ))}
        </div>
        <div className="bg-bg-page rounded-lg p-4 min-h-[200px]">
          {tab === "cards" && (
            <div>
              <div className="font-semibold text-accent-primary mb-3">Thứ tự bài (cao → thấp):</div>
              {RANKINGS.map(([name, desc]) => (
                <div key={name} className="flex justify-between py-2 border-b border-bg-elevated last:border-0">
                  <span className="font-semibold text-accent-primary w-28">{name}</span>
                  <span className="text-xs text-text-secondary">{desc}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "betting" && (
            <div className="space-y-3 text-sm">
              <p>👑 <strong>Cược:</strong> Đặt tiền vào pot để xem bài.</p>
              <p>📞 <strong>Theo (Call):</strong> Theo mức cược hiện tại.</p>
              <p>⬆️ <strong>Tăng (Raise):</strong> Nâng mức cược lên.</p>
              <p>🃏 <strong>Bỏ bài (Fold):</strong> Bỏ bài, mất tiền đã cược.</p>
              <p className="text-text-secondary">Ai có bài cao nhất sau lượt cược cuối thắng pot!</p>
            </div>
          )}
          {tab === "winning" && (
            <div className="space-y-3 text-sm">
              <p>🏆 <strong>Thắng:</strong> Khi tất cả người chơi khác bỏ bài.</p>
              <p>🃏 <strong>Showdown:</strong> So bài nếu không ai bỏ trước.</p>
              <p>♠️ <strong>Chất:</strong> Spades &gt; Hearts &gt; Diamonds &gt; Clubs là chất cao nhất.</p>
            </div>
          )}
        </div>
        <Button variant="primary" size="lg" onClick={onClose} style={{ width: "100%" }}>
          Hiểu rồi!
        </Button>
      </div>
    </Modal>
  );
}
