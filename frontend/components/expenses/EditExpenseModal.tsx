"use client";

import { getApiHeaders } from "@/lib/api";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
import { CalendarIcon } from "lucide-react";
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
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description,
        date: format(new Date(expense.date), "yyyy-MM-dd"),
        payment_method: expense.payment_method,
      });
    }
  }, [expense, isOpen]);

  const categories = [
    "Alimentación",
    "Transporte",
    "Servicios",
    "Entretenimiento",
    "Salud",
    "Otros",
  ];

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
      const url = expense
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/expenses/${expense.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/expenses`;
      const method = expense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getApiHeaders(),
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          currency,
          date: new Date(formData.date + "T12:00:00").toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process expense");
      }

      const successMsg = expense
        ? translate("expenses.form.success") // Or add update specific key if available
        : translate("expenses.form.success");

      toast.success(successMsg);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        amount: "",
        category: "Alimentación",
        description: "",
        date: new Date().toISOString().split("T")[0],
        payment_method: "Tarjeta de Crédito",
      });
    } catch (error) {
      console.error("Error registering expense:", error);
      toast.error(translate("expenses.form.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
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
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                className="pl-8 text-lg font-bold h-12 focus-visible:ring-action"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-titles dark:text-foreground">
                {translate("expenses.form.category")}
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as ExpenseCategory,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-titles dark:text-foreground">
                {translate("expenses.form.date")}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full h-10 px-3 justify-start text-left font-normal focus-visible:ring-action hover:bg-action/5 dark:hover:bg-action/10",
                      !formData.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(new Date(formData.date + "T12:00:00"), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
  );
}
