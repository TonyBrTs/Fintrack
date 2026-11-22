"use client";

import { IncomeDetailsSheet } from "@/components/incomes/IncomeDetailsSheet";
import { RegisterIncomeModal } from "@/components/incomes/RegisterIncomeModal";
import { RecurringIncomesManager } from "@/components/incomes/RecurringIncomesManager";
import { RecurringIncomeModal } from "@/components/incomes/RecurringIncomeModal";
import { TransactionTimeFilter } from "@/components/transactions/TransactionTimeFilter";
import { KPICard } from "@/components/ui/KPICard";
import { NavIncomeIcon } from "@/components/ui/AppIcons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { incomeService } from "@/services";
import { useCategories } from "@/hooks/useCategories";
import { ManageCategoriesModal } from "@/components/categories/ManageCategoriesModal";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import { PageLoadingState } from "@/components/ui/PageLoadingState";
import {
  cn,
  formatCurrency,
  getCategoryStyle,
  formatDateDDMMYYYY,
  parseCalendarDate,
} from "@/lib/utils";
import {
  formatDateGroupHeader,
  getDateGroupKey,
  getDateRangeForPreset,
  getPeriodDisplayLabel,
  isWithinDateRange,
  type TimeFilterPreset,
} from "@/lib/dateFilter";
import type { Income } from "@/types/index";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronRight,
  Filter,
  HandCoins,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  Tag,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function IncomesContent() {
  const { currency, currencySymbol, translate, language } = useSettings();
  const { user, openAuthModal } = useAuth();
  const { categories: userSourceList } = useCategories("income");
  const searchParams = useSearchParams();
  const isEs = language !== "en";

  const [activeTab, setActiveTab] = useState<"history" | "recurring">("history");
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [timePreset, setTimePreset] = useState<TimeFilterPreset>("this_month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    getDateRangeForPreset("this_month")
  );

  // Auto-open details if ID is in URL
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && incomes.length > 0) {
      const income = incomes.find((i) => i.id.toString() === id);
      if (income) {
        setSelectedIncome(income);
        setIsDetailsOpen(true);
      }
    }
  }, [searchParams, incomes]);

  const fetchIncomes = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await incomeService.getIncomes();

      if (!res.ok) {
        if (res.isUnauthorized) {
          setError("Tu sesión ha expirado o necesitas iniciar sesión.");
        } else {
          setError(res.error || "No fue posible cargar tus ingresos en este momento.");
        }
        setIncomes([]);
        return;
      }
      setIncomes(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch {
      setError("No se pudo establecer conexión. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setIncomes([]);
      setLoading(false);
      return;
    }
    fetchIncomes();

    const localDate = new Date().toLocaleDateString("en-CA");
    incomeService
      .syncRecurringIncomes(localDate)
      .then((res) => {
        if (res.ok && res.data && res.data.processed_count > 0) {
          toast.success(
            `Se registraron automáticamente ${res.data.processed_count} ingreso(s) fijos del período.`,
            { duration: 6000 }
          );
          fetchIncomes(true);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const handleSelectPreset = (preset: TimeFilterPreset) => {
    setTimePreset(preset);
    setDateRange(getDateRangeForPreset(preset));
  };

  const handleSelectCustomRange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setTimePreset("custom");
    } else {
      setTimePreset("all");
    }
  };

  const safeIncomes = useMemo(() => (Array.isArray(incomes) ? incomes : []), [incomes]);

  const sourcesList = useMemo(() => {
    const set = new Set<string>();
    userSourceList.forEach((c) => set.add(c.name));
    safeIncomes.forEach((i) => {
      if (i.source) set.add(i.source);
    });
    return Array.from(set);
  }, [safeIncomes, userSourceList]);

  // Filtered and newest-first sorted incomes
  const filteredIncomes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return safeIncomes
      .filter((i) => {
        const matchesTime = isWithinDateRange(i.date, dateRange);
        if (!matchesTime) return false;

        const matchesSource = selectedSource === "all" || i.source === selectedSource;
        if (!matchesSource) return false;

        if (!query) return true;
        return (
          i.description.toLowerCase().includes(query) ||
          i.source.toLowerCase().includes(query) ||
          i.payment_method.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => parseCalendarDate(b.date).getTime() - parseCalendarDate(a.date).getTime());
  }, [safeIncomes, dateRange, searchTerm, selectedSource]);

  const periodTotal = useMemo(
    () => filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0),
    [filteredIncomes]
  );

  const sourceTotals = useMemo(() => {
    return filteredIncomes.reduce(
      (acc, curr) => {
        acc[curr.source] = (acc[curr.source] || 0) + curr.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [filteredIncomes]);

  const mainSource = useMemo(() => {
    return Object.entries(sourceTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "---";
  }, [sourceTotals]);

  const periodLabel = useMemo(
    () => getPeriodDisplayLabel(timePreset, dateRange, language),
    [timePreset, dateRange, language]
  );

  // Date-grouped incomes for native mobile list
  const groupedIncomes = useMemo(() => {
    const groups: { key: string; label: string; total: number; items: Income[] }[] = [];
    const map = new Map<string, { key: string; label: string; total: number; items: Income[] }>();

    for (const income of filteredIncomes) {
      const key = getDateGroupKey(income.date);
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          label: formatDateGroupHeader(income.date, language),
          total: 0,
          items: [],
        };
        map.set(key, group);
        groups.push(group);
      }
      group.items.push(income);
      group.total += income.amount;
    }

    return groups;
  }, [filteredIncomes, language]);

  const hasActiveFilters =
    timePreset !== "all" || selectedSource !== "all" || searchTerm.trim().length > 0;

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedSource("all");
    handleSelectPreset("all");
  };

  if (loading && incomes.length === 0) {
    return <PageLoadingState message={translate("common.loading") || "Cargando ingresos..."} />;
  }

  if (error && incomes.length === 0) {
    const isAuthError =
      error.toLowerCase().includes("sesión") || error.toLowerCase().includes("iniciar");
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-20 py-24 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="bg-rose-500/10 p-4 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-titles dark:text-foreground">
            {isAuthError
              ? "Sesión requerida"
              : translate("common.errorTitle") || "Algo no salió como esperábamos"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            {error ||
              translate("common.errorMessage") ||
              "No fue posible cargar la información en este momento."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthError ? (
            <button
              onClick={() => openAuthModal("login")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Iniciar Sesión
            </button>
          ) : (
            <button
              onClick={() => fetchIncomes()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {translate("common.retry") || "Reintentar"}
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20 md:pb-6">
      {/* Compact Mobile-First Header */}
      <header className="flex items-center justify-between gap-3 pb-3 sm:pb-5 border-b border-border/40">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground truncate">
            {translate("income.title") || "Ingresos"}
          </h1>
          <p className="hidden sm:block text-sm text-muted-foreground mt-1 leading-relaxed max-w-lg">
            {translate("income.description") ||
              "Registra y analiza todas tus fuentes de capital: salario, freelance, inversiones y más."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsManageCategoriesOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl font-semibold text-xs sm:text-sm min-h-[44px] sm:h-10 px-3 sm:px-3.5 border-border/80 hover:bg-secondary cursor-pointer touch-manipulation"
            aria-label={isEs ? "Gestionar fuentes" : "Manage sources"}
          >
            <Tag size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden xs:inline sm:inline">{isEs ? "Fuentes" : "Sources"}</span>
          </Button>

          {activeTab === "recurring" ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsRecurringModalOpen(true)}
              className="hidden md:flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer h-10"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>{isEs ? "Nuevo Ingreso Fijo" : "New Recurring"}</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer h-10"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>{translate("income.register") || "Registrar Ingreso"}</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Segmented Control Tabs */}
      <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900/80 rounded-2xl border border-slate-300/80 dark:border-slate-800 w-full sm:w-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex items-center justify-center gap-2 min-h-[40px] sm:min-h-[36px] px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none touch-manipulation",
            activeTab === "history"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-foreground shadow-sm border border-slate-200/90 dark:border-slate-700"
              : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
          )}
        >
          <HandCoins className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{isEs ? "Ingresos" : "Income"}</span>
          <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold">
            {filteredIncomes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("recurring")}
          className={cn(
            "flex items-center justify-center gap-2 min-h-[40px] sm:min-h-[36px] px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none touch-manipulation",
            activeTab === "recurring"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-foreground shadow-sm border border-slate-200/90 dark:border-slate-700"
              : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
          )}
        >
          <Repeat className="w-4 h-4 text-teal-500 shrink-0" />
          <span>{isEs ? "Ingresos Fijos" : "Recurring"}</span>
        </button>
      </div>

      <RegisterIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIncomes}
      />

      <RecurringIncomeModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSuccess={fetchIncomes}
      />

      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        type="income"
      />

      <IncomeDetailsSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        income={selectedIncome}
        onSuccess={fetchIncomes}
      />

      {activeTab === "recurring" ? (
        <RecurringIncomesManager onIncomeGenerated={fetchIncomes} />
      ) : (
        <>
          {/* Compact Mobile KPI Strip (2-col on mobile) + Full KPICards on desktop */}
          <section className="grid grid-cols-2 gap-2.5 sm:hidden">
            <div className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  {periodLabel}
                </span>
                <NavIncomeIcon size={15} className="text-emerald-500 shrink-0" />
              </div>
              <p className="font-mono tabular-nums text-lg font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
                +{currencySymbol}
                {formatCurrency(periodTotal)}
              </p>
              <span className="block text-[11px] font-medium text-muted-foreground">
                {filteredIncomes.length}{" "}
                {filteredIncomes.length === 1
                  ? isEs
                    ? "cobro"
                    : "entry"
                  : isEs
                    ? "cobros"
                    : "entries"}
              </span>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-xs space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  {isEs ? "Fuente principal" : "Top source"}
                </span>
                <HandCoins size={14} className="text-emerald-500 shrink-0" />
              </div>
              <p className="text-base font-bold tracking-tight text-foreground truncate pt-0.5">
                {mainSource === "---" ? "---" : translate(`sources.${mainSource}`) || mainSource}
              </p>
              <span className="block font-mono tabular-nums text-[11px] font-medium text-muted-foreground truncate">
                {mainSource !== "---"
                  ? `${currencySymbol}${formatCurrency(sourceTotals[mainSource] || 0)}`
                  : isEs
                    ? "Sin datos"
                    : "No data"}
              </span>
            </div>
          </section>

          <section className="hidden sm:grid sm:grid-cols-2 gap-4 md:gap-6">
            <KPICard
              title={`${translate("income.totalMonth") || "Total Ingresos"} · ${periodLabel}`}
              amount={`${currencySymbol}${formatCurrency(periodTotal)}`}
              trend={`${filteredIncomes.length} ${
                filteredIncomes.length === 1 ? "cobro" : "cobros"
              }`}
              trendType="up"
              icon={<NavIncomeIcon size={22} className="text-emerald-500" />}
            />
            <KPICard
              title={translate("income.mainSource") || "Fuente Principal"}
              amount={
                mainSource === "---" ? "---" : translate(`sources.${mainSource}`) || mainSource
              }
              trend={
                mainSource !== "---"
                  ? `${currencySymbol}${formatCurrency(sourceTotals[mainSource] || 0)} en período`
                  : undefined
              }
              trendType="up"
              icon={<HandCoins size={22} className="text-emerald-500" />}
            />
          </section>

          {/* Time Filter Bar + Search & Source Filter */}
          <div className="space-y-2.5 sm:space-y-3">
            <TransactionTimeFilter
              preset={timePreset}
              dateRange={dateRange}
              onSelectPreset={handleSelectPreset}
              onSelectCustomRange={handleSelectCustomRange}
              language={language}
              accent="income"
            />

            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    isEs
                      ? "Buscar descripción, fuente o método..."
                      : "Search description, source, or method..."
                  }
                  className="w-full min-h-[44px] sm:min-h-[40px] pl-10 pr-4 py-2 rounded-xl bg-card border border-border/80 text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="flex-1 sm:flex-initial sm:w-[210px] min-h-[44px] sm:h-10 rounded-xl bg-card border-border/80 font-medium text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder={isEs ? "Todas las fuentes" : "All sources"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {isEs ? "Todas las fuentes" : "All sources"}
                    </SelectItem>
                    {sourcesList.map((src) => (
                      <SelectItem key={src} value={src}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              getCategoryStyle(src, userSourceList).dot
                            )}
                          />
                          <span>{translate(`sources.${src}`) || src}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="hidden sm:inline-flex text-xs font-mono tabular-nums text-muted-foreground font-semibold px-3 py-2 bg-secondary/80 rounded-xl whitespace-nowrap border border-border/50">
                  {filteredIncomes.length} {filteredIncomes.length === 1 ? "ingreso" : "ingresos"}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile-First Grouped Transaction Feed (< md) */}
          <section className="md:hidden space-y-4">
            {groupedIncomes.length === 0 ? (
              <div className="bg-card border border-border/80 rounded-2xl px-5 py-10 text-center space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {isEs
                    ? "No hay ingresos en este período o con estos filtros."
                    : "No incomes found for this period or filters."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors cursor-pointer touch-manipulation"
                  >
                    <RotateCcw size={14} />
                    {isEs ? "Ver todo el historial" : "View all history"}
                  </button>
                )}
              </div>
            ) : (
              groupedIncomes.map((group) => (
                <div key={group.key} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </span>
                    <span className="font-mono tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      +{currencySymbol}
                      {formatCurrency(group.total)}
                    </span>
                  </div>

                  <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-xs">
                    {group.items.map((income) => {
                      const style = getCategoryStyle(income.source, userSourceList);
                      const isRecurring =
                        income.id.startsWith("rec_") || income.id.startsWith("rec-");

                      return (
                        <button
                          key={income.id}
                          type="button"
                          onClick={() => {
                            setSelectedIncome(income);
                            setIsDetailsOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-3 min-h-[64px] text-left hover:bg-secondary/40 active:bg-secondary/70 transition-colors cursor-pointer touch-manipulation"
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                              style.bg,
                              style.border
                            )}
                          >
                            <span className={cn("w-2.5 h-2.5 rounded-full", style.dot)} />
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {income.description.replace(/^\[Recurrente\]\s*/i, "")}
                              </span>
                              {isRecurring && (
                                <Repeat
                                  size={13}
                                  className="text-emerald-500 shrink-0"
                                  aria-label={isEs ? "Recurrente" : "Recurring"}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                              <span className="font-semibold truncate">
                                {translate(`sources.${income.source}`) || income.source}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{income.payment_method}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className="block font-mono tabular-nums text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                +{currencySymbol}
                                {formatCurrency(income.amount)}
                              </span>
                              <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
                                {currency}
                              </span>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-muted-foreground/60 shrink-0"
                              aria-hidden="true"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Desktop Table (>= md) */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block bg-card dark:bg-card/75 backdrop-blur-sm border border-slate-200/90 dark:border-border/60 rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
          >
            <Table>
              <TableHeader className="bg-secondary/40 dark:bg-secondary/20">
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {translate("income.table.date") || "Fecha"}
                  </TableHead>
                  <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {translate("income.table.description") || "Descripción"}
                  </TableHead>
                  <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {translate("income.table.source") || "Fuente"}
                  </TableHead>
                  <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                    {translate("income.table.amount") || "Monto"}
                  </TableHead>
                  <TableHead className="w-10 px-2 py-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncomes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-muted-foreground text-sm"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span>
                          No se encontraron ingresos que coincidan con los filtros aplicados.
                        </span>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetAllFilters}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                          >
                            <RotateCcw size={13} />
                            {isEs ? "Ver todo el historial" : "View all history"}
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncomes.map((income) => (
                    <TableRow
                      key={income.id}
                      onClick={() => {
                        setSelectedIncome(income);
                        setIsDetailsOpen(true);
                      }}
                      className="hover:bg-secondary/30 dark:hover:bg-secondary/15 border-b border-border/40 cursor-pointer transition-colors group"
                    >
                      <TableCell className="px-5 py-4 text-sm font-medium whitespace-nowrap text-titles dark:text-foreground">
                        <div className="flex flex-col">
                          <span className="font-mono tabular-nums font-semibold">
                            {formatDateDDMMYYYY(income.date)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {income.payment_method}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm font-semibold text-titles dark:text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{income.description.replace(/^\[Recurrente\]\s*/i, "")}</span>
                          {(income.id.startsWith("rec_") || income.id.startsWith("rec-")) && (
                            <span
                              title={
                                language === "en"
                                  ? "Automatic recurring income"
                                  : "Ingreso recurrente automático"
                              }
                              className="inline-flex items-center cursor-help"
                            >
                              <Repeat className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <CategoryBadge
                          category={income.source}
                          categories={userSourceList}
                          label={translate(`sources.${income.source}`) || income.source}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono tabular-nums text-base font-black text-emerald-600 dark:text-emerald-400">
                            +{currencySymbol}
                            {formatCurrency(income.amount)}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            {currency}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="px-2 py-4 text-right pr-4"
                        title={
                          language === "en" ? "View income details" : "Ver detalles del ingreso"
                        }
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all inline" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.section>
        </>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() =>
          activeTab === "recurring" ? setIsRecurringModalOpen(true) : setIsModalOpen(true)
        }
        aria-label={
          activeTab === "recurring"
            ? isEs
              ? "Nuevo ingreso fijo"
              : "New recurring income"
            : translate("income.register") || "Registrar Ingreso"
        }
        className="md:hidden fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 h-14 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer touch-manipulation"
      >
        <Plus size={20} strokeWidth={2.5} />
        <span>
          {activeTab === "recurring" ? (isEs ? "Fijo" : "Recurring") : isEs ? "Ingreso" : "Income"}
        </span>
      </button>
    </div>
  );
}

export default function IngresosPage() {
  return (
    <ProtectedRoute>
      <Suspense>
        <IncomesContent />
      </Suspense>
    </ProtectedRoute>
  );
}
