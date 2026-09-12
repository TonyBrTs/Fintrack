import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats user input in real-time with thousand commas and clean decimals.
 * Examples:
 *  "1234" -> "1,234"
 *  "1234." -> "1,234."
 *  "1234.5" -> "1,234.5"
 *  "1234.56" -> "1,234.56"
 */
export function formatLiveNumber(val: string): string {
  if (!val) return "";

  // Convert commas to dots if user typed comma as decimal, or strip thousand commas
  const cleaned = val.replace(/,/g, "");

  // Prevent multiple dots
  const parts = cleaned.split(".");
  let integerPart = parts[0].replace(/\D/g, "");
  const decimalPart = parts.length > 1 ? parts.slice(1).join("").replace(/\D/g, "").slice(0, 2) : null;

  if (integerPart) {
    integerPart = new Intl.NumberFormat("en-US").format(BigInt(integerPart));
  } else if (cleaned.startsWith(".")) {
    integerPart = "0";
  }

  if (decimalPart !== null) {
    return `${integerPart}.${decimalPart}`;
  }
  if (cleaned.includes(".")) {
    return `${integerPart}.`;
  }
  return integerPart;
}

/**
 * Extracts raw numeric string for form submission or parseFloat.
 * Example: "1,234,567.89" -> "1234567.89"
 */
export function parseLiveNumber(val: string): string {
  if (!val) return "";
  return val.replace(/,/g, "");
}

/**
 * Returns static Tailwind CSS classes for category color dots and badges.
 */
export function getCategoryColorBg(color?: string): string {
  switch (color?.toLowerCase()) {
    case "emerald":
      return "bg-emerald-500";
    case "purple":
      return "bg-purple-500";
    case "amber":
      return "bg-amber-500";
    case "rose":
      return "bg-rose-500";
    case "cyan":
      return "bg-cyan-500";
    case "indigo":
      return "bg-indigo-500";
    case "slate":
      return "bg-slate-500";
    case "blue":
    default:
      return "bg-blue-500";
  }
}

