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

export interface CategoryColorTheme {
  name: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  badge: string;
  hex: string;
}

export const CATEGORY_COLOR_PALETTE: Record<string, CategoryColorTheme> = {
  emerald: {
    name: "emerald",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    hex: "#10b981",
  },
  blue: {
    name: "blue",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    hex: "#3b82f6",
  },
  purple: {
    name: "purple",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    hex: "#8b5cf6",
  },
  amber: {
    name: "amber",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    hex: "#f59e0b",
  },
  rose: {
    name: "rose",
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    hex: "#f43f5e",
  },
  cyan: {
    name: "cyan",
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-500/30",
    dot: "bg-cyan-500",
    badge: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    hex: "#06b6d4",
  },
  indigo: {
    name: "indigo",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/30",
    dot: "bg-indigo-500",
    badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    hex: "#6366f1",
  },
  pink: {
    name: "pink",
    bg: "bg-pink-500/10 dark:bg-pink-500/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-500/30",
    dot: "bg-pink-500",
    badge: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
    hex: "#ec4899",
  },
  orange: {
    name: "orange",
    bg: "bg-orange-500/10 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/30",
    dot: "bg-orange-500",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    hex: "#f97316",
  },
  teal: {
    name: "teal",
    bg: "bg-teal-500/10 dark:bg-teal-500/20",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-500/30",
    dot: "bg-teal-500",
    badge: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    hex: "#14b8a6",
  },
  slate: {
    name: "slate",
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30",
    dot: "bg-slate-500",
    badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    hex: "#64748b",
  },
};

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  // Expenses
  alimentación: "emerald",
  alimentacion: "emerald",
  transporte: "blue",
  servicios: "amber",
  entretenimiento: "purple",
  salud: "rose",
  metas: "cyan",
  otros: "slate",
  // Incomes
  salario: "emerald",
  freelance: "blue",
  inversiones: "purple",
  regalo: "pink",
};

/**
 * Returns full color theme for any category name or color key.
 * Automatically looks up in user categories list, falls back to system defaults,
 * or deterministically hashes the name to a vibrant palette color.
 */
export function getCategoryStyle(
  categoryNameOrColor?: string | null,
  categoryList?: Array<{ name: string; color?: string }>
): CategoryColorTheme {
  const fallback = CATEGORY_COLOR_PALETTE.slate;
  if (!categoryNameOrColor) return fallback;

  const trimmed = categoryNameOrColor.trim();
  const normalized = trimmed.toLowerCase();

  // 1. Direct color key match (e.g. "emerald", "purple")
  if (CATEGORY_COLOR_PALETTE[normalized]) {
    return CATEGORY_COLOR_PALETTE[normalized];
  }

  // 2. Lookup in provided categoryList (user's custom categories or state)
  if (categoryList && Array.isArray(categoryList)) {
    const found = categoryList.find(
      (c) => c.name.trim().toLowerCase() === normalized
    );
    if (found?.color) {
      const colorKey = found.color.toLowerCase();
      if (CATEGORY_COLOR_PALETTE[colorKey]) {
        return CATEGORY_COLOR_PALETTE[colorKey];
      }
    }
  }

  // 3. Lookup in system default categories
  if (DEFAULT_CATEGORY_COLORS[normalized]) {
    const colorKey = DEFAULT_CATEGORY_COLORS[normalized];
    if (CATEGORY_COLOR_PALETTE[colorKey]) {
      return CATEGORY_COLOR_PALETTE[colorKey];
    }
  }

  // 4. Stable deterministic hash so any unexpected category gets a consistent color
  const paletteKeys = [
    "emerald",
    "blue",
    "purple",
    "amber",
    "rose",
    "cyan",
    "indigo",
    "pink",
    "teal",
  ];
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % paletteKeys.length;
  return CATEGORY_COLOR_PALETTE[paletteKeys[index]] || fallback;
}

/**
 * Returns static Tailwind CSS classes for category color dots and badges.
 * Supports both color keys ("emerald") and category names ("Alimentación").
 */
export function getCategoryColorBg(
  colorOrCategory?: string,
  categoryList?: Array<{ name: string; color?: string }>
): string {
  return getCategoryStyle(colorOrCategory, categoryList).dot;
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

const MONTHS_SHORT: Record<string, string[]> = {
  es: ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "set.", "oct.", "nov.", "dic."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/**
 * Formats a calendar date safely into "30 set." or "Sep 30" without timezone shifting or browser locale bugs.
 */
export function formatCalendarDate(
  dateInput: string | Date | null | undefined,
  language: string = "es",
  includeYear: boolean = false
): string {
  if (!dateInput) return "";
  const d = parseCalendarDate(dateInput);
  const day = d.getDate();
  const langKey = language === "en" ? "en" : "es";
  const months = MONTHS_SHORT[langKey];
  const month = months[d.getMonth()] || "";

  if (langKey === "en") {
    return includeYear ? `${month} ${day}, ${d.getFullYear()}` : `${month} ${day}`;
  }
  return includeYear ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`;
}

/**
 * Formats due date urgency label bilingual (es/en)
 */
export function formatDueDateLabel(dueDateStr: string | Date, language: string = "es") {
  const target = parseCalendarDate(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const isEn = language === "en";

  if (diffDays === 0) return { label: isEn ? "Today!" : "¡Hoy!", urgent: true };
  if (diffDays === 1) return { label: isEn ? "Tomorrow" : "Mañana", urgent: true };
  if (diffDays > 1 && diffDays <= 31) {
    return { label: isEn ? `In ${diffDays} days` : `En ${diffDays} días`, urgent: false };
  }
  if (diffDays > 31) {
    const months = Math.round(diffDays / 30);
    return {
      label: isEn
        ? `In ${months} ${months === 1 ? "month" : "months"}`
        : `En ${months} meses`,
      urgent: false,
    };
  }
  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      label: isEn ? `Overdue by ${abs}d` : `Venció hace ${abs}d`,
      urgent: true,
    };
  }

  return {
    label: isEn ? `In ${diffDays} days` : `En ${diffDays} días`,
    urgent: false,
  };
}

/**
 * Formats recurring frequencies bilingual (es/en)
 */
export function formatFrequencyLabel(
  frequency: string,
  biweeklyType?: string,
  billingDay?: number,
  language: string = "es"
): string {
  const isEn = language === "en";
  switch (frequency) {
    case "biweekly":
      if (biweeklyType === "every_15_days") {
        return isEn ? "Biweekly (every 15 days)" : "Quincenal (c/ 15 días)";
      }
      return isEn ? "Biweekly (15th & end of month)" : "Quincenal (15 y fin de mes)";
    case "monthly":
      return isEn ? `Monthly (Day ${billingDay || 15})` : `Mensual (Día ${billingDay || 15})`;
    case "weekly":
      return isEn ? "Weekly" : "Semanal";
    case "yearly":
      return isEn ? "Yearly" : "Anual";
    default:
      return frequency;
  }
}

