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
import { Category, Income } from "../types";
import { useSettings } from "../context/SettingsContext";
import { CURRENCY_SYMBOLS } from "../lib/currency";
import { CategoryModal } from "./CategoryModal";
import { DatePickerModal } from "./DatePickerModal";
import { Plus, Calendar, X } from "lucide-react-native";
import { DEFAULT_INCOME_CATEGORIES } from "../lib/constants";

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Income | null;
  editingIncome?: Income | null;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialData,
  editingIncome,
}) => {
  const effectiveData = initialData || editingIncome;
  const { currency: defaultCurrency, language, t } = useSettings();
  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_INCOME_CATEGORIES[0]);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_INCOME_CATEGORIES]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    if (visible) {
      if (effectiveData) {
        setAmount(String(effectiveData.amount));
        setSource(effectiveData.source || "");
        setCategory(effectiveData.category || DEFAULT_INCOME_CATEGORIES[0]);
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
        setSource("");
        setSelectedDate(getTodayKey());
      }

      api
        .getCategories()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const incCats = data
              .filter((c: Category) => c.type === "income")
              .map((c: Category) => c.name);
            if (incCats.length > 0) {
              setCategories(Array.from(new Set([...incCats, ...DEFAULT_INCOME_CATEGORIES])));
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

    if (!source.trim()) {
      Alert.alert(t("common.error"), "Por favor especifica la fuente del ingreso.");
      return;
    }

    setSaving(true);
    try {
      const dateIso = new Date(`${selectedDate}T12:00:00Z`).toISOString();
      if (effectiveData) {
        await api.updateIncome(effectiveData.id, {
          amount: numAmount,
          currency: defaultCurrency,
          source: source.trim(),
          description: source.trim(),
          payment_method: "Transferencia",
          category,
          date: dateIso,
        });
      } else {
        await api.createIncome({
          amount: numAmount,
          currency: defaultCurrency,
          source: source.trim(),
          description: source.trim(),
          payment_method: "Transferencia",
          category,
          date: dateIso,
        });
      }

      setAmount("");
      setSource("");
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message || "No se pudo guardar el ingreso.");
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
        <View className="bg-[#0a0f1d] rounded-t-[28px] px-[22px] pt-[18px] pb-9 max-h-[85%] border-t border-white/10">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-extrabold text-white">
              {effectiveData
                ? t("common.edit") + " " + t("summary.income")
                : t("summary.newIncome")}
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
            <View className="flex-row items-center justify-center py-3.5 bg-slate-900 rounded-[20px] border border-emerald-500/25">
              <Text className="text-[32px] font-extrabold text-emerald-400 mr-1.5">
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

            {/* Fuente / Descripción */}
            <View className="gap-2">
              <Text className="text-slate-300 text-[13px] font-semibold">
                {t("common.description")}
              </Text>
              <TextInput
                className="bg-slate-900 rounded-2xl px-3.5 py-3 text-white text-[15px] border border-white/10"
                placeholder="Ej. Quincena de Nómina, Venta Proyecto, Dividendos"
                placeholderTextColor="#64748b"
                value={source}
                onChangeText={setSource}
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
                <Calendar size={16} color="#10b981" />
                <Text className="text-white text-[15px] font-semibold">{displayDateLabel}</Text>
              </TouchableOpacity>
            </View>

            {/* Categoría con botón de crear nueva */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-300 text-[13px] font-semibold">
                  {t("common.category")}
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/25"
                  onPress={() => setShowCategoryModal(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={12} color="#10b981" />
                  <Text className="text-emerald-400 text-[11px] font-bold">
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
                        ? "bg-emerald-600 border-emerald-600"
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

            {/* Botón Guardar */}
            <TouchableOpacity
              className={`bg-emerald-500 rounded-2xl py-4 items-center mt-1.5 ${saving ? "opacity-60" : ""}`}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold">
                  {effectiveData ? t("common.save") : t("summary.newIncome")}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <CategoryModal
        visible={showCategoryModal}
        defaultType="income"
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
