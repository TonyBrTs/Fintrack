import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Layers,
  ArrowRight,
  Check,
  X,
  Clock,
} from "lucide-react-native";
import { useSettings } from "../context/SettingsContext";

/**
 * Extrae la clave de fecha en formato YYYY-MM-DD sin sufrir desajustes por zona horaria.
 */
export const extractDateKey = (dateVal: string | Date | undefined): string => {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    if (dateVal.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      return dateVal.slice(0, 10);
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  } else if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, "0");
    const day = String(dateVal.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
};

/**
 * Función utilitaria compartida para verificar si una fecha ISO o string
 * cae dentro del período seleccionado (mes, día, rango inicio..fin, o 'all').
 */
export const isDateInPeriod = (dateStr: string | Date | undefined, period: string): boolean => {
  if (!dateStr || !period || period === "all") return true;
  const dateKey = extractDateKey(dateStr);
  if (!dateKey) return true; // Incluir para no ocultar registros sin fecha

  const monthKey = dateKey.slice(0, 7);

  // Si es un rango "YYYY-MM-DD..YYYY-MM-DD"
  if (period.includes("..")) {
    const [startStr, endStr] = period.split("..");
    return dateKey >= startStr && dateKey <= endStr;
  }

  // Si es un año "YYYY"
  if (period.length === 4 && /^\d{4}$/.test(period)) {
    return dateKey.slice(0, 4) === period;
  }

  // Si es un mes "YYYY-MM" o día "YYYY-MM-DD"
  return period === monthKey || period === dateKey;
};

interface PeriodPickerProps {
  selectedMonth: string; // "YYYY-MM" | "YYYY-MM-DD" | "YYYY-MM-DD..YYYY-MM-DD" | "all"
  onSelectMonth: (month: string) => void;
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({ selectedMonth, onSelectMonth }) => {
  const { language } = useSettings();
  const [showModal, setShowModal] = useState(false);

  // Estados de Rango (Inicio y Fin) para el modal
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [activeRangeSelector, setActiveRangeSelector] = useState<"start" | "end">("start");

  // Fecha del mes visible en el calendario interno
  const [viewYear, setViewYear] = useState<number>(() => {
    if (selectedMonth && selectedMonth !== "all") {
      const firstPart = selectedMonth.split("..")[0];
      const parts = firstPart.split("-").map(Number);
      if (parts[0]) return parts[0];
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (selectedMonth && selectedMonth !== "all") {
      const firstPart = selectedMonth.split("..")[0];
      const parts = firstPart.split("-").map(Number);
      if (parts[1]) return parts[1] - 1;
    }
    return new Date().getMonth();
  });

  // Clave de hoy "YYYY-MM-DD"
  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  // Al abrir el modal, inicializar el rango con el período actual
  const handleOpenModal = () => {
    if (selectedMonth === "all") {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      setRangeStart(null);
      setRangeEnd(null);
      setActiveRangeSelector("start");
    } else if (selectedMonth.includes("..")) {
      const [start, end] = selectedMonth.split("..");
      setRangeStart(start);
      setRangeEnd(end);
      const parts = start.split("-").map(Number);
      if (parts[0] && parts[1]) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
      setActiveRangeSelector("start");
    } else if (selectedMonth.length === 10) {
      // Día individual YYYY-MM-DD
      setRangeStart(selectedMonth);
      setRangeEnd(selectedMonth);
      const parts = selectedMonth.split("-").map(Number);
      if (parts[0] && parts[1]) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
      setActiveRangeSelector("start");
    } else {
      // Mes YYYY-MM
      const parts = selectedMonth.split("-").map(Number);
      if (parts[0] && parts[1]) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
        const lastDay = new Date(parts[0], parts[1], 0).getDate();
        setRangeStart(`${selectedMonth}-01`);
        setRangeEnd(`${selectedMonth}-${String(lastDay).padStart(2, "0")}`);
      }
      setActiveRangeSelector("start");
    }
    setShowModal(true);
  };

  // Etiqueta para la barra superior
  const getPeriodLabel = (): string => {
    if (selectedMonth === "all") {
      return language === "en" ? "All History" : "Todo el Historial";
    }

    // Rango Inicio .. Fin
    if (selectedMonth.includes("..")) {
      const [startStr, endStr] = selectedMonth.split("..");
      const [sy, sm, sd] = startStr.split("-").map(Number);
      const [ey, em, ed] = endStr.split("-").map(Number);
      const startDate = new Date(sy, sm - 1, sd);
      const endDate = new Date(ey, em - 1, ed);

      const isSameYear = sy === ey;
      const startFmt = startDate.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
        day: "numeric",
        month: "short",
        year: isSameYear ? undefined : "2-digit",
      });
      const endFmt = endDate.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      return `${startFmt} - ${endFmt}`;
    }

    const parts = selectedMonth.split("-").map(Number);
    if (!parts[0] || !parts[1]) return selectedMonth;

    // Día específico (YYYY-MM-DD)
    if (parts[2]) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    // Mes completo (YYYY-MM)
    const date = new Date(parts[0], parts[1] - 1, 15);
    const monthName = date.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
      month: "long",
      year: "numeric",
    });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  // Flecha anterior de la barra principal
  const handlePrev = () => {
    if (selectedMonth === "all") {
      const now = new Date();
      onSelectMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
      return;
    }

    if (selectedMonth.includes("..")) {
      const [startStr, endStr] = selectedMonth.split("..");
      const start = new Date(startStr + "T12:00:00");
      const end = new Date(endStr + "T12:00:00");
      const diffDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );

      start.setDate(start.getDate() - diffDays);
      end.setDate(end.getDate() - diffDays);

      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      onSelectMonth(`${fmt(start)}..${fmt(end)}`);
      return;
    }

    const parts = selectedMonth.split("-").map(Number);
    if (parts[2]) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() - 1);
      onSelectMonth(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      );
    } else {
      const d = new Date(parts[0], parts[1] - 1, 1);
      d.setMonth(d.getMonth() - 1);
      onSelectMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  };

  // Flecha siguiente de la barra principal
  const handleNext = () => {
    if (selectedMonth === "all") return;

    if (selectedMonth.includes("..")) {
      const [startStr, endStr] = selectedMonth.split("..");
      const start = new Date(startStr + "T12:00:00");
      const end = new Date(endStr + "T12:00:00");
      const diffDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );

      start.setDate(start.getDate() + diffDays);
      end.setDate(end.getDate() + diffDays);

      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      onSelectMonth(`${fmt(start)}..${fmt(end)}`);
      return;
    }

    const parts = selectedMonth.split("-").map(Number);
    if (parts[2]) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + 1);
      onSelectMonth(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      );
    } else {
      const d = new Date(parts[0], parts[1] - 1, 1);
      d.setMonth(d.getMonth() + 1);
      onSelectMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  };

  // Navegación dentro del modal
  const handleCalendarPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleCalendarNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const viewMonthName = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 15);
    const name = d.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
      month: "long",
      year: "numeric",
    });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [viewYear, viewMonth, language]);

  const weekDays = useMemo(() => {
    return language === "en"
      ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
      : ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
  }, [language]);

  const viewMonthKey = useMemo(() => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  }, [viewYear, viewMonth]);

  // Cuadrícula de días
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
        dateKey: `${prevY}-${String(prevM).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`,
      });
    }

    // Mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
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
        dateKey: `${nextY}-${String(nextM).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  // Manejo de pulsación en un día del calendario
  const handleDayPress = (dateKey: string) => {
    if (activeRangeSelector === "start") {
      setRangeStart(dateKey);
      if (rangeEnd && dateKey > rangeEnd) {
        setRangeEnd(dateKey);
      }
      // Cambiar automáticamente a seleccionar fin
      setActiveRangeSelector("end");
    } else {
      // Seleccionando fin
      if (rangeStart && dateKey < rangeStart) {
        // Si toca una fecha anterior al inicio, se convierte en el nuevo inicio
        setRangeStart(dateKey);
        setActiveRangeSelector("end");
      } else {
        setRangeEnd(dateKey);
      }
    }
  };

  // Aplicar el rango seleccionado
  const handleApplyRange = () => {
    if (!rangeStart && !rangeEnd) {
      onSelectMonth("all");
    } else if (rangeStart && rangeEnd) {
      if (rangeStart === rangeEnd) {
        onSelectMonth(rangeStart);
      } else {
        onSelectMonth(`${rangeStart}..${rangeEnd}`);
      }
    } else if (rangeStart) {
      onSelectMonth(rangeStart);
    }
    setShowModal(false);
  };

  // Presets
  const handlePresetThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    onSelectMonth(`${y}-${m}-01..${y}-${m}-${String(lastDay).padStart(2, "0")}`);
    setShowModal(false);
  };

  const handlePresetLastMonth = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    onSelectMonth(`${y}-${m}-01..${y}-${m}-${String(lastDay).padStart(2, "0")}`);
    setShowModal(false);
  };

  const handlePresetLast30Days = () => {
    const now = new Date();
    const endStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    now.setDate(now.getDate() - 30);
    const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    onSelectMonth(`${startStr}..${endStr}`);
    setShowModal(false);
  };

  const handlePresetAllHistory = () => {
    onSelectMonth("all");
    setShowModal(false);
  };

  // Formato corto para las píldoras de Inicio y Fin
  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return language === "en" ? "Select" : "Seleccionar";
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <View className="my-1">
      {/* Barra de Período Principal */}
      <View className="flex-row items-center justify-between bg-[#111827] rounded-[14px] border border-white/[0.07] px-1.5 py-1">
        <TouchableOpacity
          className="w-[34px] h-[34px] rounded-[10px] bg-white/[0.03] justify-center items-center"
          onPress={handlePrev}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 py-1.5 px-3"
          onPress={handleOpenModal}
          activeOpacity={0.75}
        >
          <CalendarIcon size={14} color="#3b82f6" />
          <Text className="text-white text-sm font-bold tracking-wide" numberOfLines={1}>
            {getPeriodLabel()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-[34px] h-[34px] rounded-[10px] bg-white/[0.03] justify-center items-center"
          onPress={handleNext}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Modal Desplegable con Rango Inicio y Fin */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/75 justify-center p-4"
          onPress={() => setShowModal(false)}
        >
          <Pressable
            className="bg-[#0f172a] rounded-3xl border border-white/10 p-[18px] max-h-[90%] shadow-2xl shadow-black"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header del Calendario */}
            <View className="flex-row justify-between items-center pb-3 border-b border-white/[0.06] mb-3">
              <View className="flex-row items-center gap-2.5">
                <CalendarIcon size={18} color="#3b82f6" />
                <Text className="text-[17px] font-extrabold text-white">
                  {language === "en" ? "Date Range & Filter" : "Rango de Fechas"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] justify-center items-center"
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="gap-2.5 pb-1"
            >
              {/* Selector de Rango: Inicio y Fin */}
              <View className="flex-row items-center justify-between bg-[#111827] rounded-[14px] p-1.5 border border-white/[0.06]">
                <TouchableOpacity
                  className={`flex-1 py-2 px-2.5 rounded-[10px] items-center border ${
                    activeRangeSelector === "start"
                      ? "border-primary bg-primary/15"
                      : "border-transparent bg-slate-800"
                  }`}
                  onPress={() => setActiveRangeSelector("start")}
                  activeOpacity={0.7}
                >
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === "en" ? "Start Date" : "Fecha Inicio"}
                  </Text>
                  <Text
                    className={`text-[13px] font-bold mt-0.5 ${
                      activeRangeSelector === "start" ? "text-blue-400" : "text-slate-300"
                    }`}
                  >
                    {formatShortDate(rangeStart)}
                  </Text>
                </TouchableOpacity>

                <View className="px-1.5">
                  <ArrowRight size={14} color="#64748b" />
                </View>

                <TouchableOpacity
                  className={`flex-1 py-2 px-2.5 rounded-[10px] items-center border ${
                    activeRangeSelector === "end"
                      ? "border-primary bg-primary/15"
                      : "border-transparent bg-slate-800"
                  }`}
                  onPress={() => setActiveRangeSelector("end")}
                  activeOpacity={0.7}
                >
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === "en" ? "End Date" : "Fecha Fin"}
                  </Text>
                  <Text
                    className={`text-[13px] font-bold mt-0.5 ${
                      activeRangeSelector === "end" ? "text-blue-400" : "text-slate-300"
                    }`}
                  >
                    {formatShortDate(rangeEnd)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Accesos Rápidos de Período */}
              <View className="flex-row gap-1.5 my-1">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center gap-1 bg-slate-800 py-2 rounded-lg border border-white/[0.05]"
                  onPress={handlePresetThisMonth}
                  activeOpacity={0.7}
                >
                  <Text className="text-[11px] font-semibold text-slate-400">
                    {language === "en" ? "This Month" : "Este Mes"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center gap-1 bg-slate-800 py-2 rounded-lg border border-white/[0.05]"
                  onPress={handlePresetLast30Days}
                  activeOpacity={0.7}
                >
                  <Clock size={12} color="#94a3b8" />
                  <Text className="text-[11px] font-semibold text-slate-400">
                    {language === "en" ? "30 Days" : "30 Días"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center gap-1 bg-slate-800 py-2 rounded-lg border border-white/[0.05]"
                  onPress={handlePresetLastMonth}
                  activeOpacity={0.7}
                >
                  <Text className="text-[11px] font-semibold text-slate-400">
                    {language === "en" ? "Last Month" : "Mes Anterior"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center gap-1 bg-slate-800 py-2 rounded-lg border border-white/[0.05]"
                  onPress={handlePresetAllHistory}
                  activeOpacity={0.7}
                >
                  <Layers size={12} color="#94a3b8" />
                  <Text className="text-[11px] font-semibold text-slate-400">
                    {language === "en" ? "All" : "Todo"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Navegador del Mes Visible */}
              <View className="flex-row items-center justify-between bg-slate-800 rounded-xl px-2 py-1.5 mt-0.5 mb-1.5">
                <TouchableOpacity
                  className="w-[30px] h-[30px] rounded-lg justify-center items-center bg-white/[0.04]"
                  onPress={handleCalendarPrevMonth}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={18} color="#94a3b8" />
                </TouchableOpacity>

                <Text className="text-[13px] font-bold text-white">{viewMonthName}</Text>

                <TouchableOpacity
                  className="w-[30px] h-[30px] rounded-lg justify-center items-center bg-white/[0.04]"
                  onPress={handleCalendarNextMonth}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Cabecera de Días de la Semana */}
              <View className="flex-row mb-1.5">
                {weekDays.map((day, idx) => (
                  <View key={idx} className="flex-1 items-center">
                    <Text className="text-[11px] font-bold text-slate-500 uppercase">{day}</Text>
                  </View>
                ))}
              </View>

              {/* Cuadrícula de Días con Selección de Rango */}
              <View className="flex-row flex-wrap">
                {calendarDays.map((cell) => {
                  const isStart = rangeStart === cell.dateKey;
                  const isEnd = rangeEnd === cell.dateKey;
                  const isInRange =
                    rangeStart && rangeEnd && cell.dateKey > rangeStart && cell.dateKey < rangeEnd;
                  const isToday = cell.dateKey === todayKey;

                  return (
                    <TouchableOpacity
                      key={cell.key}
                      style={{ width: "14.28%", aspectRatio: 1.1 }}
                      className={`justify-center items-center rounded-lg my-[1px] ${
                        isStart
                          ? "bg-primary rounded-l-[10px]"
                          : isEnd
                            ? "bg-primary rounded-r-[10px]"
                            : isInRange
                              ? "bg-primary/20 rounded-none"
                              : isToday && !isStart && !isEnd
                                ? "border border-blue-500"
                                : ""
                      }`}
                      onPress={() => handleDayPress(cell.dateKey)}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isStart || isEnd
                            ? "text-white font-extrabold"
                            : isInRange
                              ? "text-blue-300 font-bold"
                              : isToday && !isStart && !isEnd
                                ? "text-blue-400 font-bold"
                                : !cell.isCurrentMonth
                                  ? "text-slate-600"
                                  : "text-slate-300"
                        }`}
                      >
                        {cell.dayNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botón Principal: Aplicar Rango */}
              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 mt-2 py-3 rounded-xl bg-primary shadow-lg shadow-blue-500/30"
                onPress={handleApplyRange}
                activeOpacity={0.8}
              >
                <Check size={16} color="#ffffff" />
                <Text className="text-sm font-bold text-white">
                  {language === "en" ? "Apply Filter" : "Aplicar Filtro"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
