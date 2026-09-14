"use client";

import { useState } from "react";
import { Loader2, Goal, CalendarIcon } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { safeFetch } from "@/lib/api";
import { cn, formatLiveNumber, parseLiveNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";

interface RegisterGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterGoalModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterGoalModalProps) {
  const { translate, currencySymbol } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    deadline: new Date().toISOString().split("T")[0],
    category: "Metas",
  });

  const categories = ["Metas", "Viajes", "Inversión", "Compra", "Otros"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedTarget = parseFloat(parseLiveNumber(formData.target_amount));
      if (isNaN(parsedTarget) || parsedTarget <= 0) {
        toast.error("Por favor ingresa una meta válida");
        setLoading(false);
        return;
      }

      const res = await safeFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          target_amount: parsedTarget,
          current_amount: parseFloat(parseLiveNumber(formData.current_amount)) || 0,
          deadline: new Date(formData.deadline + "T12:00:00").toISOString(),
        }),
      });

      if (res.ok) {
        toast.success(translate("goals.form.success"));
        onSuccess();
        onClose();
        setFormData({
          name: "",
          target_amount: "",
          current_amount: "0",
          deadline: new Date().toISOString().split("T")[0],
          category: "Ahorro",
        });
      } else {
        toast.error(res.error || translate("goals.form.error") || "Error al registrar la meta");
      }
    } catch {
      toast.error(translate("goals.form.error") || "Error al registrar la meta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-action/10 text-action rounded-xl">
              <Goal size={20} />
            </div>
            <DialogTitle className="text-xl font-bold">
              {translate("goals.register")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1 flex items-center gap-2 text-titles dark:text-foreground">
              {translate("goals.name")}
            </label>
            <Input
              required
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej. Viaje a Japón"
              className="h-12 focus-visible:ring-action"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 flex items-center gap-2 text-titles dark:text-foreground">
                {translate("goals.target")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 z-10">
                  {currencySymbol}
                </span>
                <Input
                  required
                  type="text"
                  inputMode="decimal"
                  value={formData.target_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, target_amount: formatLiveNumber(e.target.value) })
                  }
                  placeholder="0.00"
                  className="pl-8 text-lg font-bold h-12 focus-visible:ring-action"
                />
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <label className="text-sm font-bold ml-1 flex items-center gap-2 text-titles dark:text-foreground">
                {translate("goals.deadline")}
              </label>
              <DatePicker
                value={formData.deadline}
                onChange={(deadline) => setFormData({ ...formData, deadline })}
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold ml-1 flex items-center gap-2 text-titles dark:text-foreground">
              {translate("goals.category")}
            </label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="h-12">
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

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
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
              className="w-full sm:w-auto bg-action hover:bg-action/90 text-white font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {translate("income.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
