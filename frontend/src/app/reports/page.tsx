"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { safeFetch } from "@/lib/api";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { formatCurrency } from "@/lib/utils";
import { translations } from "@/lib/translations";
import type { Expense, Income, Goal } from "@/types/index";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { PageLoadingState } from "@/components/ui/PageLoadingState";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { exportFinancialReportExcel } from "@/lib/excelExport";
import { toast } from "sonner";
import {
  Printer,
  FileSpreadsheet,
  FileDown,
  Calendar as CalendarIcon,
  ChevronDown,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileCheck2,
  Check,
  RotateCcw,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

type PeriodPreset =
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "this_year"
  | "all"
  | "custom";

/**
 * Safely parses any date string or Date object to a local Date instance
 * normalized at midday (12:00:00) to prevent UTC midnight rollback.
 */
function parseLocalDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  if (!d) return new Date();
  if (typeof d === "string") {
    // If it's a simple YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [year, month, day] = d.split("-").map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    // If it's an ISO timestamp
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export default function ReportsPage() {
  const { currencySymbol, language } = useSettings();
  const { user } = useAuth();
  const isEs = language === "es";

  // Data fetching state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Period Preset & Date Range state
  const [preset, setPreset] = useState<PeriodPreset>("this_month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from: start, to: end };
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Inclusions toggles
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeExpensesList, setIncludeExpensesList] = useState(true);
  const [includeIncomesList, setIncludeIncomesList] = useState(true);
  const [includeGoals, setIncludeGoals] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  // Load all user financial data
  const fetchReportData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [expRes, incRes, goalRes] = await Promise.all([
        safeFetch<Expense[]>("/api/expenses", { timeoutMs: 15000 }),
        safeFetch<Income[]>("/api/incomes", { timeoutMs: 15000 }),
        safeFetch<Goal[]>("/api/goals", { timeoutMs: 15000 }),
      ]);

      if (expRes.ok && incRes.ok) {
        setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
        setIncomes(Array.isArray(incRes.data) ? incRes.data : []);
        setGoals(Array.isArray(goalRes.data) ? goalRes.data : []);
      } else {
        setError(
          expRes.error ||
            incRes.error ||
            (isEs
              ? "No se pudo cargar la información contable. Reintenta."
              : "Failed to load financial records. Please retry.")
        );
      }
    } catch {
      setError(
        isEs
          ? "Error de conexión con el servidor contable."
          : "Server connection error."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [user?.id]);

  // Preset Selection
  const handleSelectPreset = (p: PeriodPreset) => {
    setPreset(p);
    const now = new Date();

    if (p === "this_month") {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      setDateRange({ from, to });
    } else if (p === "last_month") {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      setDateRange({ from, to });
    } else if (p === "last_30_days") {
      const from = new Date();
      from.setDate(now.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      setDateRange({ from, to });
    } else if (p === "this_year") {
      const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      setDateRange({ from, to });
    } else if (p === "all") {
      setDateRange(undefined);
    }
  };

  // Filtered transactions (Safe local date comparison)
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
        const itemDate = parseLocalDate(e.date);

        if (dateRange.from && dateRange.to) {
          const start = new Date(dateRange.from);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }

        if (dateRange.from) {
          const start = new Date(dateRange.from);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateRange.from);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }

        return true;
      })
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }, [expenses, dateRange]);

  const filteredIncomes = useMemo(() => {
    return incomes
      .filter((i) => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
        const itemDate = parseLocalDate(i.date);

        if (dateRange.from && dateRange.to) {
          const start = new Date(dateRange.from);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }

        if (dateRange.from) {
          const start = new Date(dateRange.from);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateRange.from);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }

        return true;
      })
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }, [incomes, dateRange]);

  // Aggregates
  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalIncome = useMemo(() => {
    return filteredIncomes.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  }, [filteredIncomes]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Period label for statement
  const periodLabel = useMemo(() => {
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      return isEs ? "Histórico Completo (Todo el Registro)" : "All Historical Records";
    }
    const fmt = (d: Date) =>
      d.toLocaleDateString(isEs ? "es-ES" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    if (dateRange.from && dateRange.to) {
      return `${fmt(dateRange.from)} — ${fmt(dateRange.to)}`;
    }
    if (dateRange.from) {
      return fmt(dateRange.from);
    }
    return isEs ? "Período Personalizado" : "Custom Period";
  }, [dateRange, isEs]);

  // Report Reference (deterministic hash)
  const reportReference = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const seed = ((Math.abs(totalExpense) + Math.abs(totalIncome) + 71) * 997)
      .toString(16)
      .toUpperCase()
      .slice(0, 4);
    return `FT-${y}${m}-${seed || "9B3E"}`;
  }, [totalExpense, totalIncome]);

  // Emission date string
  const generatedAt = useMemo(() => {
    return new Date().toLocaleDateString(isEs ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [isEs]);

  const handlePrint = () => {
    window.print();
  };

  const formatDateDisplay = (d: Date | string) => {
    const parsed = parseLocalDate(d);
    return parsed.toLocaleDateString(isEs ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const translateCategory = (cat?: string) => {
    if (!cat) return "";
    if (isEs) return cat;
    const catDict = (translations.en?.categories || {}) as Record<string, string>;
    return catDict[cat] || cat;
  };

  const translateSource = (src?: string) => {
    if (!src) return "";
    if (isEs) return src;
    const srcDict = (translations.en?.sources || {}) as Record<string, string>;
    return srcDict[src] || src;
  };

  const paymentMethodTranslations: Record<string, string> = {
    "Tarjeta de Crédito": "Credit Card",
    "Tarjeta de Débito": "Debit Card",
    "Efectivo": "Cash",
    "Transferencia": "Bank Transfer",
  };

  const translatePaymentMethod = (pm?: string) => {
    if (!pm) return "---";
    if (isEs) return pm;
    return paymentMethodTranslations[pm] || pm;
  };

  const handleExportExcel = async () => {
    try {
      await exportFinancialReportExcel({
        reportReference,
        user: {
          name: (user?.user_metadata?.full_name as string) || undefined,
          email: user?.email || undefined,
        },
        periodLabel,
        generatedAt,
        currencySymbol,
        notes,
        isEs,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        filteredExpenses,
        filteredIncomes,
        goals,
        formatDateDisplay,
        translateCategory,
        translateSource,
        translatePaymentMethod,
      });

      const filename = `FinTrack-Reporte-${reportReference}.xlsx`;
      toast.success(
        isEs
          ? `Reporte Excel descargado: ${filename}`
          : `Excel report downloaded: ${filename}`
      );
    } catch (err) {
      console.error(err);
      toast.error(
        isEs
          ? "No se pudo generar el archivo Excel."
          : "Could not generate Excel file."
      );
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        isEs ? "Tipo" : "Type",
        isEs ? "Fecha" : "Date",
        isEs ? "Concepto" : "Description",
        isEs ? "Categoría / Fuente" : "Category / Source",
        isEs ? "Medio de Pago" : "Payment Method",
        isEs ? "Monto" : "Amount",
        isEs ? "Moneda" : "Currency",
      ];

      type UnifiedTx = {
        type: string;
        date: string;
        rawDate: string | Date;
        description: string;
        catOrSource: string;
        paymentMethod: string;
        amount: number;
      };

      const combined: UnifiedTx[] = [
        ...filteredIncomes.map((i) => ({
          type: isEs ? "Ingreso" : "Income",
          date: formatDateDisplay(i.date),
          rawDate: i.date,
          description: i.description || (isEs ? "Abono a cuenta" : "Deposit"),
          catOrSource: translateSource(i.source),
          paymentMethod: translatePaymentMethod(i.payment_method),
          amount: Number(i.amount) || 0,
        })),
        ...filteredExpenses.map((e) => ({
          type: isEs ? "Egreso" : "Expense",
          date: formatDateDisplay(e.date),
          rawDate: e.date,
          description: e.description || (isEs ? "Sin descripción" : "No concept"),
          catOrSource: translateCategory(e.category),
          paymentMethod: translatePaymentMethod(e.payment_method),
          amount: -(Number(e.amount) || 0),
        })),
      ];

      combined.sort((a, b) => parseLocalDate(b.rawDate).getTime() - parseLocalDate(a.rawDate).getTime());

      const escapeCSV = (val: string | number) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvLines = [
        headers.map(escapeCSV).join(","),
        ...combined.map((tx) =>
          [
            tx.type,
            tx.date,
            tx.description,
            tx.catOrSource,
            tx.paymentMethod,
            tx.amount.toFixed(2),
            currencySymbol,
          ]
            .map(escapeCSV)
            .join(",")
        ),
      ];

      const csvContent = "\uFEFF" + csvLines.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `FinTrack-Reporte-${reportReference}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        isEs
          ? `Reporte CSV descargado: ${filename}`
          : `CSV report downloaded: ${filename}`
      );
    } catch {
      toast.error(
        isEs
          ? "No se pudo generar el archivo CSV."
          : "Could not generate CSV file."
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16 print:space-y-0 print:pb-0 print:m-0 print:max-w-none">
        {/* Page Top Header (Screen Only) */}
        <div className="print-hide print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
              <FileSpreadsheet size={12} className="text-blue-500" />
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{isEs ? "Auditoría y Exportación" : "Audit & Export"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-titles dark:text-foreground">
                {isEs ? "Reportes y Estados de Cuenta" : "Financial Reports & Statements"}
              </h1>
              <span className="text-[11px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {reportReference}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isEs
                ? "Configura el período exacto y exporta en PDF oficial, libro de Excel (.xlsx) o archivo CSV."
                : "Configure your date range and export as an official PDF, Excel workbook (.xlsx), or CSV."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {/* PDF / Print Button */}
            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 h-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
              title={isEs ? "Imprimir o Guardar como PDF" : "Print or Save as PDF"}
            >
              <Printer size={15} />
              <span>{isEs ? "PDF / Imprimir" : "PDF / Print"}</span>
            </button>

            {/* Excel (.xlsx) Button */}
            <button
              onClick={handleExportExcel}
              disabled={loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
              title={isEs ? "Exportar a libro de Excel (.xlsx)" : "Export to Excel workbook (.xlsx)"}
            >
              <FileSpreadsheet size={15} />
              <span>Excel (.xlsx)</span>
            </button>

            {/* CSV (.csv) Button */}
            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-3.5 h-10 rounded-xl bg-card text-foreground border border-border/80 hover:bg-accent hover:text-foreground font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
              title={isEs ? "Descargar archivo CSV estructurado" : "Download structured CSV file"}
            >
              <FileDown size={15} className="text-muted-foreground" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States for Screen */}
        {loading && (
          <div className="print-hide print:hidden">
            <PageLoadingState message={isEs ? "Cargando libro contable..." : "Loading financial records..."} />
          </div>
        )}

        {error && !loading && (
          <div className="print-hide print:hidden p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchReportData()}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
            >
              {isEs ? "Reintentar" : "Retry"}
            </button>
          </div>
        )}

        {/* Configuration Toolbar Card (Screen Only) */}
        {!loading && (
          <div className="print-hide print:hidden p-4 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            {/* Row 1: Date Range Presets & Interactive Popover */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1 w-full sm:w-auto mb-1 sm:mb-0">
                  <CalendarIcon size={14} className="text-blue-500" />
                  {isEs ? "Período:" : "Period:"}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("this_month")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                    preset === "this_year"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {isEs ? "Año en Curso" : "Current Year"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
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
                      <CalendarIcon size={14} className={preset === "custom" ? "text-white" : "text-blue-600 dark:text-blue-400"} />
                      <span className="truncate">{periodLabel}</span>
                    </div>
                    <ChevronDown size={14} className="opacity-60 ml-1 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
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
                      className="px-4 py-1.5 rounded-xl bg-action hover:bg-action/90 text-white text-xs font-bold cursor-pointer transition shadow-xs"
                    >
                      {isEs ? "Aplicar Fechas" : "Apply Dates"}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Row 2: Inclusions Toggles */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-border/50">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1 w-full sm:w-auto mb-1 sm:mb-0">
                <SlidersHorizontal size={13} className="text-blue-500" />
                {isEs ? "Secciones a Incluir:" : "Include Sections:"}
              </span>

              {/* Summary Toggle */}
              <button
                type="button"
                onClick={() => setIncludeSummary(!includeSummary)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
                  includeSummary
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-semibold"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                    includeSummary ? "bg-blue-600 text-white" : "border border-muted-foreground/40"
                  }`}
                >
                  {includeSummary && <Check size={11} strokeWidth={3} />}
                </span>
                <span>{isEs ? "Estado de Flujo y Resumen" : "Cash Flow Summary"}</span>
              </button>

              {/* Expenses List Toggle */}
              <button
                type="button"
                onClick={() => setIncludeExpensesList(!includeExpensesList)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
                  includeExpensesList
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                    includeExpensesList ? "bg-rose-600 text-white" : "border border-muted-foreground/40"
                  }`}
                >
                  {includeExpensesList && <Check size={11} strokeWidth={3} />}
                </span>
                <span>
                  {isEs ? "Detalle de Cada Gasto" : "Every Expense"} ({filteredExpenses.length})
                </span>
              </button>

              {/* Incomes List Toggle */}
              <button
                type="button"
                onClick={() => setIncludeIncomesList(!includeIncomesList)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
                  includeIncomesList
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                    includeIncomesList ? "bg-emerald-600 text-white" : "border border-muted-foreground/40"
                  }`}
                >
                  {includeIncomesList && <Check size={11} strokeWidth={3} />}
                </span>
                <span>
                  {isEs ? "Detalle de Cada Ingreso" : "Every Income"} ({filteredIncomes.length})
                </span>
              </button>

              {/* Goals Toggle */}
              <button
                type="button"
                onClick={() => setIncludeGoals(!includeGoals)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
                  includeGoals
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                    includeGoals ? "bg-amber-600 text-white" : "border border-muted-foreground/40"
                  }`}
                >
                  {includeGoals && <Check size={11} strokeWidth={3} />}
                </span>
                <span>
                  {isEs ? "Metas de Ahorro" : "Savings Goals"} ({goals.length})
                </span>
              </button>

              {/* Notes Toggle */}
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition cursor-pointer ${
                  showNotes || notes.trim()
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
                }`}
              >
                <span>{showNotes ? "✕" : "✍"}</span>
                <span>{isEs ? "Observaciones Contables" : "Accounting Notes"}</span>
              </button>
            </div>

            {/* Collapsible Notes Textarea */}
            {showNotes && (
              <div className="pt-2">
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                <span className="whitespace-nowrap">
                  {isEs ? "Ingresos:" : "Income:"}{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +{currencySymbol}{formatCurrency(totalIncome)}
                  </strong>
                </span>
                <span className="hidden sm:inline text-border/80">•</span>
                <span className="whitespace-nowrap">
                  {isEs ? "Egresos:" : "Expenses:"}{" "}
                  <strong className="text-rose-600 dark:text-rose-400">
                    -{currencySymbol}{formatCurrency(totalExpense)}
                  </strong>
                </span>
                <span className="hidden sm:inline text-border/80">•</span>
                <span className="whitespace-nowrap">
                  {isEs ? "Saldo:" : "Balance:"}{" "}
                  <strong
                    className={netSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
                  >
                    {netSavings < 0
                      ? `-${currencySymbol}${formatCurrency(Math.abs(netSavings))}`
                      : `+${currencySymbol}${formatCurrency(netSavings)}`}
                  </strong>
                </span>
              </div>

              <div className="text-muted-foreground text-[11px] sm:text-xs">
                {filteredExpenses.length + filteredIncomes.length} {isEs ? "movimientos en período" : "records in period"}
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Document Canvas Preview & Printable Document */}
        <div className="rounded-2xl bg-slate-200/60 dark:bg-slate-950/60 p-2 sm:p-6 md:p-10 flex justify-center border border-border/60 shadow-inner print:p-0 print:m-0 print:bg-transparent print:border-none print:shadow-none print:rounded-none print:block overflow-hidden">
          {/* Printable Official Financial Document */}
          <div
            id="printable-financial-report"
            className="w-full max-w-[850px] bg-white text-slate-900 border border-slate-300/80 shadow-2xl rounded-sm p-4 sm:p-8 md:p-12 font-sans text-xs sm:text-sm leading-normal transition-all print:p-0 print:m-0 print:max-w-none print:border-none print:shadow-none print:rounded-none print:w-full"
          >
            {/* Header: Corporate Branding & Technical Audit Box */}
            <div className="report-section pb-5 sm:pb-6 border-b-2 border-slate-400 mb-5 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
                {/* Left: Brand Identity */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <BrandLogo size={36} priority />
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                        FinTrack
                      </h1>
                      <p className="text-[9px] sm:text-[10px] tracking-widest font-bold text-slate-500 uppercase">
                        {isEs
                          ? "Control Financiero y Gestión Patrimonial"
                          : "Asset Management & Financial Accounting"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-3">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight uppercase">
                      {isEs
                        ? "Estado de Cuenta y Rendición de Fondos"
                        : "Official Statement of Operations"}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      {isEs
                        ? "Informe consolidado de ingresos percibidos, egresos y posiciones de ahorro."
                        : "Consolidated financial ledger of inflows, outflows, and capital targets."}
                    </p>
                  </div>
                </div>

                {/* Right: Technical Accounting Badge */}
                <div className="sm:text-right border border-slate-300 bg-slate-50 p-2.5 sm:p-3 rounded-lg text-xs space-y-1 shrink-0 font-mono">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {isEs ? "Referencia Contable" : "Audit Reference"}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    {reportReference}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-600">
                    {isEs ? "Emisión:" : "Issued:"} {generatedAt}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-semibold text-blue-800 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded inline-block">
                    {isEs ? "REGISTRO OFICIAL" : "OFFICIAL RECORD"}
                  </div>
                </div>
              </div>

              {/* Technical Account Holder & Range Grid */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                    {isEs ? "Titular de Cuenta" : "Account Holder"}
                  </span>
                  <span className="font-semibold text-slate-800 break-words block">
                    {user?.user_metadata?.full_name ||
                      user?.email?.split("@")[0] ||
                      (isEs ? "Titular FinTrack" : "Account Holder")}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                    {isEs ? "Correo Electrónico" : "Email"}
                  </span>
                  <span className="font-mono text-slate-700 break-words block">
                    {user?.email || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                    {isEs ? "Período Consultado" : "Consulted Period"}
                  </span>
                  <span className="font-semibold text-slate-800 break-words block">
                    {periodLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Statement of Operations (Summary) */}
            {includeSummary && (
              <div className="report-section mb-7">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {isEs
                      ? "I. RESUMEN EJECUTIVO Y FLUJO NETO DEL PERÍODO"
                      : "I. EXECUTIVE SUMMARY & NET CASH FLOW"}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {periodLabel}
                  </span>
                </div>

                <div className="overflow-x-auto print:overflow-visible -mx-2 px-2 sm:mx-0 sm:px-0">
                  <table className="w-full text-xs border-collapse min-w-[460px] sm:min-w-0">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-y border-slate-300">
                        <th className="py-2 px-3 text-left">
                          {isEs ? "Concepto Contable" : "Ledger Concept"}
                        </th>
                        <th className="py-2 px-3 text-center w-32">
                          {isEs ? "N° Operaciones" : "Tx Count"}
                        </th>
                        <th className="py-2 px-3 text-right w-44">
                          {isEs ? "Importe Consolidado" : "Consolidated Amount"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                          <ArrowDownRight size={14} className="text-emerald-600 shrink-0" />
                          <span>
                            {isEs
                              ? "(+) Total Ingresos y Abonos Percibidos"
                              : "(+) Gross Incomes & Received Funds"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {filteredIncomes.length}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          +{currencySymbol}{formatCurrency(totalIncome)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                          <ArrowUpRight size={14} className="text-rose-600 shrink-0" />
                          <span>
                            {isEs
                              ? "(-) Total Egresos y Gastos Realizados"
                              : "(-) Gross Outflows & Expenses"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {filteredExpenses.length}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                          -{currencySymbol}{formatCurrency(totalExpense)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-b-2 border-slate-400 bg-slate-50 font-bold">
                        <td className="py-2.5 px-3 text-slate-900 uppercase">
                          {isEs ? "(=) Superávit / Déficit Operativo Neto" : "(=) Net Financial Balance"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                          {savingsRate.toFixed(1)}% {isEs ? "margen ahorro" : "saving rate"}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono text-sm ${
                            netSavings >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {netSavings < 0
                            ? `-${currencySymbol}${formatCurrency(Math.abs(netSavings))}`
                            : `+${currencySymbol}${formatCurrency(netSavings)}`}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Itemized Individual Expenses (CADA TRANSACCIÓN) */}
            {includeExpensesList && (
              <div className="report-section mb-7">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {isEs
                      ? "II. DETALLE DESGLOSADO DE EGRESOS (CADA TRANSACCIÓN)"
                      : "II. ITEMIZED EXPENSES LEDGER (EVERY TRANSACTION)"}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {filteredExpenses.length} {isEs ? "transacciones" : "transactions"}
                  </span>
                </div>

                {filteredExpenses.length === 0 ? (
                  <div className="py-3 text-center border border-dashed border-slate-300 rounded text-slate-500 text-xs">
                    {isEs
                      ? "No se registran operaciones de egreso en el período seleccionado."
                      : "No expense records registered in this consulted period."}
                  </div>
                ) : (
                  <div className="overflow-x-auto print:overflow-visible -mx-2 px-2 sm:mx-0 sm:px-0">
                    <table className="w-full text-xs border-collapse min-w-[480px] sm:min-w-0">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-y border-slate-300">
                          <th className="py-2 px-3 text-left w-24">
                            {isEs ? "Fecha" : "Date"}
                          </th>
                          <th className="py-2 px-3 text-left">
                            {isEs ? "Concepto / Descripción" : "Description / Concept"}
                          </th>
                          <th className="py-2 px-3 text-left w-32">
                            {isEs ? "Categoría" : "Category"}
                          </th>
                          <th className="py-2 px-3 text-left w-32 hidden sm:table-cell">
                            {isEs ? "Medio Pago" : "Payment Method"}
                          </th>
                          <th className="py-2 px-3 text-right w-28">
                            {isEs ? "Importe" : "Amount"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredExpenses.map((exp, idx) => (
                          <tr
                            key={exp.id || idx}
                            className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                          >
                            <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                              {formatDateDisplay(exp.date)}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {exp.description || (isEs ? "Sin descripción" : "No concept")}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/80 text-slate-700">
                                {translateCategory(exp.category)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                              {translatePaymentMethod(exp.payment_method)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700 whitespace-nowrap">
                              -{currencySymbol}{formatCurrency(exp.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-b-2 border-slate-400 font-bold bg-slate-50">
                          <td colSpan={3} className="py-2.5 px-3 text-slate-900 uppercase font-black">
                            {isEs
                              ? `Total Egresos (${filteredExpenses.length} transacciones)`
                              : `Total Outflows (${filteredExpenses.length} transactions)`}
                          </td>
                          <td className="hidden sm:table-cell"></td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-700 text-xs font-black whitespace-nowrap">
                            -{currencySymbol}{formatCurrency(totalExpense)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. Itemized Individual Incomes (CADA TRANSACCIÓN) */}
            {includeIncomesList && (
              <div className="report-section mb-7">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {isEs
                      ? "III. DETALLE DESGLOSADO DE INGRESOS (CADA TRANSACCIÓN)"
                      : "III. ITEMIZED INCOMES LEDGER (EVERY TRANSACTION)"}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {filteredIncomes.length} {isEs ? "transacciones" : "transactions"}
                  </span>
                </div>

                {filteredIncomes.length === 0 ? (
                  <div className="py-3 text-center border border-dashed border-slate-300 rounded text-slate-500 text-xs">
                    {isEs
                      ? "No se registran abonos o ingresos en el período seleccionado."
                      : "No income records registered in this consulted period."}
                  </div>
                ) : (
                  <div className="overflow-x-auto print:overflow-visible -mx-2 px-2 sm:mx-0 sm:px-0">
                    <table className="w-full text-xs border-collapse min-w-[480px] sm:min-w-0">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-y border-slate-300">
                          <th className="py-2 px-3 text-left w-24">
                            {isEs ? "Fecha" : "Date"}
                          </th>
                          <th className="py-2 px-3 text-left">
                            {isEs ? "Concepto / Descripción" : "Description / Concept"}
                          </th>
                          <th className="py-2 px-3 text-left w-32">
                            {isEs ? "Origen / Fuente" : "Source"}
                          </th>
                          <th className="py-2 px-3 text-left w-32 hidden sm:table-cell">
                            {isEs ? "Medio Acreditación" : "Method"}
                          </th>
                          <th className="py-2 px-3 text-right w-28">
                            {isEs ? "Importe" : "Amount"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredIncomes.map((inc, idx) => (
                          <tr
                            key={inc.id || idx}
                            className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                          >
                            <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                              {formatDateDisplay(inc.date)}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {inc.description || (isEs ? "Abono a cuenta" : "Deposit")}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                {translateSource(inc.source)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px] hidden sm:table-cell">
                              {translatePaymentMethod(inc.payment_method)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                              +{currencySymbol}{formatCurrency(inc.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-b-2 border-slate-400 font-bold bg-slate-50">
                          <td colSpan={3} className="py-2.5 px-3 text-slate-900 uppercase font-black">
                            {isEs
                              ? `Total Ingresos (${filteredIncomes.length} transacciones)`
                              : `Total Inflows (${filteredIncomes.length} transactions)`}
                          </td>
                          <td className="hidden sm:table-cell"></td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-xs font-black whitespace-nowrap">
                            +{currencySymbol}{formatCurrency(totalIncome)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 4. Capital Goals Balance Sheet */}
            {includeGoals && goals.length > 0 && (
              <div className="report-section mb-7">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {isEs
                      ? "IV. BALANCE DE OBJETIVOS FINANCIEROS Y METAS DE AHORRO"
                      : "IV. CAPITAL GOALS & SAVINGS STATUS"}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {goals.length} {isEs ? "metas registradas" : "recorded goals"}
                  </span>
                </div>

                <div className="overflow-x-auto print:overflow-visible -mx-2 px-2 sm:mx-0 sm:px-0">
                  <table className="w-full text-xs border-collapse min-w-[500px] sm:min-w-0">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-y border-slate-300">
                        <th className="py-2 px-3 text-left">
                          {isEs ? "Objetivo / Meta" : "Goal Target"}
                        </th>
                        <th className="py-2 px-3 text-right">
                          {isEs ? "Fondo Actual" : "Current Fund"}
                        </th>
                        <th className="py-2 px-3 text-right">
                          {isEs ? "Meta Proyectada" : "Target Cap"}
                        </th>
                        <th className="py-2 px-3 text-center">
                          {isEs ? "Progreso" : "Status"}
                        </th>
                        <th className="py-2 px-3 text-right">
                          {isEs ? "Remanente" : "Remaining"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {goals.map((g, idx) => {
                        const pct =
                          g.target_amount > 0
                            ? (g.current_amount / g.target_amount) * 100
                            : 0;
                        const rem = Math.max(0, g.target_amount - g.current_amount);
                        const isDone = g.current_amount >= g.target_amount;
                        return (
                          <tr
                            key={g.id || idx}
                            className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                          >
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {g.name}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {currencySymbol}{formatCurrency(g.current_amount)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {currencySymbol}{formatCurrency(g.target_amount)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isDone ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {isEs ? "100% CUMPLIDA" : "COMPLETED"}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-700 font-bold text-[11px]">
                                  {pct.toFixed(1)}%
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500">
                              {rem > 0
                                ? `${currencySymbol}${formatCurrency(rem)}`
                                : "---"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Observations & Remarks */}
            {notes.trim() && (
              <div className="report-section mb-7 p-3.5 bg-slate-50 border-l-4 border-blue-600 text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  {isEs ? "V. OBSERVACIONES Y NOTAS ACLARATORIAS" : "V. AUDITOR REMARKS & DISCLOSURES"}
                </div>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {notes}
                </p>
              </div>
            )}

            {/* Official Certification Footer */}
            <div className="report-section pt-5 mt-8 border-t border-slate-300 text-slate-500 text-[10px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="space-y-1 max-w-md">
                  <p className="font-bold text-slate-800 uppercase tracking-wider">
                    {isEs
                      ? "Certificación de Movimientos y Rendición de Cuentas"
                      : "Statement Certification & Integrity"}
                  </p>
                  <p className="leading-relaxed text-slate-500">
                    {isEs
                      ? "Este estado de cuenta ha sido consolidado de forma automatizada y cifrada a partir de los registros provistos por el titular en la plataforma FinTrack. Documento privado para uso exclusivo de control contable y patrimonial."
                      : "This financial statement has been consolidated automatically and securely from records provided by the account holder in FinTrack. Private document for accounting and asset management purposes."}
                  </p>
                </div>

                <div className="text-right font-mono shrink-0">
                  <div className="flex items-center justify-end gap-1 text-slate-700 font-bold mb-1">
                    <ShieldCheck size={14} className="text-blue-600" />
                    <span>{isEs ? "DOCUMENTO CERTIFICADO" : "CERTIFIED REPORT"}</span>
                  </div>
                  <p className="text-[9px] text-slate-400">
                    REF: {reportReference} • {isEs ? "EMISIÓN:" : "ISSUED:"} {generatedAt}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    FinTrack Systems © 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
