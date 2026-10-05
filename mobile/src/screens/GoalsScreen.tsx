import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "../context/SettingsContext";
import { api } from "../lib/api";
import { Goal } from "../types";
import { BrandLogo } from "../components/BrandLogo";
import { GoalCardItem } from "../components/GoalCardItem";
import { GoalActionSheet } from "../components/GoalActionSheet";
import { GoalModal } from "../components/GoalModal";
import { ContributeGoalModal } from "../components/ContributeGoalModal";
import { Target, Plus, Sparkles, Settings, Trophy, TrendingUp } from "lucide-react-native";

export const GoalsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { formatCurrency, currency, t, openSettings } = useSettings();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const kpiAnim = useRef(new Animated.Value(0)).current;

  // Sheets & Modals state
  const [actionSheetGoal, setActionSheetGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);

  // Cargar metas
  const loadGoals = useCallback(async () => {
    try {
      const data = await api.getGoals();
      setGoals(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert(t("common.error"), "No se pudieron cargar las metas de ahorro.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    if (!loading && goals.length > 0) {
      Animated.timing(kpiAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, goals.length, kpiAnim]);

  // Cálculos de métricas KPI
  const { totalSaved, totalTarget, overallProgress, completedCount } = useMemo(() => {
    const safeGoals = Array.isArray(goals) ? goals : [];
    const saved = safeGoals.reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0);
    const target = safeGoals.reduce((acc, g) => acc + (Number(g.target_amount) || 0), 0);
    const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
    const completed = safeGoals.filter(
      (g) => (Number(g.current_amount) || 0) >= (Number(g.target_amount) || 0)
    ).length;

    return {
      totalSaved: saved,
      totalTarget: target,
      overallProgress: progress,
      completedCount: completed,
    };
  }, [goals]);

  // Modal Crear
  const handleOpenCreate = () => {
    setEditingGoal(null);
    setShowGoalModal(true);
  };

  // Modal Editar
  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  // Eliminar Meta
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await api.deleteGoal(goalId);
      loadGoals();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "No se pudo eliminar la meta.");
    }
  };

  if (loading && goals.length === 0) {
    return (
      <View className="flex-1 bg-background justify-center items-center gap-3">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-slate-400 text-sm font-medium">Cargando objetivos de ahorro...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header Superior con Logo Oficial FinTrack */}
      <View
        className="flex-row justify-between items-center px-5 pb-3.5"
        style={{ paddingTop: Math.max(insets.top + 8, 20) }}
      >
        <View className="flex-1 pr-2.5">
          <View className="flex-row items-center gap-1.5 mb-1">
            <BrandLogo size={20} variant="icon" />
            <Text className="text-slate-400 text-[11px] font-extrabold tracking-widest">
              FINTRACK
            </Text>
          </View>
          <Text className="text-[22px] font-extrabold text-white">{t("goals.title")}</Text>
          <Text className="text-xs text-slate-400 mt-0.5">{t("goals.subtitle")}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="flex-row items-center gap-1 bg-emerald-500 px-3 h-[38px] rounded-xl justify-center shadow-sm"
            onPress={handleOpenCreate}
            activeOpacity={0.85}
          >
            <Plus size={15} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white text-[13px] font-bold">{t("goals.newGoal")}</Text>
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

      {/* Lista de Metas con Tarjetas de Resumen KPI integradas */}
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadGoals();
            }}
            tintColor="#10b981"
            colors={["#10b981", "#f59e0b", "#a855f7"]}
          />
        }
        ListHeaderComponent={
          goals.length > 0 ? (
            <Animated.View
              className="gap-2.5 mb-1.5"
              style={{
                opacity: kpiAnim,
                transform: [
                  {
                    translateY: kpiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 0],
                    }),
                  },
                ],
              }}
            >
              {/* Tarjeta 1: Total Acumulado */}
              <View className="bg-card rounded-[18px] p-4 border border-emerald-500/30">
                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <View className="w-[26px] h-[26px] rounded-md bg-emerald-500/20 justify-center items-center">
                    <TrendingUp size={16} color="#10b981" />
                  </View>
                  <Text className="text-[11px] font-extrabold text-emerald-400 tracking-wider">
                    TOTAL ACUMULADO
                  </Text>
                </View>
                <Text className="text-[26px] font-extrabold text-white">
                  {formatCurrency(totalSaved)}
                </Text>
                <Text className="text-xs text-slate-500 mt-1 font-medium">
                  Meta acumulada: {formatCurrency(totalTarget)}
                </Text>
              </View>

              {/* Fila con 2 KPIs secundarios */}
              <View className="flex-row gap-2.5">
                {/* Progreso Global */}
                <View className="flex-1 bg-card rounded-2xl p-3.5 border border-amber-500/25">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <View className="w-6 h-6 rounded-md bg-amber-500/20 justify-center items-center">
                      <Sparkles size={14} color="#f59e0b" />
                    </View>
                    <Text className="text-[11px] font-extrabold text-amber-400 tracking-wider">
                      PROGRESO
                    </Text>
                  </View>
                  <Text className="text-lg font-extrabold text-white mb-1.5">
                    {overallProgress.toFixed(1)}%
                  </Text>
                  <View className="h-[5px] bg-slate-800 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </View>
                </View>

                {/* Metas Cumplidas */}
                <View className="flex-1 bg-card rounded-2xl p-3.5 border border-purple-500/25">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <View className="w-6 h-6 rounded-md bg-purple-500/20 justify-center items-center">
                      <Trophy size={14} color="#a855f7" />
                    </View>
                    <Text className="text-[11px] font-extrabold text-purple-400 tracking-wider">
                      CUMPLIDAS
                    </Text>
                  </View>
                  <Text className="text-lg font-extrabold text-white mb-1.5">
                    {completedCount} / {goals.length}
                  </Text>
                  <Text className="text-[11px] text-purple-400 font-semibold">
                    {completedCount > 0 ? "Objetivos logrados" : "En camino"}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12 gap-2.5">
            <View className="w-20 h-20 rounded-full bg-emerald-500/10 justify-center items-center mb-1.5">
              <Target size={44} color="#10b981" />
            </View>
            <Text className="text-base font-bold text-slate-200">{t("goals.emptyTitle")}</Text>
            <Text className="text-xs text-slate-500 text-center px-5 leading-4">
              {t("goals.emptyDesc")}
            </Text>
            <TouchableOpacity
              className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl mt-1 bg-emerald-500 shadow-md shadow-emerald-500/30"
              onPress={handleOpenCreate}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-white text-[13px] font-extrabold">
                {t("goals.createFirst")}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <GoalCardItem
            goal={item}
            index={index}
            onOpenActions={(g) => setActionSheetGoal(g)}
            onContribute={(g) => setContributeGoal(g)}
            formatCurrency={formatCurrency}
            t={t}
          />
        )}
      />

      {/* Sheet de Acciones de Meta */}
      <GoalActionSheet
        visible={actionSheetGoal !== null}
        goal={actionSheetGoal}
        onClose={() => setActionSheetGoal(null)}
        onContribute={(g) => setContributeGoal(g)}
        onEdit={(g) => handleOpenEdit(g)}
        onDelete={handleDeleteGoal}
        formatCurrency={formatCurrency}
        t={t}
      />

      {/* Modal Crear / Editar Meta */}
      <GoalModal
        visible={showGoalModal}
        editingGoal={editingGoal}
        onClose={() => setShowGoalModal(false)}
        onSuccess={loadGoals}
        currency={currency}
        t={t}
      />

      {/* Modal Aportar a Meta */}
      <ContributeGoalModal
        visible={contributeGoal !== null}
        goal={contributeGoal}
        onClose={() => setContributeGoal(null)}
        onSuccess={loadGoals}
        currency={currency}
        formatCurrency={formatCurrency}
        t={t}
      />
    </View>
  );
};
