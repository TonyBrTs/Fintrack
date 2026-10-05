import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {
  Target,
  CheckCircle2,
  ChevronRight,
  Coins,
  Edit2,
  Trash2,
  AlertTriangle,
} from "lucide-react-native";
import { Goal } from "../types";
import { getCategoryTheme } from "../lib/constants";

export interface GoalActionSheetProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onContribute: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => Promise<void>;
  formatCurrency: (amount: number, currency?: string) => string;
  t: (key: string) => string;
}

export const GoalActionSheet: React.FC<GoalActionSheetProps> = ({
  visible,
  goal,
  onClose,
  onContribute,
  onEdit,
  onDelete,
  formatCurrency,
  t,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    if (visible) {
      setConfirmDelete(false);
      setDeleting(false);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 320,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropAnim, slideAnim]);

  if (!visible && !goal) return null;

  const current = goal?.current_amount || 0;
  const target = goal?.target_amount || 1;
  const progressPercent = Math.min(100, Math.max(0, (current / target) * 100));
  const isCompleted = current >= (goal?.target_amount || 0);
  const theme = getCategoryTheme(goal?.category, isCompleted);

  const handleDelete = async () => {
    if (!goal) return;
    setDeleting(true);
    try {
      await onDelete(goal.id);
      onClose();
    } catch {
      // Manejado en padre
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View
          className="absolute inset-0 bg-black"
          style={{
            opacity: backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.75],
            }),
          }}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="bg-[#0f172a] rounded-t-3xl border-t border-x border-white/10 p-5 pb-8 shadow-2xl shadow-black"
          style={{ transform: [{ translateY: slideAnim }] }}
        >
          <View className="w-10 h-1 bg-slate-700 rounded-full self-center mb-4" />

          {/* Resumen de la meta */}
          {goal && (
            <View
              className="bg-card p-3 rounded-2xl border mb-4"
              style={{ borderColor: theme.border }}
            >
              <View className="flex-row items-center gap-2.5">
                <View
                  className="w-10 h-10 rounded-xl justify-center items-center border"
                  style={{ backgroundColor: theme.lightBg, borderColor: theme.border }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} color={theme.primary} />
                  ) : (
                    <Target size={18} color={theme.primary} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white" numberOfLines={1}>
                    {goal.title}
                  </Text>
                  <Text className="text-xs font-semibold mt-0.5" style={{ color: theme.badgeText }}>
                    {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)} (
                    {progressPercent.toFixed(0)}%)
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Menú normal vs Confirmación de eliminación */}
          {!confirmDelete ? (
            <View className="gap-2">
              {/* Opción 1: Aportar fondos */}
              <TouchableOpacity
                className="flex-row items-center bg-slate-800/60 p-3.5 rounded-2xl border border-white/[0.04] gap-3"
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  if (goal) onContribute(goal);
                }}
              >
                <View
                  className="w-9 h-9 rounded-xl justify-center items-center"
                  style={{ backgroundColor: theme.lightBg }}
                >
                  <Coins size={18} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white">Aportar a la Meta</Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">
                    Añadir fondos al acumulado actual
                  </Text>
                </View>
                <ChevronRight size={16} color="#64748b" />
              </TouchableOpacity>

              {/* Opción 2: Editar meta */}
              <TouchableOpacity
                className="flex-row items-center bg-slate-800/60 p-3.5 rounded-2xl border border-white/[0.04] gap-3"
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  if (goal) onEdit(goal);
                }}
              >
                <View className="w-9 h-9 rounded-xl justify-center items-center bg-slate-400/10">
                  <Edit2 size={18} color="#cbd5e1" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white">Editar Meta</Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">
                    Modificar título, monto objetivo o fecha
                  </Text>
                </View>
                <ChevronRight size={16} color="#64748b" />
              </TouchableOpacity>

              {/* Opción 3: Eliminar meta */}
              <TouchableOpacity
                className="flex-row items-center p-3.5 rounded-2xl border gap-3 bg-rose-500/10 border-rose-500/20"
                activeOpacity={0.7}
                onPress={() => setConfirmDelete(true)}
              >
                <View className="w-9 h-9 rounded-xl justify-center items-center bg-rose-500/15">
                  <Trash2 size={18} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-rose-400">Eliminar Meta</Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">
                    Quitar este objetivo de tu plan
                  </Text>
                </View>
                <ChevronRight size={16} color="#ef4444" />
              </TouchableOpacity>

              <TouchableOpacity
                className="py-3.5 items-center justify-center rounded-2xl bg-card border border-white/[0.06] mt-2"
                activeOpacity={0.8}
                onPress={onClose}
              >
                <Text className="text-sm font-bold text-slate-400">{t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center py-2 gap-3">
              <View className="w-12 h-12 rounded-full bg-rose-500/15 justify-center items-center mb-1">
                <AlertTriangle size={24} color="#ef4444" />
              </View>
              <Text className="text-lg font-bold text-white text-center">¿Eliminar esta meta?</Text>
              <Text className="text-xs text-slate-400 text-center leading-4 px-3">
                Se eliminará permanentemente &quot;{goal?.title}&quot;. Esta acción no se puede
                deshacer.
              </Text>

              <View className="flex-row gap-3 w-full mt-2">
                <TouchableOpacity
                  className="flex-1 py-3.5 rounded-2xl bg-card border border-white/[0.08] items-center justify-center"
                  onPress={() => setConfirmDelete(false)}
                  disabled={deleting}
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-bold text-slate-300">{t("common.cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-[1.2] py-3.5 rounded-2xl bg-rose-500 items-center justify-center shadow-lg shadow-rose-500/30"
                  onPress={handleDelete}
                  disabled={deleting}
                  activeOpacity={0.8}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-sm font-extrabold text-white">Sí, Eliminar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};
