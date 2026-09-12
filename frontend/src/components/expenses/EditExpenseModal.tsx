"use client";

import { safeFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { cn, formatLiveNumber, parseLiveNumber, getCategoryColorBg } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/types/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { CategoryModal } from "@/components/categories/CategoryModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense | null;
}

export function EditExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expense,
}: EditExpenseModalProps) {
  const { translate, currency, currencySymbol } = useSettings();
  const { categories: categoryList } = useCategories("expense");
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: expense?.amount.toString() || "",
    category:
      (expense?.category as ExpenseCategory) ||
      ("Alimentación" as ExpenseCategory),
    description: expense?.description || "",
    date: expense
      ? format(new Date(expense.date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    payment_method: expense?.payment_method || "Tarjeta de Crédito",
  });

  useEffect(() => {
    if (expense && isOpen) {
      setFormData({
        amount: formatLiveNumber(expense.amount.toString()),
        category: expense.category,
        description: expense.description,
        date: format(new Date(expense.date), "yyyy-MM-dd"),
        payment_method: expense.payment_method,
      });
    }
  }, [expense, isOpen]);

  const paymentMethods = [
    "Tarjeta de Crédito",
    "Tarjeta de Débito",
    "Efectivo",
    "Transferencia",
  ];

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

      const endpoint = expense
        ? `/api/expenses/${expense.id}`
        : `/api/expenses`;
      const method = expense ? "PUT" : "POST";

      const res = await safeFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...formData,
          amount: parsedAmount,
          currency,
          date: new Date(formData.date + "T12:00:00").toISOString(),
        }),
      });

      if (!res.ok) {
        toast.error(res.error || translate("expenses.form.error") || "Error al procesar el gasto");
        return;
      }

      toast.success(translate("expenses.form.success"));
      onSuccess();
      onClose();
    } catch {
      toast.error(translate("expenses.form.error") || "Error al procesar el gasto");
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
            {translate("expenses.form.title")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-titles dark:text-foreground">
              {translate("expenses.form.amount")}
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
                  {translate("expenses.form.category")}
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer py-0.5 px-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"
                  title="Crear nueva categoría"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>+ Nueva</span>
                </button>
              </div>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  if (value === "__new_category__") {
                    setIsCreateCategoryOpen(true);
                    return;
                  }
                  setFormData({
                    ...formData,
                    category: value as ExpenseCategory,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryList.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", getCategoryColorBg(cat.color))} />
                        <span className="truncate">{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="p-1 border-t border-border/40 mt-1">
                    <SelectItem
                      value="__new_category__"
                      className="text-blue-600 dark:text-blue-400 font-bold focus:bg-blue-500/10 focus:text-blue-600 dark:focus:text-blue-400 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Plus size={14} strokeWidth={2.5} />
                        <span>+ Nueva categoría...</span>
                      </div>
                    </SelectItem>
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <label className="text-sm font-bold text-titles dark:text-foreground">
                {translate("expenses.form.date")}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-10 px-3 justify-start text-left font-normal focus-visible:ring-action hover:bg-action/5 dark:hover:bg-action/10 overflow-hidden",
                      !formData.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {formData.date ? (
                        format(new Date(formData.date + "T12:00:00"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.date
                        ? new Date(formData.date + "T12:00:00")
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        setFormData({
                          ...formData,
                          date: format(date, "yyyy-MM-dd"),
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-titles dark:text-foreground">
              {translate("expenses.form.paymentMethod")}
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
              {translate("expenses.form.description")}
            </label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="..."
              className="min-h-24 resize-none"
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto font-medium bg-expense hover:bg-expense/90 text-white dark:bg-expense/10 dark:hover:bg-expense/20 dark:text-expense border border-transparent dark:border-expense/20 cursor-pointer"
            >
              {translate("expenses.form.cancel")}
            </Button>
            <Button
              disabled={loading}
              type="submit"
              className="w-full sm:w-auto bg-action hover:bg-action/90 dark:bg-action/10 dark:hover:bg-action/20 text-white dark:text-action font-bold shadow-md active:scale-95 transition-all border border-transparent dark:border-action/20 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? translate("expenses.form.loading")
                : translate("expenses.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <CategoryModal
      isOpen={isCreateCategoryOpen}
      onClose={() => setIsCreateCategoryOpen(false)}
      defaultType="expense"
      onSuccess={(newCat) => {
        setFormData((prev) => ({ ...prev, category: newCat.name as ExpenseCategory }));
      }}
    />
  </>
  );
}
