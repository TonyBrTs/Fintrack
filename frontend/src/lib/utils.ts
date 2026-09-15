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

