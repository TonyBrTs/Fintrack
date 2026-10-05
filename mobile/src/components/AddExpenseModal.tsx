import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { api } from "../lib/api";
import { Category, Expense } from "../types";
import { useSettings } from "../context/SettingsContext";
import { CURRENCY_SYMBOLS } from "../lib/currency";
import { CategoryModal } from "./CategoryModal";
import { DatePickerModal } from "./DatePickerModal";
import { Plus, Calendar, X } from "lucide-react-native";
import { PAYMENT_METHODS, DEFAULT_EXPENSE_CATEGORIES } from "../lib/constants";

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Expense | null;
  editingExpense?: Expense | null;
}

const DEFAULT_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialData,
  editingExpense,
}) => {
  const effectiveData = initialData || editingExpense;
  const { currency: defaultCurrency, language, t } = useSettings();
  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    if (visible) {
      if (effectiveData) {
        setAmount(String(effectiveData.amount));
        setDescription(effectiveData.description || "");
        setCategory(effectiveData.category || DEFAULT_CATEGORIES[0]);
        setPaymentMethod(effectiveData.payment_method || PAYMENT_METHODS[0]);
        if (effectiveData.date) {
          const d = new Date(effectiveData.date);
          if (!isNaN(d.getTime())) {
            setSelectedDate(
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
            );
          }
        }
      } else {
        setAmount("");
        setDescription("");
        setSelectedDate(getTodayKey());
      }

      // Cargar categorías dinámicas
      api
        .getCategories()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const expCats = data
              .filter((c: Category) => !c.type || c.type === "expense")
              .map((c: Category) => c.name);
            if (expCats.length > 0) {
              setCategories(Array.from(new Set([...expCats, ...DEFAULT_CATEGORIES])));
            }
          }
        })
        .catch(() => {});
    }
  }, [visible, effectiveData, defaultCurrency]);

  const displayDateLabel = React.useMemo(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    if (!y || !m || !d) return selectedDate;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [selectedDate, language]);

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert(t("common.error"), "Por favor ingresa un monto mayor a cero.");
      return;
    }

    if (!description.trim()) {
      Alert.alert(t("common.error"), "Por favor describe el gasto.");
      return;
    }

    setSaving(true);
    try {
      const dateIso = new Date(`${selectedDate}T12:00:00Z`).toISOString();
      if (effectiveData) {
        await api.updateExpense(effectiveData.id, {
          amount: numAmount,
          currency: defaultCurrency,
          description: description.trim(),
          category,
          date: dateIso,
          payment_method: paymentMethod,
        });
        Alert.alert(t("common.success"), t("summary.expenseSaved"));
      } else {
        await api.createExpense({
          amount: numAmount,
          currency: defaultCurrency,
          description: description.trim(),
          category,
          date: dateIso,
          payment_method: paymentMethod,
        });
      }

      setAmount("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message || "No se pudo guardar el gasto.");
    } finally {
      setSaving(false);
    }
  };

  const activeSymbol = CURRENCY_SYMBOLS[defaultCurrency] || "$";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/75 justify-end"
      >
        <View className="bg-[#0a0f1d] rounded-t-[28px] px-[22px] pt-[18px] pb-9 max-h-[90%] border-t border-white/10">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-extrabold text-white">
              {effectiveData
                ? t("common.edit") + " " + t("summary.expenses")
                : t("summary.newExpense")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {/* Monto & Moneda */}
            <View className="flex-row items-center justify-center py-3.5 bg-slate-900 rounded-[20px] border border-rose-500/25">
              <Text className="text-[32px] font-extrabold text-rose-500 mr-1.5">
                {activeSymbol}
              </Text>
              <TextInput
                className="text-4xl font-black text-white min-w-[140px] text-center"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            {/* Descripción */}
            <View className="gap-2">
              <Text className="text-slate-300 text-[13px] font-semibold">
                {t("common.description")}
              </Text>
              <TextInput
                className="bg-slate-900 rounded-2xl px-3.5 py-3 text-white text-[15px] border border-white/10"
                placeholder="Ej. Supermercado, Almuerzo, Gasolina"
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Fecha con Calendario */}
            <View className="gap-2">
              <Text className="text-slate-300 text-[13px] font-semibold">
                {language === "en" ? "Date" : "Fecha"}
              </Text>
              <TouchableOpacity
                className="flex-row items-center gap-2.5 bg-slate-900 rounded-2xl px-3.5 py-3 border border-white/10"
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={16} color="#3b82f6" />
                <Text className="text-white text-[15px] font-semibold">{displayDateLabel}</Text>
              </TouchableOpacity>
            </View>

            {/* Categoría con botón para crear nueva */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-300 text-[13px] font-semibold">
                  {t("common.category")}
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/25"
                  onPress={() => setShowCategoryModal(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={12} color="#60a5fa" />
                  <Text className="text-blue-400 text-[11px] font-bold">
                    {language === "en" ? "New Category" : "Nueva"}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-[22px]"
                contentContainerStyle={{
                  paddingLeft: 22,
                  paddingRight: 36,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className={`py-2 px-3.5 rounded-xl border mr-2 ${
                      category === cat
                        ? "bg-blue-600 border-blue-600"
                        : "bg-slate-900 border-white/5"
                    }`}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      className={`text-[13px] ${
                        category === cat ? "text-white font-bold" : "text-slate-400 font-medium"
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Método de Pago */}
            <View className="gap-2">
              <Text className="text-slate-300 text-[13px] font-semibold">
                {t("common.paymentMethod")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <TouchableOpacity
                    key={pm}
                    className={`py-2 px-3 rounded-xl border ${
                      paymentMethod === pm
                        ? "bg-blue-500/15 border-blue-500"
                        : "bg-slate-900 border-white/5"
                    }`}
                    onPress={() => setPaymentMethod(pm)}
                  >
                    <Text
                      className={`text-xs ${
                        paymentMethod === pm ? "text-blue-400 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {pm}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity
              className={`bg-rose-500 rounded-2xl py-4 items-center mt-1.5 ${saving ? "opacity-60" : ""}`}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold">
                  {effectiveData ? t("common.save") : t("summary.newExpense")}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <CategoryModal
        visible={showCategoryModal}
        defaultType="expense"
        onClose={() => setShowCategoryModal(false)}
        onSuccess={(newCat) => {
          setCategories((prev) => [newCat.name, ...prev.filter((c) => c !== newCat.name)]);
          setCategory(newCat.name);
        }}
      />

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
    </Modal>
  );
};
