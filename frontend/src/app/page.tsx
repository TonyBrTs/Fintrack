"use client";

import { KPICard } from "@/components/ui/KPICard";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Loader2,
  Goal as GoalIcon,
  Calendar,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import { safeFetch } from "@/lib/api";
import type { Expense, Income, Goal } from "@/types/index";
import { formatCurrency } from "@/lib/utils";
import { SummaryCharts } from "@/components/SummaryCharts";
import { RecentTransactions } from "@/components/RecentTransactions";
import { FinancialInsights } from "@/components/FinancialInsights";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SummaryPage() {
  const { currencySymbol, translate } = useSettings();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [incomes, setIncomes] = useState<Income[] | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const generateMonthOptions = () => {
    const options = [
      { value: "all", label: translate("common.allTime") || "Todo el tiempo" },
    ];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;
      const label = date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
      options.push({
        value,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      });
      date.setMonth(date.getMonth() - 1);
    }
    return options;
  };

  const maxRetries = 4;

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) {
        setRetryAttempt(0);
        setFetchError(null);
      }
      setLoading(true);

      try {
        const [expensesRes, incomesRes, goalsRes] = await Promise.all([
          safeFetch<Expense[]>("/api/expenses", { timeoutMs: 15000 }),
          safeFetch<Income[]>("/api/incomes", { timeoutMs: 15000 }),
          safeFetch<Goal[]>("/api/goals", { timeoutMs: 15000 }),
        ]);

        if (expensesRes.ok && incomesRes.ok) {
          setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
          setIncomes(Array.isArray(incomesRes.data) ? incomesRes.data : []);
          setGoals(Array.isArray(goalsRes.data) ? goalsRes.data : []);
          setFetchError(null);
          setLoading(false);
          setRetryAttempt(0);
          return;
        }

        if (expensesRes.isUnauthorized || incomesRes.isUnauthorized) {
          setFetchError("Tu sesión ha expirado o necesitas iniciar sesión.");
          setLoading(false);
          return;
        }

        // Auto-retry if server is warming up or connection is delayed
        setRetryAttempt((prev) => {
          const next = prev + 1;
          if (next <= maxRetries) {
            setTimeout(() => {
              fetchData(false);
            }, 2500);
          } else {
            setLoading(false);
            setFetchError(
              expensesRes.error ||
                incomesRes.error ||
                "El servidor tardó en responder. Por favor, reintenta la conexión.",
            );
          }
          return next;
        });
      } catch {
        setRetryAttempt((prev) => {
          const next = prev + 1;
          if (next <= maxRetries) {
            setTimeout(() => {
              fetchData(false);
            }, 2500);
          } else {
            setLoading(false);
            setFetchError(
              "No se pudo comunicar con el servidor en este momento.",
            );
          }
          return next;
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setIncomes([]);
      setGoals([]);
      setLoading(false);
      return;
    }

    fetchData(true);
  }, [user, fetchData]);

  const currentExpenses = Array.isArray(expenses) ? expenses : [];
  const currentIncomes = Array.isArray(incomes) ? incomes : [];
  const currentGoals = Array.isArray(goals) ? goals : [];

  const totalExpensesAllTime = currentExpenses.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const totalIncomesAllTime = currentIncomes.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const balance = totalIncomesAllTime - totalExpensesAllTime;

  // Filtering Logic
  const filteredExpenses =
    selectedMonth === "all"
      ? currentExpenses
      : currentExpenses.filter((e) => {
          const d = new Date(e.date);
          const monthKey = `${d.getFullYear()}-${String(
            d.getMonth() + 1,
          ).padStart(2, "0")}`;
          return monthKey === selectedMonth;
        });

  const filteredIncomes =
    selectedMonth === "all"
      ? currentIncomes
      : currentIncomes.filter((i) => {
          const d = new Date(i.date);
          const monthKey = `${d.getFullYear()}-${String(
            d.getMonth() + 1,
          ).padStart(2, "0")}`;
          return monthKey === selectedMonth;
        });

  const totalExpensesFiltered = filteredExpenses.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const totalIncomesFiltered = filteredIncomes.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  const netSavingPercentFiltered =
    totalIncomesFiltered > 0
      ? ((totalIncomesFiltered - totalExpensesFiltered) /
          totalIncomesFiltered) *
        100
      : 0;

  if (loading || (expenses === null && !fetchError)) {
    return (
      <ProtectedRoute>
        <DashboardLoadingState retryAttempt={retryAttempt} />
      </ProtectedRoute>
    );
  }

  if (fetchError && expenses === null) {
    return (
      <ProtectedRoute>
        <DashboardErrorState
          error={fetchError}
          onRetry={() => fetchData(true)}
        />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-titles dark:text-foreground">
              {translate("nav.summary") || "Resumen"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {translate("common.summaryDescription") || "Vista general de tus finanzas y métricas clave"}
            </p>
          </div>
        <div className="sm:w-auto w-full">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-xl bg-card/90 dark:bg-card/75 backdrop-blur-sm border-border/80 shadow-xs font-medium text-sm">
              <div className="flex items-center gap-2 truncate">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Seleccionar mes" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <KPICard
          title={translate("summary.balance")}
          amount={`${currencySymbol}${formatCurrency(balance)}`}
          trend={balance >= 0 ? "Estado óptimo" : "Balance negativo"}
          trendType={balance >= 0 ? "up" : "down"}
          icon={<Wallet size={22} className="text-action dark:text-blue-400" />}
        />
        <KPICard
          title={translate("summary.income")}
          amount={`${currencySymbol}${formatCurrency(totalIncomesFiltered)}`}
          trend={`${filteredIncomes.length} ingresos`}
          trendType="up"
          icon={<TrendingUp size={22} className="text-emerald-500" />}
        />
        <KPICard
          title={translate("summary.expenses")}
          amount={`${currencySymbol}${formatCurrency(totalExpensesFiltered)}`}
          trend={`${filteredExpenses.length} gastos`}
          trendType="down"
          icon={<TrendingDown size={22} className="text-rose-500" />}
        />
        <KPICard
          title={translate("summary.savings")}
          amount={`${netSavingPercentFiltered.toFixed(1)}%`}
          trend={netSavingPercentFiltered >= 20 ? "Excelente" : "Ajustado"}
          trendType={netSavingPercentFiltered >= 20 ? "up" : "neutral"}
          icon={<PieChart size={22} className="text-amber-500" />}
        />
      </section>

      {/* Recent Activity & Goals Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions
            expenses={filteredExpenses}
            incomes={filteredIncomes}
          />
        </div>

        {/* Goals Progress in Summary */}
        <div className="bg-card/90 dark:bg-card/75 backdrop-blur-sm p-6 rounded-3xl border border-border/80 dark:border-border/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <GoalIcon size={18} />
                </div>
                <h2 className="text-base font-bold text-titles dark:text-foreground">
                  {translate("nav.goals")}
                </h2>
              </div>
              <Link
                href="/goals"
                className="text-xs font-bold text-action dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Ver todas →
              </Link>
            </div>

            {currentGoals.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <GoalIcon
                  size={36}
                  className="text-muted-foreground opacity-25 mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  {translate("goals.emptyState") || "No tienes metas registradas"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentGoals.slice(0, 3).map((goal) => {
                  const progress = Math.min(
                    (goal.current_amount / goal.target_amount) * 100,
                    100,
                  );
                  return (
                    <div key={goal.id} className="space-y-1.5 p-3 rounded-2xl bg-secondary/40 border border-border/40">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold truncate max-w-44 text-titles dark:text-foreground">
                          {goal.name}
                        </span>
                        <span className="font-extrabold text-action dark:text-blue-400">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-full"
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>{currencySymbol}{formatCurrency(goal.current_amount)}</span>
                        <span>de {currencySymbol}{formatCurrency(goal.target_amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {currentGoals.length > 3 && (
            <p className="text-[11px] text-center text-muted-foreground pt-4 border-t border-border/40 mt-4">
              + {currentGoals.length - 3} metas activas en tu lista
            </p>
          )}
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-8">
          <SummaryCharts
            expenses={currentExpenses}
            incomes={currentIncomes}
            currentMonthExpenses={filteredExpenses}
          />
        </div>

        {/* Sidebar Column (Insights only now) */}
        <div className="space-y-8">
          <FinancialInsights
            expenses={filteredExpenses}
            incomes={filteredIncomes}
            goals={currentGoals}
          />
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}

function DashboardLoadingState({ retryAttempt }: { retryAttempt: number }) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Floating Modern Synchronization Hero Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white/95 via-blue-50/50 to-indigo-50/40 dark:from-[#0d1322]/90 dark:via-[#090d18]/85 dark:to-blue-950/25 border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl transition-all">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative shrink-0">
            <BrandLogo size={56} className="shadow-lg rounded-2xl animate-pulse" priority />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md border-2 border-white dark:border-[#0d1322]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </span>
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {retryAttempt === 0
                  ? "Sincronizando tus finanzas..."
                  : "Conectando con el servidor seguro..."}
              </h2>
              {retryAttempt > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 animate-pulse">
                  Reintento {retryAttempt} de 4
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              {retryAttempt === 0
                ? "Obteniendo tus gastos, ingresos y metas en tiempo real con cifrado seguro."
                : "El servidor en la nube se está activando desde reposo. Esto puede tardar unos segundos..."}
            </p>
            {/* Animated Progress Bar */}
            <div className="w-full max-w-md h-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-700 animate-pulse"
                style={{
                  width: retryAttempt === 0 ? "40%" : `${Math.min(90, 40 + retryAttempt * 15)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Skeletons with Shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-6 bg-white/80 dark:bg-card/60 border border-slate-200/80 dark:border-border/60 shadow-xs space-y-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="w-10 h-10 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
            </div>
            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-20 bg-slate-200/60 dark:bg-slate-800/60 rounded-md" />
          </div>
        ))}
      </div>

      {/* Grid Bottom Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl p-6 bg-white/80 dark:bg-card/60 border border-slate-200/80 dark:border-border/60 shadow-xs space-y-4 animate-pulse min-h-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border/40">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-14 bg-slate-100/80 dark:bg-slate-800/40 rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-6 bg-white/80 dark:bg-card/60 border border-slate-200/80 dark:border-border/60 shadow-xs space-y-4 animate-pulse min-h-[300px]">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="space-y-3 pt-4">
            <div className="h-20 bg-slate-100/80 dark:bg-slate-800/40 rounded-2xl" />
            <div className="h-20 bg-slate-100/80 dark:bg-slate-800/40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-white/95 dark:bg-[#0d1322]/90 border border-slate-200/90 dark:border-white/10 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <CloudOff size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Servidor en proceso de inicio
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {error}
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95"
          >
            <RefreshCw size={16} />
            Reintentar conexión
          </button>
        </div>
      </div>
    </div>
  );
}

