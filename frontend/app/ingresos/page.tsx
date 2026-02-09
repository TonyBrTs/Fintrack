"use client";

import { motion } from "framer-motion";
import {
  Plus,
  TrendingUp,
  HandCoins,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { Badge } from "@/components/ui/Badge";
import { useSettings } from "@/contexts/SettingsContext";
import { getApiHeaders } from "@/lib/api";
import type { Income } from "@/types/index";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { RegisterIncomeModal } from "@/components/incomes/RegisterIncomeModal";
import { IncomeDetailsSheet } from "@/components/incomes/IncomeDetailsSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const sourceColors: Record<
  string,
  "success" | "warning" | "error" | "info" | "default"
> = {
  Salario: "success",
  Freelance: "info",
  Inversiones: "warning",
  Regalo: "success",
  Otros: "default",
};

export default function IngresosPage() {
  const { currency, currencySymbol, translate } = useSettings();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/incomes`,
        {
          headers: getApiHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch incomes");
      }
      const data = await response.json();
      setIncomes(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching incomes:", err);
      setError("Could not load incomes. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const totalMonth = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  const sourceTotals = incomes.reduce(
    (acc, curr) => {
      acc[curr.source] = (acc[curr.source] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const mainSource =
    Object.entries(sourceTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "---";

  if (loading && incomes.length === 0) {
    return (
      <main className="max-w-360 mx-auto px-4 lg:px-20 py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-income animate-spin opacity-50" />
        <p className="text-secondary-titles font-medium animate-pulse">
          {translate("common.loading")}
        </p>
      </main>
    );
  }

  if (error && incomes.length === 0) {
    return (
      <main className="max-w-360 mx-auto px-4 lg:px-20 py-20 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="bg-income/10 p-4 rounded-full">
          <AlertCircle className="w-12 h-12 text-income" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-titles dark:text-foreground">
            {translate("common.errorTitle")}
          </h2>
          <p className="text-secondary-titles max-w-md mx-auto">
            {translate("common.errorMessage")}
          </p>
        </div>
        <button
          onClick={() => fetchIncomes()}
          className="bg-income text-white px-6 py-2 rounded-xl font-bold cursor-pointer"
        >
          {translate("common.retry")}
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
              {translate("income.title")}
            </h1>
          </div>
          <p className="text-secondary-titles dark:text-muted-foreground text-lg ml-5">
            {translate("income.description")}
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
              ease: "easeInOut",
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </motion.div>
          {translate("income.register")}
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <KPICard
          title={translate("income.totalMonth")}
          amount={`${currencySymbol}${formatCurrency(totalMonth)}`}
          icon={<TrendingUp size={24} className="text-income" />}
        />
        <KPICard
          title={translate("income.mainSource")}
          amount={mainSource}
          icon={<HandCoins size={24} className="text-gold" />}
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
                {translate("income.table.date")}
              </TableHead>
              <TableHead className="hidden md:table-cell px-6 py-5 text-sm font-bold text-titles dark:text-foreground uppercase tracking-widest">
                {translate("income.table.description")}
              </TableHead>
              <TableHead className="px-4 md:px-6 py-5 text-xs md:text-sm font-bold text-titles dark:text-foreground uppercase tracking-widest">
                {translate("income.table.source")}
              </TableHead>
              <TableHead className="px-4 md:px-6 py-5 text-xs md:text-sm font-bold text-titles dark:text-foreground uppercase tracking-widest text-right">
                {translate("income.table.amount")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomes.map((income) => (
              <TableRow
                key={income.id}
                onClick={() => {
                  setSelectedIncome(income);
                  setIsDetailsOpen(true);
                }}
                className="hover:bg-secondary/20 dark:hover:bg-secondary/5 border-border-ui h-20 cursor-pointer active:scale-[0.99] transition-all"
              >
                <TableCell className="px-4 md:px-6 py-4 text-sm text-titles dark:text-foreground whitespace-nowrap font-medium">
                  <div className="flex flex-col">
                    <span className="text-base">
                      {new Date(income.date).toLocaleDateString()}
                    </span>
                    <span className="md:hidden text-[10px] text-secondary-titles mt-0.5 truncate max-w-20 opacity-70">
                      {income.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell px-6 py-4 text-sm text-titles dark:text-foreground font-medium">
                  {income.description}
                </TableCell>
                <TableCell className="px-4 md:px-6 py-4">
                  <Badge
                    variant={sourceColors[income.source] || "default"}
                    className="text-[10px] md:text-xs px-3 py-1 font-bold tracking-tight shadow-sm"
                  >
                    {income.source}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 md:px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-base md:text-lg text-titles dark:text-foreground font-black">
                      {currencySymbol}
                      {formatCurrency(income.amount)}
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
