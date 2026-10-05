import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "../context/SettingsContext";
import { api } from "../lib/api";
import { RecurringTransaction, Category } from "../types";
import { CategoryModal } from "../components/CategoryModal";
import { BrandLogo } from "../components/BrandLogo";
import { RecurringModal } from "../components/RecurringModal";
import { RecurringActionSheet } from "../components/RecurringActionSheet";
import {
  Repeat,
  Play,
  Plus,
  Calendar,
  ChevronLeft,
  RefreshCw,
  Clock,
  CalendarClock,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
} from "lucide-react-native";

export const RecurringScreen: React.FC<{
  onBack?: () => void;
  initialTab?: "expenses" | "incomes";
  autoOpenCreate?: boolean;
}> = ({ onBack, initialTab = "expenses", autoOpenCreate = false }) => {
  const insets = useSafeAreaInsets();
  const { formatCurrency, currency, language, t, openSettings } = useSettings();

  const [tab, setTab] = useState<"expenses" | "incomes">(initialTab);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringTransaction[]>([]);
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [actionSheetItem, setActionSheetItem] = useState<RecurringTransaction | null>(null);
  const [confirmDeleteSheet, setConfirmDeleteSheet] = useState(false);
  const [deletingSheet, setDeletingSheet] = useState(false);

  const loadRecurringData = useCallback(async () => {
    try {
      const [expData, incData, catData] = await Promise.all([
        api.getRecurringExpenses().catch(() => []),
        api.getRecurringIncomes().catch(() => []),
        api.getCategories().catch(() => []),
      ]);
      setRecurringExpenses(Array.isArray(expData) ? expData : []);
      setRecurringIncomes(Array.isArray(incData) ? incData : []);

      if (Array.isArray(catData) && catData.length > 0) {
        const catNames = catData.map((c: Category) => c.name);
        setCategories(Array.from(new Set(catNames)));
      }
    } catch {
      Alert.alert(t("common.error"), "No se pudieron sincronizar los datos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadRecurringData();
  }, [loadRecurringData]);

  // Sincronización automática de vencimientos con el backend (idéntico a la web)
  const handleSync = async () => {
    try {
      setSyncing(true);
      const clientDate = new Date().toISOString().split("T")[0];

      if (tab === "expenses") {
        const res = await api.syncRecurringExpenses(clientDate);
        if (res?.processed_count && res.processed_count > 0) {
          Alert.alert(
            t("common.success"),
            t("recurring.syncSuccess", { count: res.processed_count })
          );
        } else {
          Alert.alert(t("common.success"), t("recurring.syncUpToDate"));
        }
      } else {
        const res = await api.syncRecurringIncomes(clientDate);
        if (res?.processed_count && res.processed_count > 0) {
          Alert.alert(
            t("common.success"),
            t("recurring.syncSuccess", { count: res.processed_count })
          );
        } else {
          Alert.alert(t("common.success"), t("recurring.syncUpToDate"));
        }
      }
      loadRecurringData();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "Error al sincronizar.");
    } finally {
      setSyncing(false);
    }
  };

  const isAlreadyExecutedThisPeriod = (item: RecurringTransaction): boolean => {
    if (!item.last_executed_at) return false;
    const last = new Date(item.last_executed_at);
    const now = new Date();
    if (item.frequency === "biweekly") {
      const sameMonth =
        last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
      if (!sameMonth) return false;
      const lastIsFirst = last.getDate() <= 15;
      const nowIsFirst = now.getDate() <= 15;
      return lastIsFirst === nowIsFirst;
    }
    if (item.frequency === "monthly") {
      return last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
    }
    if (item.frequency === "weekly") {
      return now.getTime() - last.getTime() < 6 * 24 * 60 * 60 * 1000;
    }
    if (item.frequency === "yearly") {
      return last.getFullYear() === now.getFullYear();
    }
    return false;
  };

  const getDueDateLabel = (
    item: RecurringTransaction
  ): { text: string; status: "today" | "upcoming" | "overdue" | "done" } => {
    if (isAlreadyExecutedThisPeriod(item)) {
      return { text: t("recurring.alreadyRegistered"), status: "done" };
    }

    const targetDateStr = item.next_due_date || item.start_date;
    if (!targetDateStr) return { text: "", status: "upcoming" };

    const target = new Date(targetDateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: t("recurring.today"), status: "today" };
    } else if (diffDays === 1) {
      return { text: t("recurring.tomorrow"), status: "upcoming" };
    } else if (diffDays > 1) {
      return { text: t("recurring.inDays", { days: diffDays }), status: "upcoming" };
    } else {
      return { text: t("recurring.overdueBy", { days: Math.abs(diffDays) }), status: "overdue" };
    }
  };

  const handleToggleActive = async (item: RecurringTransaction) => {
    try {
      setActionLoadingId(item.id);
      const newStatus = !item.is_active;
      if (tab === "expenses") {
        await api.updateRecurringExpense(item.id, { is_active: newStatus });
      } else {
        await api.updateRecurringIncome(item.id, { is_active: newStatus });
      }
      loadRecurringData();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "No se pudo cambiar el estado.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteNow = async (item: RecurringTransaction) => {
    const isIncome = tab === "incomes";
    const actionLabel = isIncome ? t("recurring.collectBtn") : t("recurring.executeBtn");

    Alert.alert(
      actionLabel,
      `¿Deseas registrar "${item.description || item.source}" ahora mismo en tu balance?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          onPress: async () => {
            try {
              setActionLoadingId(item.id);
              if (isIncome) {
                await api.executeRecurringIncomeNow(item.id);
              } else {
                await api.executeRecurringExpenseNow(item.id);
              }
              Alert.alert(t("common.success"), t("recurring.executeSuccess"));
              loadRecurringData();
            } catch (e: any) {
              Alert.alert(t("common.error"), e?.message || "No se pudo ejecutar.");
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const openCreateModal = useCallback(
    (type?: "expenses" | "incomes") => {
      const targetType = type || tab;
      if (type && type !== tab) {
        setTab(type);
      }
      setEditingItem(null);
      setShowModal(true);
    },
    [tab]
  );

  useEffect(() => {
    if (autoOpenCreate) {
      openCreateModal(initialTab);
    }
  }, [autoOpenCreate, initialTab, openCreateModal]);

  const openEditModal = (item: RecurringTransaction) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSaveModal = async (payload: Partial<RecurringTransaction>, isIncome: boolean) => {
    if (isIncome) {
      if (editingItem) {
        await api.updateRecurringIncome(editingItem.id, payload);
      } else {
        await api.createRecurringIncome(payload);
      }
    } else {
      if (editingItem) {
        await api.updateRecurringExpense(editingItem.id, payload);
      } else {
        await api.createRecurringExpense(payload);
      }
    }
    loadRecurringData();
  };

  const currentList = tab === "expenses" ? recurringExpenses : recurringIncomes;
  const activeItems = useMemo(() => currentList.filter((i) => i.is_active), [currentList]);

  const monthlyTotal = useMemo(() => {
    return activeItems.reduce((acc, curr) => {
      const amt = Number(curr.amount) || 0;
      if (curr.frequency === "biweekly") return acc + amt * 2;
      if (curr.frequency === "monthly") return acc + amt;
      if (curr.frequency === "weekly") return acc + amt * 4;
      if (curr.frequency === "yearly") return acc + amt / 12;
      return acc;
    }, 0);
  }, [activeItems]);

  const translateFrequency = (f: string, biweeklyType?: string, billingDay?: number) => {
    const isEn = language === "en";
    switch (f) {
      case "biweekly":
        if (biweeklyType === "every_15_days") {
          return isEn ? "Biweekly (every 15 days)" : "Quincenal (c/ 15 días)";
        }
        return isEn ? "Biweekly (15th & end of month)" : "Quincenal (15 y fin de mes)";
      case "monthly":
        return isEn ? `Monthly (Day ${billingDay || 15})` : `Mensual (Día ${billingDay || 15})`;
      case "weekly":
        return isEn ? "Weekly" : "Semanal";
      case "yearly":
        return isEn ? "Yearly" : "Anual";
      default:
        return f;
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="flex-row justify-between items-center px-5 pb-3.5"
        style={{ paddingTop: Math.max(insets.top + 8, 20) }}
      >
        <View className="flex-1 flex-row items-center gap-2.5 mr-2">
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              className="w-9 h-9 rounded-full bg-slate-800 justify-center items-center"
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color="#ffffff" />
            </TouchableOpacity>
          )}
          <View>
            <View className="flex-row items-center gap-2">
              <BrandLogo size={20} variant="icon" />
              <Text className="text-[21px] font-extrabold text-white">{t("recurring.title")}</Text>
            </View>
            <Text className="text-xs text-slate-400 mt-0.5">{t("recurring.subtitle")}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className={`flex-row items-center gap-1 px-3 h-[38px] rounded-xl justify-center shadow-md ${
              tab === "incomes"
                ? "bg-emerald-500 shadow-emerald-500/35"
                : "bg-rose-500 shadow-rose-500/35"
            }`}
            onPress={() => openCreateModal(tab)}
            activeOpacity={0.85}
          >
            <Plus size={15} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white text-[13px] font-bold">
              {language === "en" ? "New" : "Fijo"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-[38px] h-[38px] rounded-xl bg-card border border-blue-500/30 justify-center items-center"
            onPress={handleSync}
            disabled={syncing}
            activeOpacity={0.7}
            accessibilityLabel={language === "en" ? "Sync" : "Sincronizar"}
          >
            <RefreshCw size={16} color="#60a5fa" className={syncing ? "rotate-45" : ""} />
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

      {/* Selector Gastos Fijos vs Ingresos Fijos */}
      <View className="flex-row mx-5 mb-3 bg-card rounded-xl p-[3px] border border-white/[0.05]">
        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-[9px] ${
            tab === "expenses" ? "bg-slate-800" : ""
          }`}
          onPress={() => setTab("expenses")}
        >
          <Text
            className={`text-xs ${
              tab === "expenses" ? "text-white font-bold" : "text-slate-400 font-semibold"
            }`}
          >
            {t("transactions.expenses")} ({recurringExpenses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-[9px] ${
            tab === "incomes" ? "bg-slate-800" : ""
          }`}
          onPress={() => setTab("incomes")}
        >
          <Text
            className={`text-xs ${
              tab === "incomes" ? "text-white font-bold" : "text-slate-400 font-semibold"
            }`}
          >
            {t("transactions.incomes")} ({recurringIncomes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards de Métricas (Idénticas a la web) */}
      <View className="flex-row mx-5 gap-2.5 mb-3">
        <View className="flex-1 bg-card p-3 rounded-xl border border-white/[0.05] gap-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t("recurring.estimatedMonthly")}
            </Text>
            <Clock size={14} color="#818cf8" />
          </View>
          <Text
            className={`text-lg font-extrabold ${
              tab === "incomes" ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {formatCurrency(monthlyTotal)}
          </Text>
          <Text className="text-[10px] text-slate-500">
            {tab === "incomes"
              ? t("recurring.activeIncomesDesc")
              : t("recurring.activeExpensesDesc")}
          </Text>
        </View>

        <View className="flex-1 bg-card p-3 rounded-xl border border-white/[0.05] gap-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {tab === "incomes"
                ? t("recurring.scheduledIncomes")
                : t("recurring.scheduledExpenses")}
            </Text>
            <Repeat size={14} color="#34d399" />
          </View>
          <Text className="text-lg font-extrabold text-white">
            {activeItems.length}{" "}
            <Text className="text-xs text-slate-500 font-normal">
              / {currentList.length} {t("recurring.activeRatio")}
            </Text>
          </Text>
          <View className="flex-row items-center gap-1">
            <CalendarClock size={11} color="#34d399" />
            <Text className="text-[10px] font-semibold text-emerald-400">
              {t("recurring.autoRegisterActive")}
            </Text>
          </View>
        </View>
      </View>

      {/* Botones de Acción Rápida para Móvil: Gasto Fijo & Ingreso Fijo */}
      <View className="flex-row mx-5 gap-2.5 mb-3">
        <TouchableOpacity
          className={`flex-1 flex-row items-center p-3 rounded-2xl bg-card border gap-2.5 ${
            tab === "expenses" ? "border-rose-500/35" : "border-rose-500/15"
          }`}
          onPress={() => openCreateModal("expenses")}
          activeOpacity={0.85}
        >
          <View className="w-8 h-8 rounded-[10px] bg-rose-500/15 items-center justify-center">
            <ArrowDownRight size={15} color="#f43f5e" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-white">Gasto Fijo</Text>
            <Text className="text-[9px] text-slate-500 mt-0.5">Renta, servicios, gym</Text>
          </View>
          <View className="w-5 h-5 rounded-full bg-white/[0.06] items-center justify-center">
            <Plus size={13} color="#f43f5e" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 flex-row items-center p-3 rounded-2xl bg-card border gap-2.5 ${
            tab === "incomes" ? "border-emerald-500/35" : "border-emerald-500/15"
          }`}
          onPress={() => openCreateModal("incomes")}
          activeOpacity={0.85}
        >
          <View className="w-8 h-8 rounded-[10px] bg-emerald-500/15 items-center justify-center">
            <ArrowUpRight size={15} color="#10b981" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-white">Ingreso Fijo</Text>
            <Text className="text-[9px] text-slate-500 mt-0.5">Salario, cobros, renta</Text>
          </View>
          <View className="w-5 h-5 rounded-full bg-white/[0.06] items-center justify-center">
            <Plus size={13} color="#10b981" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadRecurringData();
              }}
              tintColor="#3b82f6"
              colors={["#3b82f6"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2.5">
              <Repeat size={38} color="#475569" />
              <Text className="text-[15px] font-bold text-slate-300">
                {t("recurring.emptyTitle")}
              </Text>
              <Text className="text-xs text-slate-500 text-center px-5 leading-4">
                {t("recurring.emptyDesc")}
              </Text>
              <TouchableOpacity
                className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] mt-1 shadow-md ${
                  tab === "incomes"
                    ? "bg-emerald-500 shadow-emerald-500/35"
                    : "bg-rose-500 shadow-rose-500/35"
                }`}
                onPress={() => openCreateModal(tab)}
                activeOpacity={0.8}
              >
                <Plus size={15} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-white text-[13px] font-extrabold">
                  {tab === "expenses" ? t("recurring.newExpense") : t("recurring.newIncome")}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const dueLabel = getDueDateLabel(item);
            const isLoadingAction = actionLoadingId === item.id;

            return (
              <TouchableOpacity
                className={`bg-card p-3 rounded-2xl border border-white/[0.05] gap-2.5 ${
                  !item.is_active ? "opacity-65 border-white/[0.02]" : ""
                }`}
                onPress={() => {
                  setConfirmDeleteSheet(false);
                  setActionSheetItem(item);
                }}
                activeOpacity={0.85}
              >
                <View className="flex-row items-center gap-2.5">
                  {/* Icono de Tipo */}
                  <View
                    className={`w-[38px] h-[38px] rounded-xl justify-center items-center ${
                      tab === "incomes" ? "bg-emerald-500/15" : "bg-rose-500/15"
                    }`}
                  >
                    {tab === "incomes" ? (
                      <ArrowUpRight size={20} color="#10b981" />
                    ) : (
                      <ArrowDownRight size={20} color="#f43f5e" />
                    )}
                  </View>

                  {/* Detalles Principales */}
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-bold text-white" numberOfLines={1}>
                      {item.description || item.source}
                    </Text>

                    <View className="flex-row flex-wrap gap-1">
                      <View className="bg-slate-800 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-semibold text-blue-400">
                          {translateFrequency(item.frequency, item.biweekly_type, item.billing_day)}
                        </Text>
                      </View>

                      <View className="bg-slate-800/80 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] text-slate-400 font-medium">
                          {item.category}
                        </Text>
                      </View>

                      {item.payment_method && (
                        <View className="bg-slate-800/60 px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] text-slate-500">{item.payment_method}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Switch Activo / Pausado */}
                  <Switch
                    value={item.is_active}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: "#334155", true: "#2563eb" }}
                    thumbColor={item.is_active ? "#ffffff" : "#94a3b8"}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>

                {/* Fila Inferior: Vencimiento + Monto + Acciones */}
                <View className="flex-row justify-between items-center pt-1 border-t border-white/[0.04]">
                  <View>
                    {dueLabel.text ? (
                      <View
                        className={`flex-row items-center gap-1 px-2 py-0.5 rounded-md ${
                          dueLabel.status === "today"
                            ? "bg-emerald-500/15"
                            : dueLabel.status === "overdue"
                              ? "bg-rose-500/15"
                              : "bg-slate-800"
                        }`}
                      >
                        <Calendar
                          size={10}
                          color={
                            dueLabel.status === "today"
                              ? "#10b981"
                              : dueLabel.status === "overdue"
                                ? "#f43f5e"
                                : "#94a3b8"
                          }
                        />
                        <Text
                          className={`text-[10px] font-bold ${
                            dueLabel.status === "today"
                              ? "text-emerald-400"
                              : dueLabel.status === "overdue"
                                ? "text-rose-400"
                                : "text-slate-400"
                          }`}
                        >
                          {dueLabel.text}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Text
                      className={`text-sm font-extrabold ${
                        tab === "incomes" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {tab === "incomes" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </Text>

                    {/* Acciones: Ejecutar y Más Opciones */}
                    <View className="flex-row items-center gap-1">
                      <TouchableOpacity
                        className={`flex-row items-center gap-1 bg-primary px-2.5 py-1 rounded-lg ${
                          isLoadingAction ? "opacity-50" : ""
                        }`}
                        onPress={() => handleExecuteNow(item)}
                        disabled={isLoadingAction}
                        activeOpacity={0.7}
                      >
                        <Play size={10} color="#ffffff" />
                        <Text className="text-white text-[11px] font-bold">
                          {tab === "incomes"
                            ? t("recurring.collectBtn")
                            : t("recurring.executeBtn")}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="w-7 h-7 rounded-lg bg-white/[0.04] justify-center items-center"
                        onPress={() => {
                          setConfirmDeleteSheet(false);
                          setActionSheetItem(item);
                        }}
                        activeOpacity={0.7}
                      >
                        <MoreVertical size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal Reutilizable Crear / Editar Regla Fija */}
      <RecurringModal
        visible={showModal}
        editingItem={editingItem}
        initialTab={tab}
        categories={categories}
        currency={currency}
        language={language}
        onClose={() => setShowModal(false)}
        onSave={handleSaveModal}
        onOpenNewCategoryModal={() => setShowCategoryModal(true)}
        t={t}
      />

      <CategoryModal
        visible={showCategoryModal}
        defaultType={tab === "expenses" ? "expense" : "income"}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={(newCat) => {
          setCategories((prev) => [newCat.name, ...prev.filter((c) => c !== newCat.name)]);
        }}
      />

      {/* Action Sheet Reutilizable para Fijos */}
      <RecurringActionSheet
        visible={actionSheetItem !== null}
        item={actionSheetItem}
        tab={tab}
        confirmDeleteSheet={confirmDeleteSheet}
        deletingSheet={deletingSheet}
        onClose={() => setActionSheetItem(null)}
        onConfirmDeleteChange={setConfirmDeleteSheet}
        onExecuteNow={async (item) => {
          setActionSheetItem(null);
          handleExecuteNow(item);
        }}
        onOpenEdit={(item) => {
          setActionSheetItem(null);
          openEditModal(item);
        }}
        onDeleteConfirm={async () => {
          if (!actionSheetItem) return;
          setDeletingSheet(true);
          try {
            if (tab === "expenses") {
              await api.deleteRecurringExpense(actionSheetItem.id);
            } else {
              await api.deleteRecurringIncome(actionSheetItem.id);
            }
            setActionSheetItem(null);
            loadRecurringData();
          } catch (e: any) {
            Alert.alert(t("common.error"), e?.message || "Error al eliminar.");
          } finally {
            setDeletingSheet(false);
          }
        }}
        formatCurrency={formatCurrency}
        translateFrequency={translateFrequency}
        t={t}
      />
    </View>
  );
};
