"use client";

import React from "react";
import { cn, getCategoryStyle, CategoryColorTheme } from "@/lib/utils";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { Category } from "@/types";

interface CategoryBadgeProps {
  category: string;
  categories?: Category[] | Array<{ name: string; color?: string; icon?: string }>;
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

  const iconSize = {
    sm: 12,
    md: 13,
    lg: 15,
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
        <CategoryIcon category={category} categories={categories} size={iconSize} />
      )}
      <span className="truncate">{textLabel}</span>
    </span>
  );
}
