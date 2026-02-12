"use client";

import { Expense, Income } from "@/types/index";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Calendar, Goal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

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

  // Combine and sort by date
  const allTransactions = [
    ...expenses.map((e) => ({ ...e, type: "expense" as const })),
    ...incomes.map((i) => ({ ...i, type: "income" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recent = allTransactions.slice(0, 5);

  return (
    <div className="w-ful">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 opacity-70 uppercase tracking-wider">
          <Calendar size={14} className="text-action" />
          {translate("summary.recentActivity")}
        </h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {recent.length === 0 ? (
          <div className="w-full text-center py-4 bg-surface rounded-xl border border-dashed border-border opacity-50">
            <p className="text-sm">
              {translate("common.noRecentActivity") ||
                "Sin movimientos recientes"}
            </p>
          </div>
        ) : (
          recent.map((tx: Transaction) => (
            <Link
              key={`${tx.type}-${tx.id}`}
              href={
                tx.type === "income"
                  ? `/incomes?id=${tx.id}`
                  : `/expenses?id=${tx.id}`
              }
              className="bg-white dark:bg-card shrink-0 w-64 p-4 rounded-2xl bg-surface border border-border shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95 block"
            >
              <div className="flex justify-between items-start mb-3">
                <div
                  className={`p-2 rounded-xl ${
                    tx.type === "income"
                      ? "bg-green-100/50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                      : (tx as Expense).category === "Metas"
                      ? "bg-gold/10 text-gold dark:bg-gold/20 dark:text-gold"
                      : "bg-red-100/50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {tx.type === "income" ? (
                    <ArrowUpRight size={18} />
                  ) : (tx as Expense).category === "Metas" ? (
                    <Goal size={18} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}
                </div>
                <Badge
                  variant="info"
                  className="bg-action/5 text-[10px] border-none "
                >
                  {tx.payment_method}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-sm truncate group-hover:text-action transition-colors">
                  {tx.category === "Metas"
                    ? `${translate("goals.contributionToGoal")}: ${
                        tx.description.includes(": ")
                          ? tx.description.split(": ")[1]
                          : tx.description
                      }`
                    : tx.description}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      {tx.type === "income"
                        ? translate(`sources.${(tx as Income).source}`)
                        : translate(`categories.${(tx as Expense).category}`)}
                    </p>
                    <p className="text-[10px] text-muted-foreground opacity-70">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`font-bold text-base ${
                      tx.type === "income"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {currencySymbol}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
