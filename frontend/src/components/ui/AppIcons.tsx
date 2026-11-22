import {
  IconLayoutDashboard,
  IconTrendingUp,
  IconTrendingDown,
  IconTargetArrow,
  IconWallet,
  IconPigMoney,
  IconArrowUpRight,
  IconArrowDownRight,
} from "@tabler/icons-react";

export interface AppIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function NavSummaryIcon({
  size = 20,
  className = "",
  strokeWidth = 1.8,
}: AppIconProps) {
  return <IconLayoutDashboard size={size} stroke={strokeWidth} className={className} />;
}

export function NavExpensesIcon({
  size = 20,
  className = "",
  strokeWidth = 1.8,
}: AppIconProps) {
  return <IconTrendingDown size={size} stroke={strokeWidth} className={className} />;
}

export function NavIncomeIcon({
  size = 20,
  className = "",
  strokeWidth = 1.8,
}: AppIconProps) {
  return <IconTrendingUp size={size} stroke={strokeWidth} className={className} />;
}

export function NavGoalsIcon({
  size = 20,
  className = "",
  strokeWidth = 1.8,
}: AppIconProps) {
  return <IconTargetArrow size={size} stroke={strokeWidth} className={className} />;
}

// ----------------------------------------------------------------------
// 2. DASHBOARD KPI ICONS (Balance, Savings, Income, Expenses)
// ----------------------------------------------------------------------

export function KPIBalanceIcon({
  size = 22,
  className = "",
  strokeWidth = 1.8,
}: AppIconProps) {
  return <IconWallet size={size} stroke={strokeWidth} className={className} />;
}

export function KPISavingsIcon({
  size = 22,
  className = "",
  strokeWidth = 1.8,
}: AppIconProps) {
  return <IconPigMoney size={size} stroke={strokeWidth} className={className} />;
}

export function KPIIncomeIcon({
  size = 22,
  className = "",
  strokeWidth = 1.8,
}: AppIconProps) {
  return <IconTrendingUp size={size} stroke={strokeWidth} className={className} />;
}

export function KPIExpenseIcon({
  size = 22,
  className = "",
  strokeWidth = 1.8,
}: AppIconProps) {
  return <IconTrendingDown size={size} stroke={strokeWidth} className={className} />;
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
}: TxTypeIconProps) {
  if (type === "income") {
    return <IconArrowUpRight size={size} stroke={strokeWidth} className={className} />;
  }

  if (type === "expense") {
    return <IconArrowDownRight size={size} stroke={strokeWidth} className={className} />;
  }

  // Goal transaction type
  return <IconTargetArrow size={size} stroke={strokeWidth} className={className} />;
}
