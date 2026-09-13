"use client";

import { Expense, Income } from "@/types/index";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TxTypeIcon } from "@/components/ui/AppIcons";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

interface Transaction extends Partial<Expense>, Partial<Income> {
  id: string;
  amount: number;
  date: Date | string;
  description: string;
  payment_method: string;
  type: "income" | "expense";
}

interface RecentTransactionsProps {
  expenses: Expense[];
  incomes: Income[];
}

export function RecentTransactions({
  expenses,
  incomes,
}: RecentTransactionsProps) {
  const { translate, currencySymbol } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Combine and sort by date
  const allTransactions = [
    ...expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...incomes.map((i) => ({ ...i, type: "income" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recent = allTransactions.slice(0, 8);

  const [isPaused, setIsPaused] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(scrollLeft / maxScroll);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [recent]);

  // Auto-play loop effect
  useEffect(() => {
    if (recent.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      const cardWidth = 300;
      
      // If reached the end, smoothly loop back to the beginning
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [recent.length, isPaused]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const cardWidth = 300;

    if (direction === "right") {
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    } else {
      if (scrollLeft <= 10) {
        el.scrollTo({ left: scrollWidth, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -cardWidth, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          <Sparkles size={14} className="text-action" />
          {translate("summary.recentActivity")}
        </h3>

        <div className="flex items-center gap-2.5">
          {recent.length > 0 && (
            <span className="text-xs text-muted-foreground font-semibold px-2.5 py-1 rounded-xl bg-secondary/80 border border-border/50">
              {recent.length} {translate("common.recent")}
            </span>
          )}

          {/* Carousel Arrows (Infinite loop) */}
          {recent.length > 2 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                className="w-8 h-8 rounded-xl bg-card/90 dark:bg-card/75 border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Anterior (Loop)"
                title="Anterior"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                className="w-8 h-8 rounded-xl bg-card/90 dark:bg-card/75 border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Siguiente (Loop)"
                title="Siguiente"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Container with Auto-play Loop */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide pt-1 scroll-smooth snap-x snap-mandatory"
      >
        {recent.length === 0 ? (
          <div className="w-full text-center py-8 bg-card/60 dark:bg-card/40 rounded-2xl border border-dashed border-border text-muted-foreground">
            <p className="text-sm font-medium">
              {translate("common.noRecentActivity") || "Sin movimientos recientes"}
            </p>
          </div>
        ) : (
          recent.map((tx: Transaction) => {
            const isIncome = tx.type === "income";
            const isGoal = (tx as Expense).category === "Metas";

            return (
              <Link
                key={`${tx.type}-${tx.id}`}
                href={
                  isIncome
                    ? `/incomes?id=${tx.id}`
                    : `/expenses?id=${tx.id}`
                }
                className="shrink-0 w-68 sm:w-72 p-4 rounded-2xl bg-card dark:bg-card/75 backdrop-blur-sm border border-slate-200/90 dark:border-border/60 shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:border-action/40 transition-all group cursor-pointer block snap-start"
              >
                <div className="flex justify-between items-start mb-3">
                  <div
                    className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${
                      isIncome
                        ? "bg-emerald-500/10 text-emerald-500"
                        : isGoal
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    <TxTypeIcon
                      type={isIncome ? "income" : isGoal ? "goal" : "expense"}
                      size={18}
                    />
                  </div>
                  <Badge
                    variant="info"
                    className="bg-secondary text-secondary-foreground text-[10px] font-semibold border border-border/40"
                  >
                    {tx.payment_method}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-sm truncate text-titles dark:text-foreground group-hover:text-action dark:group-hover:text-blue-400 transition-colors">
                    {isGoal
                      ? `${translate("goals.contributionToGoal")}: ${
                          tx.description.includes(": ")
                            ? tx.description.split(": ")[1]
                            : tx.description
                        }`
                      : tx.description}
                  </p>
                  <div className="flex justify-between items-end pt-1 border-t border-border/40">
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        {isIncome
                          ? translate(`sources.${(tx as Income).source}`) || (tx as Income).source
                          : translate(`categories.${(tx as Expense).category}`) || (tx as Expense).category}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <p
                      className={`font-black text-base ${
                        isIncome
                          ? "text-emerald-500 dark:text-emerald-400"
                          : "text-rose-500 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {currencySymbol}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Sleek Carousel Progress Indicator Bar */}
      {recent.length > 2 && (
        <div className="flex items-center justify-center pt-2">
          <div className="w-32 h-1 bg-secondary/80 dark:bg-slate-800/80 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-action/70 dark:bg-blue-500/70 rounded-full transition-all duration-200"
              style={{
                width: "40%",
                transform: `translateX(${scrollProgress * 150}%)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
