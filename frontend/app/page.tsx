"use client";

import { KPICard } from "@/components/ui/KPICard";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Loader2,
  Goal as GoalIcon,
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
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="md:flex md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {translate("nav.summary")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {translate("common.summaryDescription") ||
              "Visualiza tu salud financiera de un vistazo."}
          </p>
        </div>
        <div className="md:w-auto w-full">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-[180px] rounded-xl bg-surface border-border">
              <SelectValue placeholder="Seleccionar mes" />
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title={translate("summary.balance")}
          amount={`${currencySymbol}${formatCurrency(balance)}`}
          icon={<Wallet size={24} className="text-action" />}
        />
        <KPICard
          title={translate("summary.income")}
          amount={`${currencySymbol}${formatCurrency(totalIncomesFiltered)}`}
          icon={<TrendingUp size={24} className="text-income" />}
        />
        <KPICard
          title={translate("summary.expenses")}
          amount={`${currencySymbol}${formatCurrency(totalExpensesFiltered)}`}
          icon={<TrendingDown size={24} className="text-expense" />}
        />
        <KPICard
          title={translate("summary.savings")}
          amount={`${netSavingPercentFiltered.toFixed(1)}%`}
          icon={<PieChart size={24} className="text-action" />}
        />
      </section>

      {/* Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentTransactions
            expenses={filteredExpenses}
            incomes={filteredIncomes}
          />
        </div>

        {/* Goals Progress in Summary */}
        <div className="bg-background p-6 rounded-[32px] border border-border shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-action/10 text-action rounded-xl">
                <GoalIcon size={20} />
              </div>
              <h2 className="text-xl font-bold">{translate("nav.goals")}</h2>
            </div>
            <Link
              href="/metas"
              className="text-xs font-bold text-action hover:underline"
            >
              {translate("nav.goals")} →
            </Link>
          </div>

          {goals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <GoalIcon
                size={40}
                className="text-muted-foreground opacity-20 mb-3"
              />
              <p className="text-sm text-muted-foreground">
                {translate("goals.emptyState")}
              </p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-75 pr-2 custom-scrollbar">
              {goals.slice(0, 3).map((goal) => {
                const progress = Math.min(
                  (goal.current_amount / goal.target_amount) * 100,
                  100,
                );
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-sm truncate max-w-30">
                        {goal.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-action"
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
              {goals.length > 3 && (
                <p className="text-[10px] text-center text-muted-foreground pt-2">
                  + {goals.length - 3} metas más en la página de metas
                </p>
              )}
            </div>
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
