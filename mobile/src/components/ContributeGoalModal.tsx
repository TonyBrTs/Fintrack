import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X } from "lucide-react-native";
import { Goal } from "../types";
import { api } from "../lib/api";

export interface ContributeGoalModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSuccess: () => void;
  currency: string;
  formatCurrency: (amount: number, currency?: string) => string;
  t: (key: string) => string;
}

export const ContributeGoalModal: React.FC<ContributeGoalModalProps> = ({
  visible,
  goal,
  onClose,
  onSuccess,
  currency,
  formatCurrency,
  t,
}) => {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount("");
    }
  }, [visible]);

  const handleQuickAdd = (amt: number) => {
    const currentVal = parseFloat(amount.replace(",", ".")) || 0;
    setAmount(String(currentVal + amt));
  };

  const handleFillRemaining = () => {
    if (!goal) return;
    const remaining = Math.max(0, goal.target_amount - (goal.current_amount || 0));
    setAmount(String(remaining));
  };

  const handleSubmit = async () => {
    if (!goal) return;
    const amt = parseFloat(amount.replace(",", "."));
    if (isNaN(amt) || amt <= 0) {
      Alert.alert(t("common.error"), "Por favor ingresa un monto válido a aportar.");
      return;
    }

    setSaving(true);
    try {
      const newCurrent = Number(goal.current_amount || 0) + amt;
      await api.updateGoal(goal.id, {
        current_amount: newCurrent,
      });

      // Crear gasto contable automático para el aporte (Paridad Web)
      try {
        await api.createExpense({
          description: `Aporte a meta: ${goal.title}`,
          amount: amt,
          category: "Inversión",
          date: new Date().toISOString(),
          payment_method: "Efectivo",
          currency,
        });
      } catch (err) {
        console.warn("Aviso: no se pudo crear el gasto contable del aporte", err);
      }

      Alert.alert(t("common.success"), t("goals.contributeSuccess"));
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "Error al registrar el aporte.");
    } finally {
      setSaving(false);
    }
  };

  if (!visible && !goal) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-[#0f172a] rounded-t-3xl border-t border-x border-white/10 p-5 pb-8 max-h-[88%] shadow-2xl shadow-black">
          <View className="flex-row justify-between items-center pb-3 border-b border-white/[0.06] mb-3">
            <View>
              <Text className="text-lg font-extrabold text-white">
                {t("goals.contributeModalTitle")}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Añade fondos para alcanzar tu objetivo
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] justify-center items-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {goal && (
            <View className="bg-card p-3.5 rounded-2xl border border-white/[0.06] mb-2">
              <Text className="text-sm font-bold text-white">{goal.title}</Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Actual: {formatCurrency(goal.current_amount)} de{" "}
                {formatCurrency(goal.target_amount)}
              </Text>
            </View>
          )}

          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3">
            Monto a aportar ({currency})
          </Text>
          <TextInput
            className="bg-card rounded-xl px-3.5 py-3 border border-white/[0.08] text-white text-sm font-medium"
            placeholder="0.00"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
            autoFocus
            value={amount}
            onChangeText={setAmount}
          />

          {/* Atajos de Monto Dinámicos según moneda */}
          <View className="flex-row flex-wrap gap-2 my-3">
            {(currency === "CRC" ? [1000, 5000, 10000] : [10, 25, 50, 100]).map((amt) => (
              <TouchableOpacity
                key={amt}
                className="bg-slate-800 px-3 py-2 rounded-xl border border-white/[0.05]"
                onPress={() => handleQuickAdd(amt)}
              >
                <Text className="text-xs font-bold text-emerald-400">+{amt.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="bg-emerald-500/15 px-3 py-2 rounded-xl border border-emerald-500/30"
              onPress={handleFillRemaining}
            >
              <Text className="text-xs font-bold text-emerald-400">Completar restante</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`bg-emerald-500 rounded-xl py-3.5 items-center justify-center mt-5 shadow-lg shadow-emerald-500/30 ${
              saving ? "opacity-50" : ""
            }`}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-sm font-extrabold text-white">{t("goals.contribute")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
