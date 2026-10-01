import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  X,
} from 'lucide-react-native';
import { useSettings } from '../context/SettingsContext';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // "YYYY-MM-DD" o ISO string
  onSelectDate: (dateStr: string) => void; // Retorna "YYYY-MM-DD"
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  const { language } = useSettings();

  // Parsear fecha inicial
  const initialDate = useMemo(() => {
    if (!selectedDate) return new Date();
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState<number>(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => initialDate.getMonth());

  // Sincronizar al abrir
  React.useEffect(() => {
    if (visible) {
      setViewYear(initialDate.getFullYear());
      setViewMonth(initialDate.getMonth());
    }
  }, [visible, initialDate]);

  const selectedDateKey = useMemo(() => {
    const y = initialDate.getFullYear();
    const m = String(initialDate.getMonth() + 1).padStart(2, '0');
    const d = String(initialDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [initialDate]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const viewMonthName = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 15);
    const name = d.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      month: 'long',
      year: 'numeric',
    });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [viewYear, viewMonth, language]);

  const weekDays = useMemo(() => {
    return language === 'en'
      ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
      : ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  }, [language]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      key: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      dateKey: string;
    }[] = [];

    // Mes anterior
    for (let i = 0; i < firstDayIndex; i++) {
      const dayNum = prevMonthDays - firstDayIndex + 1 + i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        key: `prev-${dayNum}`,
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateKey: `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
      });
    }

    // Mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        key: `cur-${d}`,
        dayNumber: d,
        isCurrentMonth: true,
        dateKey,
      });
    }

    // Mes siguiente
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = viewMonth === 11 ? 1 : viewMonth + 2;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        key: `next-${i}`,
        dayNumber: i,
        isCurrentMonth: false,
        dateKey: `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handleSelect = (dateKey: string) => {
    onSelectDate(dateKey);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/75 justify-center p-[18px]" onPress={onClose}>
        <Pressable className="bg-[#0f172a] rounded-3xl border border-white/10 p-[18px] shadow-2xl shadow-black" onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View className="flex-row justify-between items-center pb-3.5 border-b border-white/[0.06] mb-3">
            <View className="flex-row items-center gap-2.5">
              <CalendarIcon size={18} color="#3b82f6" />
              <Text className="text-[17px] font-extrabold text-white">
                {language === 'en' ? 'Select Date' : 'Seleccionar Fecha'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] justify-center items-center">
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Accesos rápidos: Hoy, Ayer */}
          <View className="flex-row gap-2 mb-3.5">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-[10px] border ${
                selectedDateKey === todayKey ? 'bg-primary border-blue-500' : 'bg-slate-800 border-white/[0.05]'
              }`}
              onPress={() => handleSelect(todayKey)}
              activeOpacity={0.7}
            >
              <CalendarIcon size={14} color={selectedDateKey === todayKey ? '#ffffff' : '#94a3b8'} />
              <Text className={`text-xs font-semibold ${selectedDateKey === todayKey ? 'text-white font-bold' : 'text-slate-400'}`}>
                {language === 'en' ? 'Today' : 'Hoy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-[10px] border ${
                selectedDateKey === yesterdayKey ? 'bg-primary border-blue-500' : 'bg-slate-800 border-white/[0.05]'
              }`}
              onPress={() => handleSelect(yesterdayKey)}
              activeOpacity={0.7}
            >
              <Clock size={14} color={selectedDateKey === yesterdayKey ? '#ffffff' : '#94a3b8'} />
              <Text className={`text-xs font-semibold ${selectedDateKey === yesterdayKey ? 'text-white font-bold' : 'text-slate-400'}`}>
                {language === 'en' ? 'Yesterday' : 'Ayer'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Mes */}
          <View className="flex-row items-center justify-between bg-slate-800 rounded-xl px-2 py-1.5 mb-3">
            <TouchableOpacity
              className="w-8 h-8 rounded-lg justify-center items-center bg-white/[0.04]"
              onPress={handlePrevMonth}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color="#94a3b8" />
            </TouchableOpacity>

            <Text className="text-sm font-bold text-white">{viewMonthName}</Text>

            <TouchableOpacity
              className="w-8 h-8 rounded-lg justify-center items-center bg-white/[0.04]"
              onPress={handleNextMonth}
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Días de la semana */}
          <View className="flex-row mb-2">
            {weekDays.map((day, idx) => (
              <View key={idx} className="flex-1 items-center">
                <Text className="text-[11px] font-bold text-slate-500 uppercase">{day}</Text>
              </View>
            ))}
          </View>

          {/* Grilla de Días */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((cell) => {
              const isSelected = selectedDateKey === cell.dateKey;
              const isToday = cell.dateKey === todayKey;

              return (
                <TouchableOpacity
                  key={cell.key}
                  style={{ width: '14.28%', aspectRatio: 1 }}
                  className={`justify-center items-center rounded-[10px] my-0.5 ${
                    isSelected ? 'bg-primary' : isToday ? 'border border-blue-500' : ''
                  }`}
                  onPress={() => handleSelect(cell.dateKey)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      isSelected
                        ? 'text-white font-extrabold'
                        : isToday
                        ? 'text-blue-400 font-bold'
                        : !cell.isCurrentMonth
                        ? 'text-slate-600'
                        : 'text-slate-300'
                    }`}
                  >
                    {cell.dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
