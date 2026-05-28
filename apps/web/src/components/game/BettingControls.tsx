"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui";

interface BettingControlsProps {
  currentBet: number;
  minBet: number;
  myLastBet: number;
  canBet: boolean;
  canCall: boolean;
  canRaise: boolean;
  onAction: (action: string, amount?: number) => void;
  disabled?: boolean;
}

export function BettingControls({
  currentBet, minBet, myLastBet, canBet, canCall, canRaise, onAction, disabled
}: BettingControlsProps) {
  const [showRaise, setShowRaise] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState<number>(0);

  const toCall = currentBet - myLastBet;

  const handleRaise = () => {
    if (raiseAmount >= currentBet + minBet) {
      onAction("raise", raiseAmount);
      setShowRaise(false);
    }
  };

  if (disabled) {
    return (
      <div className="bg-black/30 rounded-xl p-4">
        <p className="text-center text-text-muted text-sm">Đang chờ lượt khác...</p>
      </div>
    );
  }

  if (showRaise) {
    return (
      <div className="bg-black/30 rounded-xl p-4 space-y-3">
        <p className="text-sm text-center text-text-secondary">Mức cược mới:</p>
        <div className="flex gap-2">
          <input
            type="number"
            min={currentBet + minBet}
            value={raiseAmount}
            onChange={e => setRaiseAmount(Number(e.target.value))}
            className="flex-1 bg-bg-page border border-bg-elevated rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-primary"
          />
          <Button size="sm" onClick={handleRaise}>Xác nhận</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowRaise(false)}>Hủy</Button>
        </div>
        <div className="flex gap-2">
          {[currentBet + minBet, (currentBet + minBet) * 2, (currentBet + minBet) * 5].map(a => (
            <Button key={a} size="sm" variant="ghost" onClick={() => setRaiseAmount(a)}>+{a}</Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/30 rounded-xl p-4">
      <div className="flex justify-between text-xs text-text-muted mb-3">
        <span>Cược tối thiểu: <strong>{minBet}</strong></span>
        {currentBet > 0 && <span className="text-text-primary">Cần theo: <strong className="text-accent-gold">{Math.max(0, toCall)}</strong></span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="secondary"
          size="md"
          disabled={!canBet}
          onClick={() => onAction("bet", minBet)}
        >
          Cược {minBet}
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={!canCall || toCall <= 0}
          onClick={() => onAction("call", toCall)}
        >
          Theo {toCall > 0 ? toCall : 0}
        </Button>
        <Button
          variant="secondary"
          size="md"
          disabled={!canRaise}
          onClick={() => { setShowRaise(true); setRaiseAmount(currentBet + minBet); }}
        >
          Tăng
        </Button>
        <Button
          variant="danger"
          size="md"
          disabled={currentBet === 0 && myLastBet === 0}
          onClick={() => onAction("fold")}
        >
          Bỏ bài
        </Button>
      </div>
    </div>
  );
}
