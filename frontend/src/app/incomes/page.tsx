'use client';

import { IncomeDetailsSheet } from '@/components/incomes/IncomeDetailsSheet';
import { RegisterIncomeModal } from '@/components/incomes/RegisterIncomeModal';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
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
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getApiHeaders, safeFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Income } from '@/types/index';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ChevronRight,
  Filter,
  HandCoins,
  Loader2,
  Plus,
  Search,
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
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        setError(res.error || 'No se pudieron cargar los ingresos. Asegúrate de que el backend esté encendido.');
        setIncomes([]);
        return;
      }
      setIncomes(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch {
      setError('No se pudo establecer conexión con el backend.');
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
  }, [incomes]);

  const mainSource = useMemo(() => {
    return Object.entries(sourceTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
  }, [sourceTotals]);

  // Unique sources list
  const sourcesList = useMemo(() => {
    const set = new Set<string>();
    incomes.forEach((i) => {
      if (i.source) set.add(i.source);
    });
    return Array.from(set);
  }, [incomes]);

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
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-20 py-24 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="bg-rose-500/10 p-4 rounded-full">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-titles dark:text-foreground">
            {translate('common.errorTitle') || 'Error de conexión'}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            {translate('common.errorMessage') || 'No se pudieron cargar los ingresos del servidor.'}
          </p>
        </div>
        <button
          onClick={() => fetchIncomes()}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
        >
          {translate('common.retry') || 'Reintentar'}
        </button>
      </main>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-titles dark:text-foreground">
            {translate('income.title') || 'Ingresos'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {translate('income.description') || 'Gestiona y analiza tus fuentes de capital'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          {translate('income.register') || 'Registrar Ingreso'}
        </motion.button>
      </header>

      <RegisterIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIncomes}
      />

      <IncomeDetailsSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        income={selectedIncome}
        onSuccess={fetchIncomes}
      />

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <KPICard
          title={translate('income.totalMonth') || 'Total Ingresos'}
          amount={`${currencySymbol}${formatCurrency(totalMonth)}`}
          trend={`${incomes.length} cobros registrados`}
          trendType="up"
          icon={<TrendingUp size={22} className="text-emerald-500" />}
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
        className="bg-card/90 dark:bg-card/75 backdrop-blur-sm border border-border/80 dark:border-border/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
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
                    {income.description}
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
