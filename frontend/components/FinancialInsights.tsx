"use client";

import { Expense, Income } from "@/types/index";
import { useSettings } from "@/contexts/SettingsContext";
import { Lightbulb, TrendingDown, Goal, Zap } from "lucide-react";

interface FinancialInsightsProps {
  expenses: Expense[];
  incomes: Income[];
}

export function FinancialInsights({
  expenses,
  incomes,
}: FinancialInsightsProps) {
  const { translate } = useSettings();

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const savingsRate =
    totalIncomes > 0
      ? ((totalIncomes - totalExpenses) / totalIncomes) * 100
      : 0;

  // Get highest expense category
  const categoryTotals = expenses.reduce(
    (acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    },
    {},
  );

  const highestCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const insights = [];

  if (savingsRate > 20) {
    insights.push({
      icon: <Zap className="text-yellow-500" />,
      title: "¡Excelente ahorro!",
      desc: `Estás ahorrando el ${savingsRate.toFixed(1)}% de tus ingresos. Vas por muy buen camino.`,
      color:
        "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800",
    });
  } else if (savingsRate > 0) {
    insights.push({
      icon: <Goal className="text-blue-500" />,
      title: "Meta de ahorro",
      desc: "Intenta llegar al 20% de ahorro mensual para fortalecer tu fondo de emergencia.",
      color:
        "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
    });
  }

  if (highestCategory) {
    insights.push({
      icon: <TrendingDown className="text-red-500" />,
      title: "Gasto principal",
      desc: `Tu mayor gasto es en ${highestCategory[0]}. ¿Podrías reducirlo un 10% el próximo mes?`,
      color: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800",
    });
  }

  if (expenses.length > 10) {
    insights.push({
      icon: <Lightbulb className="text-purple-500" />,
      title: "Tip financiero",
      desc: "Revisa tus suscripciones activas. A veces pagamos por servicios que ya no usamos.",
      color:
        "bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800",
    });
  }

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border h-full">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Lightbulb size={20} className="text-action" />
        {translate("summary.financialInsights")}
      </h3>

      <div className="space-y-4">
        {insights.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Registra más movimientos para obtener consejos personalizados
          </p>
        ) : (
          insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${insight.color}`}
            >
              <div className="flex gap-3">
                <div className="mt-1">{insight.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {insight.desc}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
