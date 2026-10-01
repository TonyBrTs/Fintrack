import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Target, CheckCircle2, Plus, MoreVertical, Calendar, ChevronRight } from 'lucide-react-native';
import { Goal } from '../types';
import { getCategoryTheme } from '../lib/constants';

export interface GoalCardItemProps {
  goal: Goal;
  index: number;
  onOpenActions: (goal: Goal) => void;
  onContribute: (goal: Goal) => void;
  formatCurrency: (amount: number, currency?: string) => string;
  t: (key: string) => string;
}

export const GoalCardItem: React.FC<GoalCardItemProps> = ({
  goal,
  index,
  onOpenActions,
  onContribute,
  formatCurrency,
  t,
}) => {
  const target = goal.target_amount > 0 ? goal.target_amount : 1;
  const current = Math.max(0, goal.current_amount || 0);
  const progressPercent = Math.min(100, Math.max(0, (current / target) * 100));
  const isCompleted = current >= goal.target_amount;
  const remaining = Math.max(0, goal.target_amount - current);

  const theme = useMemo(
    () => getCategoryTheme(goal.category, isCompleted),
    [goal.category, isCompleted]
  );

  const cardAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index * 65, 300),
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 900,
      delay: Math.min(index * 65 + 150, 450),
      useNativeDriver: false,
    }).start();
  }, [cardAnim, progressAnim, index, progressPercent]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.985,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const formattedDeadline = useMemo(() => {
    if (!goal.deadline) return null;
    try {
      const d = new Date(goal.deadline);
      if (isNaN(d.getTime())) return goal.deadline;
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return goal.deadline;
    }
  }, [goal.deadline]);

  return (
    <Animated.View
      style={{
        opacity: cardAnim,
        transform: [
          {
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [22, 0],
            }),
          },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity
        className={`bg-card rounded-[20px] p-4 border gap-3 ${
          isCompleted ? 'border-emerald-500/50' : ''
        }`}
        style={{ borderColor: theme.border }}
        activeOpacity={0.92}
        onPress={() => onOpenActions(goal)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Cabecera de la meta */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
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
            <View className="flex-1 gap-1">
              <Text className="text-[15px] font-bold text-white" numberOfLines={1}>
                {goal.title}
              </Text>
              <View
                className="self-start px-2 py-0.5 rounded-md"
                style={{ backgroundColor: theme.badgeBg }}
              >
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: theme.badgeText }}
                >
                  {goal.category || 'Ahorro'}
                </Text>
              </View>
            </View>
          </View>

          {/* Acciones rápidas en la tarjeta */}
          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg border"
              style={{ backgroundColor: theme.lightBg, borderColor: theme.border }}
              onPress={() => onContribute(goal)}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Plus size={13} color={theme.primary} strokeWidth={3} />
              <Text className="text-xs font-bold" style={{ color: theme.primary }}>
                {isCompleted ? t('goals.completed') : t('goals.contribute')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-8 h-8 rounded-lg bg-white/[0.04] justify-center items-center"
              onPress={() => onOpenActions(goal)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Opciones de meta"
            >
              <MoreVertical size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progreso visual y porcentaje */}
        <View className="gap-1.5">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-bold" style={{ color: theme.primary }}>
              {progressPercent.toFixed(0)}% {isCompleted ? '¡Completada!' : 'alcanzado'}
            </Text>
            <Text className="text-xs font-semibold text-slate-400">
              Meta: {formatCurrency(goal.target_amount)}
            </Text>
          </View>

          <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full"
              style={{ width: widthInterpolation, backgroundColor: theme.primary }}
            />
          </View>
        </View>

        {/* Cuadrícula de 2 columnas: Ahorrado y Faltante */}
        <View className="flex-row bg-background rounded-xl p-2.5">
          <View className="flex-1 items-center gap-0.5">
            <Text className="text-[9px] font-bold text-slate-500 tracking-wider">AHORRADO</Text>
            <Text className="text-sm font-extrabold" style={{ color: theme.primary }}>
              {formatCurrency(current)}
            </Text>
          </View>
          <View className="flex-1 items-center gap-0.5">
            <Text className="text-[9px] font-bold text-slate-500 tracking-wider">FALTANTE</Text>
            <Text className="text-sm font-extrabold text-slate-300">
              {formatCurrency(remaining)}
            </Text>
          </View>
        </View>

        {/* Pie de tarjeta con fecha límite */}
        <View className="flex-row items-center justify-between pt-1 border-t border-white/[0.05]">
          <View className="flex-row items-center gap-1.5">
            <Calendar size={13} color="#64748b" />
            <Text className="text-[11px] text-slate-500">
              Fecha límite: <Text className="text-slate-300 font-semibold">{formattedDeadline || 'Sin fecha'}</Text>
            </Text>
          </View>

          <View className="flex-row items-center gap-0.5">
            <Text className="text-[11px] font-semibold" style={{ color: theme.badgeText }}>Opciones</Text>
            <ChevronRight size={13} color={theme.primary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
