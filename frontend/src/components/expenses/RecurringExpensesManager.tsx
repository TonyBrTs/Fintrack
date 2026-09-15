"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { formatCurrency, getCategoryColorBg, cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { safeFetch } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Repeat,
  Plus,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Loader2,
  CalendarClock,
  Zap,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecurringExpenseModal } from "./RecurringExpenseModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { RecurringExpense, RecurringSyncResult } from "@/types/index";

interface RecurringExpensesManagerProps {
  onExpenseGenerated?: () => void;
}

export function RecurringExpensesManager({ onExpenseGenerated }: RecurringExpensesManagerProps) {
  const { currency, currencySymbol } = useSettings();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRecurring = useCallback(async () => {
    try {
      setLoading(true);
      const res = await safeFetch<RecurringExpense[]>("/api/recurring-expenses");
      if (res.ok && Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await safeFetch<RecurringSyncResult>("/api/recurring-expenses/sync", {
        method: "POST",
      });

      if (res.ok && res.data) {
        if (res.data.processed_count > 0) {
          toast.success(
            `✨ Se registraron ${res.data.processed_count} gasto(s) automático(s) que llegaron a su fecha.`,
            { duration: 5000 }
          );
          if (onExpenseGenerated) onExpenseGenerated();
        } else {
          toast.info("Tus gastos fijos están al día. Ningún cobro pendiente hoy.");
        }
        fetchRecurring();
      }
    } catch {
      toast.error("Error al sincronizar los gastos automáticos");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  // Checks if a recurring item was already manually executed within the current billing cycle
  const isAlreadyExecutedThisPeriod = (item: RecurringExpense): boolean => {
    if (!item.last_executed_at) return false;
    const last = new Date(item.last_executed_at);
    const now = new Date();
    if (item.frequency === "biweekly") {
      const sameMonth = last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
      if (!sameMonth) return false;
      const lastIsFirst = last.getDate() <= 15;
      const nowIsFirst = now.getDate() <= 15;
      return lastIsFirst === nowIsFirst;
    }
    if (item.frequency === "monthly") {
      return last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
    }
    if (item.frequency === "weekly") {
      return (now.getTime() - last.getTime()) < 6 * 24 * 60 * 60 * 1000;
    }
    if (item.frequency === "yearly") {
      return last.getFullYear() === now.getFullYear();
    }
    return false;
  };

  const handleToggleActive = async (item: RecurringExpense) => {
    try {
      setActionLoadingId(item.id);
      const res = await safeFetch(`/api/recurring-expenses/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (res.ok) {
        toast.success(item.is_active ? "Gasto fijo pausado" : "Gasto fijo reactivado");
        fetchRecurring();
      } else {
        toast.error("No se pudo cambiar el estado");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteNow = async (item: RecurringExpense) => {
    try {
      setActionLoadingId(item.id);
      const res = await safeFetch(`/api/recurring-expenses/${item.id}/execute-now`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(`✨ Se registró "${item.description}" como gasto realizado hoy.`);
        if (onExpenseGenerated) onExpenseGenerated();
        fetchRecurring();
      } else {
        toast.error(res.error || "No se pudo registrar el gasto");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (item: RecurringExpense) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setActionLoadingId(deleteTarget.id);
      const res = await safeFetch(`/api/recurring-expenses/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Gasto fijo eliminado");
        fetchRecurring();
      } else {
        toast.error("Error al eliminar");
      }
    } finally {
      setActionLoadingId(null);
      setDeleteTarget(null);
    }
  };

  // Metrics
  const activeItems = useMemo(() => items.filter((i) => i.is_active), [items]);

  const monthlyTotal = useMemo(() => {
    return activeItems.reduce((acc, curr) => {
      if (curr.frequency === "biweekly") return acc + curr.amount * 2;
      if (curr.frequency === "monthly") return acc + curr.amount;
      if (curr.frequency === "weekly") return acc + curr.amount * 4;
      if (curr.frequency === "yearly") return acc + curr.amount / 12;
      return acc;
    }, 0);
  }, [activeItems]);

  const formatDueDateLabel = (dueDateStr: string | Date) => {
    const d = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return { label: "¡Hoy!", urgent: true };
    if (diffDays === 1) return { label: "Mañana", urgent: true };
    if (diffDays > 1 && diffDays <= 7) return { label: `En ${diffDays} días`, urgent: false };
    if (diffDays < 0) return { label: `Venció hace ${Math.abs(diffDays)}d`, urgent: true };

    return {
      label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      urgent: false,
    };
  };

  const getFrequencyBadge = (item: RecurringExpense) => {
    switch (item.frequency) {
      case "biweekly":
        return item.biweekly_type === "every_15_days" 
          ? "Quincenal (c/ 15 días)" 
          : "Quincenal (15 y fin de mes)";
      case "monthly":
        return `Mensual (Día ${item.billing_day || 15})`;
      case "weekly":
        return "Semanal";
      case "yearly":
        return "Anual";
      default:
        return item.frequency;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base sm:text-lg font-bold text-titles dark:text-foreground">
              Gastos Fijos y Recurrentes
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se registran automáticamente en tu historial al llegar su fecha
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            title="Sincronizar: Comprueba gastos recurrentes cuya fecha ya venció y los registra en el balance automáticamente"
            className="flex-1 sm:flex-initial rounded-xl font-bold text-xs h-9 px-3 border-border hover:bg-secondary cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", syncing && "animate-spin text-blue-600")} />
            <span>{syncing ? "Comprobando..." : "Sincronizar"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs h-9 px-3.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Nuevo Gasto Fijo</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Compact for Mobile & Tablet */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Mensual Estimado</span>
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 dark:text-rose-400">
            {currencySymbol}{formatCurrency(monthlyTotal)}
          </div>
          <span className="text-[11px] text-muted-foreground">En compromisos fijos activos</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Gastos Programados</span>
            <Repeat className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-titles dark:text-foreground">
            {activeItems.length} <span className="text-xs sm:text-sm font-normal text-muted-foreground">/ {items.length} activos</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CalendarClock className="w-3 h-3" />
            <span>Auto-registro activado</span>
          </span>
        </div>
      </div>

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-card border border-border/80 shadow-xs">
          <Repeat className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
          <p className="font-bold text-base text-titles dark:text-foreground">
            No tienes gastos fijos programados
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Configura tus pagos habituales (renta, servicios, suscripciones) para que se registren solos al llegar la fecha.
          </p>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Crear Primer Gasto Fijo
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/80">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <span className="text-xs">Cargando compromisos fijos...</span>
        </div>
      )}

      {/* Mobile Card List (Visible on phones & small screens) */}
      {!loading && items.length > 0 && (
        <div className="block md:hidden space-y-3">
          {items.map((item) => {
            const dueInfo = formatDueDateLabel(item.next_due_date);
            const isActionLoading = actionLoadingId === item.id;
            const alreadyExecuted = isAlreadyExecutedThisPeriod(item);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3 transition-all",
                  !item.is_active && "opacity-60 bg-secondary/15"
                )}
              >
                {/* Header Row: Title, Status, Category, & Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Title + Active/Inactive toggle */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-titles dark:text-foreground truncate max-w-[200px]">
                        {item.description}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        disabled={isActionLoading}
                        title={item.is_active ? "Activo • Clic para desactivar" : "Inactivo • Clic para activar"}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-all cursor-pointer",
                          item.is_active
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            item.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          )}
                        />
                        <span>{item.is_active ? "Activo" : "Inactivo"}</span>
                      </button>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-md text-[11px] font-medium">
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", getCategoryColorBg(item.category))} />
                        <span>{item.category}</span>
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md text-[11px]">
                        {getFrequencyBadge(item)}
                      </span>
                      {item.auto_register ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Auto
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                          Manual
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-rose-500 dark:text-rose-400 whitespace-nowrap">
                      -{currencySymbol}{formatCurrency(item.amount)}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                      {item.currency}
                    </span>
                  </div>
                </div>

                {/* Due Date Indicator Banner */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/40 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Próximo cobro:</span>
                    <span className="font-bold text-foreground">
                      {new Date(item.next_due_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap",
                      dueInfo.urgent
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    )}
                  >
                    {dueInfo.label}
                  </span>
                </div>

                {/* Actions Bar for Mobile */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-2">
                  {/* Registrar Hoy button */}
                  <Button
                    variant="outline"
                    size="sm"
                    title={
                      alreadyExecuted
                        ? "Ya registrado en este ciclo"
                        : "Registrar ahora en el balance (adelantar cobro)"
                    }
                    onClick={() => handleExecuteNow(item)}
                    disabled={isActionLoading || !item.is_active || alreadyExecuted}
                    className={cn(
                      "flex-1 rounded-xl text-xs font-bold h-8.5 border cursor-pointer",
                      alreadyExecuted
                        ? "text-slate-400 border-slate-300/30 opacity-50 cursor-not-allowed"
                        : "text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                    )}
                  >
                    <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
                    {alreadyExecuted ? "Ya Registrado" : "Registrar Ahora"}
                  </Button>

                  {/* Icon Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title={item.is_active ? "Desactivar automatización" : "Activar automatización"}
                      onClick={() => handleToggleActive(item)}
                      disabled={isActionLoading}
                      className="h-8.5 w-8.5 text-muted-foreground hover:bg-secondary rounded-xl cursor-pointer"
                    >
                      <Power className={cn("w-3.5 h-3.5", item.is_active ? "text-emerald-500" : "text-slate-400")} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Editar datos de este gasto fijo"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsModalOpen(true);
                      }}
                      disabled={isActionLoading}
                      className="h-8.5 w-8.5 text-muted-foreground hover:bg-secondary rounded-xl cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Eliminar este gasto fijo"
                      onClick={() => handleDelete(item)}
                      disabled={isActionLoading}
                      className="h-8.5 w-8.5 text-rose-500 hover:bg-rose-500/15 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Desktop Table (Visible on md screens and up) */}
      {!loading && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block bg-card dark:bg-card/75 backdrop-blur-sm border border-border/80 rounded-2xl overflow-hidden shadow-xs"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/40">
                <TableRow className="border-b border-border/60">
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    Estado
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground">
                    Concepto
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground">
                    Frecuencia
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground">
                    Próxima Fecha
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    Monto Fijo
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const dueInfo = formatDueDateLabel(item.next_due_date);
                  const isActionLoading = actionLoadingId === item.id;

                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "border-b border-border/40 transition-colors",
                        !item.is_active && "opacity-50 bg-secondary/15"
                      )}
                    >
                      {/* Estado */}
                      <TableCell className="px-4 py-3.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          disabled={isActionLoading}
                          title={item.is_active ? "Activo • Clic para desactivar" : "Inactivo • Clic para activar"}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs",
                            item.is_active
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            )}
                          />
                          <span>{item.is_active ? "Activo" : "Inactivo"}</span>
                        </button>
                      </TableCell>

                      {/* Concepto & Categoría */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-titles dark:text-foreground">
                            {item.description}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                getCategoryColorBg(item.category)
                              )}
                            />
                            <span className="text-xs text-muted-foreground">{item.category}</span>
                            <span className="text-xs text-muted-foreground/50">•</span>
                            <span className="text-xs text-muted-foreground">{item.payment_method}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Frecuencia */}
                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-medium bg-secondary/60 px-2.5 py-1 rounded-lg border border-border/50 text-foreground">
                          {getFrequencyBadge(item)}
                        </span>
                      </TableCell>

                      {/* Próxima Fecha */}
                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "text-xs font-bold",
                                dueInfo.urgent ? "text-amber-600 dark:text-amber-400" : "text-titles dark:text-foreground"
                              )}
                            >
                              {new Date(item.next_due_date).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                dueInfo.urgent
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              )}
                            >
                              {dueInfo.label}
                            </span>
                          </div>
                          {item.last_executed_at && (
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              Último: {new Date(item.last_executed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Monto */}
                      <TableCell className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-sm font-black text-rose-500 dark:text-rose-400">
                            -{currencySymbol}{formatCurrency(item.amount)}
                          </span>
                          <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                            {item.currency}
                          </span>
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Registrar ahora */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={
                              isAlreadyExecutedThisPeriod(item)
                                ? "Ya registrado en este ciclo"
                                : "Registrar cobro ahora (adelantar en el historial)"
                            }
                            onClick={() => handleExecuteNow(item)}
                            disabled={isActionLoading || isAlreadyExecutedThisPeriod(item)}
                            className={cn(
                              "h-8 w-8 rounded-lg cursor-pointer",
                              isAlreadyExecutedThisPeriod(item)
                                ? "text-slate-400 opacity-50 cursor-not-allowed"
                                : "text-blue-600 hover:bg-blue-500/15"
                            )}
                          >
                            <Zap className="w-4 h-4 fill-current" />
                          </Button>

                          {/* Pausar / Activar */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={item.is_active ? "Desactivar automatización" : "Activar automatización"}
                            onClick={() => handleToggleActive(item)}
                            disabled={isActionLoading}
                            className="h-8 w-8 text-muted-foreground hover:bg-secondary rounded-lg cursor-pointer"
                          >
                            <Power className={cn("w-3.5 h-3.5", item.is_active ? "text-emerald-500" : "text-slate-400")} />
                          </Button>

                          {/* Editar */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Editar datos de este gasto fijo"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsModalOpen(true);
                            }}
                            disabled={isActionLoading}
                            className="h-8 w-8 text-muted-foreground hover:bg-secondary rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Eliminar */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Eliminar este gasto fijo"
                            onClick={() => handleDelete(item)}
                            disabled={isActionLoading}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-500/15 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}

      <RecurringExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          fetchRecurring();
          if (onExpenseGenerated) onExpenseGenerated();
        }}
        initialData={selectedItem}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={!!actionLoadingId}
        title="Eliminar gasto fijo"
        description={`¿Eliminar "${deleteTarget?.description}"? Los gastos ya registrados previamente se conservarán.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
