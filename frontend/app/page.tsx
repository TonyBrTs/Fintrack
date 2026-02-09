"use client";

import { KPICard } from "@/components/ui/KPICard";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Loader2,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useState, useEffect } from "react";
import { getApiHeaders } from "@/lib/api";
import type { Expense, Income } from "@/types/index";
import { formatCurrency } from "@/lib/utils";

export default function SummaryPage() {
  const { currencySymbol, translate } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [expensesRes, incomesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`, {
            headers: getApiHeaders(),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incomes`, {
            headers: getApiHeaders(),
          }),
        ]);

        if (expensesRes.ok && incomesRes.ok) {
          const [expensesData, incomesData] = await Promise.all([
            expensesRes.json(),
            incomesRes.json(),
          ]);
          setExpenses(expensesData);
          setIncomes(incomesData);
        }
      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalExpenses = expenses.reduce(
    (acc: number, curr: Expense) => acc + curr.amount,
    0,
  );
  const totalIncomes = incomes.reduce(
    (acc: number, curr: Income) => acc + curr.amount,
    0,
  );
  const balance = totalIncomes - totalExpenses;
  const netSavingPercent =
    totalIncomes > 0 ? (balance / totalIncomes) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-12 h-12 text-action animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* KPI Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <KPICard
          title={translate("summary.balance")}
          amount={`${currencySymbol}${formatCurrency(balance)}`}
          icon={<Wallet size={24} className="text-action" />}
        />
        <KPICard
          title={translate("summary.income")}
          amount={`${currencySymbol}${formatCurrency(totalIncomes)}`}
          icon={<TrendingUp size={24} className="text-action" />}
        />
        <KPICard
          title={translate("summary.expenses")}
          amount={`${currencySymbol}${formatCurrency(totalExpenses)}`}
          icon={<TrendingDown size={24} className="text-action" />}
        />
        <KPICard
          title={translate("summary.savings")}
          amount={`${netSavingPercent.toFixed(1)}%`}
          icon={<PieChart size={24} className="text-action" />}
        />
      </section>
    </div>
  );
}
