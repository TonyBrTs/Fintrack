"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDateDDMMYYYY } from "@/lib/utils";
import type { TimeFilterPreset } from "@/lib/dateFilter";
import { Calendar as CalendarIcon, X } from "lucide-react";

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
  { id: "last_7_days", es: "7 días", en: "7 days" },
  { id: "last_30_days", es: "30 días", en: "30 days" },
  { id: "last_month", es: "Mes pasado", en: "Last month" },
  { id: "this_year", es: "Este año", en: "This year" },
  { id: "all", es: "Todo", en: "All" },
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

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5 sm:mx-0 sm:px-0 sm:flex-wrap">
      {PRESET_OPTIONS.map((option) => {
        const isActive = preset === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelectPreset(option.id)}
            aria-pressed={isActive}
            className={cn(
              "shrink-0 whitespace-nowrap min-h-[40px] sm:min-h-[36px] px-3.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer touch-manipulation select-none",
              isActive ? activePillClass : inactivePillClass
            )}
          >
            {isEs ? option.es : option.en}
          </button>
        );
      })}

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-pressed={preset === "custom"}
            className={cn(
              "shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[36px] px-3.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer touch-manipulation select-none",
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
  );
}
