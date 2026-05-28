"use client";
import React from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
  type?: "button" | "submit";
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  children,
  type = "button",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-display font-semibold rounded-lg transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-accent-primary text-white hover:brightness-110",
    secondary: "bg-bg-elevated text-text-primary hover:brightness-110",
    ghost: "bg-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
    danger: "bg-danger text-white hover:brightness-110",
  };
  const sizes = {
    sm: "text-xs px-3 py-1.5 h-8",
    md: "text-sm px-4 py-2 h-10",
    lg: "text-base px-6 py-3 h-12",
  };
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="animate-spin">⟳</span>
      ) : null}
      {children}
    </button>
  );
}
