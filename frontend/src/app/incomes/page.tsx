'use client';

import { IncomeDetailsSheet } from '@/components/incomes/IncomeDetailsSheet';
import { RegisterIncomeModal } from '@/components/incomes/RegisterIncomeModal';
import { RecurringIncomesManager } from '@/components/incomes/RecurringIncomesManager';
import { RecurringIncomeModal } from '@/components/incomes/RecurringIncomeModal';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { NavIncomeIcon } from '@/components/ui/AppIcons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { safeFetch } from '@/lib/api';
import { useCategories } from '@/hooks/useCategories';
import { ManageCategoriesModal } from '@/components/categories/ManageCategoriesModal';
import { cn, formatCurrency } from '@/lib/utils';
import type { Income, RecurringIncomeSyncResult } from '@/types/index';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ChevronRight,
  Filter,
  HandCoins,
  Loader2,
  Plus,
  Repeat,
  Search,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

const sourceColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  Salario: 'success',
  Freelance: 'info',
  Inversiones: 'warning',
  Regalo: 'success',
  Otros: 'default',
};

function IncomesContent() {
  const { currency, currencySymbol, translate } = useSettings();
  const { user, openAuthModal } = useAuth();
  const { categories: userSourceList } = useCategories("income");
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'history' | 'recurring'>('history');
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Auto-open details if ID is in URL
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && incomes.length > 0) {
      const income = incomes.find((i) => i.id.toString() === id);
      if (income) {
        setSelectedIncome(income);
        setIsDetailsOpen(true);
      }
    }
  }, [searchParams, incomes]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const res = await safeFetch<Income[]>('/api/incomes');

      if (!res.ok) {
        if (res.isUnauthorized) {
          setError('Tu sesión ha expirado o necesitas iniciar sesión.');
        } else {
          setError(res.error || 'No fue posible cargar tus ingresos en este momento.');
        }
        setIncomes([]);
        return;
      }
      setIncomes(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch {
      setError('No se pudo establecer conexión. Por favor, intenta nuevamente.');
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

    // Sincronización automática de ingresos fijos pendientes de la quincena/mes
    safeFetch<RecurringIncomeSyncResult>('/api/recurring-incomes/sync', { method: 'POST' })
      .then((res) => {
        if (res.ok && res.data && res.data.processed_count > 0) {
          toast.success(
            `✨ Se registraron automáticamente ${res.data.processed_count} ingreso(s) fijos de tu quincena/mes.`,
            { duration: 6000 }
          );
          fetchIncomes();
        }
      })
      .catch(() => {});
  }, [user]);

  const safeIncomes = useMemo(() => Array.isArray(incomes) ? incomes : [], [incomes]);

  const totalMonth = useMemo(() => {
    return safeIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  }, [safeIncomes]);

  const sourceTotals = useMemo(() => {
    return safeIncomes.reduce(
      (acc, curr) => {
        acc[curr.source] = (acc[curr.source] || 0) + curr.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [safeIncomes]);

  const mainSource = useMemo(() => {
    return Object.entries(sourceTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
  }, [sourceTotals]);

  // Unique sources list combining user categories and transactions
  const sourcesList = useMemo(() => {
    const set = new Set<string>();
    userSourceList.forEach((c) => set.add(c.name));
    incomes.forEach((i) => {
      if (i.source) set.add(i.source);
    });
    return Array.from(set);
  }, [incomes, userSourceList]);

  // Filtered incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((i) => {
      const matchesSearch =
        i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.payment_method.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource = selectedSource === 'all' || i.source === selectedSource;

      return matchesSearch && matchesSource;
    });
  }, [incomes, searchTerm, selectedSource]);

  if (loading && incomes.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-20 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin opacity-60" />
        <p className="text-muted-foreground font-medium animate-pulse text-sm">
          {translate('common.loading') || 'Cargando ingresos...'}
        </p>
      </main>
    );
  }

  if (error && incomes.length === 0) {
    const isAuthError = error.toLowerCase().includes('sesión') || error.toLowerCase().includes('iniciar');
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-20 py-24 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="bg-rose-500/10 p-4 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-titles dark:text-foreground">
            {isAuthError ? 'Sesión requerida' : (translate('common.errorTitle') || 'Algo no salió como esperábamos')}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            {error || translate('common.errorMessage') || 'No fue posible cargar la información en este momento.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthError ? (
            <button
              onClick={() => openAuthModal('login')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Iniciar Sesión
            </button>
          ) : (
            <button
              onClick={() => fetchIncomes()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {translate('common.retry') || 'Reintentar'}
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-border/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Flujo de Capital</span>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              {translate('income.title') || 'Ingresos'}
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-1.5 leading-relaxed max-w-lg">
              {translate('income.description') || 'Registra y analiza todas tus fuentes de capital — salario, freelance, inversiones y más.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsManageCategoriesOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs sm:text-sm h-10 px-3.5 border-border/80 hover:bg-secondary cursor-pointer"
          >
            <Tag size={15} className="text-emerald-500" />
            <span>Fuentes</span>
          </Button>

          {activeTab === 'recurring' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsRecurringModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer h-10"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="truncate">Nuevo Ingreso Fijo</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer h-10"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="truncate">{translate('income.register') || 'Registrar Ingreso'}</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Tabs Switcher - Mobile Responsive Segmented Control */}
      <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900/80 rounded-2xl border border-slate-300/80 dark:border-slate-800 w-full sm:w-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center justify-center gap-2 py-2 px-3.5 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none",
            activeTab === 'history'
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-foreground shadow-sm border border-slate-200/90 dark:border-slate-700"
              : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
          )}
        >
          <HandCoins className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Ingresos</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold">
            {incomes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recurring')}
          className={cn(
            "flex items-center justify-center gap-2 py-2 px-3.5 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none",
            activeTab === 'recurring'
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-foreground shadow-sm border border-slate-200/90 dark:border-slate-700"
              : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
          )}
        >
          <Repeat className="w-4 h-4 text-teal-500 shrink-0" />
          <span>Ingresos Fijos</span>
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

      {activeTab === 'recurring' ? (
        <RecurringIncomesManager onIncomeGenerated={fetchIncomes} />
      ) : (
        <>
      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <KPICard
          title={translate('income.totalMonth') || 'Total Ingresos'}
          amount={`${currencySymbol}${formatCurrency(totalMonth)}`}
          trend={`${incomes.length} cobros registrados`}
          trendType="up"
          icon={<NavIncomeIcon size={22} className="text-emerald-500" />}
        />
        <KPICard
          title={translate('income.mainSource') || 'Fuente Principal'}
          amount={mainSource === '---' ? '---' : translate(`sources.${mainSource}`) || mainSource}
          trend={mainSource !== '---' ? `${currencySymbol}${formatCurrency(sourceTotals[mainSource] || 0)} acumulado` : undefined}
          trendType="up"
          icon={<HandCoins size={22} className="text-emerald-500" />}
        />
      </section>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, fuente o método..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card/90 dark:bg-card/75 backdrop-blur-sm border border-border/80 text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-auto min-w-[200px] sm:w-[220px] h-10 rounded-xl bg-card/90 dark:bg-card/75 border-border/80 font-medium text-sm">
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Todas las fuentes" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fuentes</SelectItem>
              {sourcesList.map((src) => (
                <SelectItem key={src} value={src}>
                  {translate(`sources.${src}`) || src}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground font-semibold px-2.5 py-2 bg-secondary/80 rounded-xl whitespace-nowrap border border-border/50">
            {filteredIncomes.length} {filteredIncomes.length === 1 ? 'ingreso' : 'ingresos'}
          </span>
        </div>
      </div>

      {/* Incomes Table */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card dark:bg-card/75 backdrop-blur-sm border border-slate-200/90 dark:border-border/60 rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
      >
        <Table>
          <TableHeader className="bg-secondary/40 dark:bg-secondary/20">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {translate('income.table.date') || 'Fecha'}
              </TableHead>
              <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {translate('income.table.description') || 'Descripción'}
              </TableHead>
              <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {translate('income.table.source') || 'Fuente'}
              </TableHead>
              <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                {translate('income.table.amount') || 'Monto'}
              </TableHead>
              <TableHead className="w-10 px-2 py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                  No se encontraron ingresos que coincidan con los filtros aplicados.
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
                      <span className="font-semibold">{new Date(income.date).toLocaleDateString()}</span>
                      <span className="text-[11px] text-muted-foreground">{income.payment_method}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm font-semibold text-titles dark:text-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>{income.description.replace(/^\[Recurrente\]\s*/i, '')}</span>
                      {(income.id.startsWith('rec_') || income.id.startsWith('rec-')) && (
                        <Repeat className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      variant={sourceColors[income.source] || 'default'}
                      className="text-xs px-3 py-1 font-bold shadow-2xs"
                    >
                      {translate(`sources.${income.source}`) || income.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-base font-black text-emerald-500 dark:text-emerald-400">
                        +{currencySymbol}{formatCurrency(income.amount)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                        {currency}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4 text-right pr-4">
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
