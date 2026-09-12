"use client";

import { Expense, Income } from "@/types/index";
import { useSettings } from "@/contexts/SettingsContext";
import { Lightbulb, TrendingDown, Target, Zap, ShieldCheck } from "lucide-react";

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
      icon: <Zap className="text-amber-500" size={18} />,
      title: "¡Excelente tasa de ahorro!",
      desc: `Estás ahorrando el ${savingsRate.toFixed(1)}% de tus ingresos. Superas la meta recomendada del 20%.`,
      badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    });
  } else if (savingsRate > 0) {
    insights.push({
      icon: <Target className="text-blue-500" size={18} />,
      title: "Oportunidad de ahorro",
      desc: "Intenta acercarte al 20% de ahorro mensual para fortalecer tu fondo de tranquilidad y emergencias.",
      badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    });
  } else {
    insights.push({
      icon: <ShieldCheck className="text-rose-500" size={18} />,
      title: "Control de balance",
      desc: "Tus gastos superan o igualan tus ingresos este mes. Revisa gastos prescindibles para equilibrar tus números.",
      badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    });
  }

  if (highestCategory) {
    insights.push({
      icon: <TrendingDown className="text-rose-500" size={18} />,
      title: "Categoría de mayor impacto",
      desc: `Tu mayor egreso es en "${translate(`categories.${highestCategory[0]}`) || highestCategory[0]}". Analizar micro-gastos aquí te dará mayor liquidez.`,
      badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    });
  }

  if (expenses.length > 5) {
    insights.push({
      icon: <Lightbulb className="text-purple-500" size={18} />,
      title: "Optimización de suscripciones",
      desc: "Revisa servicios recurrentes y membresías digitales para evitar cargos inadvertidos.",
      badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    });
  }

  return (
    <div className="bg-card dark:bg-card/75 backdrop-blur-sm p-6 rounded-3xl shadow-card hover:shadow-card-hover border border-slate-200/90 dark:border-border/60 h-full flex flex-col justify-between transition-all">
      <div>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Lightbulb size={18} />
          </div>
          <h3 className="text-base font-bold text-titles dark:text-foreground">
            {translate("summary.financialInsights")}
          </h3>
        </div>

        <div className="space-y-3.5">
          {insights.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              Registra más transacciones para desbloquear recomendaciones financieras inteligentes.
            </p>
          ) : (
            insights.map((insight, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-secondary/50 dark:bg-slate-800/40 border border-border/60 hover:border-border transition-colors flex gap-3.5 items-start"
              >
                <div className={`p-2 rounded-xl border ${insight.badgeClass} shrink-0 mt-0.5`}>
                  {insight.icon}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xs text-titles dark:text-foreground">
                    {insight.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.desc}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
        <span>Consejos basados en tus hábitos</span>
        <span className="font-bold text-action">FinTrack AI</span>
      </div>
    </div>
  );
}
