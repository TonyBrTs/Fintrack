"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { formatCurrency } from "@/lib/utils";
import type { Expense, Income, Goal } from "@/types/index";
import {
  Printer,
  X,
  Calendar,
  Wallet,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  incomes: Income[];
  goals: Goal[];
  initialMonth?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  expenses,
  incomes,
  goals,
  initialMonth,
}: ReportModalProps) {
  const { currencySymbol, translate, language } = useSettings();
  const { user } = useAuth();

  const isEs = language === "es";

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (initialMonth) return initialMonth;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [includeGoals, setIncludeGoals] = useState(true);

  // Generate month options
  const monthOptions = useMemo(() => {
    const options = [
      { value: "all", label: isEs ? "Histórico Completo (Todo el tiempo)" : "All Time" },
    ];
    const date = new Date();
    for (let i = 0; i < 18; i++) {
      const val = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString(isEs ? "es-ES" : "en-US", {
        month: "long",
        year: "numeric",
      });
      options.push({
        value: val,
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      });
      date.setMonth(date.getMonth() - 1);
    }
    return options;
  }, [isEs]);

  // Filtered data based on selectedMonth
  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;
    return expenses.filter((e) => {
      const d = new Date(e.date);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return m === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  const filteredIncomes = useMemo(() => {
    if (selectedMonth === "all") return incomes;
    return incomes.filter((i) => {
      const d = new Date(i.date);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return m === selectedMonth;
    });
  }, [incomes, selectedMonth]);

  // Financial aggregates
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );
  const totalIncomes = useMemo(
    () => filteredIncomes.reduce((sum, i) => sum + i.amount, 0),
    [filteredIncomes]
  );
  const balance = totalIncomes - totalExpenses;
  const savingsRate =
    totalIncomes > 0 ? Math.max(0, (balance / totalIncomes) * 100) : 0;

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || (isEs ? "Otros" : "Others");
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += e.amount;
      map[cat].count += 1;
    });
    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        percent: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totalExpenses, isEs]);

  // Breakdown by source
  const sourceBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filteredIncomes.forEach((i) => {
      const src = i.source || (isEs ? "Otros" : "Others");
      if (!map[src]) map[src] = { total: 0, count: 0 };
      map[src].total += i.amount;
      map[src].count += 1;
    });
    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        percent: totalIncomes > 0 ? (data.total / totalIncomes) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredIncomes, totalIncomes, isEs]);

  const emissionDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(isEs ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [isEs]);

  const periodLabel = useMemo(() => {
    if (selectedMonth === "all") {
      return isEs ? "Histórico Consolidado" : "Consolidated History";
    }
    const [year, month] = selectedMonth.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    const mName = d.toLocaleDateString(isEs ? "es-ES" : "en-US", {
      month: "long",
      year: "numeric",
    });
    return mName.charAt(0).toUpperCase() + mName.slice(1);
  }, [selectedMonth, isEs]);

  const handlePrint = () => {
    window.print();
  };

  const userName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    (isEs ? "Usuario FinTrack" : "FinTrack User");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl! w-[95vw]! max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-100 dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Reporte Financiero</DialogTitle>
          <DialogDescription>
            Estado de cuenta y reporte financiero en formato descargable e imprimible PDF.
          </DialogDescription>
        </DialogHeader>

        {/* Top Control Toolbar (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white/95 dark:bg-[#0f172a]/95 border-b border-slate-200 dark:border-slate-800 print-hide shrink-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {isEs ? "Generador de Reporte Financiero" : "Financial Report Generator"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEs ? "Vista previa en alta resolución lista para PDF" : "High-res printable PDF preview"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Period Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/70 text-xs font-semibold">
              <Calendar size={14} className="text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Seleccionar período del reporte"
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer pr-1"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Include Goals Toggle */}
            <label className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none px-2">
              <input
                type="checkbox"
                checked={includeGoals}
                onChange={(e) => setIncludeGoals(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>{isEs ? "Incluir Metas" : "Include Goals"}</span>
            </label>

            {/* Print / Download Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>{isEs ? "Descargar PDF / Imprimir" : "Download PDF / Print"}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Cerrar modal de reporte"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-200/60 dark:bg-[#060911]/80">
          {/* A4 Document Paper Sheet Container */}
          <div
            id="printable-financial-report"
            className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl max-w-3xl mx-auto border border-slate-200 font-sans"
          >
            {/* Document Header */}
            <div className="flex justify-between items-start pb-6 border-b border-slate-200 gap-4 report-section">
              <div className="flex items-center gap-3">
                <BrandLogo size={46} priority />
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    FinTrack
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {isEs ? "Control & Gestión Financiera Inteligente" : "Smart Financial Management"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  {isEs ? "Reporte Oficial" : "Official Report"}
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {periodLabel}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isEs ? "Emitido el" : "Generated on"} {emissionDate}
                </p>
              </div>
            </div>

            {/* User & Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 my-5 bg-slate-50 rounded-xl px-4 border border-slate-100 text-xs report-section">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {isEs ? "Titular" : "Account Holder"}
                </p>
                <p className="font-bold text-slate-800 truncate mt-0.5">{userName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {isEs ? "Correo Registrado" : "Account Email"}
                </p>
                <p className="font-semibold text-slate-600 truncate mt-0.5">
                  {user?.email || "usuario@fintrack.app"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {isEs ? "Moneda Principal" : "Base Currency"}
                </p>
                <p className="font-bold text-slate-800 mt-0.5">{currencySymbol} ({isEs ? "Personalizada" : "Custom"})</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {isEs ? "Estado del Período" : "Period Status"}
                </p>
                <p className={`font-bold mt-0.5 ${balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {balance >= 0 ? (isEs ? "Superávit Financiero" : "Surplus") : (isEs ? "Déficit Temporal" : "Deficit")}
                </p>
              </div>
            </div>

            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 report-section">
              {/* Balance */}
              <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                  <Wallet size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {translate("summary.balance") || "Saldo Total"}
                  </span>
                </div>
                <p className={`text-lg font-black tracking-tight ${balance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                  {currencySymbol}{formatCurrency(balance)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {balance >= 0 ? (isEs ? "Balance a favor" : "Positive balance") : (isEs ? "Mayor a ingresos" : "Negative balance")}
                </p>
              </div>

              {/* Incomes */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white">
                <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                  <TrendingUp size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {translate("summary.income") || "Ingresos"}
                  </span>
                </div>
                <p className="text-lg font-black text-emerald-600 tracking-tight">
                  +{currencySymbol}{formatCurrency(totalIncomes)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {filteredIncomes.length} {isEs ? "movimientos" : "entries"}
                </p>
              </div>

              {/* Expenses */}
              <div className="p-4 rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50/40 to-white">
                <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                  <TrendingDown size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {translate("summary.expenses") || "Gastos"}
                  </span>
                </div>
                <p className="text-lg font-black text-rose-600 tracking-tight">
                  -{currencySymbol}{formatCurrency(totalExpenses)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {filteredExpenses.length} {isEs ? "registros" : "records"}
                </p>
              </div>

              {/* Savings Rate */}
              <div className="p-4 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/40 to-white">
                <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                  <PiggyBank size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {translate("summary.savings") || "Ahorro"}
                  </span>
                </div>
                <p className="text-lg font-black text-amber-600 tracking-tight">
                  {savingsRate.toFixed(1)}%
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isEs ? "De tus ingresos" : "Of income"}
                </p>
              </div>
            </div>

            {/* Expenses by Category Table */}
            <div className="mb-6 report-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {isEs ? "Desglose de Gastos por Categoría" : "Expenses by Category"}
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {filteredExpenses.length} {isEs ? "transacciones" : "transactions"}
                </span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  {isEs ? "Sin gastos registrados para este período." : "No expenses recorded for this period."}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">{isEs ? "Categoría" : "Category"}</th>
                        <th className="py-2.5 px-3 text-center">{isEs ? "Movimientos" : "Count"}</th>
                        <th className="py-2.5 px-3 text-right">{isEs ? "Incidencia" : "Share"}</th>
                        <th className="py-2.5 px-3 text-right">{isEs ? "Total Gastado" : "Total Amount"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryBreakdown.map((cat) => (
                        <tr key={cat.name} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {translate(`categories.${cat.name}`) || cat.name}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500">{cat.count}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[11px] font-semibold text-slate-600">
                                {cat.percent.toFixed(1)}%
                              </span>
                              <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${cat.percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {currencySymbol}{formatCurrency(cat.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Income Sources Table */}
            <div className="mb-6 report-section">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {isEs ? "Distribución de Ingresos por Fuente" : "Income Distribution by Source"}
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {filteredIncomes.length} {isEs ? "entradas" : "entries"}
                </span>
              </div>

              {sourceBreakdown.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  {isEs ? "Sin ingresos registrados para este período." : "No income recorded for this period."}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">{isEs ? "Fuente" : "Source"}</th>
                        <th className="py-2.5 px-3 text-center">{isEs ? "Cobros" : "Entries"}</th>
                        <th className="py-2.5 px-3 text-right">{isEs ? "Participación" : "Share"}</th>
                        <th className="py-2.5 px-3 text-right">{isEs ? "Total Ingresado" : "Total Amount"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sourceBreakdown.map((src) => (
                        <tr key={src.name} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {translate(`sources.${src.name}`) || src.name}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500">{src.count}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[11px] font-semibold text-slate-600">
                                {src.percent.toFixed(1)}%
                              </span>
                              <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${src.percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-emerald-600">
                            {currencySymbol}{formatCurrency(src.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Goals Progress Section (Optional) */}
            {includeGoals && goals.length > 0 && (
              <div className="mb-6 report-section">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {isEs ? "Estado de Metas de Ahorro" : "Savings Goals Status"}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    {goals.length} {isEs ? "metas activas" : "active goals"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goals.map((goal) => {
                    const pct = goal.target_amount > 0
                      ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
                      : 0;
                    const remaining = Math.max(0, goal.target_amount - goal.current_amount);
                    const isCompleted = goal.current_amount >= goal.target_amount;

                    return (
                      <div
                        key={goal.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-xs text-slate-800 truncate">{goal.name}</p>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 size={10} />
                              {isEs ? "Cumplida" : "Completed"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600">
                              {pct.toFixed(0)}%
                            </span>
                          )}
                        </div>

                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-1.5">
                          <div
                            className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>
                            {isEs ? "Ahorrado" : "Saved"}: <strong>{currencySymbol}{formatCurrency(goal.current_amount)}</strong>
                          </span>
                          <span>
                            {isEs ? "Meta" : "Target"}: {currencySymbol}{formatCurrency(goal.target_amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document Official Footer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 report-section">
              <p>
                FinTrack © 2026 • {isEs ? "Documento financiero confidencial generado automáticamente" : "Confidential financial statement"}
              </p>
              <p className="font-mono">
                ID-{Math.random().toString(36).substring(2, 8).toUpperCase()} • {emissionDate}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
