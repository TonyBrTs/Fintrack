"use client";

import { Expense, Income, Goal } from "@/types/index";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Lightbulb,
  TrendingDown,
  Target,
  Zap,
  ShieldCheck,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { safeFetch } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

interface RawAIInsight {
  type: "savings" | "optimization" | "warning" | "goal";
  title: string;
  desc: string;
  priority?: "high" | "medium" | "low";
}

export function FinancialInsights({
  expenses,
  incomes,
  goals = [],
}: FinancialInsightsProps) {
  const { translate, currency, currencySymbol } = useSettings();
  const { user } = useAuth();

  const [aiInsights, setAiInsights] = useState<InsightItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAIActive, setIsAIActive] = useState(false);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<string | null>(null);

  // Generate fallback rule-based insights locally
  const localRuleInsights = useMemo(() => {
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const savingsRate =
      totalIncomes > 0
        ? ((totalIncomes - totalExpenses) / totalIncomes) * 100
        : 0;

    const categoryTotals = expenses.reduce(
      (acc: Record<string, number>, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      },
      {}
    );

    const highestCategory = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const fallbackList: InsightItem[] = [];

    if (savingsRate > 20) {
      fallbackList.push({
        icon: <Zap className="text-amber-500" size={18} />,
        title: "¡Excelente tasa de ahorro!",
        desc: `Estás ahorrando el ${savingsRate.toFixed(1)}% de tus ingresos. Superas la meta recomendada del 20%.`,
        badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      });
    } else if (savingsRate > 0) {
      fallbackList.push({
        icon: <Target className="text-blue-500" size={18} />,
        title: "Oportunidad de ahorro",
        desc: "Intenta acercarte al 20% de ahorro mensual para fortalecer tu fondo de tranquilidad y emergencias.",
        badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      });
    } else {
      fallbackList.push({
        icon: <ShieldCheck className="text-rose-500" size={18} />,
        title: "Control de balance",
        desc: "Tus gastos superan o igualan tus ingresos este mes. Revisa gastos prescindibles para equilibrar tus números.",
        badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      });
    }

    if (highestCategory) {
      const catName =
        translate(`categories.${highestCategory[0]}`, highestCategory[0]) ||
        highestCategory[0];
      fallbackList.push({
        icon: <TrendingDown className="text-rose-500" size={18} />,
        title: "Categoría de mayor impacto",
        desc: `Tu mayor egreso es en "${catName}". Analizar micro-gastos aquí te dará mayor liquidez.`,
        badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      });
    }

    if (expenses.length > 5) {
      fallbackList.push({
        icon: <Lightbulb className="text-purple-500" size={18} />,
        title: "Optimización de suscripciones",
        desc: "Revisa servicios recurrentes y membresías digitales para evitar cargos inadvertidos.",
        badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      });
    }

    return fallbackList;
  }, [expenses, incomes, translate]);

  const mapVisuals = (type: string) => {
    switch (type) {
      case "savings":
        return {
          icon: <Zap className="text-amber-500" size={18} />,
          badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        };
      case "optimization":
        return {
          icon: <TrendingDown className="text-blue-500" size={18} />,
          badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        };
      case "warning":
        return {
          icon: <ShieldCheck className="text-rose-500" size={18} />,
          badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        };
      case "goal":
        return {
          icon: <Target className="text-purple-500" size={18} />,
          badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        };
      default:
        return {
          icon: <Lightbulb className="text-amber-500" size={18} />,
          badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        };
    }
  };

  // Transaction state signature to detect meaningful changes
  const txHash = useMemo(() => {
    const totalExp = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalInc = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    return `${expenses.length}_${incomes.length}_${totalExp.toFixed(0)}_${totalInc.toFixed(0)}_${goals.length}`;
  }, [expenses, incomes, goals]);

  const cacheKey = `fintrack_ai_insights_${user?.id || "guest"}`;

  // Call AI Endpoint
  const requestAIInsights = useCallback(
    async (showToast = false) => {
      if (expenses.length === 0 && incomes.length === 0) {
        return;
      }

      setIsLoading(true);

      try {
        const payload = {
          expenses: expenses.slice(0, 30).map((e) => ({
            amount: e.amount,
            category: e.category,
            description: e.description,
            date: typeof e.date === "string" ? e.date : e.date.toISOString(),
          })),
          incomes: incomes.slice(0, 30).map((i) => ({
            amount: i.amount,
            source: i.source,
            description: i.description,
            date: typeof i.date === "string" ? i.date : i.date.toISOString(),
          })),
          goals: goals.map((g) => ({
            name: g.name,
            target_amount: g.target_amount,
            current_amount: g.current_amount,
            deadline:
              typeof g.deadline === "string"
                ? g.deadline
                : g.deadline.toISOString(),
          })),
          currency,
          currencySymbol,
        };

        const res = await safeFetch<{
          ok: boolean;
          configured: boolean;
          insights: RawAIInsight[];
          message?: string;
          timestamp?: string;
        }>("/api/ai/insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          timeoutMs: 12000,
        });

        if (res.ok && res.data?.ok && res.data.insights?.length > 0) {
          const formatted: InsightItem[] = res.data.insights.map((item) => {
            const visual = mapVisuals(item.type);
            return {
              icon: visual.icon,
              title: item.title,
              desc: item.desc,
              badgeClass: visual.badgeClass,
            };
          });

          setAiInsights(formatted);
          setIsAIActive(true);
          setLastAnalyzedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

          // Save in cache
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  insights: res.data.insights,
                  timestamp: Date.now(),
                  txHash,
                })
              );
            } catch {
              // Ignore storage errors
            }
          }

          if (showToast) {
            toast.success("Análisis con IA actualizado con éxito");
          }
        } else {
          // If Gemini key is not configured, inform discreetly on manual request
          if (showToast && res.data?.configured === false) {
            toast.info(
              "Configura GEMINI_API_KEY en .env.local para activar el análisis con IA."
            );
          }
          setIsAIActive(false);
        }
      } catch (err) {
        console.error("Error updating AI insights:", err);
        if (showToast) {
          toast.error("No se pudo conectar con el servicio de IA.");
        }
        setIsAIActive(false);
      } finally {
        setIsLoading(false);
      }
    },
    [expenses, incomes, goals, currency, currencySymbol, cacheKey, txHash]
  );

  // Smart caching and initial check
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        const ageMs = Date.now() - (cached.timestamp || 0);
        const isFresh = ageMs < 24 * 60 * 60 * 1000; // 24 hours
        const sameData = cached.txHash === txHash;

        if (Array.isArray(cached.insights) && cached.insights.length > 0) {
          const formatted: InsightItem[] = cached.insights.map(
            (item: RawAIInsight) => {
              const visual = mapVisuals(item.type);
              return {
                icon: visual.icon,
                title: item.title,
                desc: item.desc,
                badgeClass: visual.badgeClass,
              };
            }
          );
          setAiInsights(formatted);
          setIsAIActive(true);
          setLastAnalyzedTime(
            new Date(cached.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }

        // Background refresh only if transactions changed or older than 24h
        if (!sameData || !isFresh) {
          requestAIInsights(false);
        }
        return;
      }
    } catch {
      // Ignore cache parse error
    }

    // No cache: perform initial background analysis if user has data
    if (expenses.length > 0 || incomes.length > 0) {
      requestAIInsights(false);
    }
  }, [cacheKey, txHash, expenses.length, incomes.length, requestAIInsights]);

  const activeInsights =
    aiInsights && aiInsights.length > 0 ? aiInsights : localRuleInsights;

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
              {lastAnalyzedTime && isAIActive && (
                <span className="text-[10px] text-muted-foreground">
                  Actualizado: {lastAnalyzedTime}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAIActive && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles size={11} className="text-amber-500" />
                Gemini
              </span>
            )}
            <button
              onClick={() => requestAIInsights(true)}
              disabled={isLoading || (expenses.length === 0 && incomes.length === 0)}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-action p-2 rounded-xl hover:bg-secondary/80 border border-transparent hover:border-border/60 transition-all cursor-pointer disabled:opacity-50"
              title="Actualizar análisis con IA"
              type="button"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin text-action" />
              ) : (
                <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3.5">
          {activeInsights.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              Registra más transacciones para desbloquear recomendaciones financieras con IA.
            </p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={isAIActive ? "ai-active" : "rules-fallback"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="space-y-3.5"
              >
                {activeInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-secondary/50 dark:bg-slate-800/40 border border-border/60 hover:border-border transition-colors flex gap-3.5 items-start"
                  >
                    <div
                      className={`p-2 rounded-xl border ${insight.badgeClass} shrink-0 mt-0.5`}
                    >
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
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isAIActive
            ? "Análisis contextualizado por IA"
            : "Consejos basados en tus hábitos"}
        </span>
        <span className="font-bold text-action flex items-center gap-1">
          <Sparkles size={12} className="text-amber-500" />
          FinTrack AI
        </span>
      </div>
    </div>
  );
}

