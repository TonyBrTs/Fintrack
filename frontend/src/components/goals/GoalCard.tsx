"use client";

import { Goal } from "@/types/index";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { Target, Calendar, Trash2, Plus, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { ContributeModal } from "./ContributeModal";

interface GoalCardProps {
  goal: Goal;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

export function GoalCard({ goal, onDelete, onRefresh }: GoalCardProps) {
  const { currencySymbol, translate } = useSettings();
  const [isContributeOpen, setIsContributeOpen] = useState(false);

  const progress = Math.min(
    (goal.current_amount / goal.target_amount) * 100,
    100,
  );
  const isCompleted = progress >= 100;
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  return (
    <>
      <div className="bg-card/90 dark:bg-card/75 backdrop-blur-sm p-6 rounded-3xl border border-border/80 dark:border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
        {/* Subtle background glow */}
        <div
          className={`absolute -right-16 -bottom-16 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
            isCompleted ? "bg-emerald-500/15" : "bg-blue-600/10"
          }`}
        />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl border transition-transform group-hover:scale-105 ${
                  isCompleted
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-blue-600/10 text-action dark:text-blue-400 border-action/20"
                }`}
              >
                {isCompleted ? <CheckCircle2 size={22} /> : <Target size={22} />}
              </div>
              <div>
                <h3 className="font-bold text-base text-titles dark:text-foreground group-hover:text-action dark:group-hover:text-blue-400 transition-colors">
                  {goal.name}
                </h3>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {goal.category}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsContributeOpen(true)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-action/10 hover:bg-action text-action hover:text-white dark:bg-blue-500/15 dark:hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                title={translate("goals.contribute") || "Aportar"}
              >
                <Plus size={14} strokeWidth={3} />
                <span>{translate("goals.contribute") || "Aportar"}</span>
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(goal.id)}
                  aria-label="Delete goal"
                  className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-40 group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Progress Bar & percentage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className={isCompleted ? "text-emerald-500" : "text-action dark:text-blue-400"}>
                  {progress.toFixed(0)}% {isCompleted ? "¡Completada!" : translate("goals.achieved") || "alcanzado"}
                </span>
                <span className="text-muted-foreground font-semibold">
                  Meta: {currencySymbol}{formatCurrency(goal.target_amount)}
                </span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    isCompleted
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-secondary/60 dark:bg-slate-800/50 p-3 rounded-2xl border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                  {translate("goals.current") || "Ahorrado"}
                </p>
                <p className="font-black text-titles dark:text-foreground text-sm">
                  {currencySymbol}{formatCurrency(goal.current_amount)}
                </p>
              </div>
              <div className="bg-secondary/60 dark:bg-slate-800/50 p-3 rounded-2xl border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                  {translate("goals.remaining") || "Faltante"}
                </p>
                <p className="font-black text-sm text-titles dark:text-foreground">
                  {currencySymbol}{formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/30 min-w-0 overflow-hidden">
              <Calendar size={13} className="text-action shrink-0" />
              <span className="truncate">
                {translate("goals.deadline") || "Fecha límite"}:{" "}
                {new Date(goal.deadline).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ContributeModal
        isOpen={isContributeOpen}
        onClose={() => setIsContributeOpen(false)}
        onSuccess={onRefresh || (() => {})}
        goal={goal}
      />
    </>
  );
}
