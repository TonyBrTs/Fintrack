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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/contexts/SettingsContext";
import { useState, useEffect } from "react";
import { getApiHeaders } from "@/lib/api";
import type { Expense, Income, Goal } from "@/types/index";
import { formatCurrency } from "@/lib/utils";
import { SummaryCharts } from "@/components/SummaryCharts";
import { RecentTransactions } from "@/components/RecentTransactions";
import { FinancialInsights } from "@/components/FinancialInsights";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SummaryPage() {
  const { currencySymbol, translate } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [expensesRes, incomesRes, goalsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`, {
            headers: getApiHeaders(),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incomes`, {
            headers: getApiHeaders(),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals`, {
            headers: getApiHeaders(),
          }),
        ]);

        if (expensesRes.ok && incomesRes.ok && goalsRes.ok) {
          const [expensesData, incomesData, goalsData] = await Promise.all([
            expensesRes.json(),
            incomesRes.json(),
            goalsRes.json(),
          ]);
          setExpenses(expensesData);
          setIncomes(incomesData);
          setGoals(goalsData);
        }
      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalExpensesAllTime = expenses.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const totalIncomesAllTime = incomes.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const balance = totalIncomesAllTime - totalExpensesAllTime;

  // Filtering Logic
  const filteredExpenses =
    selectedMonth === "all"
      ? expenses
      : expenses.filter((e) => {
          const d = new Date(e.date);
          const monthKey = `${d.getFullYear()}-${String(
            d.getMonth() + 1,
          ).padStart(2, "0")}`;
          return monthKey === selectedMonth;
        });

  const filteredIncomes =
    selectedMonth === "all"
      ? incomes
      : incomes.filter((i) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-12 h-12 text-action animate-spin opacity-50" />
      </div>
    );
  }

  return (
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

            {goals.length === 0 ? (
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
                {goals.slice(0, 3).map((goal) => {
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

          {goals.length > 3 && (
            <p className="text-[11px] text-center text-muted-foreground pt-4 border-t border-border/40 mt-4">
              + {goals.length - 3} metas activas en tu lista
            </p>
          )}
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-8">
          <SummaryCharts
            expenses={expenses}
            incomes={incomes}
            currentMonthExpenses={filteredExpenses}
          />
        </div>

        {/* Sidebar Column (Insights only now) */}
        <div className="space-y-8">
          <FinancialInsights
            expenses={filteredExpenses}
            incomes={filteredIncomes}
          />
        </div>
      </div>
    </div>
  );
}
