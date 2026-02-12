"use client";

import { Goal } from "@/types/index";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { Goal as GoalIcon, Calendar, Trash2, PlusCircle } from "lucide-react";
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
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  return (
    <>
      <div className="bg-background p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        {/* Progress Background Subtle */}
        <div
          className="absolute inset-0 bg-action/5 transition-all duration-1000 ease-out origin-left pointer-events-none"
          style={{ transform: `scaleX(${progress / 100})` }}
        />

        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-action/10 text-action rounded-2xl">
                <GoalIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg group-hover:text-action transition-colors">
                  {goal.name}
                </h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  {goal.category}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsContributeOpen(true)}
                className="p-2 text-action hover:bg-action/10 rounded-xl transition-colors cursor-pointer"
                title={translate("goals.contribute")}
              >
                <PlusCircle size={20} />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(goal.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>
                  {progress.toFixed(0)}% {translate("goals.achieved")}
                </span>
                <span className="text-muted-foreground">
                  {currencySymbol}
                  {formatCurrency(goal.target_amount)}
                </span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-action transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-muted/30 p-3 rounded-2xl">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                  {translate("goals.current")}
                </p>
                <p className="font-bold text-action text-sm">
                  {currencySymbol}
                  {formatCurrency(goal.current_amount)}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-2xl">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                  {translate("goals.remaining")}
                </p>
                <p className="font-bold text-sm">
                  {currencySymbol}
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Calendar size={14} />
              <span>
                {translate("goals.deadline")}:{" "}
                {new Date(goal.deadline).toLocaleDateString()}
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
