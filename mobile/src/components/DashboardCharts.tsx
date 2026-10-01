import React from 'react';
import { View, Text } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react-native';
import { Expense, Income } from '../types';
import { useSettings } from '../context/SettingsContext';

interface DashboardChartsProps {
  expenses: Expense[];
  incomes: Income[];
  currentMonthExpenses?: Expense[];
}

const CATEGORY_COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  expenses,
  incomes,
  currentMonthExpenses,
}) => {
  const { formatCurrency, language, t } = useSettings();

  const expensesForPie = currentMonthExpenses || expenses;

  // Procesar gastos por categoría
  const categoryMap: { [cat: string]: number } = {};
  expensesForPie.forEach((e) => {
    const amt = Number(e.amount) || 0;
    categoryMap[e.category] = (categoryMap[e.category] || 0) + amt;
  });

  const categoryList = Object.entries(categoryMap)
    .map(([name, value], idx) => ({
      name,
      value,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const totalExpenseAmount = categoryList.reduce((acc, curr) => acc + curr.value, 0);

  // Procesar 12 meses Ingresos vs Gastos
  const currentYear = new Date().getFullYear();
  const monthNames = language === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES;
  const monthlyData = monthNames.map((name) => ({ name, income: 0, expenses: 0 }));

  expenses.forEach((e) => {
    try {
      const d = new Date(e.date);
      if (d.getFullYear() === currentYear && d.getMonth() >= 0 && d.getMonth() < 12) {
        monthlyData[d.getMonth()].expenses += Number(e.amount) || 0;
      }
    } catch {
      // Ignorar errores de fecha
    }
  });

  incomes.forEach((i) => {
    try {
      const d = new Date(i.date);
      if (d.getFullYear() === currentYear && d.getMonth() >= 0 && d.getMonth() < 12) {
        monthlyData[d.getMonth()].income += Number(i.amount) || 0;
      }
    } catch {
      // Ignorar errores de fecha
    }
  });

  const maxMonthValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expenses)),
    1
  );

  // Donut SVG Math
  const radius = 64;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <View className="gap-4 mb-5">
      {/* 1. Gastos por Categoría */}
      <View className="bg-card rounded-3xl p-[18px] border border-white/[0.06]">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-[10px] bg-blue-500/15 justify-center items-center">
              <PieIcon size={16} color="#3b82f6" />
            </View>
            <Text className="text-[15px] font-bold text-white">{t('summary.expensesByCategory')}</Text>
          </View>
          <View className="bg-slate-800 px-2 py-0.5 rounded-lg">
            <Text className="text-[11px] text-slate-400 font-semibold">
              {expensesForPie.length} {language === 'en' ? 'txs' : 'movs'}
            </Text>
          </View>
        </View>

        {categoryList.length === 0 ? (
          <View className="py-8 items-center justify-center">
            <Text className="text-slate-500 text-xs">{t('common.noData')}</Text>
          </View>
        ) : (
          <>
            {/* Donut Chart SVG con Centro */}
            <View className="items-center justify-center relative my-2">
              <Svg width={160} height={160} viewBox="0 0 160 160">
                <G rotation="-90" origin="80, 80">
                  {/* Círculo base de fondo */}
                  <Circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />

                  {/* Segmentos de Categorías */}
                  {categoryList.map((cat, idx) => {
                    const percent = cat.value / totalExpenseAmount;
                    const strokeDashoffset = circumference * (1 - percent);
                    const rotation = accumulatedPercent * 360;
                    accumulatedPercent += percent;

                    return (
                      <Circle
                        key={`cat-arc-${idx}`}
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke={cat.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        fill="none"
                        strokeLinecap="round"
                        transform={`rotate(${rotation}, 80, 80)`}
                      />
                    );
                  })}
                </G>
              </Svg>

              <View className="absolute items-center justify-center max-w-[100px]">
                <Text className="text-[10px] font-bold text-slate-400 tracking-wider">TOTAL</Text>
                <Text className="text-[13px] font-extrabold text-white mt-0.5 text-center" numberOfLines={1}>
                  {formatCurrency(totalExpenseAmount)}
                </Text>
              </View>
            </View>

            {/* Desglose de Categorías */}
            <View className="gap-3 mt-4 border-t border-white/[0.05] pt-3.5">
              {categoryList.slice(0, 5).map((cat) => {
                const percent = totalExpenseAmount > 0 ? (cat.value / totalExpenseAmount) * 100 : 0;
                return (
                  <View key={cat.name} className="gap-1.5">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2 flex-1 mr-2">
                        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <Text className="text-xs font-semibold text-slate-100 flex-1" numberOfLines={1}>
                          {cat.name}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs font-bold text-white">{formatCurrency(cat.value)}</Text>
                        <Text className="text-[11px] font-semibold text-slate-400 min-w-[28px] text-right">
                          {percent.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    {/* Barra de progreso */}
                    <View className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={[
                          { width: `${Math.min(percent, 100)}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* 2. Gráfico 12 Meses Ingresos vs Gastos */}
      <View className="bg-card rounded-3xl p-[18px] border border-white/[0.06]">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-[10px] bg-emerald-500/15 justify-center items-center">
              <BarChart3 size={16} color="#10b981" />
            </View>
            <Text className="text-[15px] font-bold text-white">{t('summary.incomeVsExpenses')}</Text>
          </View>
          <View className="bg-slate-800 px-2 py-0.5 rounded-lg">
            <Text className="text-[11px] text-slate-400 font-semibold">{currentYear}</Text>
          </View>
        </View>

        {/* Leyenda */}
        <View className="flex-row justify-end gap-4 mb-3">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Text className="text-[11px] text-slate-400 font-semibold">{t('summary.income')}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-rose-500" />
            <Text className="text-[11px] text-slate-400 font-semibold">{t('summary.expenses')}</Text>
          </View>
        </View>

        {/* Gráfico de Barras por Mes */}
        <View className="pt-2">
          <View className="flex-row justify-between items-end h-[140px] pb-[22px] border-b border-white/[0.05]">
            {monthlyData.map((m, idx) => {
              const incHeight = maxMonthValue > 0 ? (m.income / maxMonthValue) * 110 : 0;
              const expHeight = maxMonthValue > 0 ? (m.expenses / maxMonthValue) * 110 : 0;

              return (
                <View key={`month-${idx}`} className="items-center flex-1 h-full justify-end relative">
                  <View className="flex-row items-end gap-0.5 mb-1.5">
                    {/* Barra Ingreso */}
                    <View
                      className={`w-[5px] rounded-t-[3px] ${m.income > 0 ? 'bg-emerald-500' : 'bg-slate-800'}`}
                      style={{ height: Math.max(incHeight, 4) }}
                    />
                    {/* Barra Gasto */}
                    <View
                      className={`w-[5px] rounded-t-[3px] ${m.expenses > 0 ? 'bg-rose-500' : 'bg-slate-800'}`}
                      style={{ height: Math.max(expHeight, 4) }}
                    />
                  </View>
                  <Text className="text-[9px] text-slate-500 font-semibold absolute -bottom-[18px]">
                    {m.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};
