'use client';

import { ExpenseDetailsSheet } from '@/components/expenses/ExpenseDetailsSheet';
import { RegisterExpenseModal } from '@/components/expenses/RegisterExpenseModal';
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
import { safeFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Expense } from '@/types/index';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  Search,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

const categoryColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  Alimentación: 'success',
  Transporte: 'info',
  Servicios: 'warning',
  Entretenimiento: 'error',
  Salud: 'error',
  Otros: 'default',
  Metas: 'warning',
};

function ExpensesContent() {
  const { currency, currencySymbol, translate } = useSettings();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Auto-open details if ID is in URL
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && expenses.length > 0) {
      const expense = expenses.find((e) => e.id.toString() === id);
      if (expense) {
        setSelectedExpense(expense);
        setIsDetailsOpen(true);
      }
    }
  }, [searchParams, expenses]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await safeFetch<Expense[]>('/api/expenses');

      if (!res.ok) {
        setError(res.error || 'No se pudieron cargar los gastos. Asegúrate de que el backend esté encendido.');
        setExpenses([]);
        return;
      }
      setExpenses(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch {
      setError('No se pudo establecer conexión con el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    fetchExpenses();
  }, [user]);

  const safeExpenses = useMemo(() => Array.isArray(expenses) ? expenses : [], [expenses]);

  const totalMonth = useMemo(() => {
    return safeExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [safeExpenses]);

  const categoryTotals = useMemo(() => {
    return safeExpenses.reduce(
      (acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [safeExpenses]);

  const highestCategory = useMemo(() => {
    return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
  }, [categoryTotals]);

  // Unique categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.payment_method.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchTerm, selectedCategory]);

  if (loading && expenses.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-20 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-action animate-spin opacity-60" />
        <p className="text-muted-foreground font-medium animate-pulse text-sm">
          {translate('common.loading') || 'Cargando gastos...'}
        </p>
      </main>
    );
  }

  if (error && expenses.length === 0) {
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
            {translate('common.errorMessage') || 'No se pudieron cargar los gastos del servidor.'}
          </p>
        </div>
        <button
          onClick={() => fetchExpenses()}
          className="bg-action text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
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
            {translate('expenses.title') || 'Gastos'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {translate('expenses.description') || 'Monitorea y categoriza todos tus egresos'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          {translate('expenses.register') || 'Registrar Gasto'}
        </motion.button>
      </header>

      <RegisterExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
      />

      <ExpenseDetailsSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        expense={selectedExpense}
        onSuccess={fetchExpenses}
      />

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <KPICard
          title={translate('expenses.totalMonth') || 'Total en Gastos'}
          amount={`${currencySymbol}${formatCurrency(totalMonth)}`}
          trend={`${expenses.length} registros en total`}
          trendType="down"
          icon={<TrendingDown size={22} className="text-rose-500" />}
        />
        <KPICard
          title={translate('expenses.highestCategory') || 'Categoría Principal'}
          amount={highestCategory === '---' ? '---' : translate(`categories.${highestCategory}`) || highestCategory}
          trend={highestCategory !== '---' ? `${currencySymbol}${formatCurrency(categoryTotals[highestCategory] || 0)} acumulado` : undefined}
          trendType="neutral"
          icon={<Tag size={22} className="text-amber-500" />}
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
            placeholder="Buscar por descripción, categoría o método..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card/90 dark:bg-card/75 backdrop-blur-sm border border-border/80 text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-action/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-auto min-w-[200px] sm:w-[220px] h-10 rounded-xl bg-card/90 dark:bg-card/75 border-border/80 font-medium text-sm">
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Todas las categorías" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categoriesList.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {translate(`categories.${cat}`) || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground font-semibold px-2.5 py-2 bg-secondary/80 rounded-xl whitespace-nowrap border border-border/50">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
          </span>
        </div>
      </div>

      {/* Expenses Table */}
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
                {translate('expenses.table.date') || 'Fecha'}
              </TableHead>
              <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {translate('expenses.table.description') || 'Descripción'}
              </TableHead>
              <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {translate('expenses.table.category') || 'Categoría'}
              </TableHead>
              <TableHead className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                {translate('expenses.table.amount') || 'Monto'}
              </TableHead>
              <TableHead className="w-10 px-2 py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                  No se encontraron gastos que coincidan con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  onClick={() => {
                    setSelectedExpense(expense);
                    setIsDetailsOpen(true);
                  }}
                  className="hover:bg-secondary/30 dark:hover:bg-secondary/15 border-b border-border/40 cursor-pointer transition-colors group"
                >
                  <TableCell className="px-5 py-4 text-sm font-medium whitespace-nowrap text-titles dark:text-foreground">
                    <div className="flex flex-col">
                      <span className="font-semibold">{new Date(expense.date).toLocaleDateString()}</span>
                      <span className="text-[11px] text-muted-foreground">{expense.payment_method}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm font-semibold text-titles dark:text-foreground">
                    {expense.category === 'Metas'
                      ? `${translate('goals.contributionToGoal') || 'Aporte a meta'}: ${
                          expense.description.split(': ')[1] || expense.description
                        }`
                      : expense.description}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      variant={categoryColors[expense.category] || 'default'}
                      className="text-xs px-3 py-1 font-bold shadow-2xs"
                    >
                      {translate(`categories.${expense.category}`) || expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-base font-black text-rose-500 dark:text-rose-400">
                        -{currencySymbol}{formatCurrency(expense.amount)}
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

export default function GastosPage() {
  return (
    <ProtectedRoute>
      <Suspense>
        <ExpensesContent />
      </Suspense>
    </ProtectedRoute>
  );
}
