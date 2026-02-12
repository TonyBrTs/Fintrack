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
import { useSettings } from '@/contexts/SettingsContext';
import { getApiHeaders } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Expense } from '@/types/index';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Plus, Tag, TrendingDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

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
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`, {
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      setExpenses(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Could not load expenses. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const totalMonth = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryTotals = expenses.reduce(
    (acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const highestCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';

  if (loading && expenses.length === 0) {
    return (
      <main className="max-w-360 mx-auto px-4 lg:px-20 py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-action animate-spin opacity-50" />
        <p className="text-secondary-titles font-medium animate-pulse">
          {translate('common.loading')}
        </p>
      </main>
    );
  }

  if (error && expenses.length === 0) {
    return (
      <main className="max-w-360 mx-auto px-4 lg:px-20 py-20 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="bg-expense/10 p-4 rounded-full">
          <AlertCircle className="w-12 h-12 text-expense" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-titles dark:text-foreground">
            {translate('common.errorTitle')}
          </h2>
          <p className="text-secondary-titles max-w-md mx-auto">
            {translate('common.errorMessage')}
          </p>
        </div>
        <button
          onClick={() => fetchExpenses()}
          className="bg-action text-white px-6 py-2 rounded-xl font-bold"
        >
          {translate('common.retry')}
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-360 mx-auto px-4 lg:px-20 py-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-15 bg-action rounded-full" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-titles dark:text-foreground">
              {translate('expenses.title')}
            </h1>
          </div>
          <p className="text-secondary-titles dark:text-muted-foreground text-lg ml-5">
            {translate('expenses.description')}
          </p>
        </div>
        <motion.button
          whileHover="hover"
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 bg-action hover:bg-action/90 text-white dark:bg-action/10 dark:hover:bg-action/20 dark:text-action px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 border border-transparent dark:border-action/20 cursor-pointer"
        >
          <motion.div
            initial={{ rotate: 0 }}
            variants={{
              hover: { rotate: 180 },
            }}
            transition={{
              duration: 0.6,
              ease: 'easeInOut',
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </motion.div>
          {translate('expenses.register')}
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <KPICard
          title={translate('expenses.totalMonth')}
          amount={`${currencySymbol}${formatCurrency(totalMonth)}`}
          icon={<TrendingDown size={24} className="text-expense" />}
        />
        <KPICard
          title={translate('expenses.highestCategory')}
          amount={highestCategory === '---' ? '---' : translate(`categories.${highestCategory}`)}
          icon={<Tag size={24} className="text-gold" />}
        />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card-bg dark:bg-card border border-border-ui rounded-3xl overflow-hidden shadow-xl shadow-black/5"
      >
        <Table>
          <TableHeader className="bg-secondary/30 dark:bg-secondary/10">
            <TableRow className="hover:bg-transparent border-border-ui border-b-2">
              <TableHead className="px-4 md:px-6 py-5 text-xs md:text-sm font-bold text-titles dark:text-foreground uppercase tracking-widest">
                {translate('expenses.table.date')}
              </TableHead>
              <TableHead className="hidden md:table-cell px-6 py-5 text-sm font-bold text-titles dark:text-foreground uppercase tracking-widest">
                {translate('expenses.table.description')}
              </TableHead>
              <TableHead className="px-4 md:px-6 py-5 text-xs md:text-sm font-bold text-titles dark:text-foreground uppercase tracking-widest">
                {translate('expenses.table.category')}
              </TableHead>
              <TableHead className="px-4 md:px-6 py-5 text-xs md:text-sm font-bold text-titles dark:text-foreground uppercase tracking-widest text-right">
                {translate('expenses.table.amount')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow
                key={expense.id}
                onClick={() => {
                  setSelectedExpense(expense);
                  setIsDetailsOpen(true);
                }}
                className="hover:bg-secondary/20 dark:hover:bg-secondary/5 border-border-ui h-20 cursor-pointer active:scale-[0.99] transition-all"
              >
                <TableCell className="px-4 md:px-6 py-4 text-sm text-titles dark:text-foreground whitespace-nowrap font-medium">
                  <div className="flex flex-col">
                    <span className="text-base">{new Date(expense.date).toLocaleDateString()}</span>
                    <span className="md:hidden text-[10px] text-secondary-titles mt-0.5 truncate max-w-20 opacity-70">
                      {expense.category === 'Metas'
                        ? `${translate('goals.contributionToGoal')}: ${
                            expense.description.split(': ')[1] || expense.description
                          }`
                        : expense.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell px-6 py-4 text-sm text-titles dark:text-foreground font-medium">
                  {expense.category === 'Metas'
                    ? `${translate('goals.contributionToGoal')}: ${
                        expense.description.split(': ')[1] || expense.description
                      }`
                    : expense.description}
                </TableCell>
                <TableCell className="px-4 md:px-6 py-4">
                  <Badge
                    variant={categoryColors[expense.category]}
                    className="text-[10px] md:text-xs px-3 py-1 font-bold tracking-tight shadow-sm"
                  >
                    {translate(`categories.${expense.category}`)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 md:px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-base md:text-lg text-titles dark:text-foreground font-black">
                      {currencySymbol}
                      {formatCurrency(expense.amount)}
                    </span>
                    <span className="text-[10px] text-secondary-titles dark:text-muted-foreground uppercase font-bold tracking-tighter opacity-80">
                      {currency}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.section>
    </main>
  );
}

export default function GastosPage() {
  return (
    <Suspense>
      <ExpensesContent />
    </Suspense>
  );
}
