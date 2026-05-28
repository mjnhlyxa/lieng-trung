"use client";
import React from "react";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  type?: string;
  className?: string;
  error?: string;
}

export function Input({ label, placeholder, value, onChange, maxLength, type = "text", className = "", error }: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? <label className="text-xs text-text-secondary">{label}</label> : null}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        className={`bg-bg-page border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none transition-colors ${error ? "border-red-500" : "border-bg-elevated focus:border-accent-primary"}`}
      />
      {error ? <span className="text-xs text-red-400 mt-1">{error}</span> : null}
    </div>
  );
}
