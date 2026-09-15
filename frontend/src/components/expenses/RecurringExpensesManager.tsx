"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  formatCurrency,
  getCategoryColorBg,
  cn,
  formatCalendarDate,
  parseCalendarDate,
  formatDueDateLabel,
  formatFrequencyLabel,
} from "@/lib/utils";
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
  ChevronDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  const { currency, currencySymbol, language, translate } = useSettings();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  return (
    <div className="space-y-5">
      {/* Top Bar / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base sm:text-lg font-bold text-titles dark:text-foreground">
              {translate("recurring.expensesTitle", "Gastos Fijos y Recurrentes")}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {translate("recurring.expensesSubtitle", "Se registran automáticamente en tu historial al llegar su fecha")}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            title={language === "en" ? "Sync due recurring expenses" : "Sincronizar gastos vencidos"}
            className="flex-1 sm:flex-initial rounded-xl font-bold text-xs h-9 px-3 border-border hover:bg-secondary cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", syncing && "animate-spin text-blue-600")} />
            <span>{syncing ? (language === "en" ? "Checking..." : "Comprobando...") : translate("recurring.sync", "Sincronizar")}</span>
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
            <span>{translate("recurring.newExpense", "Nuevo Gasto Fijo")}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Compact for Mobile & Tablet */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {translate("recurring.estimatedMonthly", "Total Mensual Estimado")}
            </span>
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 dark:text-rose-400">
            {currencySymbol}{formatCurrency(monthlyTotal)}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {translate("recurring.activeExpensesDesc", "En compromisos fijos activos")}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {translate("recurring.scheduledExpenses", "Gastos Programados")}
            </span>
            <Repeat className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-titles dark:text-foreground">
            {activeItems.length}{" "}
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">
              / {items.length} {translate("recurring.activeRatio", "activos")}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CalendarClock className="w-3 h-3" />
            <span>{translate("recurring.autoRegisterActive", "Auto-registro activado")}</span>
          </span>
        </div>
      </div>

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-card border border-border/80 shadow-xs">
          <Repeat className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
          <p className="font-bold text-base text-titles dark:text-foreground">
            {translate("recurring.noExpensesTitle", "No tienes gastos fijos programados")}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {translate("recurring.noExpensesDesc", "Configura tus pagos habituales (renta, servicios, suscripciones) para que se registren solos al llegar la fecha.")}
          </p>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {translate("recurring.createFirstExpense", "Crear Primer Gasto Fijo")}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/80">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <span className="text-xs">{language === "en" ? "Loading fixed expenses..." : "Cargando compromisos fijos..."}</span>
        </div>
      )}

      {/* Mobile Card List (Visible on phones & small screens) */}
      {!loading && items.length > 0 && (
        <div className="block md:hidden space-y-3">
          {items.map((item) => {
            const dueInfo = formatDueDateLabel(item.next_due_date, language);
            const isActionLoading = actionLoadingId === item.id;
            const alreadyExecuted = isAlreadyExecutedThisPeriod(item);
            const isExpanded = !!expandedIds[item.id];

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2.5 transition-all",
                  !item.is_active && "opacity-65 bg-secondary/15"
                )}
              >
                {/* Fila 1: Concepto Principal y Monto */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-titles dark:text-foreground truncate">
                      {item.description}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-rose-500 dark:text-rose-400 whitespace-nowrap">
                      -{currencySymbol}{formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>

                {/* Fila 2: Próximo Cobro & Toggle Activo */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                  {/* Próximo cobro limpio */}
                  <div className="flex items-center gap-1.5 min-w-0 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span>{translate("recurring.dueOn", "Cobro:")}</span>
                    <span className="font-bold text-foreground">
                      {formatCalendarDate(item.next_due_date, language)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0",
                        dueInfo.urgent
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/25"
                          : "bg-secondary/60 text-muted-foreground"
                      )}
                    >
                      {dueInfo.label}
                    </span>
                  </div>

                  {/* Switch de Activo/Pausado */}
                  <div className="flex items-center shrink-0">
                    <Switch
                      size="sm"
                      checked={item.is_active}
                      disabled={isActionLoading}
                      onCheckedChange={() => handleToggleActive(item)}
                      title={item.is_active ? (language === "en" ? "Active • Click to pause" : "Gasto activo • Clic para pausar") : (language === "en" ? "Paused • Click to activate" : "Gasto pausado • Clic para activar")}
                    />
                  </div>
                </div>

                {/* Fila 3: Botón de Cobro Principal y Botón Detalles */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    title={
                      alreadyExecuted
                        ? (language === "en" ? "Already recorded in current cycle" : "Ya registrado en este ciclo")
                        : (language === "en" ? "Record now into balance" : "Registrar ahora en el balance (adelantar cobro)")
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
                    {alreadyExecuted ? translate("recurring.alreadyRegistered", "Ya Registrado") : translate("recurring.registerNow", "Registrar Ahora")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(item.id)}
                    className="h-8.5 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 cursor-pointer flex items-center gap-1 font-medium shrink-0"
                  >
                    <span>{isExpanded ? translate("recurring.hide", "Ocultar") : translate("recurring.details", "Detalles")}</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </Button>
                </div>

                {/* Sección Desplegable de Detalles */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pt-2 border-t border-border/40 space-y-2.5 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 text-xs bg-secondary/30 p-2.5 rounded-xl border border-border/30">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                          {translate("recurring.category", "Categoría")}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 font-medium text-foreground">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              getCategoryColorBg(item.category)
                            )}
                          />
                          <span className="truncate">{item.category}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                          {translate("recurring.frequency", "Frecuencia")}
                        </span>
                        <span className="font-medium text-foreground block mt-0.5 truncate">
                          {formatFrequencyLabel(item.frequency, item.biweekly_type, item.billing_day, language)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                          {translate("recurring.paymentMethod", "Medio de Pago")}
                        </span>
                        <span className="font-medium text-foreground block mt-0.5 truncate">
                          {item.payment_method || (language === "en" ? "Not specified" : "No especificado")}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                          {translate("recurring.mode", "Modo de Cobro")}
                        </span>
                        <span className="font-medium text-foreground block mt-0.5 truncate">
                          {item.auto_register ? translate("recurring.autoOnDue", "Automático al vencer") : translate("recurring.manual", "Manual")}
                        </span>
                      </div>
                    </div>

                    {/* Botones de Editar y Eliminar dentro de Detalles */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                        disabled={isActionLoading}
                        className="flex-1 rounded-xl text-xs font-semibold h-8 hover:bg-secondary cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                        {translate("recurring.editExpense", "Editar gasto")}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        disabled={isActionLoading}
                        className="flex-1 rounded-xl text-xs font-semibold h-8 text-rose-500 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        {translate("recurring.delete", "Eliminar")}
                      </Button>
                    </div>
                  </motion.div>
                )}
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
                    {language === "en" ? "Status" : "Estado"}
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground">
                    {translate("expenses.table.description", "Concepto")}
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground">
                    {translate("recurring.frequency", "Frecuencia")}
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground">
                    {translate("recurring.nextDue", "Próxima Fecha")}
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    {language === "en" ? "Fixed Amount" : "Monto Fijo"}
                  </TableHead>
                  <TableHead className="px-4 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    {language === "en" ? "Actions" : "Acciones"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const dueInfo = formatDueDateLabel(item.next_due_date, language);
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
                        <div className="inline-flex items-center justify-center">
                          <Switch
                            size="sm"
                            checked={item.is_active}
                            disabled={isActionLoading}
                            onCheckedChange={() => handleToggleActive(item)}
                            title={item.is_active ? (language === "en" ? "Active • Click to pause" : "Gasto activo • Clic para pausar") : (language === "en" ? "Paused • Click to activate" : "Gasto pausado • Clic para activar")}
                          />
                        </div>
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
                          {formatFrequencyLabel(item.frequency, item.biweekly_type, item.billing_day, language)}
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
                              {formatCalendarDate(item.next_due_date, language)}
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
