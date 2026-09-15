"use client";

import { useState, useEffect } from "react";
import { cn, formatLiveNumber, parseLiveNumber, getTodayLocal } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { safeFetch } from "@/lib/api";
import { Loader2, Calendar as CalendarLucide, Repeat, CalendarClock, CheckCircle2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
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
    start_date: getTodayLocal(),
    auto_register: true,
    is_active: true,
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
        is_active: initialData.is_active ?? true,
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
        start_date: getTodayLocal(),
        auto_register: true,
        is_active: true,
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
        start_date: new Date(formData.start_date + "T12:00:00Z").toISOString(),
        auto_register: formData.auto_register,
        is_active: formData.is_active,
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
                <CalendarLucide className="w-3.5 h-3.5" />
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
            <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3">
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                Día del mes que recibes el pago
              </label>
              {/* Quick select pills */}
              <div className="flex flex-wrap gap-1.5">
                {[1, 5, 10, 15, 20, 25, "Último"].map((d) => {
                  const val = d === "Último" ? 31 : Number(d);
                  const isSelected = formData.billing_day === val;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, billing_day: val })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-secondary/40 border-border/60 text-muted-foreground hover:border-emerald-400 hover:text-emerald-600"
                      }`}
                    >
                      {d === "Último" ? "Último día" : `Día ${d}`}
                    </button>
                  );
                })}
              </div>
              {/* Custom number input */}
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
              {/* Live preview of next 3 due dates */}
              <div className="text-[11px] text-muted-foreground bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Próximos cobros: </span>
                {(() => {
                  const day = Math.min(formData.billing_day || 15, 31);
                  const now = new Date();
                  const dates: string[] = [];
                  let y = now.getFullYear();
                  let m = now.getMonth();
                  while (dates.length < 3) {
                    const lastOfMonth = new Date(y, m + 1, 0).getDate();
                    const d = Math.min(day, lastOfMonth);
                    const dt = new Date(y, m, d);
                    if (dt >= now) {
                      dates.push(dt.toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" }));
                    }
                    m++;
                    if (m > 11) { m = 0; y++; }
                  }
                  return dates.join(" · ");
                })()}
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
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/60 gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <CalendarClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-titles dark:text-foreground block">
                    Registro Automático
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors",
                      formData.auto_register
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-400/30"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        formData.auto_register ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      )}
                    />
                    {formData.auto_register ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Registra el ingreso en el balance en la fecha sin requerir acción manual
                </span>
              </div>
            </div>

            <Switch
              checked={formData.auto_register}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, auto_register: checked })
              }
              activeColor="bg-emerald-600"
            />
          </div>

          {/* Switch de Estado (Activo / Pausado) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/60 gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Power className={cn("w-4 h-4 shrink-0 mt-0.5", formData.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-titles dark:text-foreground block">
                    Estado del Ingreso
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors",
                      formData.is_active
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-400/30"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        formData.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      )}
                    />
                    {formData.is_active ? "Activo" : "Pausado"}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  {formData.is_active
                    ? "El ingreso está vigente y programado para sus cobros"
                    : "El cobro está pausado y no generará movimientos"}
                </span>
              </div>
            </div>

            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
              activeColor="bg-emerald-500"
            />
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
