import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../lib/api';
import { Expense, Income, Goal, AIInsight } from '../types';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { AddIncomeModal } from '../components/AddIncomeModal';
import { TransactionActionSheet, ActionSheetTransaction } from '../components/TransactionActionSheet';
import { PeriodPicker, isDateInPeriod } from '../components/PeriodPickerModal';
import { BrandLogo } from '../components/BrandLogo';
import { DashboardCharts } from '../components/DashboardCharts';
import { formatDate } from '../lib/format';
import {
  Settings,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  MoreVertical,
} from 'lucide-react-native';

type DashboardTx = {
  id: string;
  type: 'expense' | 'income';
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  raw: Expense | Income;
};

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { formatCurrency, t, openSettings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Datos puros de la API
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allIncomes, setAllIncomes] = useState<Income[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  // Filtro de movimientos en dashboard
  const [txFilter, setTxFilter] = useState<'all' | 'expenses' | 'incomes'>('all');

  // Filtro de mes (por defecto el mes actual: "YYYY-MM")
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modales
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [actionSheetTx, setActionSheetTx] = useState<DashboardTx | null>(null);

  // Animaciones de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const runEntranceAnimation = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Carga de datos del backend
  const loadDashboardData = useCallback(async () => {
    try {
      const [expData, incData, goalsData] = await Promise.all([
        api.getExpenses().catch(() => []),
        api.getIncomes().catch(() => []),
        api.getGoals().catch(() => []),
      ]);

      setAllExpenses(Array.isArray(expData) ? expData : []);
      setAllIncomes(Array.isArray(incData) ? incData : []);
      setAllGoals(Array.isArray(goalsData) ? goalsData : []);

      // Cargar insights de Gemini en segundo plano
      api.getAIInsights(expData, incData, goalsData)
        .then((insights) => setAiInsights(insights))
        .catch(() => {});
    } catch {
      Alert.alert(t('common.error'), 'No se pudieron sincronizar los datos con la API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      runEntranceAnimation();
    }
  }, [runEntranceAnimation, t]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleActionSheetEdit = (tx: ActionSheetTransaction) => {
    if (tx.type === 'expense') {
      setEditingExpense(tx.raw as Expense);
    } else {
      setEditingIncome(tx.raw as Income);
    }
  };

  const handleActionSheetDelete = async (id: string, _title: string, type: 'expense' | 'income') => {
    try {
      if (type === 'expense') {
        await api.deleteExpense(id);
      } else {
        await api.deleteIncome(id);
      }
      loadDashboardData();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'No se pudo eliminar el movimiento.');
    }
  };

  // Filtrar según mes, día o rango (inicio..fin)
  const filteredExpenses = React.useMemo(() => {
    return allExpenses.filter((e) => isDateInPeriod(e.date, selectedMonth));
  }, [allExpenses, selectedMonth]);

  const filteredIncomes = React.useMemo(() => {
    return allIncomes.filter((i) => isDateInPeriod(i.date, selectedMonth));
  }, [allIncomes, selectedMonth]);

  // CÁLCULO PRECISO Y REAL DE TOTALES (DIRECTO 1:1 COMO EN LA WEB)
  const totalExpenses = filteredExpenses.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );
  const totalIncomes = filteredIncomes.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );
  const netSavings = totalIncomes - totalExpenses;
  const savingsRate = totalIncomes > 0 ? ((totalIncomes - totalExpenses) / totalIncomes) * 100 : 0;
  const isNegative = netSavings < 0;


  // Movimientos combinados para el dashboard (Ingresos y Gastos ordenados cronológicamente)
  const combinedTransactions: DashboardTx[] = React.useMemo(() => {
    const expList: DashboardTx[] = filteredExpenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      title: e.description || e.category,
      category: e.category,
      amount: e.amount,
      currency: e.currency,
      date: e.date,
      raw: e,
    }));

    const incList: DashboardTx[] = filteredIncomes.map((i) => ({
      id: i.id,
      type: 'income' as const,
      title: i.source || i.description || i.category || 'Ingreso',
      category: i.category || i.source || 'Ingreso',
      amount: i.amount,
      currency: i.currency,
      date: i.date,
      raw: i,
    }));

    let list: DashboardTx[] = [];
    if (txFilter === 'all') {
      list = [...expList, ...incList];
    } else if (txFilter === 'expenses') {
      list = expList;
    } else {
      list = incList;
    }

    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredExpenses, filteredIncomes, txFilter]);

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center gap-3.5">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 text-sm font-medium">Cargando balance de FinTrack...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
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
        {/* Header Superior con Logo Oficial FinTrack */}
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-2.5 justify-center">
            <BrandLogo size={26} variant="full" className="mb-1" />
            <Text className="text-xs text-slate-400 font-medium">
              {t('common.welcome')}{' '}
              <Text className="text-sm font-extrabold text-white">
                {user?.email ? user.email.split('@')[0] : t('common.user')}
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            className="w-[38px] h-[38px] rounded-xl bg-card border border-white/[0.08] justify-center items-center"
            onPress={openSettings}
            activeOpacity={0.7}
            accessibilityLabel="Configuración"
          >
            <Settings size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Selector de Período Moderno */}
        <PeriodPicker selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Hero Card de Balance Principal */}
          <View
            className={`bg-card rounded-3xl p-[22px] border gap-3.5 shadow-xl shadow-black ${
              isNegative ? 'border-rose-500/35' : 'border-emerald-500/35'
            }`}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <Wallet size={16} color="#94a3b8" />
                <Text className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t('summary.netSaving')}
                </Text>
              </View>
            </View>

            <Text
              className={`text-[34px] font-black tracking-tight ${
                isNegative ? 'text-rose-500' : 'text-white'
              }`}
            >
              {formatCurrency(netSavings)}
            </Text>

            {/* Sub-tarjeta de Ingresos y Gastos */}
            <View className="flex-row items-center bg-background rounded-2xl p-3.5">
              <View className="flex-1 flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-[10px] bg-emerald-500/15 justify-center items-center">
                  <ArrowUpRight size={14} color="#10b981" />
                </View>
                <View className="gap-0.5">
                  <Text className="text-[11px] text-slate-500 font-medium">{t('summary.income')}</Text>
                  <Text className="text-[13px] font-bold text-emerald-500">
                    +{formatCurrency(totalIncomes)}
                  </Text>
                </View>
              </View>

              <View className="w-[1px] h-8 bg-white/[0.08] mx-3" />

              <View className="flex-1 flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-[10px] bg-rose-500/15 justify-center items-center">
                  <ArrowDownRight size={14} color="#f43f5e" />
                </View>
                <View className="gap-0.5">
                  <Text className="text-[11px] text-slate-500 font-medium">{t('summary.expenses')}</Text>
                  <Text className="text-[13px] font-bold text-rose-500">
                    -{formatCurrency(totalExpenses)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 pt-1">
              <Sparkles size={13} color="#f59e0b" />
              <Text className="text-xs text-slate-400">
                {t('summary.savingsRate')}:{' '}
                <Text className="font-bold text-blue-400">{savingsRate.toFixed(1)}%</Text>
              </Text>
            </View>
          </View>

          {/* Acciones Rápidas */}
          <Text className="text-base font-extrabold text-white mt-2 mb-1">
            {t('summary.quickActions')}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center p-3.5 rounded-[18px] bg-card border border-emerald-500/25 gap-3"
              onPress={() => setShowIncomeModal(true)}
              activeOpacity={0.8}
            >
              <View className="w-10 h-10 rounded-[14px] bg-emerald-500/15 justify-center items-center">
                <ArrowUpRight size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-white mb-0.5">{t('summary.newIncome')}</Text>
                <Text className="text-[11px] text-slate-400">{t('summary.registerIncomeDesc')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center p-3.5 rounded-[18px] bg-card border border-rose-500/25 gap-3"
              onPress={() => setShowExpenseModal(true)}
              activeOpacity={0.8}
            >
              <View className="w-10 h-10 rounded-[14px] bg-rose-500/15 justify-center items-center">
                <ArrowDownRight size={20} color="#f43f5e" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-white mb-0.5">{t('summary.newExpense')}</Text>
                <Text className="text-[11px] text-slate-400">{t('summary.registerExpenseDesc')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* AI Insights Card de Google Gemini */}
          {aiInsights.length > 0 && (
            <View className="gap-2 mt-1.5">
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={16} color="#60a5fa" />
                <Text className="text-[13px] font-bold text-blue-300">{t('summary.aiInsights')}</Text>
              </View>
              <View className="bg-[#0f172a] rounded-2xl p-3.5 border border-blue-500/25 gap-1">
                <Text className="text-[13px] font-bold text-white">{aiInsights[0].title}</Text>
                <Text className="text-xs text-slate-400 leading-[17px]">{aiInsights[0].desc}</Text>
              </View>
            </View>
          )}

          {/* Gráficos de Resumen con Paridad Web: Gastos por Categoría + 12 Meses Ingresos vs Gastos */}
          <View className="mt-3">
            <DashboardCharts
              expenses={allExpenses}
              incomes={allIncomes}
              currentMonthExpenses={filteredExpenses}
            />
          </View>

          {/* Movimientos Recientes (Ingresos y Gastos combinados) */}
          <View className="flex-row justify-between items-center mt-1 mb-0.5">
            <Text className="text-base font-extrabold text-white">
              {t('summary.recentTransactions')}
            </Text>
          </View>

          {/* Segmented Control Táctil Móvil para Alternar entre Todos, Ingresos y Gastos */}
          <View className="flex-row bg-card rounded-[14px] p-[3px] border border-white/[0.07] gap-1 mb-1">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-[9px] rounded-[11px] gap-1.5 ${
                txFilter === 'all' ? 'bg-slate-800 border border-white/[0.12]' : ''
              }`}
              onPress={() => setTxFilter('all')}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-semibold ${
                  txFilter === 'all' ? 'text-white font-bold' : 'text-slate-400'
                }`}
              >
                {t('transactions.all')}
              </Text>
              <View
                className={`px-1.5 py-0.5 rounded-lg ${
                  txFilter === 'all' ? 'bg-white/15' : 'bg-white/[0.05]'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    txFilter === 'all' ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {filteredExpenses.length + filteredIncomes.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-[9px] rounded-[11px] gap-1.5 ${
                txFilter === 'incomes'
                  ? 'bg-emerald-500/15 border border-emerald-500/35'
                  : ''
              }`}
              onPress={() => setTxFilter('incomes')}
              activeOpacity={0.7}
            >
              <ArrowUpRight
                size={14}
                color={txFilter === 'incomes' ? '#10b981' : '#64748b'}
              />
              <Text
                className={`text-xs font-semibold ${
                  txFilter === 'incomes' ? 'text-emerald-500 font-bold' : 'text-slate-400'
                }`}
              >
                {t('transactions.incomes')}
              </Text>
              <View
                className={`px-1.5 py-0.5 rounded-lg ${
                  txFilter === 'incomes' ? 'bg-emerald-500/25' : 'bg-white/[0.05]'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    txFilter === 'incomes' ? 'text-emerald-500' : 'text-slate-500'
                  }`}
                >
                  {filteredIncomes.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-[9px] rounded-[11px] gap-1.5 ${
                txFilter === 'expenses'
                  ? 'bg-rose-500/15 border border-rose-500/35'
                  : ''
              }`}
              onPress={() => setTxFilter('expenses')}
              activeOpacity={0.7}
            >
              <ArrowDownRight
                size={14}
                color={txFilter === 'expenses' ? '#f43f5e' : '#64748b'}
              />
              <Text
                className={`text-xs font-semibold ${
                  txFilter === 'expenses' ? 'text-rose-500 font-bold' : 'text-slate-400'
                }`}
              >
                {t('transactions.expenses')}
              </Text>
              <View
                className={`px-1.5 py-0.5 rounded-lg ${
                  txFilter === 'expenses' ? 'bg-rose-500/25' : 'bg-white/[0.05]'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    txFilter === 'expenses' ? 'text-rose-500' : 'text-slate-500'
                  }`}
                >
                  {filteredExpenses.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {combinedTransactions.length === 0 ? (
            <View className="items-center justify-center py-9 gap-2.5 bg-card rounded-[18px] border border-white/[0.04]">
              <Layers size={38} color="#475569" />
              <Text className="text-xs text-slate-500 text-center">{t('summary.noTransactions')}</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {combinedTransactions.slice(0, 8).map((item) => {
                const isExp = item.type === 'expense';

                return (
                  <TouchableOpacity
                    key={`${item.type}-${item.id}`}
                    className="flex-row items-center justify-between bg-card p-3 rounded-2xl border border-white/[0.05]"
                    onPress={() => setActionSheetTx(item)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className={`w-[38px] h-[38px] rounded-xl justify-center items-center ${
                          isExp ? 'bg-rose-500/15' : 'bg-emerald-500/15'
                        }`}
                      >
                        {isExp ? (
                          <ArrowDownRight size={18} color="#f43f5e" />
                        ) : (
                          <ArrowUpRight size={18} color="#10b981" />
                        )}
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text className="text-sm font-bold text-white" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-[11px] text-slate-400">{item.category}</Text>
                          <Text className="text-[10px] text-slate-600">•</Text>
                          <Text className="text-[11px] text-slate-500">{formatDate(item.date)}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`text-sm font-extrabold ${
                          isExp ? 'text-rose-500' : 'text-emerald-500'
                        }`}
                      >
                        {isExp ? '-' : '+'}
                        {formatCurrency(item.amount)}
                      </Text>
                      <View className="w-[26px] h-[26px] rounded-lg bg-white/[0.04] justify-center items-center">
                        <MoreVertical size={16} color="#64748b" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modales de Adición y Edición */}
      <AddExpenseModal
        visible={showExpenseModal || editingExpense !== null}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        onSuccess={loadDashboardData}
        initialData={editingExpense}
      />
      <AddIncomeModal
        visible={showIncomeModal || editingIncome !== null}
        onClose={() => {
          setShowIncomeModal(false);
          setEditingIncome(null);
        }}
        onSuccess={loadDashboardData}
        initialData={editingIncome}
      />

      {/* Action Sheet Móvil para Editar / Eliminar */}
      <TransactionActionSheet
        visible={actionSheetTx !== null}
        transaction={
          actionSheetTx
            ? {
                id: actionSheetTx.id,
                type: actionSheetTx.type,
                title: actionSheetTx.title,
                category: actionSheetTx.category,
                amount: actionSheetTx.amount,
                currency: actionSheetTx.currency,
                date: actionSheetTx.date,
                paymentMethod: (actionSheetTx.raw as any).payment_method,
                raw: actionSheetTx.raw,
              }
            : null
        }
        onClose={() => setActionSheetTx(null)}
        onEdit={handleActionSheetEdit}
        onDelete={handleActionSheetDelete}
      />
    </View>
  );
};
