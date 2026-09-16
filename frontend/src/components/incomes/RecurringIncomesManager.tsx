"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  formatCurrency,
  cn,
  formatCalendarDate,
  parseCalendarDate,
  formatDueDateLabel,
  formatFrequencyLabel,
} from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { recurringService } from "@/services";
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
  CalendarClock,
  ChevronDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
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
import { useCategories } from "@/hooks/useCategories";
import { getCategoryColorBg } from "@/lib/utils";
import type { RecurringIncome, RecurringIncomeSyncResult } from "@/types/index";

interface RecurringIncomesManagerProps {
  onIncomeGenerated?: () => void;
}

export function RecurringIncomesManager({ onIncomeGenerated }: RecurringIncomesManagerProps) {
  const { currency, currencySymbol, language, translate } = useSettings();
  const { categories } = useCategories("income");
  const [items, setItems] = useState<RecurringIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringIncome | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringIncome | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchRecurring = useCallback(async () => {
    try {
      setLoading(true);
      const res = await recurringService.getRecurringIncomes();
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
      const localDate = new Date().toLocaleDateString("en-CA");
      const res = await recurringService.syncRecurringIncomes(localDate);

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
      const res = await recurringService.updateRecurringIncome(item.id, {
        is_active: !item.is_active,
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
      const res = await recurringService.executeRecurringIncomeNow(item.id);

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
      const res = await recurringService.deleteRecurringIncome(deleteTarget.id);

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

  const formatDueDateLabelLocal = (dueDateStr: string | Date) => {
    return formatDueDateLabel(dueDateStr, language);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base sm:text-lg font-bold text-titles dark:text-foreground">
              {translate("recurring.incomesTitle", "Ingresos Fijos y Recurrentes")}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {translate("recurring.incomesSubtitle", "Se registran automáticamente en tu balance al llegar su fecha de cobro")}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            title={language === "en" ? "Sync due recurring incomes" : "Sincronizar ingresos vencidos"}
            className="flex-1 sm:flex-initial rounded-xl font-bold text-xs h-9 px-3 border-border hover:bg-secondary cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", syncing && "animate-spin text-emerald-600")} />
            <span>{syncing ? (language === "en" ? "Checking..." : "Comprobando...") : translate("recurring.sync", "Sincronizar")}</span>
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
            <span>{translate("recurring.newIncome", "Nuevo Ingreso Fijo")}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {translate("recurring.estimatedMonthly", "Total Mensual Estimado")}
            </p>
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              +{currencySymbol}{formatCurrency(monthlyTotal)}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              / {language === "en" ? "mo" : "mes"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {language === "en"
              ? `Based on ${activeItems.length} active income(s)`
              : `Basado en ${activeItems.length} ingreso(s) activos`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {translate("recurring.nextDue", "Próximo Cobro")}
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
                  {formatCalendarDate(activeItems[0].next_due_date, language)} • {formatDueDateLabelLocal(activeItems[0].next_due_date).label}
                </p>
              </>
            ) : (
              <span className="text-sm text-muted-foreground block mt-1">
                {language === "en" ? "No active income" : "Sin ingresos activos"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content: List or Empty State */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin opacity-70" />
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Loading recurring income..." : "Cargando ingresos fijos..."}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-card border border-dashed border-border/90 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Repeat className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-titles dark:text-foreground">
              {translate("recurring.noIncomesTitle", "No tienes ingresos fijos configurados")}
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {translate("recurring.noIncomesDesc", "Programa tu salario quincenal, pensión o cobros recurrentes de clientes para que se registren automáticamente sin que tengas que hacerlo a mano.")}
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
            {translate("recurring.createFirstIncome", "Configurar mi primer ingreso fijo")}
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (md:hidden) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {items.map((item) => {
              const dueInfo = formatDueDateLabelLocal(item.next_due_date);
              const isLoadingThis = actionLoadingId === item.id;
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            getCategoryColorBg(item.source, categories)
                          )}
                        />
                        <span className="text-[11px] text-muted-foreground font-medium truncate">
                          {translate(`sources.${item.source}`) || item.source}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{currencySymbol}{formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Fila 2: Próximo Cobro & Toggle Activo */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                    {/* Próximo cobro limpio */}
                    <div className="flex items-center gap-1.5 min-w-0 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
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
                        disabled={isLoadingThis}
                        onCheckedChange={() => handleToggleActive(item)}
                        title={item.is_active ? (language === "en" ? "Active • Click to pause" : "Ingreso activo • Clic para pausar") : (language === "en" ? "Paused • Click to activate" : "Ingreso pausado • Clic para activar")}
                      />
                    </div>
                  </div>

                  {/* Fila 3: Botón de Cobro Principal y Botón Detalles */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoadingThis || !item.is_active || alreadyExecuted}
                      onClick={() => handleExecuteNow(item)}
                      title={
                        alreadyExecuted
                          ? (language === "en" ? "Already recorded in this cycle" : "Ya registrado en este ciclo")
                          : (language === "en" ? "Record income now" : "Registrar cobro ahora (adelantar en el historial)")
                      }
                      className={cn(
                        "flex-1 rounded-xl text-xs font-bold h-8.5 border cursor-pointer",
                        alreadyExecuted
                          ? "text-slate-400 border-slate-300/30 opacity-50 cursor-not-allowed"
                          : "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      )}
                    >
                      <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
                      {alreadyExecuted ? translate("recurring.alreadyRegistered", "Ya Registrado") : translate("recurring.collectNow", "Cobrar Ahora")}
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
                            {translate("recurring.source", "Fuente")}
                          </span>
                          <div className="mt-0.5 font-medium text-foreground">
                            <CategoryBadge
                              category={item.source}
                              categories={categories}
                              label={translate(`sources.${item.source}`) || item.source}
                              size="sm"
                            />
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
                          disabled={isLoadingThis}
                          onClick={() => {
                            setSelectedItem(item);
                            setIsModalOpen(true);
                          }}
                          className="flex-1 rounded-xl text-xs font-semibold h-8 hover:bg-secondary cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          {translate("recurring.editIncome", "Editar ingreso")}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isLoadingThis}
                          onClick={() => handleDelete(item)}
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

          {/* Desktop Table View (hidden md:block) */}
          <div className="hidden md:block bg-card rounded-3xl border border-border/80 overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-secondary/40">
                <TableRow className="border-b border-border/60">
                  <TableHead className="px-5 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    {language === "en" ? "Status" : "Estado"}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-bold uppercase text-muted-foreground">
                    {translate("recurring.description", "Concepto")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    {translate("recurring.source", "Fuente")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    {translate("recurring.frequency", "Frecuencia")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    {translate("recurring.nextDue", "Próxima Fecha")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    {language === "en" ? "Fixed Amount" : "Monto"}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-bold uppercase text-muted-foreground text-center">
                    {language === "en" ? "Actions" : "Acciones"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const dueInfo = formatDueDateLabelLocal(item.next_due_date);
                  const isLoadingThis = actionLoadingId === item.id;

                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "border-b border-border/40 hover:bg-secondary/20 transition-colors",
                        !item.is_active && "opacity-60 bg-secondary/10"
                      )}
                    >
                      <TableCell className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center">
                          <Switch
                            size="sm"
                            checked={item.is_active}
                            disabled={isLoadingThis}
                            onCheckedChange={() => handleToggleActive(item)}
                            title={item.is_active ? (language === "en" ? "Active • Click to pause" : "Ingreso activo • Clic para pausar") : (language === "en" ? "Paused • Click to activate" : "Ingreso pausado • Clic para activar")}
                          />
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 font-bold text-sm text-titles dark:text-foreground">
                        <div className="flex flex-col">
                          <span>{item.description}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            {item.payment_method || (language === "en" ? "Not specified" : "No especificado")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-center whitespace-nowrap">
                        <CategoryBadge
                          category={item.source}
                          categories={categories}
                          label={translate(`sources.${item.source}`) || item.source}
                          size="sm"
                        />
                      </TableCell>

                      <TableCell className="px-5 py-4 text-xs font-semibold text-muted-foreground text-center whitespace-nowrap">
                        <span className="bg-secondary/60 px-2.5 py-1 rounded-lg border border-border/50 text-foreground inline-block">
                          {formatFrequencyLabel(item.frequency, item.biweekly_type, item.billing_day, language)}
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
                            {formatCalendarDate(item.next_due_date, language)}
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
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={
                              isAlreadyExecutedThisPeriod(item)
                                ? (language === "en" ? "Already recorded in this cycle" : "Ya registrado en este ciclo")
                                : (language === "en" ? "Collect now (record into balance)" : "Cobrar ahora (adelantar registro de ingreso en el balance)")
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
                            title={language === "en" ? "Edit fixed income" : "Editar datos de este ingreso fijo"}
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
                            title={language === "en" ? "Delete fixed income" : "Eliminar este ingreso fijo"}
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
        title={language === "en" ? "Delete fixed income" : "Eliminar ingreso fijo"}
        description={
          language === "en"
            ? `Delete "${deleteTarget?.description}"? Incomes previously recorded in your balance will be kept.`
            : `¿Eliminar "${deleteTarget?.description}"? Los ingresos ya registrados previamente se conservarán.`
        }
        confirmLabel={translate("recurring.delete", "Eliminar")}
        cancelLabel={language === "en" ? "Cancel" : "Cancelar"}
      />
    </div>
  );
}
