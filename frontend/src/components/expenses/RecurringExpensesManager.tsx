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
  Play,
  Pause,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
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
import type { RecurringExpense, RecurringSyncResult } from "@/types/index";

interface RecurringExpensesManagerProps {
  onExpenseGenerated?: () => void;
}

export function RecurringExpensesManager({ onExpenseGenerated }: RecurringExpensesManagerProps) {
  const { currency, currencySymbol, translate } = useSettings();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringExpense | null>(null);
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
            `✨ Se procesaron y registraron ${res.data.processed_count} gasto(s) automático(s) de tu quincena/mes.`,
            { duration: 5000 }
          );
          if (onExpenseGenerated) onExpenseGenerated();
        } else {
          toast.info("Todos tus gastos fijos están al día. Ningún cobro pendiente hoy.");
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

  const handleDelete = async (item: RecurringExpense) => {
    if (!confirm(`¿Eliminar la programación de "${item.description}"? Los gastos ya registrados previamente no se borrarán.`)) {
      return;
    }

    try {
      setActionLoadingId(item.id);
      const res = await safeFetch(`/api/recurring-expenses/${item.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Programación de gasto eliminada");
        fetchRecurring();
      } else {
        toast.error("Error al eliminar la programación");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics
  const activeItems = useMemo(() => items.filter((i) => i.is_active), [items]);
  const biweeklyTotal = useMemo(() => {
    return activeItems
      .filter((i) => i.frequency === "biweekly")
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [activeItems]);

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
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-titles dark:text-foreground">
              Automatización de Gastos de Quincena y Fijos
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              FinTrack registrará estos gastos automáticamente en tu historial contable tan pronto llegue la fecha
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl font-bold text-xs h-9 px-3 border-blue-500/30 hover:bg-blue-500/10 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", syncing && "animate-spin text-blue-600")} />
            <span>{syncing ? "Comprobando..." : "Sincronizar ahora"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-3.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Programar Gasto</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Compromiso por Quincena</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-titles dark:text-foreground">
            {currencySymbol}{formatCurrency(biweeklyTotal)}
          </div>
          <span className="text-[11px] text-muted-foreground">En gastos quincenales activos</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Carga Mensual Proyectada</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-rose-500 dark:text-rose-400">
            {currencySymbol}{formatCurrency(monthlyTotal)}
          </div>
          <span className="text-[11px] text-muted-foreground">Total estimado de gastos fijos al mes</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Compromisos Registrados</span>
            <Repeat className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-titles dark:text-foreground">
            {activeItems.length} <span className="text-sm font-normal text-muted-foreground">/ {items.length} activos</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {items.some((i) => i.auto_register) ? "⚡ Con auto-registro activado" : "Manual"}
          </span>
        </div>
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card dark:bg-card/75 backdrop-blur-sm border border-border/80 rounded-2xl overflow-hidden shadow-xs"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow className="border-b border-border/60">
                <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground">
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
                <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground text-right">
                  Monto Fijo
                </TableHead>
                <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span className="text-xs">Cargando compromisos programados...</span>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Repeat className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-500" />
                    <p className="font-bold text-sm text-titles dark:text-foreground">
                      No tienes gastos fijos programados
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                      Programa el pago de tu quincena, alquiler, servicios o suscripciones para que se registren automáticamente.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsModalOpen(true)}
                      className="bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Programar Primer Gasto Fijo
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
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
                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={item.is_active ? "success" : "default"}
                          className="text-[11px] font-bold"
                        >
                          {item.is_active ? "Activo" : "Pausado"}
                        </Badge>
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
                      <TableCell className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-rose-500 dark:text-rose-400">
                          -{currencySymbol}{formatCurrency(item.amount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                          {item.currency}
                        </span>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Registrar ahora */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Registrar gasto ahora anticipadamente"
                            onClick={() => handleExecuteNow(item)}
                            disabled={isActionLoading}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-500/15 rounded-lg cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>

                          {/* Pausar / Activar */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={item.is_active ? "Pausar automatización" : "Reanudar automatización"}
                            onClick={() => handleToggleActive(item)}
                            disabled={isActionLoading}
                            className="h-8 w-8 text-muted-foreground hover:bg-secondary rounded-lg cursor-pointer"
                          >
                            {item.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                          </Button>

                          {/* Editar */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Editar programación"
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
                            title="Eliminar programación"
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
                })
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

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
    </div>
  );
}
