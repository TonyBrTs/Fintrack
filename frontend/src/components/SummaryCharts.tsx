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

interface SummaryChartsProps {
  expenses: Expense[];
  incomes: Income[];
  currentMonthExpenses?: Expense[];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
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

  // Use currentMonthExpenses if provided, otherwise fallback to all expenses
  const expensesForPie = currentMonthExpenses || expenses;

  // Process data for Expenses by Category (Pie Chart)
  const categoryData = expensesForPie.reduce((acc: ChartDataItem[], curr) => {
    const existing = acc.find((item) => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);

  // Process data for Income vs Expenses (Bar Chart)
  // For simplicity, we'll group by month of the current year
  const monthlyData = [
    { name: translate("months.jan"), income: 0, expenses: 0 },
    { name: translate("months.feb"), income: 0, expenses: 0 },
    { name: translate("months.mar"), income: 0, expenses: 0 },
    { name: translate("months.apr"), income: 0, expenses: 0 },
    { name: translate("months.may"), income: 0, expenses: 0 },
    { name: translate("months.jun"), income: 0, expenses: 0 },
    { name: translate("months.jul"), income: 0, expenses: 0 },
    { name: translate("months.aug"), income: 0, expenses: 0 },
    { name: translate("months.sep"), income: 0, expenses: 0 },
    { name: translate("months.oct"), income: 0, expenses: 0 },
    { name: translate("months.nov"), income: 0, expenses: 0 },
    { name: translate("months.dec"), income: 0, expenses: 0 },
  ];

  expenses.forEach((e) => {
    const date = new Date(e.date);
    if (date.getFullYear() === new Date().getFullYear()) {
      monthlyData[date.getMonth()].expenses += e.amount;
    }
  });

  incomes.forEach((i) => {
    const date = new Date(i.date);
    if (date.getFullYear() === new Date().getFullYear()) {
      monthlyData[date.getMonth()].income += i.amount;
    }
  });

  const totalExpenseAmount = expenses.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Expenses by Category */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col">
        <h3 className="text-lg font-semibold mb-6 flex justify-between items-center">
          {translate("summary.expensesByCategory")}
          <span className="text-xs font-normal text-muted-foreground uppercase tracking-widest">
            {expenses.length} Transacciones
          </span>
        </h3>
        <div className="h-[300px] w-full relative grow">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry: ChartDataItem, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
          {/* Central Total Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">
              Total
            </span>
            <span className="text-xl font-bold">
              {currencySymbol}
              {formatCurrency(totalExpenseAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Income vs Expenses Trend */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col">
        <h3 className="text-lg font-semibold mb-6">
          {translate("summary.incomeVsExpenses")}
        </h3>
        <div className="h-[300px] w-full grow">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                strokeOpacity={0.1}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "currentColor", opacity: 0.5 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "currentColor", opacity: 0.5 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
              />
              <Bar
                dataKey="income"
                name={translate("summary.income")}
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                barSize={12}
              />
              <Bar
                dataKey="expenses"
                name={translate("summary.expenses")}
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
