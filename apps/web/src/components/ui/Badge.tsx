"use client";
import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "error" | "info" | "muted";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "muted", children, className = "" }: BadgeProps) {
  const styles = {
    success: "bg-emerald-500/15 text-emerald-400",
    warning: "bg-amber-500/15 text-amber-400",
    error: "bg-red-500/15 text-red-400",
    info: "bg-blue-500/15 text-blue-400",
    muted: "bg-bg-elevated text-text-secondary",
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
