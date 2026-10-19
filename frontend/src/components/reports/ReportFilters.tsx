"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/utils";
import { Calendar as CalendarIcon, ChevronDown, RotateCcw, Check, FileText } from "lucide-react";

export type PeriodPreset =
  "this_month" | "last_month" | "last_30_days" | "this_year" | "all" | "custom";

interface ReportFiltersProps {
  preset: PeriodPreset;
  setPreset: (p: PeriodPreset) => void;
  handleSelectPreset: (p: PeriodPreset) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  periodLabel: string;
  includeSummary: boolean;
  setIncludeSummary: (include: boolean) => void;
  includeExpensesList: boolean;
  setIncludeExpensesList: (include: boolean) => void;
  includeIncomesList: boolean;
  setIncludeIncomesList: (include: boolean) => void;
  includeGoals: boolean;
  setIncludeGoals: (include: boolean) => void;
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
  notes: string;
  setNotes: (notes: string) => void;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  currencySymbol: string;
  filteredExpensesCount: number;
  filteredIncomesCount: number;
  goalsCount: number;
  isEs: boolean;
}

export function ReportFilters({
  preset,
  setPreset,
  handleSelectPreset,
  dateRange,
  setDateRange,
  isCalendarOpen,
  setIsCalendarOpen,
  periodLabel,
  includeSummary,
  setIncludeSummary,
  includeExpensesList,
  setIncludeExpensesList,
  includeIncomesList,
  setIncludeIncomesList,
  includeGoals,
  setIncludeGoals,
  showNotes,
  setShowNotes,
  notes,
  setNotes,
  totalIncome,
  totalExpense,
  netSavings,
  currencySymbol,
  filteredExpensesCount,
  filteredIncomesCount,
  goalsCount,
  isEs,
}: ReportFiltersProps) {
  return (
    <div className="rounded-2xl bg-card border border-border/80 p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4 print:hidden">
      {/* Date & Period Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap -mx-1 px-1 sm:mx-0 sm:px-0">
          <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
            <CalendarIcon size={13} />
            {isEs ? "PERÍODO:" : "PERIOD:"}
          </span>

          <button
            type="button"
            onClick={() => handleSelectPreset("this_month")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              preset === "this_month"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-accent hover:text-foreground"
            }`}
          >
            {isEs ? "Este Mes" : "This Month"}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset("last_month")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              preset === "last_month"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-accent hover:text-foreground"
            }`}
          >
            {isEs ? "Mes Pasado" : "Last Month"}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset("last_30_days")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              preset === "last_30_days"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-accent hover:text-foreground"
            }`}
          >
            {isEs ? "Últimos 30 Días" : "Last 30 Days"}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset("this_year")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              preset === "this_year"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-accent hover:text-foreground"
            }`}
          >
            {isEs ? "Año en Curso" : "This Year"}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset("all")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              preset === "all"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-accent hover:text-foreground"
            }`}
          >
            {isEs ? "Todo el Historial" : "All Time"}
          </button>
        </div>

        {/* Interactive Calendar Popover Trigger */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer w-full sm:w-auto ${
                preset === "custom"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-card text-foreground border-border/90 hover:bg-accent shadow-xs"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <CalendarIcon
                  size={14}
                  className={
                    preset === "custom" ? "text-white" : "text-blue-600 dark:text-blue-400"
                  }
                />
                <span className="truncate">{periodLabel}</span>
              </div>
              <ChevronDown size={14} className="opacity-60 ml-1 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            sideOffset={8}
            className="w-auto max-w-[calc(100vw-2rem)] p-3.5"
          >
            <div className="pb-2.5 mb-2 border-b border-border/60 flex items-center justify-between">
              <span className="text-xs font-bold text-titles dark:text-foreground">
                {isEs ? "Seleccionar Rango de Fechas" : "Select Date Range"}
              </span>
              <button
                type="button"
                onClick={() => {
                  handleSelectPreset("this_month");
                  setIsCalendarOpen(false);
                }}
                className="text-[11px] text-action dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw size={11} />
                {isEs ? "Restablecer a Este Mes" : "Reset to This Month"}
              </button>
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                setPreset("custom");
              }}
              numberOfMonths={1}
            />
            <div className="pt-2.5 mt-2 border-t border-border/60 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                {isEs ? "Aplicar Período" : "Apply Range"}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Inclusions Selector */}
      <div className="pt-3 border-t border-border/50">
        <div className="text-[11px] sm:text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
          {isEs ? "SECCIONES A INCLUIR:" : "INCLUDE MODULES:"}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap -mx-1 px-1 sm:mx-0 sm:px-0">
          {/* Summary Toggle */}
          <button
            type="button"
            onClick={() => setIncludeSummary(!includeSummary)}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
              includeSummary
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-semibold"
                : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center text-[10px] ${
                includeSummary ? "bg-blue-600 text-white" : "border border-muted-foreground/40"
              }`}
            >
              {includeSummary && <Check size={10} strokeWidth={3} />}
            </span>
            <span>{isEs ? "Estado y Resumen" : "Flow & Summary"}</span>
          </button>

          {/* Expenses List Toggle */}
          <button
            type="button"
            onClick={() => setIncludeExpensesList(!includeExpensesList)}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
              includeExpensesList
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold"
                : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center text-[10px] ${
                includeExpensesList ? "bg-rose-600 text-white" : "border border-muted-foreground/40"
              }`}
            >
              {includeExpensesList && <Check size={10} strokeWidth={3} />}
            </span>
            <span>
              {isEs ? "Detalle Gastos" : "Every Expense"} ({filteredExpensesCount})
            </span>
          </button>

          {/* Incomes List Toggle */}
          <button
            type="button"
            onClick={() => setIncludeIncomesList(!includeIncomesList)}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
              includeIncomesList
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center text-[10px] ${
                includeIncomesList
                  ? "bg-emerald-600 text-white"
                  : "border border-muted-foreground/40"
              }`}
            >
              {includeIncomesList && <Check size={10} strokeWidth={3} />}
            </span>
            <span>
              {isEs ? "Detalle Ingresos" : "Every Income"} ({filteredIncomesCount})
            </span>
          </button>

          {/* Goals Toggle */}
          <button
            type="button"
            onClick={() => setIncludeGoals(!includeGoals)}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
              includeGoals
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold"
                : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center text-[10px] ${
                includeGoals ? "bg-amber-600 text-white" : "border border-muted-foreground/40"
              }`}
            >
              {includeGoals && <Check size={10} strokeWidth={3} />}
            </span>
            <span>
              {isEs ? "Metas" : "Savings Goals"} ({goalsCount})
            </span>
          </button>

          {/* Notes Toggle */}
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
              showNotes
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold"
                : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
            }`}
          >
            <FileText size={13} className="shrink-0" />
            <span>{isEs ? "Observaciones" : "Auditor Notes"}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Notes Box */}
      {showNotes && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isEs
                ? "Ingresa observaciones, aclaraciones patrimoniales o dictamen para incluir en el reporte impreso..."
                : "Enter optional auditor comments, remarks, or disclosures to print on the statement..."
            }
            rows={2}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-muted/40 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
          />
        </div>
      )}

      {/* Live Metrics Summary Bar */}
      <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 text-xs font-mono">
        <div className="grid grid-cols-3 gap-2 p-2 sm:p-0 rounded-xl bg-muted/40 sm:bg-transparent sm:flex sm:items-center sm:gap-x-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {isEs ? "Ingresos:" : "Income:"}
            </span>
            <strong className="text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-[11px] sm:text-xs">
              +{currencySymbol}
              {formatCurrency(totalIncome)}
            </strong>
          </div>
          <span className="hidden sm:inline text-border/80">•</span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {isEs ? "Egresos:" : "Expenses:"}
            </span>
            <strong className="text-rose-600 dark:text-rose-400 whitespace-nowrap text-[11px] sm:text-xs">
              -{currencySymbol}
              {formatCurrency(totalExpense)}
            </strong>
          </div>
          <span className="hidden sm:inline text-border/80">•</span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {isEs ? "Saldo:" : "Balance:"}
            </span>
            <strong
              className={`whitespace-nowrap text-[11px] sm:text-xs ${
                netSavings >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {netSavings < 0
                ? `-${currencySymbol}${formatCurrency(Math.abs(netSavings))}`
                : `+${currencySymbol}${formatCurrency(netSavings)}`}
            </strong>
          </div>
        </div>

        <div className="text-muted-foreground text-[10px] sm:text-xs text-center sm:text-right">
          {filteredExpensesCount + filteredIncomesCount}{" "}
          {isEs ? "movimientos en período" : "records in period"}
        </div>
      </div>
    </div>
  );
}
