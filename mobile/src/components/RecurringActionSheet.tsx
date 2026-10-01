import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Edit2,
  Trash2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { RecurringTransaction } from '../types';

export interface RecurringActionSheetProps {
  visible: boolean;
  item: RecurringTransaction | null;
  tab: 'expenses' | 'incomes';
  confirmDeleteSheet: boolean;
  deletingSheet: boolean;
  onClose: () => void;
  onConfirmDeleteChange: (confirm: boolean) => void;
  onExecuteNow: (item: RecurringTransaction) => void;
  onOpenEdit: (item: RecurringTransaction) => void;
  onDeleteConfirm: () => Promise<void>;
  formatCurrency: (amount: number, currency?: string) => string;
  translateFrequency: (f: string, biweeklyType?: string, billingDay?: number) => string;
  t: (key: string) => string;
}

export const RecurringActionSheet: React.FC<RecurringActionSheetProps> = ({
  visible,
  item,
  tab,
  confirmDeleteSheet,
  deletingSheet,
  onClose,
  onConfirmDeleteChange,
  onExecuteNow,
  onOpenEdit,
  onDeleteConfirm,
  formatCurrency,
  translateFrequency,
  t,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible || !item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/75" onPress={onClose} />
        <View
          className="bg-[#0f172a] rounded-t-3xl border-t border-x border-white/10 p-5 shadow-2xl shadow-black"
          style={{ paddingBottom: Math.max(insets.bottom + 12, 24) }}
        >
          <View className="w-10 h-1 bg-slate-700 rounded-full self-center mb-4" />

          {/* Resumen de la regla fija */}
          <View className="bg-card p-3.5 rounded-2xl border border-white/[0.06] mb-3.5 gap-2">
            <View className="flex-row items-center justify-between">
              <View
                className={`flex-row items-center gap-1 px-2 py-0.5 rounded-md ${
                  tab === 'incomes' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                }`}
              >
                {tab === 'incomes' ? (
                  <ArrowUpRight size={14} color="#10b981" />
                ) : (
                  <ArrowDownRight size={14} color="#f43f5e" />
                )}
                <Text
                  className={`text-[11px] font-bold ${
                    tab === 'incomes' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tab === 'incomes' ? 'Ingreso Fijo' : 'Gasto Fijo'}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 bg-indigo-500/15 px-2 py-0.5 rounded-md">
                <Clock size={12} color="#818cf8" />
                <Text className="text-[11px] font-semibold text-indigo-400">
                  {translateFrequency(item.frequency, item.biweekly_type, item.billing_day)}
                </Text>
              </View>
            </View>

            <Text
              className={`text-2xl font-black ${
                tab === 'incomes' ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {tab === 'incomes' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>

            <Text className="text-base font-bold text-white" numberOfLines={2}>
              {item.description || item.source}
            </Text>

            <View className="flex-row flex-wrap gap-2 pt-0.5">
              <View className="bg-slate-800 px-2.5 py-1 rounded-lg border border-white/[0.05]">
                <Text className="text-xs font-semibold text-slate-300">{item.category}</Text>
              </View>
              {item.payment_method && (
                <View className="bg-slate-800 px-2.5 py-1 rounded-lg border border-white/[0.05]">
                  <Text className="text-xs font-semibold text-slate-300">{item.payment_method}</Text>
                </View>
              )}
            </View>
          </View>

          {!confirmDeleteSheet ? (
            <View className="gap-2.5">
              {/* Ejecutar / Cobrar */}
              <TouchableOpacity
                className="flex-row items-center bg-slate-800/80 p-3.5 rounded-2xl border border-white/[0.06] gap-3.5"
                onPress={() => onExecuteNow(item)}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl bg-primary justify-center items-center">
                  <Play size={18} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white">
                    {tab === 'incomes' ? t('recurring.collectBtn') : t('recurring.executeBtn')}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {tab === 'incomes' ? 'Registrar ingreso en movimientos ahora' : 'Registrar gasto en movimientos ahora'}
                  </Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>

              {/* Editar */}
              <TouchableOpacity
                className="flex-row items-center bg-slate-800/80 p-3.5 rounded-2xl border border-white/[0.06] gap-3.5"
                onPress={() => onOpenEdit(item)}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl bg-blue-500/15 justify-center items-center">
                  <Edit2 size={18} color="#60a5fa" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white">
                    {t('transactions.editAction') || 'Editar Fijo'}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {t('transactions.editActionDesc') || 'Modificar monto, concepto o fecha'}
                  </Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>

              {/* Eliminar */}
              <TouchableOpacity
                className="flex-row items-center bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-2xl gap-3.5"
                onPress={() => onConfirmDeleteChange(true)}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl bg-rose-500/15 justify-center items-center">
                  <Trash2 size={18} color="#f43f5e" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-rose-400">
                    {t('transactions.deleteAction') || 'Eliminar Fijo'}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {t('transactions.deleteActionDesc') || 'Borrar esta regla permanente'}
                  </Text>
                </View>
                <ChevronRight size={18} color="#f43f5e" />
              </TouchableOpacity>

              {/* Cancelar */}
              <TouchableOpacity
                className="py-3.5 items-center justify-center rounded-2xl bg-card border border-white/[0.06] mt-1"
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-bold text-slate-400">
                  {t('transactions.cancelBtn') || 'Cancelar'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Vista confirmación eliminar */
            <View className="items-center py-2.5 gap-3">
              <View className="w-14 h-14 rounded-full bg-rose-500/15 justify-center items-center mb-1">
                <AlertTriangle size={28} color="#f43f5e" />
              </View>
              <Text className="text-[17px] font-extrabold text-white text-center">
                {t('transactions.confirmDeleteQuestion') || '¿Deseas eliminar esta regla fija?'}
              </Text>
              <Text className="text-xs text-slate-400 text-center leading-4 px-3">
                {t('transactions.confirmDeleteDesc') || 'Esta acción no se puede deshacer.'}
              </Text>
              <View className="flex-row gap-3 w-full mt-2">
                <TouchableOpacity
                  className="flex-1 py-3.5 rounded-2xl bg-card border border-white/[0.08] items-center justify-center"
                  onPress={() => onConfirmDeleteChange(false)}
                  activeOpacity={0.7}
                  disabled={deletingSheet}
                >
                  <Text className="text-sm font-bold text-slate-300">
                    {t('transactions.cancelBtn') || 'Volver'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-[1.3] flex-row gap-2 py-3.5 rounded-2xl bg-rose-500 items-center justify-center shadow-lg shadow-rose-500/30 ${
                    deletingSheet ? 'opacity-50' : ''
                  }`}
                  onPress={onDeleteConfirm}
                  activeOpacity={0.8}
                  disabled={deletingSheet}
                >
                  <Trash2 size={16} color="#ffffff" />
                  <Text className="text-sm font-extrabold text-white">
                    {deletingSheet
                      ? (t('transactions.executing') || 'Eliminando...')
                      : (t('transactions.deleteConfirmBtn') || 'Sí, Eliminar')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
