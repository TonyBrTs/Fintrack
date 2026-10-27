"use client";

import { Expense, Income, Goal } from "@/types/index";
import { useSettings } from "@/contexts/SettingsContext";
import { Lightbulb, TrendingDown, Target, Zap, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

interface FinancialInsightsProps {
  expenses: Expense[];
  incomes: Income[];
  goals?: Goal[];
}

interface InsightItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badgeClass: string;
}

export function FinancialInsights({ expenses, incomes }: FinancialInsightsProps) {
  const { translate, language } = useSettings();
  const isEs = language === "es";

  const genericInsights = useMemo(() => {
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const hasTransactions = expenses.length > 0 || incomes.length > 0;
    const savingsRate =
      totalIncomes > 0 ? ((totalIncomes - totalExpenses) / totalIncomes) * 100 : 0;

    const categoryTotals = expenses.reduce((acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    const list: InsightItem[] = [];

    if (!hasTransactions) {
      return [
        {
          icon: <Target className="text-blue-500" size={18} />,
          title: isEs ? "Regla 50/30/20" : "50/30/20 Rule",
          desc: isEs
            ? "Destina el 50% de tus ingresos a necesidades básicas, 30% a estilo de vida y ahorra al menos el 20% cada mes."
            : "Allocate 50% of your income to needs, 30% to wants, and save at least 20% each month.",
          badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        },
        {
          icon: <ShieldCheck className="text-amber-500" size={18} />,
          title: isEs ? "Fondo de emergencia" : "Emergency fund",
          desc: isEs
            ? "Construye un respaldo equivalente a 3 o 6 meses de tus gastos fijos para afrontar imprevistos con tranquilidad."
            : "Build a safety net covering 3 to 6 months of fixed expenses for peace of mind.",
          badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        },
        {
          icon: <Lightbulb className="text-purple-500" size={18} />,
          title: isEs ? "Control de gastos hormiga" : "Track small expenses",
          desc: isEs
            ? "Registra tus compras diarias y revisa suscripciones recurrentes para detectar fugas de dinero a tiempo."
            : "Log daily purchases and review recurring subscriptions to spot money leaks early.",
          badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        },
      ];
    }

    if (savingsRate > 20) {
      list.push({
        icon: <Zap className="text-amber-500" size={18} />,
        title: isEs ? "¡Excelente tasa de ahorro!" : "Great savings rate!",
        desc: isEs
          ? `Estás ahorrando el ${savingsRate.toFixed(1)}% de tus ingresos. Superas la meta recomendada del 20%.`
          : `You are saving ${savingsRate.toFixed(1)}% of your income, beating the recommended 20% target.`,
        badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      });
    } else if (savingsRate > 0) {
      list.push({
        icon: <Target className="text-blue-500" size={18} />,
        title: isEs ? "Oportunidad de ahorro" : "Savings opportunity",
        desc: isEs
          ? "Intenta acercarte al 20% de ahorro mensual para fortalecer tu fondo de tranquilidad y emergencias."
          : "Try to get closer to a 20% monthly savings rate to strengthen your emergency fund.",
        badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      });
    } else {
      list.push({
        icon: <ShieldCheck className="text-rose-500" size={18} />,
        title: isEs ? "Control de balance" : "Balance control",
        desc: isEs
          ? "Tus gastos superan o igualan tus ingresos este mes. Revisa gastos prescindibles para equilibrar tus números."
          : "Your expenses equal or exceed your income this month. Review non-essential spending to balance your numbers.",
        badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      });
    }

    if (highestCategory) {
      const catName =
        translate(`categories.${highestCategory[0]}`, highestCategory[0]) || highestCategory[0];
      list.push({
        icon: <TrendingDown className="text-rose-500" size={18} />,
        title: isEs ? "Categoría de mayor impacto" : "Highest impact category",
        desc: isEs
          ? `Tu mayor egreso es en "${catName}". Analizar micro-gastos aquí te dará mayor liquidez.`
          : `Your highest spending is in "${catName}". Reviewing small expenses here will improve your cash flow.`,
        badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      });
    }

    list.push({
      icon: <Lightbulb className="text-purple-500" size={18} />,
      title: isEs ? "Optimización de suscripciones" : "Subscription optimization",
      desc: isEs
        ? "Revisa servicios recurrentes y membresías digitales para evitar cargos inadvertidos."
        : "Review recurring services and digital memberships to avoid unnoticed charges.",
      badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    });

    return list;
  }, [expenses, incomes, translate, isEs]);

  return (
    <div className="bg-card dark:bg-card/75 backdrop-blur-sm p-6 rounded-3xl shadow-card hover:shadow-card-hover border border-slate-200/90 dark:border-border/60 h-full flex flex-col justify-between transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Lightbulb size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-titles dark:text-foreground leading-tight">
                {translate("summary.financialInsights")}
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          {genericInsights.map((insight, index) => (
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
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isEs ? "Consejos basados en tus hábitos" : "Tips based on your habits"}
        </span>
        <span className="font-bold text-action flex items-center gap-1.5">
          <Lightbulb size={13} className="text-amber-500" />
          FinTrack
        </span>
      </div>
    </div>
  );
}
