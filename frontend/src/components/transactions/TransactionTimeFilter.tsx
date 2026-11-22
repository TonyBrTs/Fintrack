"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDateDDMMYYYY } from "@/lib/utils";
import type { TimeFilterPreset } from "@/lib/dateFilter";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";

interface TransactionTimeFilterProps {
  preset: TimeFilterPreset;
  dateRange: DateRange | undefined;
  onSelectPreset: (preset: TimeFilterPreset) => void;
  onSelectCustomRange: (range: DateRange | undefined) => void;
  language: string;
  accent?: "expense" | "income";
}

const PRESET_OPTIONS: { id: Exclude<TimeFilterPreset, "custom">; es: string; en: string }[] = [
  { id: "this_month", es: "Este mes", en: "This month" },
  { id: "last_7_days", es: "Últimos 7 días", en: "Last 7 days" },
  { id: "last_30_days", es: "Últimos 30 días", en: "Last 30 days" },
  { id: "last_month", es: "Mes pasado", en: "Last month" },
  { id: "this_year", es: "Este año", en: "This year" },
  { id: "all", es: "Todo el historial", en: "All time" },
];

export function TransactionTimeFilter({
  preset,
  dateRange,
  onSelectPreset,
  onSelectCustomRange,
  language,
  accent = "expense",
}: TransactionTimeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const isEs = language !== "en";

  const activePillClass =
    accent === "income"
      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
      : "bg-blue-600 text-white border-blue-600 shadow-xs";

  const inactivePillClass =
    "bg-card text-slate-600 dark:text-muted-foreground border-border/80 hover:bg-secondary hover:text-foreground";

  const customLabel =
    preset === "custom" && dateRange?.from
      ? dateRange.to
        ? `${formatDateDDMMYYYY(dateRange.from)} - ${formatDateDDMMYYYY(dateRange.to)}`
        : formatDateDDMMYYYY(dateRange.from)
      : isEs
        ? "Fechas"
        : "Dates";

  const handleMobileSelectChange = (value: string) => {
    if (value === "custom") {
      setIsCalendarOpen(true);
      return;
    }
    onSelectPreset(value as TimeFilterPreset);
  };

  return (
    <div className="w-full">
      {/* Mobile: Dropdown + Calendar Popover (no horizontal scroll) */}
      <div className="flex sm:hidden items-center gap-2 w-full">
        <Select value={preset} onValueChange={handleMobileSelectChange}>
          <SelectTrigger className="flex-1 min-w-0 min-h-[44px] rounded-xl bg-card border-border/80 font-semibold text-sm">
            <div className="flex items-center gap-2 truncate">
              <Clock
                size={15}
                className={cn(
                  "shrink-0",
                  accent === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-blue-600 dark:text-blue-400"
                )}
              />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PRESET_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {isEs ? option.es : option.en}
              </SelectItem>
            ))}
            <SelectItem value="custom">
              {preset === "custom" && dateRange?.from
                ? customLabel
                : isEs
                  ? "Rango personalizado..."
                  : "Custom range..."}
            </SelectItem>
          </SelectContent>
        </Select>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={isEs ? "Elegir rango de fechas" : "Pick date range"}
              className={cn(
                "shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer touch-manipulation select-none",
                preset === "custom" ? activePillClass : inactivePillClass
              )}
            >
              <CalendarIcon size={16} className="shrink-0" />
              <span>{isEs ? "Rango" : "Range"}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto max-w-[calc(100vw-2rem)] p-3 rounded-2xl"
            align="end"
            sideOffset={8}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold text-foreground">
                  {isEs ? "Seleccionar rango de fechas" : "Select date range"}
                </span>
                {preset === "custom" && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPreset("this_month");
                      setIsCalendarOpen(false);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={12} />
                    {isEs ? "Limpiar" : "Clear"}
                  </button>
                )}
              </div>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  onSelectCustomRange(range);
                  if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
                    setIsCalendarOpen(false);
                  }
                }}
                numberOfMonths={1}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop: Wrapped Pills + Calendar Popover */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        {PRESET_OPTIONS.map((option) => {
          const isActive = preset === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectPreset(option.id)}
              aria-pressed={isActive}
              className={cn(
                "shrink-0 whitespace-nowrap min-h-[36px] px-3.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer select-none",
                isActive ? activePillClass : inactivePillClass
              )}
            >
              {isEs ? option.es : option.en}
            </button>
          );
        })}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-pressed={preset === "custom"}
              className={cn(
                "shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer select-none",
                preset === "custom" ? activePillClass : inactivePillClass
              )}
            >
              <CalendarIcon size={14} className="shrink-0" />
              <span className={cn(preset === "custom" && "font-mono tabular-nums")}>
                {customLabel}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 rounded-2xl" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold text-foreground">
                  {isEs ? "Seleccionar rango de fechas" : "Select date range"}
                </span>
                {preset === "custom" && (
                  <button
                    type="button"
                    onClick={() => onSelectPreset("this_month")}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={12} />
                    {isEs ? "Limpiar" : "Clear"}
                  </button>
                )}
              </div>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => onSelectCustomRange(range)}
                numberOfMonths={1}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
