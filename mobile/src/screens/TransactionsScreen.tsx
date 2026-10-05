import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "../context/SettingsContext";
import { api } from "../lib/api";
import { Expense, Income, Category } from "../types";
import { AddExpenseModal } from "../components/AddExpenseModal";
import { AddIncomeModal } from "../components/AddIncomeModal";
import { QuickActionModal } from "../components/QuickActionModal";
import { ManageCategoriesModal } from "../components/ManageCategoriesModal";
import {
  TransactionActionSheet,
  ActionSheetTransaction,
} from "../components/TransactionActionSheet";
import { RecurringScreen } from "./RecurringScreen";
import { PeriodPicker, isDateInPeriod } from "../components/PeriodPickerModal";
import { BrandLogo } from "../components/BrandLogo";
import { formatDate } from "../lib/format";
import {
  Search,
  Repeat,
  Layers,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreVertical,
  Tag,
} from "lucide-react-native";

type CombinedTx = {
  id: string;
  type: "expense" | "income";
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  extra?: string;
  raw: Expense | Income;
};

export const TransactionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { formatCurrency, t, openSettings, language } = useSettings();

  const [filter, setFilter] = useState<"all" | "expenses" | "incomes" | "recurring">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [actionSheetTx, setActionSheetTx] = useState<CombinedTx | null>(null);

  const handleActionSheetEdit = (tx: ActionSheetTransaction) => {
    if (tx.type === "expense") {
      setEditingExpense(tx.raw as Expense);
    } else {
      setEditingIncome(tx.raw as Income);
    }
  };

  const handleActionSheetDelete = async (
    id: string,
    _title: string,
    type: "expense" | "income"
  ) => {
    try {
      if (type === "expense") {
        await api.deleteExpense(id);
      } else {
        await api.deleteIncome(id);
      }
      loadData();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "No se pudo eliminar el movimiento.");
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [expData, incData, catData] = await Promise.all([
        api.getExpenses().catch(() => []),
        api.getIncomes().catch(() => []),
        api.getCategories().catch(() => []),
      ]);
      setExpenses(Array.isArray(expData) ? expData : []);
      setIncomes(Array.isArray(incData) ? incData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch {
      Alert.alert(t("common.error"), "No se pudieron cargar los movimientos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrado compuesto para movimientos estándar
  const filteredList: CombinedTx[] = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const expList: CombinedTx[] = expenses.map((e) => ({
      id: e.id,
      type: "expense" as const,
      title: e.description || e.category,
      category: e.category,
      amount: e.amount,
      currency: e.currency,
      date: e.date,
      extra: e.payment_method,
      raw: e,
    }));

    const incList: CombinedTx[] = incomes.map((i) => ({
      id: i.id,
      type: "income" as const,
      title: i.source,
      category: i.category || "Ingreso",
      amount: i.amount,
      currency: i.currency,
      date: i.date,
      extra: undefined,
      raw: i,
    }));

    let merged: CombinedTx[] = [];
    if (filter === "all") {
      merged = [...expList, ...incList];
    } else if (filter === "expenses") {
      merged = expList;
    } else if (filter === "incomes") {
      merged = incList;
    }

    // Filtrar por período (mes, día o rango inicio..fin)
    if (selectedMonth !== "all") {
      merged = merged.filter((item) => isDateInPeriod(item.date, selectedMonth));
    }

    // Filtrar por categoría seleccionada
    if (selectedCategory !== "all") {
      merged = merged.filter(
        (item) => item.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      );
    }

    // Filtrar por búsqueda
    if (query) {
      merged = merged.filter(
        (item) =>
          item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
      );
    }

    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes, filter, selectedMonth, selectedCategory, searchQuery]);

  return (
    <View className="flex-1 bg-background">
      {/* Header Superior */}
      <View
        className="flex-row justify-between items-center px-5 pb-3.5"
        style={{ paddingTop: Math.max(insets.top + 8, 20) }}
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5 mb-1">
            <BrandLogo size={20} variant="icon" />
            <Text className="text-slate-400 text-[11px] font-extrabold tracking-widest">
              FINTRACK
            </Text>
          </View>
          <Text className="text-[22px] font-extrabold text-white" numberOfLines={1}>
            {t("transactions.title")}
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
            {t("transactions.subtitle")}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-[38px] h-[38px] rounded-xl bg-card border border-blue-500/30 justify-center items-center"
            onPress={() => setShowCategoriesModal(true)}
            activeOpacity={0.8}
            accessibilityLabel={language === "en" ? "Categories" : "Categorías"}
          >
            <Tag size={17} color="#60a5fa" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-1 bg-primary px-3 h-[38px] rounded-xl shadow-md shadow-blue-500/30"
            onPress={() => setShowQuickModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={15} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white text-[13px] font-bold">
              {language === "en" ? "New" : "Nuevo"}
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

      {/* Selector de Segmento Principal con 4 pestañas */}
      <View className="flex-row mx-5 mb-3 bg-card rounded-xl p-[3px] border border-white/[0.05]">
        <TouchableOpacity
          className={`flex-1 py-2 items-center justify-center rounded-[9px] ${
            filter === "all" ? "bg-slate-800" : ""
          }`}
          onPress={() => setFilter("all")}
        >
          <Text
            className={`text-xs ${
              filter === "all" ? "text-white font-bold" : "text-slate-400 font-semibold"
            }`}
          >
            {t("transactions.all")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 items-center justify-center rounded-[9px] ${
            filter === "expenses" ? "bg-slate-800" : ""
          }`}
          onPress={() => setFilter("expenses")}
        >
          <Text
            className={`text-xs ${
              filter === "expenses" ? "text-white font-bold" : "text-slate-400 font-semibold"
            }`}
          >
            {t("transactions.expenses")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 items-center justify-center rounded-[9px] ${
            filter === "incomes" ? "bg-slate-800" : ""
          }`}
          onPress={() => setFilter("incomes")}
        >
          <Text
            className={`text-xs ${
              filter === "incomes" ? "text-white font-bold" : "text-slate-400 font-semibold"
            }`}
          >
            {t("transactions.incomes")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 items-center justify-center rounded-[9px] ${
            filter === "recurring" ? "bg-slate-800" : ""
          }`}
          onPress={() => setFilter("recurring")}
        >
          <View className="flex-row items-center gap-1">
            <Repeat size={12} color={filter === "recurring" ? "#60a5fa" : "#94a3b8"} />
            <Text
              className={`text-xs ${
                filter === "recurring" ? "text-white font-bold" : "text-slate-400 font-semibold"
              }`}
            >
              {t("transactions.recurring")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Vista de Fijos & Recurrentes con Paridad Web 100% */}
      {filter === "recurring" ? (
        <RecurringScreen />
      ) : (
        <>
          {/* Barra de Búsqueda */}
          <View className="flex-row items-center mx-5 mb-2.5 bg-card rounded-xl px-3 border border-white/[0.06]">
            <Search size={16} color="#64748b" className="mr-2" />
            <TextInput
              className="flex-1 py-2.5 text-white text-[13px]"
              placeholder={t("transactions.searchPlaceholder")}
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Selector de Período con Calendario */}
          <View className="mx-5 mb-2.5">
            <PeriodPicker selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
          </View>

          {/* Selector Horizontal de Categorías */}
          <View className="mb-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 36, gap: 8 }}
            >
              <TouchableOpacity
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  selectedCategory === "all"
                    ? "bg-blue-500/20 border-blue-500"
                    : "bg-card border-white/[0.08]"
                }`}
                onPress={() => setSelectedCategory("all")}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-xs ${
                    selectedCategory === "all"
                      ? "text-blue-400 font-bold"
                      : "text-slate-400 font-semibold"
                  }`}
                >
                  {language === "en" ? "All" : "Todas"}
                </Text>
              </TouchableOpacity>

              {categories
                .filter((c) =>
                  filter === "all"
                    ? true
                    : filter === "expenses"
                      ? (c.type || "expense") === "expense"
                      : (c.type || "expense") === "income"
                )
                .map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        isSelected
                          ? "bg-blue-500/20 border-blue-500"
                          : "bg-card border-white/[0.08]"
                      }`}
                      onPress={() => setSelectedCategory(isSelected ? "all" : cat.name)}
                      activeOpacity={0.7}
                    >
                      <View
                        className="w-[7px] h-[7px] rounded-full"
                        style={{ backgroundColor: cat.color || "#3b82f6" }}
                      />
                      <Text
                        className={`text-xs ${
                          isSelected ? "text-blue-400 font-bold" : "text-slate-400 font-semibold"
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : (
            <FlatList
              data={filteredList}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadData();
                  }}
                  tintColor="#3b82f6"
                  colors={["#3b82f6"]}
                />
              }
              ListEmptyComponent={
                <View className="items-center justify-center py-15 gap-3">
                  <Layers size={40} color="#475569" />
                  <Text className="text-[15px] font-bold text-slate-300">
                    {t("transactions.empty")}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isExp = item.type === "expense";

                return (
                  <TouchableOpacity
                    className="flex-row items-center bg-card p-3 rounded-2xl border border-white/[0.05] gap-3"
                    onPress={() => setActionSheetTx(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      className={`w-10 h-10 rounded-[13px] justify-center items-center ${
                        isExp ? "bg-rose-500/15" : "bg-emerald-500/15"
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

                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`text-[15px] font-extrabold ${
                          isExp ? "text-rose-500" : "text-emerald-500"
                        }`}
                      >
                        {isExp ? "-" : "+"}
                        {formatCurrency(item.amount)}
                      </Text>
                      <View className="w-7 h-7 rounded-lg bg-white/[0.04] justify-center items-center">
                        <MoreVertical size={16} color="#64748b" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}

      {/* Modal de Acción Rápida */}
      <QuickActionModal
        visible={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        onSelectExpense={() => setShowExpenseModal(true)}
        onSelectIncome={() => setShowIncomeModal(true)}
        onSelectRecurring={() => setShowRecurringModal(true)}
      />

      {/* Modales de Edición y Creación */}
      <AddExpenseModal
        visible={showExpenseModal || editingExpense !== null}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        onSuccess={loadData}
        initialData={editingExpense}
      />

      <AddIncomeModal
        visible={showIncomeModal || editingIncome !== null}
        onClose={() => {
          setShowIncomeModal(false);
          setEditingIncome(null);
        }}
        onSuccess={loadData}
        initialData={editingIncome}
      />

      <Modal
        visible={showRecurringModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecurringModal(false)}
      >
        <RecurringScreen
          onBack={() => {
            setShowRecurringModal(false);
            loadData();
          }}
        />
      </Modal>

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
                paymentMethod: actionSheetTx.extra,
                raw: actionSheetTx.raw,
              }
            : null
        }
        onClose={() => setActionSheetTx(null)}
        onEdit={handleActionSheetEdit}
        onDelete={handleActionSheetDelete}
      />

      {/* Modal para Administrar Categorías con Paridad Web */}
      <ManageCategoriesModal
        visible={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        defaultType={filter === "incomes" ? "income" : "expense"}
        onCategoriesChanged={loadData}
      />
    </View>
  );
};
