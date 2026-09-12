"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Expense, Income } from "@/types/index";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieIcon, BarChart3 } from "lucide-react";

interface SummaryChartsProps {
  expenses: Expense[];
  incomes: Income[];
  currentMonthExpenses?: Expense[];
}

const MODERN_COLORS = [
  "#2563eb", // Primary Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
  "#64748b", // Slate
];

interface ChartDataItem {
  name: string;
  value: number;
}

export function SummaryCharts({
  expenses,
  incomes,
  currentMonthExpenses,
}: SummaryChartsProps) {
  const { translate, currencySymbol } = useSettings();

  const expensesForPie = currentMonthExpenses || expenses;

  // Process data for Expenses by Category
  const categoryData = expensesForPie.reduce((acc: ChartDataItem[], curr) => {
    const existing = acc.find((item) => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);

  // Sort descending
  categoryData.sort((a, b) => b.value - a.value);

  // Process data for Income vs Expenses (Bar Chart)
  const monthlyData = [
    { name: translate("months.jan") || "Ene", income: 0, expenses: 0 },
    { name: translate("months.feb") || "Feb", income: 0, expenses: 0 },
    { name: translate("months.mar") || "Mar", income: 0, expenses: 0 },
    { name: translate("months.apr") || "Abr", income: 0, expenses: 0 },
    { name: translate("months.may") || "May", income: 0, expenses: 0 },
    { name: translate("months.jun") || "Jun", income: 0, expenses: 0 },
    { name: translate("months.jul") || "Jul", income: 0, expenses: 0 },
    { name: translate("months.aug") || "Ago", income: 0, expenses: 0 },
    { name: translate("months.sep") || "Sep", income: 0, expenses: 0 },
    { name: translate("months.oct") || "Oct", income: 0, expenses: 0 },
    { name: translate("months.nov") || "Nov", income: 0, expenses: 0 },
    { name: translate("months.dec") || "Dic", income: 0, expenses: 0 },
  ];

  const currentYear = new Date().getFullYear();

  expenses.forEach((e) => {
    const date = new Date(e.date);
    if (date.getFullYear() === currentYear && date.getMonth() >= 0 && date.getMonth() < 12) {
      monthlyData[date.getMonth()].expenses += e.amount;
    }
  });

  incomes.forEach((i) => {
    const date = new Date(i.date);
    if (date.getFullYear() === currentYear && date.getMonth() >= 0 && date.getMonth() < 12) {
      monthlyData[date.getMonth()].income += i.amount;
    }
  });

  const totalExpenseAmount = expensesForPie.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Expenses by Category */}
      <div className="bg-card dark:bg-card/75 backdrop-blur-sm p-6 rounded-3xl shadow-card hover:shadow-card-hover border border-slate-200/90 dark:border-border/60 flex flex-col justify-between transition-all">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-action/10 text-action">
              <PieIcon size={18} />
            </div>
            <h3 className="text-base font-bold text-titles dark:text-foreground">
              {translate("summary.expensesByCategory")}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
            {expensesForPie.length} {translate("common.transactions") || "transacciones"}
          </span>
        </div>

        {categoryData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-center text-muted-foreground text-sm">
            {translate("common.noData") || "No hay datos para este período"}
          </div>
        ) : (
          <div className="h-[260px] sm:h-[300px] w-full min-w-0 min-h-[260px] relative grow">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry: ChartDataItem, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={MODERN_COLORS[index % MODERN_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [
                    `${currencySymbol}${formatCurrency(Number(value))}`,
                    "Total",
                  ]}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    color: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-secondary-titles dark:text-muted-foreground font-medium">
                      {translate(`categories.${value}`) || value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Central Total Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10">
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                Total
              </span>
              <span className="text-lg font-black text-titles dark:text-foreground">
                {currencySymbol}
                {formatCurrency(totalExpenseAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Income vs Expenses Trend */}
      <div className="bg-card dark:bg-card/75 backdrop-blur-sm p-6 rounded-3xl shadow-card hover:shadow-card-hover border border-slate-200/90 dark:border-border/60 flex flex-col justify-between transition-all">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-base font-bold text-titles dark:text-foreground">
              {translate("summary.incomeVsExpenses")}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
            {currentYear}
          </span>
        </div>

        <div className="h-[260px] sm:h-[300px] w-full min-w-0 min-h-[260px] grow">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                strokeOpacity={0.06}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                tickFormatter={(val) => `${currencySymbol}${val}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(59, 130, 246, 0.04)" }}
                formatter={(value: unknown) => [
                  `${currencySymbol}${formatCurrency(Number(value))}`,
                ]}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  color: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-secondary-titles dark:text-muted-foreground font-medium">
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="income"
                name={translate("summary.income")}
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                barSize={10}
              />
              <Bar
                dataKey="expenses"
                name={translate("summary.expenses")}
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                barSize={10}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
