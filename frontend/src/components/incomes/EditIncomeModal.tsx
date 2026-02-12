"use client";

import { getApiHeaders } from "@/lib/api";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Income, IncomeSource } from "@/types/index";
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

interface EditIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  income: Income | null;
}

export function EditIncomeModal({
  isOpen,
  onClose,
  onSuccess,
  income,
}: EditIncomeModalProps) {
  const { translate, currency, currencySymbol } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: income?.amount.toString() || "",
    source: (income?.source as IncomeSource) || ("Salario" as IncomeSource),
    description: income?.description || "",
    date: income
      ? format(new Date(income.date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    payment_method: income?.payment_method || "Transferencia",
  });

  useEffect(() => {
    if (income && isOpen) {
      setFormData({
        amount: income.amount.toString(),
        source: income.source,
        description: income.description,
        date: format(new Date(income.date), "yyyy-MM-dd"),
        payment_method: income.payment_method,
      });
    }
  }, [income, isOpen]);

  const sources = ["Salario", "Freelance", "Inversiones", "Regalo", "Otros"];

  const paymentMethods = ["Transferencia", "Efectivo", "PayPal", "Depósito"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/incomes/${income?.id}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: getApiHeaders(),
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          currency,
          date: new Date(formData.date + "T12:00:00").toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update income");
      }

      toast.success(translate("income.form.success"));
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating income:", error);
      toast.error(translate("income.form.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
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
                {translate("income.form.source")}
              </label>
              <Select
                value={formData.source}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    source: value as IncomeSource,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar fuente" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((src) => (
                    <SelectItem key={src} value={src}>
                      {src}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-titles dark:text-foreground">
                {translate("income.form.date")}
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
  );
}
