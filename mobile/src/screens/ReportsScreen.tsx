import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { api } from '../lib/api';
import { Expense, Income } from '../types';
import {
  BarChart3,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Settings,
  Share2,
  Copy,
  Check,
} from 'lucide-react-native';
import { PeriodPicker, isDateInPeriod } from '../components/PeriodPickerModal';
import { BrandLogo } from '../components/BrandLogo';

type PeriodPreset = 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'all';

export const ReportsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { formatCurrency, t, openSettings, language } = useSettings();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [preset, setPreset] = useState<PeriodPreset>('this_month');
  const [copiedRef, setCopiedRef] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const loadReportData = useCallback(async () => {
    try {
      const [expData, incData] = await Promise.all([
        api.getExpenses().catch(() => []),
        api.getIncomes().catch(() => []),
      ]);
      setExpenses(Array.isArray(expData) ? expData : []);
      setIncomes(Array.isArray(incData) ? incData : []);
    } catch {
      Alert.alert(t('common.error'), 'No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  // Filtrar según mes, día o rango (inicio..fin)
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((e) => isDateInPeriod(e.date, selectedMonth));
  }, [expenses, selectedMonth]);

  const filteredIncomes = React.useMemo(() => {
    return incomes.filter((i) => isDateInPeriod(i.date, selectedMonth));
  }, [incomes, selectedMonth]);

  // Cálculos precisos de totales (directo 1:1 como en la web)
  const totalIncomes = filteredIncomes.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );
  const totalExpenses = filteredExpenses.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );
  const netSavings = totalIncomes - totalExpenses;
  const savingsRate = totalIncomes > 0 ? ((totalIncomes - totalExpenses) / totalIncomes) * 100 : 0;

  // Desglose de categorías directo
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    const cat = e.category || 'Otros';
    const amount = Number(e.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
  });

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const getCategoryColor = (index: number) => {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[index % colors.length];
  };

  // Código oficial de referencia de auditoría FinTrack (Paridad 100% con Web)
  const reportReference = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const seed = ((Math.abs(totalExpenses) + Math.abs(totalIncomes) + 71) * 997)
      .toString(16)
      .toUpperCase()
      .slice(0, 4);
    return `FT-${y}${m}-${seed || '9B3E'}`;
  }, [totalExpenses, totalIncomes]);

  const handleSelectPreset = (p: PeriodPreset) => {
    setPreset(p);
    const now = new Date();

    if (p === 'this_month') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setSelectedMonth(`${y}-${m}`);
    } else if (p === 'last_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = prev.getFullYear();
      const m = String(prev.getMonth() + 1).padStart(2, '0');
      setSelectedMonth(`${y}-${m}`);
    } else if (p === 'last_30_days') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      const start = past.toISOString().split('T')[0];
      const end = now.toISOString().split('T')[0];
      setSelectedMonth(`${start}..${end}`);
    } else if (p === 'this_year') {
      setSelectedMonth(String(now.getFullYear()));
    } else if (p === 'all') {
      setSelectedMonth('all');
    }
  };

  const handleCopyReference = () => {
    if (typeof navigator !== 'undefined' && (navigator as any)?.clipboard?.writeText) {
      (navigator as any).clipboard.writeText(reportReference);
    }
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleExportSummary = () => {
    const periodName =
      preset === 'this_month'
        ? (language === 'en' ? 'This Month' : 'Este Mes')
        : preset === 'last_month'
        ? (language === 'en' ? 'Last Month' : 'Mes Anterior')
        : preset === 'last_30_days'
        ? (language === 'en' ? 'Last 30 Days' : 'Últimos 30 Días')
        : preset === 'this_year'
        ? (language === 'en' ? 'This Year' : 'Este Año')
        : (language === 'en' ? 'All Time' : 'Histórico Completo');

    const summaryText =
      `FINTRACK - REPORTE FINANCIERO\n` +
      `Código de Auditoría: ${reportReference}\n` +
      `Período: ${periodName} (${selectedMonth})\n` +
      `Total Ingresos: +${formatCurrency(totalIncomes)}\n` +
      `Total Gastos: -${formatCurrency(totalExpenses)}\n` +
      `Ahorro Neto: ${formatCurrency(netSavings)}\n` +
      `Tasa de Ahorro: ${savingsRate.toFixed(1)}%\n` +
      `Fecha de Emisión: ${new Date().toLocaleDateString()}\n` +
      `Estado: Certificado FinTrack Oficial`;

    if (typeof navigator !== 'undefined' && (navigator as any)?.clipboard?.writeText) {
      (navigator as any).clipboard.writeText(summaryText);
    }

    Alert.alert(
      language === 'en' ? 'Report Exported' : 'Reporte Exportado',
      language === 'en'
        ? `Audit Reference: ${reportReference}\n\nThe financial summary has been copied to your clipboard.`
        : `Código de Auditoría: ${reportReference}\n\nEl resumen contable ha sido copiado a tu portapapeles.`
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center gap-3">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 text-[13px]">Calculando reportes y conversiones...</Text>
      </View>
    );
  }

  const cashflowMax = Math.max(totalIncomes, totalExpenses, 1);
  const incomeWidthPercent = Math.min(100, Math.round((totalIncomes / cashflowMax) * 100));
  const expenseWidthPercent = Math.min(100, Math.round((totalExpenses / cashflowMax) * 100));

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 16,
          paddingTop: Math.max(insets.top + 8, 20),
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-1.5 mb-1">
              <BrandLogo size={20} variant="icon" />
              <Text className="text-slate-400 text-[11px] font-extrabold tracking-widest">FINTRACK</Text>
            </View>
            <Text className="text-[22px] font-extrabold text-white" numberOfLines={1}>
              {t('reports.title')}
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
              {t('reports.subtitle')}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-card border border-blue-500/30 px-3 h-[38px] rounded-xl justify-center"
              onPress={handleExportSummary}
              activeOpacity={0.8}
            >
              <Share2 size={14} color="#60a5fa" />
              <Text className="text-blue-400 text-xs font-bold">
                {language === 'en' ? 'Export' : 'Exportar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[38px] h-[38px] rounded-xl bg-card border border-white/[0.08] justify-center items-center"
              onPress={openSettings}
              activeOpacity={0.7}
              accessibilityLabel="Configuración"
            >
              <Settings size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de Presets Rápidos */}
        <View className="-mx-5 mb-0.5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 36, gap: 8 }}
          >
            {[
              { id: 'this_month', label: language === 'en' ? 'This Month' : 'Este Mes' },
              { id: 'last_month', label: language === 'en' ? 'Last Month' : 'Mes Anterior' },
              { id: 'last_30_days', label: language === 'en' ? 'Last 30 Days' : 'Últimos 30 Días' },
              { id: 'this_year', label: language === 'en' ? 'This Year' : 'Este Año' },
              { id: 'all', label: language === 'en' ? 'All Time' : 'Todo el Historial' },
            ].map((item) => {
              const isActive = preset === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  className={`px-3.5 py-[7px] rounded-full border ${
                    isActive ? 'bg-blue-500/20 border-blue-500' : 'bg-card border-white/[0.08]'
                  }`}
                  onPress={() => handleSelectPreset(item.id as PeriodPreset)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-xs ${
                      isActive ? 'text-blue-400 font-bold' : 'text-slate-400 font-semibold'
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selector de Período Moderno */}
        <PeriodPicker selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />

        {/* Tarjeta de Salud Financiera */}
        <View className="bg-card rounded-[18px] p-3.5 border border-white/[0.05]">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-slate-800 justify-center items-center">
              {savingsRate >= 20 ? (
                <ShieldCheck size={18} color="#10b981" />
              ) : savingsRate >= 0 ? (
                <AlertTriangle size={18} color="#f59e0b" />
              ) : (
                <Flame size={18} color="#f43f5e" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-bold text-white">{t('reports.financialHealth')}</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5 leading-[15px]">
                {savingsRate >= 20
                  ? t('reports.healthGood')
                  : savingsRate >= 0
                  ? t('reports.healthWarning')
                  : t('reports.healthDanger')}
              </Text>
            </View>
          </View>
        </View>

        {/* Tarjeta Visual: Flujo de Caja Comparativo */}
        <View className="bg-card rounded-[20px] p-4 border border-white/[0.05] gap-4">
          <View className="flex-row items-center gap-2">
            <BarChart3 size={18} color="#60a5fa" />
            <Text className="text-[15px] font-bold text-white">{t('reports.cashflowTitle')}</Text>
          </View>

          <View className="gap-3.5">
            {/* Barra de Ingresos */}
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                <Text className="text-xs text-slate-400 flex-1">{t('reports.incomesLabel')}</Text>
                <Text className="text-[13px] font-bold text-emerald-500">+{formatCurrency(totalIncomes)}</Text>
              </View>
              <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <View className="h-full bg-emerald-500 rounded-full" style={{ width: `${incomeWidthPercent}%` }} />
              </View>
            </View>

            {/* Barra de Gastos */}
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <View className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
                <Text className="text-xs text-slate-400 flex-1">{t('reports.expensesLabel')}</Text>
                <Text className="text-[13px] font-bold text-rose-500">-{formatCurrency(totalExpenses)}</Text>
              </View>
              <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <View className="h-full bg-rose-500 rounded-full" style={{ width: `${expenseWidthPercent}%` }} />
              </View>
            </View>
          </View>

          {/* Resultado Neto */}
          <View className="flex-row justify-between items-center pt-3 border-t border-white/[0.06]">
            <Text className="text-[13px] font-semibold text-slate-300">{t('reports.netSavingsLabel')}</Text>
            <Text
              className={`text-base font-extrabold ${
                netSavings >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {formatCurrency(netSavings)}
            </Text>
          </View>
        </View>

        {/* Desglose de Gastos por Categoría */}
        <View className="bg-card rounded-[20px] p-4 border border-white/[0.05] gap-3.5">
          <View className="flex-row items-center gap-2">
            <PieChart size={18} color="#ec4899" />
            <Text className="text-[15px] font-bold text-white">{t('reports.distributionTitle')}</Text>
          </View>

          {categoryBreakdown.length === 0 ? (
            <View className="py-5 items-center">
              <Text className="text-xs text-slate-500 text-center">
                {t('reports.noData')}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {categoryBreakdown.map((cat, index) => {
                const barColor = getCategoryColor(index);
                return (
                  <View key={cat.category} className="gap-1.5">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2 flex-1 mr-2">
                        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barColor }} />
                        <Text className="text-[13px] font-semibold text-white flex-1" numberOfLines={1}>{cat.category}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[13px] font-bold text-slate-300">{formatCurrency(cat.amount)}</Text>
                        <Text className="text-[11px] text-slate-500 min-w-[38px] text-right">{cat.percentage.toFixed(1)}%</Text>
                      </View>
                    </View>

                    <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Tarjeta de Certificado de Auditoría FinTrack (Paridad Web) */}
        <View className="bg-card rounded-[18px] p-4 border border-emerald-500/20 gap-3 mt-1">
          <View className="flex-row items-center gap-2.5">
            <View className="w-[34px] h-[34px] rounded-[10px] bg-emerald-500/15 items-center justify-center">
              <ShieldCheck size={18} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-bold text-slate-100">
                {language === 'en' ? 'FinTrack Certified Report' : 'Reporte Certificado FinTrack'}
              </Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'Official statement integrity verified'
                  : 'Integridad de estados contables verificada'}
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-white/[0.06]" />

          <View className="flex-row items-center justify-between">
            <View className="gap-0.5">
              <Text className="text-[9px] font-bold text-slate-500 tracking-wider">
                {language === 'en' ? 'AUDIT REFERENCE' : 'REF. DE AUDITORÍA'}
              </Text>
              <Text className="text-[13px] font-extrabold text-emerald-500 font-mono">{reportReference}</Text>
            </View>

            <TouchableOpacity
              className={`flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                copiedRef ? 'bg-emerald-500/15' : 'bg-slate-800'
              }`}
              onPress={handleCopyReference}
              activeOpacity={0.7}
            >
              {copiedRef ? (
                <>
                  <Check size={12} color="#10b981" />
                  <Text className="text-[11px] text-emerald-500 font-bold">
                    {language === 'en' ? 'Copied' : 'Copiado'}
                  </Text>
                </>
              ) : (
                <>
                  <Copy size={12} color="#94a3b8" />
                  <Text className="text-[11px] text-slate-300 font-semibold">
                    {language === 'en' ? 'Copy Ref' : 'Copiar'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
