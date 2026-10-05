import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { Tag, X, Check } from "lucide-react-native";
import { api } from "../lib/api";
import { Category } from "../types";
import { useSettings } from "../context/SettingsContext";

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType?: "expense" | "income";
  onSuccess?: (newCategory: Category) => void;
}

const COLOR_PALETTE = [
  { name: "blue", hex: "#3b82f6" },
  { name: "emerald", hex: "#10b981" },
  { name: "purple", hex: "#8b5cf6" },
  { name: "amber", hex: "#f59e0b" },
  { name: "rose", hex: "#f43f5e" },
  { name: "cyan", hex: "#06b6d4" },
  { name: "indigo", hex: "#6366f1" },
  { name: "slate", hex: "#64748b" },
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  onClose,
  defaultType = "expense",
  onSuccess,
}) => {
  const { t, language } = useSettings();
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">(defaultType);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].hex);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setType(defaultType);
      setName("");
      setSelectedColor(defaultType === "expense" ? "#f43f5e" : "#10b981");
    }
  }, [visible, defaultType]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(
        t("common.error"),
        language === "en"
          ? "Please enter a category name"
          : "Por favor ingresa un nombre para la categoría"
      );
      return;
    }

    setLoading(true);
    try {
      const created = await api.createCategory({
        name: trimmed,
        type,
        color: selectedColor,
      });

      Alert.alert(
        t("common.success"),
        language === "en"
          ? `Category "${trimmed}" created successfully!`
          : `¡Categoría "${trimmed}" creada con éxito!`
      );
      onSuccess?.(created);
      onClose();
      setName("");
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "No se pudo crear la categoría.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/75 justify-end" onPress={onClose}>
        <Pressable
          className="bg-[#0f172a] rounded-t-[28px] border border-white/10 px-5 pb-10 pt-3"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-9 h-1 rounded-sm bg-white/20 self-center mb-4" />

          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${selectedColor}22` }}
              >
                <Tag size={18} color={selectedColor} />
              </View>
              <View>
                <Text className="text-lg font-extrabold text-white">
                  {language === "en" ? "New Category" : "Nueva Categoría"}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  {language === "en" ? "Organize your finances" : "Clasifica tus gastos e ingresos"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Tipo: Gasto o Ingreso */}
          <Text className="text-xs font-bold text-slate-400 mb-2 mt-1 uppercase tracking-wider">
            {language === "en" ? "Category Type" : "Tipo de Categoría"}
          </Text>
          <View className="flex-row gap-2.5 mb-3.5">
            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-xl border items-center ${
                type === "expense"
                  ? "bg-rose-500/15 border-rose-500"
                  : "bg-slate-800 border-white/5"
              }`}
              onPress={() => {
                setType("expense");
                setSelectedColor("#f43f5e");
              }}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${type === "expense" ? "text-white" : "text-slate-400"}`}
              >
                {t("transactions.expenses")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-xl border items-center ${
                type === "income"
                  ? "bg-emerald-500/15 border-emerald-500"
                  : "bg-slate-800 border-white/5"
              }`}
              onPress={() => {
                setType("income");
                setSelectedColor("#10b981");
              }}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${type === "income" ? "text-white" : "text-slate-400"}`}
              >
                {t("transactions.incomes")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre de la Categoría */}
          <Text className="text-xs font-bold text-slate-400 mb-2 mt-1 uppercase tracking-wider">
            {language === "en" ? "Category Name" : "Nombre de la Categoría"}
          </Text>
          <TextInput
            className="bg-slate-800 border border-white/10 rounded-xl px-3.5 py-3 text-white text-[15px] mb-4"
            placeholder={
              type === "expense"
                ? language === "en"
                  ? "e.g. Gym, Streaming, Pet care"
                  : "Ej. Gimnasio, Mascotas, Cursos"
                : language === "en"
                  ? "e.g. Freelance, Investments"
                  : "Ej. Freelance, Dividendos, Alquiler"
            }
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          {/* Paleta de Colores */}
          <Text className="text-xs font-bold text-slate-400 mb-2 mt-1 uppercase tracking-wider">
            {language === "en" ? "Select Color" : "Color Identificador"}
          </Text>
          <View className="flex-row justify-between mb-6">
            {COLOR_PALETTE.map((c) => {
              const isSelected = selectedColor === c.hex;
              return (
                <TouchableOpacity
                  key={c.name}
                  className={`w-[34px] h-[34px] rounded-full items-center justify-center ${
                    isSelected ? "border-[2.5px] border-white scale-110" : ""
                  }`}
                  style={{ backgroundColor: c.hex }}
                  onPress={() => setSelectedColor(c.hex)}
                  activeOpacity={0.8}
                >
                  {isSelected && <Check size={14} color="#ffffff" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón Crear */}
          <TouchableOpacity
            className={`bg-blue-600 py-3.5 rounded-2xl items-center justify-center ${
              !name.trim() || loading ? "opacity-50" : ""
            }`}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-[15px] font-extrabold">
                {language === "en" ? "Create Category" : "Crear Categoría"}
              </Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
