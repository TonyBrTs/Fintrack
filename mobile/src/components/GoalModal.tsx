import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Calendar, ChevronRight } from 'lucide-react-native';
import { Goal } from '../types';
import { api } from '../lib/api';
import { DatePickerModal } from './DatePickerModal';
import { GOAL_CATEGORIES, CATEGORY_THEMES } from '../lib/constants';

export interface GoalModalProps {
  visible: boolean;
  editingGoal: Goal | null;
  onClose: () => void;
  onSuccess: () => void;
  currency: string;
  t: (key: string) => string;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  visible,
  editingGoal,
  onClose,
  onSuccess,
  currency,
  t,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState('Ahorro');
  const [deadline, setDeadline] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = editingGoal !== null;

  useEffect(() => {
    if (visible) {
      if (editingGoal) {
        setTitle(editingGoal.title);
        setTargetAmount(String(editingGoal.target_amount || ''));
        setCurrentAmount(String(editingGoal.current_amount || '0'));
        setCategory(editingGoal.category || 'Ahorro');
        setDeadline(
          editingGoal.deadline
            ? editingGoal.deadline.split('T')[0]
            : new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
        );
      } else {
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('');
        setCategory('Ahorro');
        setDeadline(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
      }
    }
  }, [visible, editingGoal]);

  const handleSave = async () => {
    const target = parseFloat(targetAmount.replace(',', '.'));
    const current = currentAmount ? parseFloat(currentAmount.replace(',', '.')) : 0;

    if (!title.trim()) {
      Alert.alert(t('common.error'), 'El título de la meta es obligatorio.');
      return;
    }
    if (isNaN(target) || target <= 0) {
      Alert.alert(t('common.error'), 'El monto objetivo debe ser mayor a cero.');
      return;
    }

    setSaving(true);
    try {
      if (!isEdit) {
        await api.createGoal({
          title: title.trim(),
          target_amount: target,
          current_amount: current || 0,
          currency,
          deadline,
          category,
        });
        Alert.alert(t('common.success'), 'Meta creada exitosamente.');
      } else if (editingGoal) {
        await api.updateGoal(editingGoal.id, {
          title: title.trim(),
          target_amount: target,
          current_amount: current || 0,
          currency,
          deadline,
          category,
        });
        Alert.alert(t('common.success'), 'Meta actualizada.');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'Error al guardar la meta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-[#0f172a] rounded-t-3xl border-t border-x border-white/10 p-5 pb-8 max-h-[88%] shadow-2xl shadow-black">
          <View className="flex-row justify-between items-center pb-3 border-b border-white/[0.06] mb-3">
            <View>
              <Text className="text-lg font-extrabold text-white">
                {!isEdit ? t('goals.newGoal') : 'Editar Meta'}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                {!isEdit
                  ? 'Define el objetivo y la fecha de tu ahorro'
                  : 'Actualiza los parámetros de tu meta'}
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Título */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3">
              {t('goals.title')}
            </Text>
            <TextInput
              className="bg-card rounded-xl px-3.5 py-3 border border-white/[0.08] text-white text-sm font-medium"
              placeholder="Ej. Fondo de Emergencia, Vacaciones"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />

            {/* Categoría Selector */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3">
              Categoría
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {GOAL_CATEGORIES.map((cat) => {
                const catTheme = CATEGORY_THEMES[cat] || CATEGORY_THEMES['Ahorro'];
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-white/[0.06]"
                    style={
                      isSelected
                        ? {
                            backgroundColor: catTheme.lightBg,
                            borderColor: catTheme.primary,
                          }
                        : undefined
                    }
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <View
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: catTheme.primary }}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'font-extrabold' : 'text-slate-300'
                      }`}
                      style={isSelected ? { color: catTheme.primary } : undefined}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Monto Objetivo */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3">
              {t('goals.target')} ({currency})
            </Text>
            <TextInput
              className="bg-card rounded-xl px-3.5 py-3 border border-white/[0.08] text-white text-sm font-medium"
              placeholder="0.00"
              placeholderTextColor="#64748b"
              keyboardType="decimal-pad"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            {/* Monto Inicial / Ahorrado */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3">
              {!isEdit ? 'Monto Inicial (opcional)' : 'Monto Ahorrado'} ({currency})
            </Text>
            <TextInput
              className="bg-card rounded-xl px-3.5 py-3 border border-white/[0.08] text-white text-sm font-medium"
              placeholder="0.00"
              placeholderTextColor="#64748b"
              keyboardType="decimal-pad"
              value={currentAmount}
              onChangeText={setCurrentAmount}
            />

            {/* Selector de Fecha Límite */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3">
              {t('goals.deadline')}
            </Text>
            <TouchableOpacity
              className="flex-row items-center gap-2 bg-card rounded-xl px-3.5 py-3 border border-white/[0.08]"
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Calendar size={18} color="#10b981" />
              <Text className="text-sm font-medium text-white">
                {deadline || 'Seleccionar fecha límite'}
              </Text>
              <ChevronRight size={16} color="#64748b" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {/* Botón Guardar */}
            <TouchableOpacity
              className={`bg-emerald-500 rounded-xl py-3.5 items-center justify-center mt-5 shadow-lg shadow-emerald-500/30 ${
                saving ? 'opacity-50' : ''
              }`}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-sm font-extrabold text-white">
                  {!isEdit ? t('common.save') : 'Guardar Cambios'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={deadline}
        onSelectDate={(dateStr) => {
          setDeadline(dateStr);
          setShowDatePicker(false);
        }}
      />
    </Modal>
  );
};
