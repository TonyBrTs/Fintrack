"use client";

import { Sheet } from "@/components/ui/Sheet";
import { useSettings } from "@/contexts/SettingsContext";
import { Badge } from "@/components/ui/Badge";
import type { Income } from "@/types/index";
import {
  Calendar,
  Wallet,
  Tag,
  Info,
  Clock,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { EditIncomeModal } from "./EditIncomeModal";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { getApiHeaders } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/expenses/DeleteConfirmDialog";

interface IncomeDetailsSheetProps {
  income: Income | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const sourceColors: Record<
  string,
  "success" | "warning" | "error" | "info" | "default"
> = {
  Salario: "success",
  Freelance: "info",
  Inversiones: "warning",
  Regalo: "success",
  Otros: "default",
};

export function IncomeDetailsSheet({
  income,
  isOpen,
  onClose,
  onSuccess,
}: IncomeDetailsSheetProps) {
  const { translate, currencySymbol, currency } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!income) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incomes/${income.id}`,
        {
          method: "DELETE",
          headers: getApiHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete income");
      }

      toast.success(translate("income.details.deleteSuccess"));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error(translate("income.details.deleteError"));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={translate("income.details.title")}
    >
      <EditIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          onSuccess?.();
          setIsModalOpen(false);
          onClose();
        }}
        income={income}
      />
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title={translate("income.delete")}
        description={translate("income.details.deleteConfirm")}
        confirmLabel={translate("income.delete")}
        cancelLabel={translate("income.form.cancel")}
      />
      <div className="space-y-8 py-4">
        {/* Header/Amount Section */}
        <div className="flex flex-col items-center justify-center p-8 bg-action/5 dark:bg-action/10 rounded-3xl border border-action/10">
          <span className="text-secondary-titles dark:text-muted-foreground text-sm font-bold uppercase tracking-widest mb-2">
            {translate("income.details.amount")}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-titles dark:text-foreground">
              {currencySymbol}
              {formatCurrency(income.amount)}
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
                {translate("income.details.source")}
              </p>
              <Badge
                variant={sourceColors[income.source] || "default"}
                className="text-xs px-3 py-1 font-bold"
              >
                {income.source}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary/50 dark:bg-secondary/20 rounded-xl">
              <Calendar className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-secondary-titles dark:text-muted-foreground uppercase tracking-wider mb-1">
                {translate("income.details.date")}
              </p>
              <p className="text-base font-bold text-titles dark:text-foreground">
                {new Date(income.date).toLocaleDateString(undefined, {
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
                {translate("income.details.paymentMethod")}
              </p>
              <p className="text-base font-bold text-titles dark:text-foreground">
                {income.payment_method}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary/50 dark:bg-secondary/20 rounded-xl">
              <Info className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-secondary-titles dark:text-muted-foreground uppercase tracking-wider mb-1">
                {translate("income.details.description")}
              </p>
              <p className="text-base text-titles dark:text-foreground leading-relaxed">
                {income.description}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary/50 dark:bg-secondary/20 rounded-xl">
              <Clock className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-secondary-titles dark:text-muted-foreground uppercase tracking-wider mb-1">
                {translate("income.details.id")}
              </p>
              <p className="text-xs font-mono text-secondary-titles dark:text-muted-foreground">
                {income.id}
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
              {translate("income.delete")}
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
              {translate("income.edit")}
            </motion.button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
