"use client";
import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className={`modal-slide-up bg-bg-surface rounded-xl shadow-modal w-full ${sizes[size]} p-6`}
        onClick={e => e.stopPropagation()}
      >
        {title ? (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary text-2xl leading-none"
            >
              ×
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
