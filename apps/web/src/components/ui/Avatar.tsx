"use client";
import React from "react";
import { getInitials, getAvatarColor } from "@/types";

interface AvatarProps {
  name: string;
  seed?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ name, seed, size = "md" }: AvatarProps) {
  const dim = { sm: "w-7 h-7 text-[10px]", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };
  const color = getAvatarColor(seed || name);
  return (
    <div
      className={`${dim[size]} rounded-full flex items-center justify-center font-display font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
