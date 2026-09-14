"use client";

import { useState } from "react";
import { cn, formatLiveNumber, parseLiveNumber, getCategoryColorBg } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { safeFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { CategoryModal } from "@/components/categories/CategoryModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegisterIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterIncomeModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterIncomeModalProps) {
  const { translate, currency, currencySymbol } = useSettings();
  const { categories: sourceList } = useCategories("income");
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    source: "Salario",
    description: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "Transferencia",
  });

  const paymentMethods = ["Transferencia", "Efectivo", "PayPal", "Depósito"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedAmount = parseFloat(parseLiveNumber(formData.amount));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Por favor ingresa un monto válido");
        setLoading(false);
        return;
      }

      const res = await safeFetch("/api/incomes", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          amount: parsedAmount,
          currency,
          date: new Date(formData.date + "T12:00:00").toISOString(),
        }),
      });

      if (!res.ok) {
        toast.error(res.error || translate("income.form.error") || "Error al registrar el ingreso");
        return;
      }

      toast.success(translate("income.form.success"));
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        amount: "",
        source: "Salario",
        description: "",
        date: new Date().toISOString().split("T")[0],
        payment_method: "Transferencia",
      });
    } catch {
      toast.error(translate("income.form.error") || "Error al registrar el ingreso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="text-action">
            {translate("income.form.title")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-titles dark:text-foreground">
              {translate("income.form.amount")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 z-10">
                {currencySymbol}
              </span>
              <Input
                required
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: formatLiveNumber(e.target.value) })
                }
                placeholder="0.00"
                className="pl-8 text-lg font-bold h-12 focus-visible:ring-action"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-titles dark:text-foreground">
                  {translate("income.form.source")}
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer py-0.5 px-2 rounded-lg hover:bg-emerald-500/10 transition-colors"
                  title="Crear nueva fuente de ingresos"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Añadir fuente</span>
                </button>
              </div>
              <Select
                value={formData.source}
                onValueChange={(value) => {
                  if (value === "__new_category__") {
                    setIsCreateCategoryOpen(true);
                    return;
                  }
                  setFormData({ ...formData, source: value });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar fuente" />
                </SelectTrigger>
                <SelectContent>
                  {sourceList.map((src) => (
                    <SelectItem key={src.id} value={src.name}>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", getCategoryColorBg(src.color))} />
                        <span className="truncate">{src.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="p-1 border-t border-border/40 mt-1">
                    <SelectItem
                      value="__new_category__"
                      className="text-emerald-600 dark:text-emerald-400 font-bold focus:bg-emerald-500/10 focus:text-emerald-600 dark:focus:text-emerald-400 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Añadir nueva fuente...</span>
                      </div>
                    </SelectItem>
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <label className="text-sm font-bold text-titles dark:text-foreground">
                {translate("income.form.date")}
              </label>
              <DatePicker
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-titles dark:text-foreground">
              {translate("income.form.paymentMethod")}
            </label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm} value={pm}>
                    {pm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-titles dark:text-foreground">
              {translate("income.form.description")}
            </label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="..."
              className="min-h-24 resize-none focus-visible:ring-action"
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto font-medium bg-expense hover:bg-expense/90 text-white dark:bg-expense/10 dark:hover:bg-expense/20 dark:text-expense border border-transparent dark:border-expense/20 cursor-pointer"
            >
              {translate("income.form.cancel")}
            </Button>
            <Button
              disabled={loading}
              type="submit"
              className="w-full sm:w-auto bg-action hover:bg-action/90 dark:bg-action/10 dark:hover:bg-action/20 text-white dark:text-action font-bold shadow-md active:scale-95 transition-all border border-transparent dark:border-action/20 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? translate("income.form.loading")
                : translate("income.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <CategoryModal
      isOpen={isCreateCategoryOpen}
      onClose={() => setIsCreateCategoryOpen(false)}
      defaultType="income"
      onSuccess={(newCat) => {
        setFormData((prev) => ({ ...prev, source: newCat.name }));
      }}
    />
  </>
  );
}
