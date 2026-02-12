"use client";

import { Sheet } from "@/components/ui/Sheet";
import { useSettings } from "@/contexts/SettingsContext";
import { Badge } from "@/components/ui/Badge";
import type { Expense } from "@/types/index";
import { Calendar, Wallet, Tag, Info, Clock, Loader2 } from "lucide-react";
import { EditExpenseModal } from "./EditExpenseModal";
import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getApiHeaders } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface ExpenseDetailsSheetProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const categoryColors: Record<
  string,
  "success" | "warning" | "error" | "info" | "default"
> = {
  Alimentación: "success",
  Transporte: "info",
  Servicios: "warning",
  Entretenimiento: "error",
  Salud: "error",
  Otros: "default",
};

export function ExpenseDetailsSheet({
  expense,
  isOpen,
  onClose,
  onSuccess,
}: ExpenseDetailsSheetProps) {
  const { translate, currencySymbol, currency } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!expense) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/expenses/${expense.id}`,
        {
          method: "DELETE",
          headers: getApiHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      toast.success(translate("expenses.details.deleteSuccess"));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(translate("expenses.details.deleteError"));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={translate("expenses.details.title")}
    >
      <EditExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          onSuccess?.(); // Call parent's onSuccess to refresh the table
          setIsModalOpen(false);
          onClose();
        }}
        expense={expense}
      />
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
      <div className="space-y-8 py-4">
        {/* Header/Amount Section */}
        <div className="flex flex-col items-center justify-center p-8 bg-action/5 dark:bg-action/10 rounded-3xl border border-action/10">
          <span className="text-secondary-titles dark:text-muted-foreground text-sm font-bold uppercase tracking-widest mb-2">
            {translate("expenses.details.amount")}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-titles dark:text-foreground">
              {currencySymbol}
              {formatCurrency(expense.amount)}
            </span>
            <span className="text-sm font-bold text-action">{currency}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary/50 dark:bg-secondary/20 rounded-xl">
              <Tag className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-secondary-titles dark:text-muted-foreground uppercase tracking-wider mb-1">
                {translate("expenses.details.category")}
              </p>
              <Badge
                variant={categoryColors[expense.category] || "default"}
                className="text-xs px-3 py-1 font-bold"
              >
                {translate(`categories.${expense.category}`)}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary/50 dark:bg-secondary/20 rounded-xl">
              <Calendar className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-secondary-titles dark:text-muted-foreground uppercase tracking-wider mb-1">
                {translate("expenses.details.date")}
              </p>
              <p className="text-base font-bold text-titles dark:text-foreground">
                {new Date(expense.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary/50 dark:bg-secondary/20 rounded-xl">
              <Wallet className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-secondary-titles dark:text-muted-foreground uppercase tracking-wider mb-1">
                {translate("expenses.details.paymentMethod")}
              </p>
              <p className="text-base font-bold text-titles dark:text-foreground">
                {expense.payment_method}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary/50 dark:bg-secondary/20 rounded-xl">
              <Info className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-secondary-titles dark:text-muted-foreground uppercase tracking-wider mb-1">
                {translate("expenses.details.description")}
              </p>
              <p className="text-base text-titles dark:text-foreground leading-relaxed">
                {expense.category === "Metas"
                  ? `${translate("goals.contributionToGoal")}: ${
                      expense.description.includes(": ")
                        ? expense.description.split(": ")[1]
                        : expense.description
                    }`
                  : expense.description}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary/50 dark:bg-secondary/20 rounded-xl">
              <Clock className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-secondary-titles dark:text-muted-foreground uppercase tracking-wider mb-1">
                {translate("expenses.details.id")}
              </p>
              <p className="text-xs font-mono text-secondary-titles dark:text-muted-foreground">
                {expense.id}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover="hover"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="group flex-1 flex items-center justify-center gap-2 bg-expense hover:bg-expense/90 text-white dark:bg-expense/10 dark:hover:bg-expense/20 dark:text-expense px-6 py-3 rounded-xl font-bold transition-all border border-transparent dark:border-expense/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <motion.div
                  initial={{ scale: 1 }}
                  variants={{
                    hover: { scale: 1.2 },
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Trash2 size={20} strokeWidth={2.5} />
                </motion.div>
              )}
              {translate("expenses.delete")}
            </motion.button>

            <motion.button
              whileHover="hover"
              onClick={() => setIsModalOpen(true)}
              className="group flex-1 flex items-center justify-center gap-2 bg-action hover:bg-action/90 text-white dark:bg-action/10 dark:hover:bg-action/20 dark:text-action px-6 py-3 rounded-xl font-bold transition-all border border-transparent dark:border-action/20 active:scale-95 cursor-pointer"
            >
              <motion.div
                initial={{ scale: 1 }}
                variants={{
                  hover: { scale: 1.2 },
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut",
                }}
              >
                <Pencil size={20} strokeWidth={2.5} />
              </motion.div>
              {translate("expenses.edit")}
            </motion.button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
