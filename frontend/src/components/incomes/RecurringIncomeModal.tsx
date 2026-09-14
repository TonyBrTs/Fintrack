"use client";

import { useState, useEffect } from "react";
import { cn, formatLiveNumber, parseLiveNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { safeFetch } from "@/lib/api";
import { Loader2, Calendar as CalendarLucide, Repeat, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecurringIncome, RecurringFrequency, BiweeklyType } from "@/types/index";

interface RecurringIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: RecurringIncome | null;
}

export function RecurringIncomeModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: RecurringIncomeModalProps) {
  const { translate, currency, currencySymbol } = useSettings();
  const { categories: sourceList } = useCategories("income");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    source: "Salario",
    payment_method: "Transferencia",
    frequency: "biweekly" as RecurringFrequency,
    biweekly_type: "15_and_last_day" as BiweeklyType,
    billing_day: 15,
    start_date: new Date().toISOString().split("T")[0],
    auto_register: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description || "",
        amount: initialData.amount ? formatLiveNumber(initialData.amount.toString()) : "",
        source: initialData.source || "Salario",
        payment_method: initialData.payment_method || "Transferencia",
        frequency: initialData.frequency || "biweekly",
        biweekly_type: initialData.biweekly_type || "15_and_last_day",
        billing_day: initialData.billing_day || 15,
        start_date: typeof initialData.start_date === "string" 
          ? initialData.start_date.split("T")[0] 
          : new Date(initialData.start_date).toISOString().split("T")[0],
        auto_register: initialData.auto_register ?? true,
      });
    } else {
      setFormData({
        description: "",
        amount: "",
        source: "Salario",
        payment_method: "Transferencia",
        frequency: "biweekly",
        biweekly_type: "15_and_last_day",
        billing_day: 15,
        start_date: new Date().toISOString().split("T")[0],
        auto_register: true,
      });
    }
  }, [initialData, isOpen]);

  const paymentMethods = [
    "Transferencia",
    "Depósito Bancario",
    "Efectivo",
    "Cheque",
    "Otro",
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

      if (!formData.description.trim()) {
        toast.error("Por favor ingresa un concepto o descripción");
        setLoading(false);
        return;
      }

      const payload = {
        description: formData.description.trim(),
        amount: parsedAmount,
        currency,
        source: formData.source,
        payment_method: formData.payment_method,
        frequency: formData.frequency,
        biweekly_type: formData.frequency === "biweekly" ? formData.biweekly_type : undefined,
        billing_day: Number(formData.billing_day) || 15,
        start_date: new Date(formData.start_date + "T00:00:00Z").toISOString(),
        auto_register: formData.auto_register,
      };

      const url = initialData ? `/api/recurring-incomes/${initialData.id}` : "/api/recurring-incomes";
      const method = initialData ? "PUT" : "POST";

      const res = await safeFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error(res.error || "Error al guardar el ingreso recurrente");
        return;
      }

      toast.success(
        initialData 
          ? "Ingreso programado actualizado exitosamente" 
          : "Ingreso fijo programado exitosamente. Se registrará automáticamente en la fecha correspondiente."
      );
      onSuccess();
      onClose();
    } catch {
      toast.error("Ocurrió un error inesperado al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[92vh] overflow-y-auto bg-card border-border p-6 rounded-2xl shadow-xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-titles dark:text-foreground">
                {initialData ? "Editar Ingreso Fijo" : "Nuevo Ingreso Fijo"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configura un ingreso para que se registre automáticamente llegada su fecha de cobro
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Monto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Monto ({currency})</span>
              <span className="text-[11px] font-normal text-emerald-500">Monto a recibir</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                type="text"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: formatLiveNumber(e.target.value),
                  })
                }
                placeholder="0.00"
                className="pl-8 text-lg font-bold h-11 bg-secondary/30 border-border/80 focus:bg-background rounded-xl"
              />
            </div>
          </div>

          {/* Concepto / Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Concepto / Empleador / Cliente
            </label>
            <Input
              type="text"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ej: Salario Empresa, Pensión, Freelance Mensual"
              className="h-10 bg-secondary/30 border-border/80 focus:bg-background rounded-xl"
            />
          </div>

          {/* Frecuencia de cobro */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Frecuencia de Cobro</span>
              <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 font-semibold">
                ¿Cada cuánto recibes este ingreso?
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, frequency: "biweekly" })}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                  formData.frequency === "biweekly"
                    ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "border-border/80 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-titles dark:text-foreground">Quincenal</span>
                  {formData.frequency === "biweekly" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">2 pagos al mes</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, frequency: "monthly" })}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                  formData.frequency === "monthly"
                    ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "border-border/80 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-titles dark:text-foreground">Mensual</span>
                  {formData.frequency === "monthly" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">1 vez al mes</span>
              </button>
            </div>

            {/* Opciones secundarias: Semanal y Anual */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, frequency: "weekly" })}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer",
                  formData.frequency === "weekly"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border/60 bg-secondary/10 hover:bg-secondary/30 text-muted-foreground"
                )}
              >
                Semanal
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, frequency: "yearly" })}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer",
                  formData.frequency === "yearly"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border/60 bg-secondary/10 hover:bg-secondary/30 text-muted-foreground"
                )}
              >
                Anual
              </button>
            </div>
          </div>

          {/* Opciones específicas de Quincena */}
          {formData.frequency === "biweekly" && (
            <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Modalidad de Quincena
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="biweekly_type"
                    checked={formData.biweekly_type === "15_and_last_day"}
                    onChange={() => setFormData({ ...formData, biweekly_type: "15_and_last_day" })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Día 15 y último día del mes (Fin de mes)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="biweekly_type"
                    checked={formData.biweekly_type === "every_15_days"}
                    onChange={() => setFormData({ ...formData, biweekly_type: "every_15_days" })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Cada 15 días exactos a partir de la fecha de inicio</span>
                </label>
              </div>
            </div>
          )}

          {/* Opción específica de Cobro Mensual (Día del mes) */}
          {formData.frequency === "monthly" && (
            <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <span>Día del mes que recibes el pago</span>
                <span className="text-[11px] font-normal text-muted-foreground">Día 1 al 31</span>
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={formData.billing_day}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billing_day: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-24 h-10 bg-card text-center font-bold text-base"
                />
                <span className="text-xs text-muted-foreground">
                  de cada mes (si el mes tiene menos días, se ejecutará el último día).
                </span>
              </div>
            </div>
          )}

          {/* Fuente y Método de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fuente
              </label>
              <Select
                value={formData.source}
                onValueChange={(val) => setFormData({ ...formData, source: val })}
              >
                <SelectTrigger className="h-10 bg-secondary/30 border-border/80 rounded-xl">
                  <SelectValue placeholder="Selecciona una fuente" />
                </SelectTrigger>
                <SelectContent>
                  {sourceList.map((src) => (
                    <SelectItem key={src.id || src.name} value={src.name}>
                      {translate(`sources.${src.name}`) || src.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Método de Cobro
              </label>
              <Select
                value={formData.payment_method}
                onValueChange={(val) =>
                  setFormData({ ...formData, payment_method: val })
                }
              >
                <SelectTrigger className="h-10 bg-secondary/30 border-border/80 rounded-xl">
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha de inicio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Fecha de Inicio</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                A partir de cuándo aplicar
              </span>
            </label>
            <DatePicker
              value={formData.start_date}
              onChange={(val) => setFormData({ ...formData, start_date: val })}
              className="bg-secondary/30"
            />
          </div>

          {/* Switch de Auto-Registro */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60">
            <div>
              <p className="text-xs font-bold text-titles dark:text-foreground">
                Registro Automático
              </p>
              <p className="text-[11px] text-muted-foreground">
                Registrar el ingreso en el balance sin requerir confirmación manual
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_register}
                onChange={(e) =>
                  setFormData({ ...formData, auto_register: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-border/80 h-10 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold px-5 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : initialData ? (
                "Actualizar Ingreso Fijo"
              ) : (
                "Guardar Ingreso Fijo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
