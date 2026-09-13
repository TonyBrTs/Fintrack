"use client";

import React from "react";
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Goal,
  Wallet,
  PieChart,
  Target,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

/**
 * REVERSIBILITY FLAG:
 * Set to "classic" to instantly revert all icons across the entire app
 * back to the original Lucide outline icons.
 */
export const DEFAULT_ICON_STYLE: "modern" | "classic" = "modern";

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  styleOverride?: "modern" | "classic";
}

// ----------------------------------------------------------------------
// 1. NAVIGATION ICONS (Summary, Expenses, Income, Goals)
// ----------------------------------------------------------------------

export function NavSummaryIcon({ size = 20, className = "", strokeWidth, styleOverride }: IconProps) {
  const activeStyle = styleOverride || DEFAULT_ICON_STYLE;

  if (activeStyle === "classic") {
    return <LayoutDashboard size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Modern Duotone Dashboard
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="8"
        height="10"
        rx="2.5"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13"
        y="3"
        width="8"
        height="5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13"
        y="11"
        width="8"
        height="10"
        rx="2.5"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="16"
        width="8"
        height="5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="7" cy="8" r="1.2" fill="currentColor" />
      <circle cx="17" cy="16" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function NavExpensesIcon({ size = 20, className = "", strokeWidth, styleOverride }: IconProps) {
  const activeStyle = styleOverride || DEFAULT_ICON_STYLE;

  if (activeStyle === "classic") {
    return <TrendingDown size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Modern Duotone Expense / Card Outflow
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="3.5"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <line
        x1="2.5"
        y1="9.5"
        x2="21.5"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="6.5" cy="14.5" r="1.2" fill="currentColor" />
      {/* Dynamic diagonal outgoing arrow */}
      <path
        d="M13.5 13L17.5 17M17.5 17H14.5M17.5 17V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavIncomeIcon({ size = 20, className = "", strokeWidth, styleOverride }: IconProps) {
  const activeStyle = styleOverride || DEFAULT_ICON_STYLE;

  if (activeStyle === "classic") {
    return <TrendingUp size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Modern Duotone Capital / Coin Stack Inflow
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse
        cx="12"
        cy="7"
        rx="8"
        ry="3.5"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 7V12C4 13.9 7.6 15.5 12 15.5C16.4 15.5 20 13.9 20 12V7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 12V17C4 18.9 7.6 20.5 12 20.5C16.4 20.5 20 18.9 20 17V12"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Growth Sparkle at top-right */}
      <path
        d="M19 2L19.8 3.8L21.5 4.5L19.8 5.2L19 7L18.2 5.2L16.5 4.5L18.2 3.8L19 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NavGoalsIcon({ size = 20, className = "", strokeWidth, styleOverride }: IconProps) {
  const activeStyle = styleOverride || DEFAULT_ICON_STYLE;

  if (activeStyle === "classic") {
    return <Goal size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Modern Duotone Concentric Target & Pin
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeDasharray="3 2"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      {/* Aiming arrow / tick */}
      <path
        d="M12 3V1M21 12H23M12 21V23M3 12H1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ----------------------------------------------------------------------
// 2. DASHBOARD KPI ICONS (Balance, Incomes, Expenses, Savings)
// ----------------------------------------------------------------------

export function KPIBalanceIcon({ size = 22, className = "", strokeWidth, styleOverride }: IconProps) {
  const activeStyle = styleOverride || DEFAULT_ICON_STYLE;

  if (activeStyle === "classic") {
    return <Wallet size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Modern Duotone Executive Wallet
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Peeking Credit Card */}
      <rect
        x="5"
        y="3"
        width="14"
        height="6"
        rx="2"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Main Wallet Body */}
      <rect
        x="2.5"
        y="7"
        width="19"
        height="14"
        rx="3.5"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Biometric / Gold Clasp */}
      <path
        d="M17 12H20.5C21.3 12 22 12.7 22 13.5V14.5C22 15.3 21.3 16 20.5 16H17V12Z"
        fill="currentColor"
      />
      <circle cx="18.5" cy="14" r="1" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

export function KPISavingsIcon({ size = 22, className = "", strokeWidth, styleOverride }: IconProps) {
  const activeStyle = styleOverride || DEFAULT_ICON_STYLE;

  if (activeStyle === "classic") {
    return <PieChart size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Modern Duotone Vault / Safe Piggy-Bank
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 14C19 18 15.5 21 11 21C7.5 21 4.5 18.5 4.1 15.2L2.5 14C2 13.6 2 12.8 2.5 12.4L3.8 11.3C3.5 10.3 3.5 9.2 3.9 8.2C4.8 6 7 4.5 9.5 4.5H12C15.9 4.5 19 7.6 19 11.5V14Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Coin slot */}
      <line
        x1="9.5"
        y1="3"
        x2="13.5"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Percentage badge */}
      <circle cx="11.5" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10.5" cy="11.5" r="0.8" fill="currentColor" />
      <circle cx="12.5" cy="13.5" r="0.8" fill="currentColor" />
      <line x1="10" y1="14" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// ----------------------------------------------------------------------
// 3. TRANSACTION DETAIL ICONS
// ----------------------------------------------------------------------

export function TxTypeIcon({
  type,
  size = 18,
  className = "",
  strokeWidth = 2.5,
  styleOverride,
}: {
  type: "income" | "expense" | "goal";
  size?: number;
  className?: string;
  strokeWidth?: number;
  styleOverride?: "modern" | "classic";
}) {
  const activeStyle = styleOverride || DEFAULT_ICON_STYLE;

  if (activeStyle === "classic") {
    if (type === "income") return <ArrowUpRight size={size} strokeWidth={strokeWidth} className={className} />;
    if (type === "goal") return <Target size={size} strokeWidth={strokeWidth} className={className} />;
    return <ArrowDownRight size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // Modern Micro-Illustrations
  if (type === "income") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.2" />
        <path
          d="M6 14L14 6M14 6H9M14 6V11"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "goal") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.2" />
        <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="10" cy="10" r="2" fill="currentColor" />
      </svg>
    );
  }

  // Expense
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.2" />
      <path
        d="M6 6L14 14M14 14H9M14 14V9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
