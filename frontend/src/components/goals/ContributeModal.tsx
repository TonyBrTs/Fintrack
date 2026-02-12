"use client";

import { useState } from "react";
import { Loader2, DollarSign, Goal as GoalIcon } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getApiHeaders } from "@/lib/api";
import { toast } from "sonner";
import { Goal } from "@/types/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: Goal;
}

export function ContributeModal({
  isOpen,
  onClose,
  onSuccess,
  goal,
}: ContributeModalProps) {
  const { translate, currencySymbol } = useSettings();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contributeAmount = parseFloat(amount);
    if (isNaN(contributeAmount) || contributeAmount <= 0) return;

    setLoading(true);

    try {
      const updatedGoal = {
        ...goal,
        current_amount: goal.current_amount + contributeAmount,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/goals/${goal.id}`,
        {
          method: "PUT",
          headers: getApiHeaders(),
          body: JSON.stringify(updatedGoal),
        },
      );

      if (response.ok) {
        // Also record this as an expense to decrease balance and show in recent activity
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`, {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            amount: contributeAmount,
            description: `${translate("goals.contributionToGoal")}: ${goal.name}`,
            category: "Metas",
            date: new Date().toISOString(),
            payment_method: "Efectivo",
            currency: "USD",
          }),
        });

        toast.success(translate("goals.contributeSuccess"));
        onSuccess();
        onClose();
        setAmount("");
      } else {
        toast.error(translate("goals.contributeError"));
      }
    } catch (error) {
      console.error("Error contributing to goal:", error);
      toast.error(translate("goals.contributeError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-action/10 text-action rounded-xl">
              <GoalIcon size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {translate("goals.contribute")}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{goal.name}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1 flex items-center gap-2 text-titles dark:text-foreground">
              <DollarSign size={14} className="text-action" />
              {translate("goals.contributionAmount")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 z-10">
                {currencySymbol}
              </span>
              <Input
                required
                autoFocus
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-lg font-bold h-12 focus-visible:ring-action"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto font-medium active:scale-95 transition-all cursor-pointer bg-expense hover:bg-expense/90 text-white dark:bg-expense/10 dark:hover:bg-expense/20 dark:text-expense border border-transparent dark:border-expense/20"
            >
              {translate("income.form.cancel")}
            </Button>
            <Button
              disabled={loading || !amount}
              type="submit"
              className="w-full sm:w-auto   bg-action hover:bg-action/90 dark:bg-action/10 dark:hover:bg-action/20 text-white dark:text-action font-bold shadow-md active:scale-95 transition-all border border-transparent dark:border-action/20 cursor-pointer"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {translate("goals.contribute")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
