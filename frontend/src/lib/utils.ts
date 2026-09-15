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

/**
 * Returns today's date in local YYYY-MM-DD format (avoids UTC offset shifts).
 */
export function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses any date (string or Date) into a local Date without UTC offset regressions.
 * e.g. "2026-09-30T00:00:00Z" -> Date object for Sep 30 locally.
 */
export function parseCalendarDate(dateInput: string | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (typeof dateInput === "string") {
    const datePart = dateInput.split("T")[0];
    const parts = datePart.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
  }
  return new Date(dateInput);
}

const SPANISH_MONTHS_SHORT = [
  "ene.", "feb.", "mar.", "abr.", "may.", "jun.",
  "jul.", "ago.", "set.", "oct.", "nov.", "dic."
];

/**
 * Formats a calendar date safely into "30 set." without timezone shifting or browser locale bugs.
 */
export function formatCalendarDate(
  dateInput: string | Date | null | undefined,
  includeYear: boolean = false
): string {
  if (!dateInput) return "";
  const d = parseCalendarDate(dateInput);
  const day = d.getDate();
  const month = SPANISH_MONTHS_SHORT[d.getMonth()] || "";
  if (includeYear) {
    return `${day} ${month} ${d.getFullYear()}`;
  }
  return `${day} ${month}`;
}

