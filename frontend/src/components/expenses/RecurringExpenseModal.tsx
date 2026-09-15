"use client";

import { useState, useEffect } from "react";
import { cn, formatLiveNumber, parseLiveNumber, getCategoryColorBg, getTodayLocal } from "@/lib/utils";
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
import { useCategories } from "@/hooks/useCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecurringExpense, RecurringFrequency, BiweeklyType } from "@/types/index";

interface RecurringExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: RecurringExpense | null;
}

export function RecurringExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: RecurringExpenseModalProps) {
  const { translate, currency, currencySymbol } = useSettings();
  const { categories: categoryList } = useCategories("expense");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Servicios",
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
        category: initialData.category || "Servicios",
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
        category: "Servicios",
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
    "Tarjeta de Débito",
    "Tarjeta de Crédito",
    "Efectivo",
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
        category: formData.category,
        payment_method: formData.payment_method,
        frequency: formData.frequency,
        biweekly_type: formData.frequency === "biweekly" ? formData.biweekly_type : undefined,
        billing_day: Number(formData.billing_day) || 15,
        start_date: new Date(formData.start_date + "T12:00:00Z").toISOString(),
        auto_register: formData.auto_register,
        is_active: formData.is_active,
      };

      const url = initialData ? `/api/recurring-expenses/${initialData.id}` : "/api/recurring-expenses";
      const method = initialData ? "PUT" : "POST";

      const res = await safeFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error(res.error || "Error al guardar el gasto recurrente");
        return;
      }

      toast.success(
        initialData 
          ? "Gasto programado actualizado exitosamente" 
          : "Gasto fijo programado exitosamente. Se registrará automáticamente en la fecha correspondiente."
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
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-titles dark:text-foreground">
                {initialData ? "Editar Gasto Fijo" : "Nuevo Gasto Fijo"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configura un gasto para que se registre automáticamente llegada su fecha
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Monto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Monto ({currency})</span>
              <span className="text-[11px] font-normal text-blue-500">Monto del cobro</span>
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
              Concepto / Nombre
            </label>
            <Input
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Alquiler, Internet, Netflix, Gimnasio..."
              className="h-10 bg-secondary/30 border-border/80 rounded-xl text-sm"
            />
          </div>

          {/* Frecuencia de Ejecución */}
          <div className="space-y-1.5 bg-blue-500/5 dark:bg-blue-500/10 p-3.5 rounded-2xl border border-blue-500/20">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <CalendarLucide className="w-3.5 h-3.5" />
              <span>Frecuencia del Gasto Fijo</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: "biweekly", label: "Quincenal", desc: "Pago quincena" },
                { id: "monthly", label: "Mensual", desc: "Día fijo al mes" },
                { id: "weekly", label: "Semanal", desc: "Cada semana" },
                { id: "yearly", label: "Anual", desc: "Una vez al año" },
              ].map((freq) => (
                <button
                  type="button"
                  key={freq.id}
                  onClick={() => setFormData({ ...formData, frequency: freq.id as RecurringFrequency })}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center",
                    formData.frequency === freq.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-background/80 hover:bg-secondary/70 border-border text-foreground"
                  )}
                >
                  <span className="font-bold">{freq.label}</span>
                  <span className={cn("text-[10px] opacity-80", formData.frequency === freq.id ? "text-white" : "text-muted-foreground")}>
                    {freq.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Opciones específicas para Quincenal */}
            {formData.frequency === "biweekly" && (
              <div className="pt-2.5 mt-2 border-t border-blue-500/20 space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Esquema de quincena:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, biweekly_type: "15_and_last_day" })}
                    className={cn(
                      "p-2.5 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer flex items-start gap-2",
                      formData.biweekly_type === "15_and_last_day"
                        ? "bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold"
                        : "bg-background/60 border-border hover:bg-secondary/50 text-muted-foreground"
                    )}
                  >
                    <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", formData.biweekly_type === "15_and_last_day" ? "text-blue-600" : "opacity-30")} />
                    <div>
                      <div className="font-bold text-foreground">Día 15 y Fin de Mes</div>
                      <div className="text-[10px]">Típico pago de planilla o quincena laboral</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, biweekly_type: "every_15_days" })}
                    className={cn(
                      "p-2.5 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer flex items-start gap-2",
                      formData.biweekly_type === "every_15_days"
                        ? "bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold"
                        : "bg-background/60 border-border hover:bg-secondary/50 text-muted-foreground"
                    )}
                  >
                    <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", formData.biweekly_type === "every_15_days" ? "text-blue-600" : "opacity-30")} />
                    <div>
                      <div className="font-bold text-foreground">Cada 15 días exactos</div>
                      <div className="text-[10px]">Intervalo regular a partir de la fecha de inicio</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Opciones específicas para Mensual */}
            {formData.frequency === "monthly" && (
              <div className="pt-3 mt-2 border-t border-blue-500/20 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Día del mes a cobrar:
                </span>
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
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-secondary/40 border-border/60 text-muted-foreground hover:border-blue-400 hover:text-blue-600"
                        }`}
                      >
                        {d === "Último" ? "Último día" : `Día ${d}`}
                      </button>
                    );
                  })}
                </div>
                {/* Custom number input */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">O escribe un día:</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.billing_day}
                    onChange={(e) => setFormData({ ...formData, billing_day: parseInt(e.target.value) || 1 })}
                    className="w-16 h-8 text-center font-bold text-sm bg-background border border-border rounded-lg"
                  />
                  <span className="text-xs text-muted-foreground">de cada mes</span>
                </div>
                {/* Live preview of next 3 due dates */}
                <div className="text-[11px] text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                  <span className="font-semibold text-foreground/70">Próximos cobros: </span>
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
          </div>

          {/* Categoría y Método de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categoría
              </label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-secondary/30 border-border/80">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryList.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            getCategoryColorBg(cat.name)
                          )}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Medio de Pago
              </label>
              <Select
                value={formData.payment_method}
                onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-secondary/30 border-border/80">
                  <SelectValue placeholder="Seleccionar método" />
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
              <span className="text-[11px] font-normal text-muted-foreground">Primer ciclo</span>
            </label>
            <DatePicker
              value={formData.start_date}
              onChange={(val) => setFormData({ ...formData, start_date: val })}
              className="bg-secondary/30"
            />
          </div>

          {/* Interruptor de Automatización */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/60 gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
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
                  Registra el gasto en el balance en la fecha sin requerir acción manual
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.auto_register}
                onChange={(e) => setFormData({ ...formData, auto_register: e.target.checked })}
                className="sr-only peer"
              />
              <div
                className={cn(
                  "w-10 h-5.5 rounded-full transition-colors relative cursor-pointer",
                  "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all after:shadow-xs",
                  formData.auto_register
                    ? "bg-blue-600 dark:bg-blue-500 after:translate-x-[18px]"
                    : "bg-slate-300 dark:bg-slate-700 after:translate-x-0"
                )}
              />
            </label>
          </div>

          {/* Switch de Estado (Activo / Pausado) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/60 gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Power className={cn("w-4 h-4 shrink-0 mt-0.5", formData.is_active ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-titles dark:text-foreground block">
                    Estado del Gasto Fijo
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
                    ? "El gasto está vigente y programado para sus pagos"
                    : "El gasto está pausado y no generará movimientos"}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="sr-only peer"
              />
              <div
                className={cn(
                  "w-10 h-5.5 rounded-full transition-colors relative cursor-pointer",
                  "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all after:shadow-xs",
                  formData.is_active
                    ? "bg-blue-600 dark:bg-blue-500 after:translate-x-[18px]"
                    : "bg-slate-300 dark:bg-slate-700 after:translate-x-0"
                )}
              />
            </label>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-border/80 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : initialData ? (
                "Guardar Cambios"
              ) : (
                "Crear Gasto Fijo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
