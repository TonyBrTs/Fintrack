"use client";

import React from "react";
import { useSettings, type IconSource } from "@/contexts/SettingsContext";

// 1. Phosphor Icons (Premier Modern Duotone / Fintech)
import {
  SquaresFour,
  Receipt,
  TrendUp,
  TrendDown,
  Target,
  Wallet as PhosphorWallet,
  PiggyBank as PhosphorPiggyBank,
  ArrowUpRight as PhosphorArrowUpRight,
  ArrowDownRight as PhosphorArrowDownRight,
} from "@phosphor-icons/react";

// 2. Tabler Icons (Clean Geometric Precision / 24x24 Rounded Strokes)
import {
  IconLayoutDashboard,
  IconReceipt,
  IconTrendingUp,
  IconTrendingDown,
  IconTargetArrow,
  IconWallet,
  IconPigMoney,
  IconArrowUpRight,
  IconArrowDownRight,
} from "@tabler/icons-react";

// 3. Lucide Icons (Classic Feather Outlines)
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Goal,
  Wallet as LucideWallet,
  PiggyBank as LucidePiggyBank,
  ArrowUpRight as LucideArrowUpRight,
  ArrowDownRight as LucideArrowDownRight,
} from "lucide-react";

export type IconStyle = "modern" | "classic";
export const DEFAULT_ICON_STYLE: IconStyle = "modern";

export interface AppIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  sourceOverride?: IconSource;
  /** Backwards-compatible prop */
  styleOverride?: IconStyle;
}

function resolveSource(
  contextSource: IconSource | undefined,
  sourceOverride?: IconSource,
  styleOverride?: IconStyle
): IconSource {
  if (sourceOverride) return sourceOverride;
  if (styleOverride === "classic") return "lucide";
  return contextSource || "phosphor";
}

// ----------------------------------------------------------------------
// 1. NAVIGATION ICONS (Summary, Expenses, Income, Goals)
// ----------------------------------------------------------------------

export function NavSummaryIcon({
  size = 20,
  className = "",
  strokeWidth = 1.8,
  sourceOverride,
  styleOverride,
}: AppIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (source === "tabler") {
    return <IconLayoutDashboard size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <LayoutDashboard size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <SquaresFour weight="duotone" size={size} className={className} />;
}

export function NavExpensesIcon({
  size = 20,
  className = "",
  strokeWidth = 1.8,
  sourceOverride,
  styleOverride,
}: AppIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (source === "tabler") {
    return <IconReceipt size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <TrendingDown size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <Receipt weight="duotone" size={size} className={className} />;
}

export function NavIncomeIcon({
  size = 20,
  className = "",
  strokeWidth = 1.8,
  sourceOverride,
  styleOverride,
}: AppIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (source === "tabler") {
    return <IconTrendingUp size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <TrendingUp size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <TrendUp weight="duotone" size={size} className={className} />;
}

export function NavGoalsIcon({
  size = 20,
  className = "",
  strokeWidth = 1.8,
  sourceOverride,
  styleOverride,
}: AppIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (source === "tabler") {
    return <IconTargetArrow size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <Goal size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <Target weight="duotone" size={size} className={className} />;
}

// ----------------------------------------------------------------------
// 2. DASHBOARD KPI ICONS (Balance, Savings, Income, Expenses)
// ----------------------------------------------------------------------

export function KPIBalanceIcon({
  size = 22,
  className = "",
  strokeWidth = 1.8,
  sourceOverride,
  styleOverride,
}: AppIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (source === "tabler") {
    return <IconWallet size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <LucideWallet size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <PhosphorWallet weight="duotone" size={size} className={className} />;
}

export function KPISavingsIcon({
  size = 22,
  className = "",
  strokeWidth = 1.8,
  sourceOverride,
  styleOverride,
}: AppIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (source === "tabler") {
    return <IconPigMoney size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <LucidePiggyBank size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <PhosphorPiggyBank weight="duotone" size={size} className={className} />;
}

export function KPIIncomeIcon({
  size = 22,
  className = "",
  strokeWidth = 1.8,
  sourceOverride,
  styleOverride,
}: AppIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (source === "tabler") {
    return <IconTrendingUp size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <TrendingUp size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <TrendUp weight="duotone" size={size} className={className} />;
}

export function KPIExpenseIcon({
  size = 22,
  className = "",
  strokeWidth = 1.8,
  sourceOverride,
  styleOverride,
}: AppIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (source === "tabler") {
    return <IconTrendingDown size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <TrendingDown size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <TrendDown weight="duotone" size={size} className={className} />;
}

// ----------------------------------------------------------------------
// 3. TRANSACTION TYPE ICONS (Recent Transactions)
// ----------------------------------------------------------------------

interface TxTypeIconProps extends AppIconProps {
  type: "income" | "expense" | "goal";
}

export function TxTypeIcon({
  type,
  size = 18,
  className = "",
  strokeWidth = 2.2,
  sourceOverride,
  styleOverride,
}: TxTypeIconProps) {
  const { iconSource } = useSettings();
  const source = resolveSource(iconSource, sourceOverride, styleOverride);

  if (type === "income") {
    if (source === "tabler") {
      return <IconArrowUpRight size={size} stroke={strokeWidth} className={className} />;
    }
    if (source === "lucide") {
      return <LucideArrowUpRight size={size} strokeWidth={strokeWidth} className={className} />;
    }
    return <PhosphorArrowUpRight weight="bold" size={size} className={className} />;
  }

  if (type === "expense") {
    if (source === "tabler") {
      return <IconArrowDownRight size={size} stroke={strokeWidth} className={className} />;
    }
    if (source === "lucide") {
      return <LucideArrowDownRight size={size} strokeWidth={strokeWidth} className={className} />;
    }
    return <PhosphorArrowDownRight weight="bold" size={size} className={className} />;
  }

  // Goal transaction type
  if (source === "tabler") {
    return <IconTargetArrow size={size} stroke={strokeWidth} className={className} />;
  }
  if (source === "lucide") {
    return <Goal size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <Target weight="duotone" size={size} className={className} />;
}
