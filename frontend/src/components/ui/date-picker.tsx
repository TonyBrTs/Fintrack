"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { CalendarIcon, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSettings } from "@/contexts/SettingsContext";

export interface DatePickerProps {
  value?: string; // "yyyy-MM-dd" or ISO string
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  align?: "start" | "center" | "end";
  showQuickSelect?: boolean;
  name?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  minDate,
  maxDate,
  align = "start",
  showQuickSelect = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { language } = useSettings();
  const isEs = language === "es";
  const activeLocale = isEs ? es : enUS;

  // Safely parse "yyyy-MM-dd" without timezone shift issues
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (typeof value === "string" && value.includes("-")) {
      const parts = value.split("T")[0].split("-").map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        return isValid(d) ? d : undefined;
      }
    }
    const d = new Date(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  const handleQuickSelect = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    onChange(format(d, "yyyy-MM-dd"));
    setOpen(false);
  };

  const formattedLabel = React.useMemo(() => {
    if (!selectedDate) return null;
    try {
      return format(selectedDate, isEs ? "d 'de' MMMM, yyyy" : "PPP", {
        locale: activeLocale,
      });
    } catch {
      return value;
    }
  }, [selectedDate, isEs, activeLocale, value]);

  const defaultPlaceholder = isEs ? "Seleccionar fecha" : "Select date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-10 px-3.5 justify-between text-left font-normal bg-card/90 dark:bg-card/75 border-border/80 rounded-xl hover:border-action/60 hover:bg-card dark:hover:bg-card/90 transition-all shadow-xs group cursor-pointer",
            !value && "text-muted-foreground",
            open && "border-action ring-2 ring-action/20",
            className,
          )}
        >
          <div className="flex items-center gap-2.5 truncate min-w-0">
            <CalendarIcon className="h-4 w-4 shrink-0 text-action dark:text-blue-400 group-hover:scale-105 transition-transform" />
            <span className="truncate text-sm font-medium capitalize">
              {formattedLabel || placeholder || defaultPlaceholder}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180 text-action dark:text-blue-400",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-auto p-3 max-w-[calc(100vw-2rem)] rounded-2xl border-border/80 shadow-2xl shadow-black/25 bg-card/95 dark:bg-slate-900/95 backdrop-blur-2xl z-[300]"
      >
        {showQuickSelect && (
          <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b border-border/50">
            <button
              type="button"
              onClick={() => handleQuickSelect(0)}
              className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-secondary/70 hover:bg-action/10 hover:text-action dark:hover:bg-blue-500/15 dark:hover:text-blue-400 transition-colors text-center cursor-pointer"
            >
              {isEs ? "Hoy" : "Today"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(-1)}
              className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-secondary/70 hover:bg-action/10 hover:text-action dark:hover:bg-blue-500/15 dark:hover:text-blue-400 transition-colors text-center cursor-pointer"
            >
              {isEs ? "Ayer" : "Yesterday"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(1)}
              className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-secondary/70 hover:bg-action/10 hover:text-action dark:hover:bg-blue-500/15 dark:hover:text-blue-400 transition-colors text-center cursor-pointer"
            >
              {isEs ? "Mañana" : "Tomorrow"}
            </button>
          </div>
        )}
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
          locale={activeLocale}
        />
      </PopoverContent>
    </Popover>
  );
}
