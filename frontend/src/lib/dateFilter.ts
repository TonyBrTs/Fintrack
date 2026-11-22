import type { DateRange } from "react-day-picker";
import { formatDateDDMMYYYY, parseCalendarDate } from "@/lib/utils";

export type TimeFilterPreset =
  | "this_month"
  | "last_7_days"
  | "last_month"
  | "last_30_days"
  | "this_year"
  | "all"
  | "custom";

export function getDateRangeForPreset(preset: TimeFilterPreset): DateRange | undefined {
  const now = new Date();

  switch (preset) {
    case "this_month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case "last_7_days": {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last_month":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
        to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      };
    case "last_30_days": {
      const from = new Date(now);
      from.setDate(now.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "this_year":
      return {
        from: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    case "all":
    case "custom":
    default:
      return undefined;
  }
}

export function isWithinDateRange(
  dateInput: string | Date,
  dateRange: DateRange | undefined
): boolean {
  if (!dateRange || (!dateRange.from && !dateRange.to)) return true;

  const itemDate = parseCalendarDate(dateInput);
  if (isNaN(itemDate.getTime())) return false;

  if (dateRange.from) {
    const start = new Date(dateRange.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.to ?? dateRange.from);
    end.setHours(23, 59, 59, 999);
    return itemDate >= start && itemDate <= end;
  }

  return true;
}

export function getPeriodDisplayLabel(
  preset: TimeFilterPreset,
  dateRange: DateRange | undefined,
  language: string
): string {
  const isEs = language !== "en";

  switch (preset) {
    case "this_month":
      return isEs ? "Este mes" : "This month";
    case "last_7_days":
      return isEs ? "Últimos 7 días" : "Last 7 days";
    case "last_month":
      return isEs ? "Mes pasado" : "Last month";
    case "last_30_days":
      return isEs ? "Últimos 30 días" : "Last 30 days";
    case "this_year":
      return isEs ? "Este año" : "This year";
    case "all":
      return isEs ? "Todo el historial" : "All time";
    case "custom":
      if (dateRange?.from && dateRange?.to) {
        return `${formatDateDDMMYYYY(dateRange.from)} - ${formatDateDDMMYYYY(dateRange.to)}`;
      }
      if (dateRange?.from) {
        return formatDateDDMMYYYY(dateRange.from);
      }
      return isEs ? "Rango personalizado" : "Custom range";
  }
}

/**
 * Formats a calendar date into a human-friendly mobile group heading (Today, Yesterday, or "22 nov. 2026").
 */
export function formatDateGroupHeader(dateInput: string | Date, language: string): string {
  const d = parseCalendarDate(dateInput);
  if (isNaN(d.getTime())) return "";

  const isEs = language !== "en";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return isEs ? "Hoy" : "Today";
  if (diffDays === 1) return isEs ? "Ayer" : "Yesterday";

  return target.toLocaleDateString(isEs ? "es-CR" : "en-US", {
    day: "numeric",
    month: "short",
    year: target.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export function getDateGroupKey(dateInput: string | Date): string {
  const d = parseCalendarDate(dateInput);
  if (isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
