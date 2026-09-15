"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { formatCurrency, cn } from "@/lib/utils";
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
  TrendingUp,
  Zap,
  Power,
  CalendarClock,
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
import { RecurringIncomeModal } from "./RecurringIncomeModal";
import { DeleteConfirmDialog } from "@/components/expenses/DeleteConfirmDialog";
import type { RecurringIncome, RecurringIncomeSyncResult } from "@/types/index";

const sourceBadgeVariants: Record<string, "success" | "info" | "warning" | "default"> = {
  Salario: "success",
  Freelance: "info",
  Inversiones: "warning",
  Regalo: "success",
  Otros: "default",
};

interface RecurringIncomesManagerProps {
  onIncomeGenerated?: () => void;
}

export function RecurringIncomesManager({ onIncomeGenerated }: RecurringIncomesManagerProps) {
  const { currency, currencySymbol } = useSettings();
  const [items, setItems] = useState<RecurringIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringIncome | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringIncome | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRecurring = useCallback(async () => {
    try {
      setLoading(true);
      const res = await safeFetch<RecurringIncome[]>("/api/recurring-incomes");
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
      const res = await safeFetch<RecurringIncomeSyncResult>("/api/recurring-incomes/sync", {
        method: "POST",
      });

      if (res.ok && res.data) {
        if (res.data.processed_count > 0) {
          toast.success(
            `✨ Se registraron ${res.data.processed_count} ingreso(s) automático(s) que llegaron a su fecha.`,
            { duration: 5000 }
          );
          if (onIncomeGenerated) onIncomeGenerated();
        } else {
          toast.info("Tus ingresos fijos están al día. Ningún cobro pendiente hoy.");
        }
        fetchRecurring();
      }
    } catch {
      toast.error("Error al sincronizar los ingresos automáticos");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  // Checks if a recurring item was already manually executed within the current billing cycle
  const isAlreadyExecutedThisPeriod = (item: RecurringIncome): boolean => {
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

  const handleToggleActive = async (item: RecurringIncome) => {
    try {
      setActionLoadingId(item.id);
      const res = await safeFetch(`/api/recurring-incomes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (res.ok) {
        toast.success(
          item.is_active ? "Ingreso programado pausado" : "Ingreso programado reactivado"
        );
        fetchRecurring();
      } else {
        toast.error("No se pudo cambiar el estado del ingreso");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteNow = async (item: RecurringIncome) => {
    try {
      setActionLoadingId(item.id);
      const res = await safeFetch<{ message: string; income: any }>(`/api/recurring-incomes/${item.id}/execute-now`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(`✨ Se registró "${item.description}" como ingreso recibido hoy.`);
        if (onIncomeGenerated) onIncomeGenerated();
        fetchRecurring();
      } else {
        toast.error(res.error || "No se pudo registrar el ingreso");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (item: RecurringIncome) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setActionLoadingId(deleteTarget.id);
      const res = await safeFetch(`/api/recurring-incomes/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Ingreso fijo eliminado");
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

  const getFrequencyBadge = (item: RecurringIncome) => {
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
            <Repeat className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base sm:text-lg font-bold text-titles dark:text-foreground">
              Ingresos Fijos y Recurrentes
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se registran automáticamente en tu balance al llegar su fecha de cobro
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            title="Sincronizar: Comprueba ingresos recurrentes cuya fecha ya venció y los registra en el balance automáticamente"
            className="flex-1 sm:flex-initial rounded-xl font-bold text-xs h-9 px-3 border-border hover:bg-secondary cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", syncing && "animate-spin text-emerald-600")} />
            <span>{syncing ? "Comprobando..." : "Sincronizar"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs h-9 px-3.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Nuevo Ingreso Fijo</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ingreso Fijo Proyectado
            </p>
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              +{currencySymbol}{formatCurrency(monthlyTotal)}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              / mes
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Basado en {activeItems.length} ingreso(s) activos
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Próximo Cobro
            </p>
            <Calendar className="w-4 h-4 text-teal-500 shrink-0" />
          </div>
          <div className="mt-2">
            {activeItems.length > 0 ? (
              <>
                <span className="text-sm sm:text-base font-bold text-titles dark:text-foreground truncate block">
                  {activeItems[0].description}
                </span>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {new Date(activeItems[0].next_due_date).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })} (
                  {formatDueDateLabel(activeItems[0].next_due_date).label})
                </p>
              </>
            ) : (
              <span className="text-sm text-muted-foreground block mt-1">Sin ingresos activos</span>
            )}
          </div>
        </div>
      </div>

      {/* Content: List or Empty State */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin opacity-70" />
          <p className="text-xs text-muted-foreground">Cargando ingresos fijos...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-card border border-dashed border-border/90 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Repeat className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-titles dark:text-foreground">
              No tienes ingresos fijos configurados
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Programa tu salario quincenal, pensión o cobros recurrentes de clientes para que se registren automáticamente sin que tengas que hacerlo a mano.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 px-4 cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Configurar mi primer ingreso fijo
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (md:hidden) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {items.map((item) => {
              const dueInfo = formatDueDateLabel(item.next_due_date);
              const isLoadingThis = actionLoadingId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3 transition-all",
                    !item.is_active && "opacity-60 bg-secondary/15"
                  )}
                >
                  {/* Header Row: Title, Status, Source, & Amount */}
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
                          disabled={isLoadingThis}
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
                        <Badge
                          variant={sourceBadgeVariants[item.source] || "default"}
                          className="text-[10px] px-2 py-0.5 font-bold"
                        >
                          {item.source}
                        </Badge>
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
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block whitespace-nowrap">
                        +{currencySymbol}{formatCurrency(item.amount)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                        {currency}
                      </span>
                    </div>
                  </div>

                  {/* Due Date Indicator Banner */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/40 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
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
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      )}
                    >
                      {dueInfo.label}
                    </span>
                  </div>

                  {/* Actions Bar for Mobile */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-2">
                    {/* Cobrar Ahora button */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoadingThis || !item.is_active || isAlreadyExecutedThisPeriod(item)}
                      onClick={() => handleExecuteNow(item)}
                      title={
                        isAlreadyExecutedThisPeriod(item)
                          ? "Ya registrado en este ciclo"
                          : "Registrar cobro ahora (adelantar en el historial)"
                      }
                      className={cn(
                        "flex-1 rounded-xl text-xs font-bold h-8.5 border cursor-pointer",
                        isAlreadyExecutedThisPeriod(item)
                          ? "text-slate-400 border-slate-300/30 opacity-50 cursor-not-allowed"
                          : "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      )}
                    >
                      <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
                      {isAlreadyExecutedThisPeriod(item) ? "Ya Registrado" : "Cobrar Ahora"}
                    </Button>

                    {/* Icon Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isLoadingThis}
                        onClick={() => handleToggleActive(item)}
                        title={item.is_active ? "Desactivar cobro automático" : "Activar cobro automático"}
                        className="h-8.5 w-8.5 text-muted-foreground hover:bg-secondary rounded-xl cursor-pointer"
                      >
                        <Power className={cn("w-3.5 h-3.5", item.is_active ? "text-emerald-500" : "text-slate-400")} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isLoadingThis}
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                        title="Editar datos de este ingreso fijo"
                        className="h-8.5 w-8.5 text-muted-foreground hover:bg-secondary rounded-xl cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isLoadingThis}
                        onClick={() => handleDelete(item)}
                        title="Eliminar este ingreso fijo"
                        className="h-8.5 w-8.5 text-rose-500 hover:bg-rose-500/15 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block bg-card rounded-3xl border border-border/80 overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-secondary/40">
                <TableRow className="border-b border-border/60">
                  <TableHead className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground">
                    Concepto
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground text-center">
                    Fuente
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground text-center">
                    Frecuencia
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground text-center">
                    Próximo Cobro
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground text-center">
                    Monto
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground text-center">
                    Estado
                  </TableHead>
                  <TableHead className="px-5 py-3 text-xs font-bold uppercase text-muted-foreground text-center">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const dueInfo = formatDueDateLabel(item.next_due_date);
                  const isLoadingThis = actionLoadingId === item.id;

                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "border-b border-border/40 hover:bg-secondary/20 transition-colors",
                        !item.is_active && "opacity-60 bg-secondary/10"
                      )}
                    >
                      <TableCell className="px-5 py-4 font-bold text-sm text-titles dark:text-foreground">
                        <div className="flex flex-col">
                          <span>{item.description}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            {item.payment_method}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center whitespace-nowrap">
                        <Badge
                          variant={sourceBadgeVariants[item.source] || "default"}
                          className="text-xs px-2.5 py-0.5 font-bold"
                        >
                          {item.source}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-xs font-semibold text-muted-foreground text-center whitespace-nowrap">
                        <span className="bg-secondary/60 px-2.5 py-1 rounded-lg border border-border/50 text-foreground inline-block">
                          {getFrequencyBadge(item)}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-xs text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={cn(
                              "font-bold",
                              dueInfo.urgent
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-titles dark:text-foreground"
                            )}
                          >
                            {new Date(item.next_due_date).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            {dueInfo.label}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            +{currencySymbol}{formatCurrency(item.amount)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">
                            {currency}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          disabled={isLoadingThis}
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

                      <TableCell className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={
                              isAlreadyExecutedThisPeriod(item)
                                ? "Ya registrado en este ciclo"
                                : "Cobrar ahora (adelantar registro de ingreso en el balance)"
                            }
                            disabled={isLoadingThis || !item.is_active || isAlreadyExecutedThisPeriod(item)}
                            onClick={() => handleExecuteNow(item)}
                            className={cn(
                              "h-8 w-8 rounded-lg cursor-pointer",
                              isAlreadyExecutedThisPeriod(item)
                                ? "text-slate-400 opacity-50 cursor-not-allowed"
                                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                            )}
                          >
                            <Zap className="w-4 h-4 fill-current" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={item.is_active ? "Desactivar cobro automático" : "Activar cobro automático"}
                            disabled={isLoadingThis}
                            onClick={() => handleToggleActive(item)}
                            className="h-8 w-8 text-muted-foreground hover:bg-secondary rounded-lg cursor-pointer"
                          >
                            <Power className={cn("w-3.5 h-3.5", item.is_active ? "text-emerald-500" : "text-slate-400")} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Editar datos de este ingreso fijo"
                            disabled={isLoadingThis}
                            onClick={() => {
                              setSelectedItem(item);
                              setIsModalOpen(true);
                            }}
                            className="h-8 w-8 text-muted-foreground hover:bg-secondary rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Eliminar este ingreso fijo"
                            disabled={isLoadingThis}
                            onClick={() => handleDelete(item)}
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
        </>
      )}

      {/* Modal */}
      <RecurringIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchRecurring();
          if (onIncomeGenerated) onIncomeGenerated();
        }}
        initialData={selectedItem}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={!!actionLoadingId}
        title="Eliminar ingreso fijo"
        description={`¿Eliminar "${deleteTarget?.description}"? Los ingresos ya registrados previamente se conservarán.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
