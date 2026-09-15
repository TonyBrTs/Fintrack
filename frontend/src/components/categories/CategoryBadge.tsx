"use client";

import React from "react";
import { cn, getCategoryStyle, CategoryColorTheme } from "@/lib/utils";
import { Category } from "@/types";

interface CategoryBadgeProps {
  category: string;
  categories?: Category[] | Array<{ name: string; color?: string }>;
  label?: string;
  className?: string;
  showDot?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CategoryBadge({
  category,
  categories,
  label,
  className,
  showDot = true,
  size = "md",
}: CategoryBadgeProps) {
  const theme: CategoryColorTheme = getCategoryStyle(category, categories);
  const textLabel = label || category;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-xs sm:text-sm px-3 py-1.5 gap-2",
  }[size];

  const dotSize = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  }[size];

  return (
    <span
      title={textLabel}
      className={cn(
        "inline-flex items-center rounded-full font-bold tracking-tight shadow-2xs transition-all select-none border",
        theme.badge,
        sizeClasses,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "rounded-full shrink-0 animate-in fade-in zoom-in duration-200",
            dotSize,
            theme.dot
          )}
        />
      )}
      <span className="truncate">{textLabel}</span>
    </span>
  );
}
