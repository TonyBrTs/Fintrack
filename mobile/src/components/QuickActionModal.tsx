import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { ArrowDownRight, ArrowUpRight, Repeat, X } from 'lucide-react-native';
import { useSettings } from '../context/SettingsContext';

interface QuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExpense: () => void;
  onSelectIncome: () => void;
  onSelectRecurring: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  visible,
  onClose,
  onSelectExpense,
  onSelectIncome,
  onSelectRecurring,
}) => {
  const { t } = useSettings();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/75 justify-end" onPress={onClose}>
        <Pressable className="bg-[#0a0f1d] rounded-t-[28px] px-[22px] pt-4 pb-9 border-t border-white/10" onPress={(e) => e.stopPropagation()}>
          <View className="w-9 h-1 rounded-sm bg-slate-700 self-center mb-4" />

          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-extrabold text-white">{t('transactions.newTransaction')}</Text>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center">
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-400 text-xs mt-1 mb-5">
            {t('recurring.subtitle')}
          </Text>

          <View className="gap-3">
            {/* 1. Registrar Gasto */}
            <TouchableOpacity
              className="flex-row items-center gap-4 p-4 rounded-[18px] bg-[#111827] border border-rose-500/25"
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelectExpense();
              }}
            >
              <View className="w-[46px] h-[46px] rounded-[15px] bg-rose-500/15 items-center justify-center">
                <ArrowDownRight size={22} color="#f43f5e" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-[15px] font-bold mb-1">{t('summary.newExpense')}</Text>
                <Text className="text-slate-400 text-xs">
                  {t('summary.registerExpenseDesc')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 2. Registrar Ingreso */}
            <TouchableOpacity
              className="flex-row items-center gap-4 p-4 rounded-[18px] bg-[#111827] border border-emerald-500/25"
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelectIncome();
              }}
            >
              <View className="w-[46px] h-[46px] rounded-[15px] bg-emerald-500/15 items-center justify-center">
                <ArrowUpRight size={22} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-[15px] font-bold mb-1">{t('summary.newIncome')}</Text>
                <Text className="text-slate-400 text-xs">
                  {t('summary.registerIncomeDesc')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 3. Programar Fijo / Recurrente */}
            <TouchableOpacity
              className="flex-row items-center gap-4 p-4 rounded-[18px] bg-[#111827] border border-blue-500/25"
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onSelectRecurring();
              }}
            >
              <View className="w-[46px] h-[46px] rounded-[15px] bg-blue-500/15 items-center justify-center">
                <Repeat size={22} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-[15px] font-bold mb-1">{t('recurring.newRecurring')}</Text>
                <Text className="text-slate-400 text-xs">
                  {t('recurring.subtitle')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
