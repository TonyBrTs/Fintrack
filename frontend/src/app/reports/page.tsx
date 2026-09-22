"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { safeFetch } from "@/lib/api";
import { translations } from "@/lib/translations";
import type { Expense, Income, Goal } from "@/types/index";
import type { DateRange } from "react-day-picker";
import { PageLoadingState } from "@/components/ui/PageLoadingState";
import { exportFinancialReportExcel } from "@/lib/excelExport";
import { formatDateDDMMYYYY } from "@/lib/utils";
import { toast } from "sonner";
import { AlertCircle, RotateCcw } from "lucide-react";
import {
  ReportHeaderActions,
  ReportFilters,
  AccountStatementDocument,
  type PeriodPreset,
} from "@/components/reports";

/**
 * Safely parses any date string or Date object to a local Date instance
 * normalized at midday (12:00:00) to prevent UTC midnight rollback.
 */
function parseLocalDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  if (!d) return new Date();
  if (typeof d === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [year, month, day] = d.split("-").map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export default function ReportsPage() {
  const { currency, currencySymbol, language } = useSettings();
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
      .sort(
        (a, b) =>
          parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
      );
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
      .sort(
        (a, b) =>
          parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
      );
  }, [incomes, dateRange]);

  // Aggregates
  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, e) => acc + (Number(e.amount) || 0),
      0
    );
  }, [filteredExpenses]);

  const totalIncome = useMemo(() => {
    return filteredIncomes.reduce(
      (acc, i) => acc + (Number(i.amount) || 0),
      0
    );
  }, [filteredIncomes]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Period label for statement
  const periodLabel = useMemo(() => {
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      return isEs
        ? "Histórico Completo (Todo el Registro)"
        : "All Historical Records";
    }

    if (dateRange.from && dateRange.to) {
      return `${formatDateDDMMYYYY(dateRange.from)} — ${formatDateDDMMYYYY(dateRange.to)}`;
    }
    if (dateRange.from) {
      return formatDateDDMMYYYY(dateRange.from);
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
    const now = new Date();
    const datePart = formatDateDDMMYYYY(now);
    const timePart = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${datePart} ${timePart}`;
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatDateDisplay = (d: Date | string) => {
    return formatDateDDMMYYYY(d);
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
        currencyCode: currency,
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

      combined.sort(
        (a, b) =>
          parseLocalDate(b.rawDate).getTime() -
          parseLocalDate(a.rawDate).getTime()
      );

      const escapeCSV = (val: string | number) => {
        const str = String(val ?? "");
        if (
          str.includes(",") ||
          str.includes('"') ||
          str.includes("\n") ||
          str.includes("\r")
        ) {
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
            currency,
          ]
            .map(escapeCSV)
            .join(",")
        ),
      ];

      const blob = new Blob([csvLines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FinTrack-LibroContable-${reportReference}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        isEs
          ? "Libro contable CSV descargado con éxito."
          : "CSV transaction ledger downloaded."
      );
    } catch (err) {
      console.error(err);
      toast.error(
        isEs
          ? "No se pudo generar el archivo CSV."
          : "Could not generate CSV file."
      );
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 print:p-0 print:m-0 print:max-w-none">
        {/* Header and Export Action Buttons */}
        <ReportHeaderActions
          reportReference={reportReference}
          isEs={isEs}
          onPrint={handlePrint}
          onExportExcel={handleExportExcel}
          onExportCSV={handleExportCSV}
        />

        {/* Global Loading Spinner */}
        {loading && (
          <PageLoadingState
            message={
              isEs
                ? "Cargando libro contable..."
                : "Loading financial records..."
            }
          />
        )}

        {/* Error Alert Box */}
        {error && !loading && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-center justify-between text-destructive text-sm print:hidden">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchReportData()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 transition cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>{isEs ? "Reintentar" : "Retry"}</span>
            </button>
          </div>
        )}

        {/* Filters and Inclusion Toggles Bar */}
        {!loading && (
          <ReportFilters
            preset={preset}
            setPreset={setPreset}
            handleSelectPreset={handleSelectPreset}
            dateRange={dateRange}
            setDateRange={setDateRange}
            isCalendarOpen={isCalendarOpen}
            setIsCalendarOpen={setIsCalendarOpen}
            periodLabel={periodLabel}
            includeSummary={includeSummary}
            setIncludeSummary={setIncludeSummary}
            includeExpensesList={includeExpensesList}
            setIncludeExpensesList={setIncludeExpensesList}
            includeIncomesList={includeIncomesList}
            setIncludeIncomesList={setIncludeIncomesList}
            includeGoals={includeGoals}
            setIncludeGoals={setIncludeGoals}
            showNotes={showNotes}
            setShowNotes={setShowNotes}
            notes={notes}
            setNotes={setNotes}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netSavings={netSavings}
            currencySymbol={currencySymbol}
            filteredExpensesCount={filteredExpenses.length}
            filteredIncomesCount={filteredIncomes.length}
            goalsCount={goals.length}
            isEs={isEs}
          />
        )}

        {/* Dedicated Document Canvas Preview & Printable Document */}
        <AccountStatementDocument
          reportReference={reportReference}
          generatedAt={generatedAt}
          periodLabel={periodLabel}
          user={user}
          currencySymbol={currencySymbol}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netSavings={netSavings}
          savingsRate={savingsRate}
          filteredExpenses={filteredExpenses}
          filteredIncomes={filteredIncomes}
          goals={goals}
          includeSummary={includeSummary}
          includeExpensesList={includeExpensesList}
          includeIncomesList={includeIncomesList}
          includeGoals={includeGoals}
          notes={notes}
          formatDateDisplay={formatDateDisplay}
          translateCategory={translateCategory}
          translateSource={translateSource}
          translatePaymentMethod={translatePaymentMethod}
          isEs={isEs}
        />
      </div>
    </ProtectedRoute>
  );
}
