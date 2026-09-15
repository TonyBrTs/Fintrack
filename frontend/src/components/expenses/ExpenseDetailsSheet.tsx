"use client";

import { Sheet } from "@/components/ui/Sheet";
import { useSettings } from "@/contexts/SettingsContext";
import { useCategories } from "@/hooks/useCategories";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import type { Expense } from "@/types/index";
import {
  Calendar,
  Wallet,
  Tag,
  FileText,
  Hash,
  Loader2,
  Pencil,
  Trash2,
  ArrowDownRight,
  Check,
  Copy,
  Repeat,
} from "lucide-react";
import { EditExpenseModal } from "./EditExpenseModal";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { safeFetch } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface ExpenseDetailsSheetProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExpenseDetailsSheet({
  expense,
  isOpen,
  onClose,
  onSuccess,
}: ExpenseDetailsSheetProps) {
  const { translate, currencySymbol, currency, language } = useSettings();
  const { categories } = useCategories("expense");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!expense) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await safeFetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error(
          res.error ||
            translate("expenses.details.deleteError") ||
            "Error al eliminar el gasto"
        );
        return;
      }

      toast.success(translate("expenses.details.deleteSuccess"));
      onSuccess?.();
      onClose();
    } catch {
      toast.error(
        translate("expenses.details.deleteError") || "Error al eliminar el gasto"
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCopyId = () => {
    if (expense?.id) {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(expense.id);
      }
      setCopied(true);
      toast.success("ID copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categoryName = translate(
    `categories.${expense.category}`,
    expense.category
  );

  return (
    <>
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        title={translate("expenses.details.title")}
      >
        <div className="space-y-6 pb-6">
          {/* Hero Receipt Section */}
          <div className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/15 dark:via-rose-500/5 rounded-3xl border border-rose-500/20 text-center overflow-hidden">
            {/* Ambient indicator icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 shadow-sm ring-4 ring-rose-500/5">
              <ArrowDownRight className="w-7 h-7" strokeWidth={2.5} />
            </div>

            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300">
                {translate("expenses.title") || "Gasto"}
              </span>
              {(expense.id.startsWith("rec_") || expense.id.startsWith("rec-")) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                  <Repeat className="w-3 h-3" />
                  {language === "en" ? "Recurring" : "Recurrente"}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                - {currencySymbol}
                {formatCurrency(expense.amount)}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                {currency}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Transacción registrada</span>
            </div>
          </div>

          {/* Digital Receipt / Comprobante Ticket */}
          <div className="bg-secondary/35 dark:bg-slate-900/60 rounded-2xl border border-border/70 p-4 sm:p-5 space-y-4 shadow-xs backdrop-blur-sm">
            {/* Category */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground">
                  <Tag className="w-4 h-4 text-action" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {translate("expenses.details.category")}
                </span>
              </div>
              <CategoryBadge
                category={expense.category}
                categories={categories}
                label={categoryName}
                size="md"
              />
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Date */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground">
                  <Calendar className="w-4 h-4 text-action" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {translate("expenses.details.date")}
                </span>
              </div>
              <span className="font-semibold text-xs sm:text-sm text-foreground capitalize text-right">
                {new Date(expense.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Payment Method */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground">
                  <Wallet className="w-4 h-4 text-action" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {translate("expenses.details.paymentMethod")}
                </span>
              </div>
              <span className="font-semibold text-xs sm:text-sm text-foreground px-2.5 py-1 rounded-md bg-background/80 border border-border/60">
                {expense.payment_method || "Efectivo"}
              </span>
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Description / Concept */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground">
                  <FileText className="w-4 h-4 text-action" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {translate("expenses.details.description")}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background/80 border border-border/60 text-xs sm:text-sm text-foreground leading-relaxed">
                {expense.category === "Metas" ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-action">
                      {translate("goals.contributionToGoal")}
                    </span>
                    <span className="font-semibold">
                      {expense.description.includes(": ")
                        ? expense.description.split(": ")[1]
                        : expense.description}
                    </span>
                  </div>
                ) : (
                  expense.description.replace(/^\[Recurrente\]\s*/i, "") || "Sin descripción"
                )}
              </div>
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Transaction ID & Copy */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="w-3.5 h-3.5" />
                <span className="text-xs">
                  {translate("expenses.details.id")}
                </span>
              </div>
              <button
                onClick={handleCopyId}
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background hover:bg-secondary/70 border border-border/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-xs font-mono"
              >
                <span>{expense.id}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
              type="button"
              className="flex-1 min-h-[46px] flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition-all border border-rose-200 dark:border-rose-900/40 text-sm cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{translate("expenses.delete")}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              type="button"
              className="flex-1 min-h-[46px] flex items-center justify-center gap-2 bg-action hover:bg-action/90 text-white rounded-xl font-bold transition-all text-sm shadow-sm shadow-action/25 cursor-pointer active:scale-98"
            >
              <Pencil className="w-4 h-4" />
              <span>{translate("expenses.edit")}</span>
            </button>
          </div>
        </div>
      </Sheet>

      <EditExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          onSuccess?.();
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
    </>
  );
}
