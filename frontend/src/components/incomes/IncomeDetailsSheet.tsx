"use client";

import { Sheet } from "@/components/ui/Sheet";
import { useSettings } from "@/contexts/SettingsContext";
import { Badge } from "@/components/ui/Badge";
import type { Income } from "@/types/index";
import {
  Calendar,
  Wallet,
  Tag,
  FileText,
  Hash,
  Loader2,
  Pencil,
  Trash2,
  ArrowUpRight,
  Check,
  Copy,
} from "lucide-react";
import { EditIncomeModal } from "./EditIncomeModal";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { safeFetch } from "@/lib/api";
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
  const [copied, setCopied] = useState(false);

  if (!income) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await safeFetch(`/api/incomes/${income.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error(
          res.error ||
            translate("income.details.deleteError") ||
            "Error al eliminar el ingreso"
        );
        return;
      }

      toast.success(translate("income.details.deleteSuccess"));
      onSuccess?.();
      onClose();
    } catch {
      toast.error(
        translate("income.details.deleteError") || "Error al eliminar el ingreso"
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCopyId = () => {
    if (income?.id) {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(income.id);
      }
      setCopied(true);
      toast.success("ID copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sourceName =
    translate(`sources.${income.source}`) !== `sources.${income.source}`
      ? translate(`sources.${income.source}`)
      : income.source;

  return (
    <>
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        title={translate("income.details.title")}
      >
        <div className="space-y-6 pb-6">
          {/* Hero Receipt Section */}
          <div className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/5 rounded-3xl border border-emerald-500/20 text-center overflow-hidden">
            {/* Ambient indicator icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-sm ring-4 ring-emerald-500/5">
              <ArrowUpRight className="w-7 h-7" strokeWidth={2.5} />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 mb-2">
              {translate("income.title") || "Ingreso"}
            </span>

            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                + {currencySymbol}
                {formatCurrency(income.amount)}
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
            {/* Source */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground">
                  <Tag className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {translate("income.details.source")}
                </span>
              </div>
              <Badge
                variant={sourceColors[income.source] || "default"}
                className="text-xs px-3 py-1 font-bold shadow-xs"
              >
                {sourceName}
              </Badge>
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Date */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {translate("income.details.date")}
                </span>
              </div>
              <span className="font-semibold text-xs sm:text-sm text-foreground capitalize text-right">
                {new Date(income.date).toLocaleDateString(undefined, {
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
                  <Wallet className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {translate("income.details.paymentMethod")}
                </span>
              </div>
              <span className="font-semibold text-xs sm:text-sm text-foreground px-2.5 py-1 rounded-md bg-background/80 border border-border/60">
                {income.payment_method || "Transferencia"}
              </span>
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Description / Concept */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground">
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">
                  {translate("income.details.description")}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background/80 border border-border/60 text-xs sm:text-sm text-foreground leading-relaxed">
                {income.description || "Sin descripción"}
              </div>
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Transaction ID & Copy */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="w-3.5 h-3.5" />
                <span className="text-xs">{translate("income.details.id")}</span>
              </div>
              <button
                onClick={handleCopyId}
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background hover:bg-secondary/70 border border-border/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-xs font-mono"
              >
                <span>{String(income.id).slice(0, 10)}...</span>
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
              <span>{translate("income.delete")}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              type="button"
              className="flex-1 min-h-[46px] flex items-center justify-center gap-2 bg-action hover:bg-action/90 text-white rounded-xl font-bold transition-all text-sm shadow-sm shadow-action/25 cursor-pointer active:scale-98"
            >
              <Pencil className="w-4 h-4" />
              <span>{translate("income.edit")}</span>
            </button>
          </div>
        </div>
      </Sheet>

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
    </>
  );
}
