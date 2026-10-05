import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  ArrowUpRight,
  ArrowDownRight,
  X,
  Plus,
  Minus,
  Calendar,
  CalendarClock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react-native";
import { RecurringTransaction, Currency, BiweeklyType } from "../types";
import { CURRENCY_SYMBOLS } from "../lib/currency";
import { PAYMENT_METHODS, RECURRING_FREQUENCIES } from "../lib/constants";
import { DatePickerModal } from "./DatePickerModal";

export interface RecurringModalProps {
  visible: boolean;
  editingItem: RecurringTransaction | null;
  initialTab: "expenses" | "incomes";
  categories: string[];
  currency: Currency;
  language: "es" | "en";
  onClose: () => void;
  onSave: (payload: Partial<RecurringTransaction>, isIncome: boolean) => Promise<void>;
  onOpenNewCategoryModal: () => void;
  t: (key: string) => string;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  visible,
  editingItem,
  initialTab,
  categories,
  currency,
  language,
  onClose,
  onSave,
  onOpenNewCategoryModal,
  t,
}) => {
  const [currentTab, setCurrentTab] = useState<"expenses" | "incomes">(initialTab);
  const [modalAmount, setModalAmount] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalCategory, setModalCategory] = useState("Servicios");
  const [modalFrequency, setModalFrequency] =
    useState<RecurringTransaction["frequency"]>("monthly");
  const [modalPaymentMethod, setModalPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [modalStartDate, setModalStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [modalBiweeklyType, setModalBiweeklyType] = useState<BiweeklyType>("15_and_last_day");
  const [modalBillingDay, setModalBillingDay] = useState<number>(15);
  const [modalAutoRegister, setModalAutoRegister] = useState(true);
  const [modalIsActive, setModalIsActive] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setModalAmount(String(editingItem.amount));
        setModalDescription(editingItem.description || editingItem.source || "");
        setModalCategory(
          editingItem.category || (initialTab === "expenses" ? "Servicios" : "Salario")
        );
        setModalFrequency(editingItem.frequency || "monthly");
        setModalBiweeklyType(editingItem.biweekly_type || "15_and_last_day");
        setModalBillingDay(editingItem.billing_day || 15);
        setModalPaymentMethod(editingItem.payment_method || PAYMENT_METHODS[0]);
        setModalStartDate(
          editingItem.start_date
            ? editingItem.start_date.split("T")[0]
            : new Date().toISOString().split("T")[0]
        );
        setModalAutoRegister(editingItem.auto_register ?? true);
        setModalIsActive(editingItem.is_active ?? true);
        setCurrentTab(initialTab);
      } else {
        setModalAmount("");
        setModalDescription("");
        setModalCategory(initialTab === "expenses" ? categories[0] || "Servicios" : "Salario");
        setModalFrequency("monthly");
        setModalPaymentMethod(PAYMENT_METHODS[0]);
        setModalBiweeklyType("15_and_last_day");
        setModalBillingDay(15);
        setModalStartDate(new Date().toISOString().split("T")[0]);
        setModalAutoRegister(true);
        setModalIsActive(true);
        setCurrentTab(initialTab);
      }
    }
  }, [visible, editingItem, initialTab, categories]);

  const monthlyUpcomingDates = useMemo(() => {
    const day = Math.min(modalBillingDay || 15, 31);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dates: string[] = [];
    let y = now.getFullYear();
    let m = now.getMonth();
    while (dates.length < 3) {
      const lastOfMonth = new Date(y, m + 1, 0).getDate();
      const d = Math.min(day, lastOfMonth);
      const dt = new Date(y, m, d);
      if (dt >= now) {
        dates.push(
          dt.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        );
      }
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return dates;
  }, [modalBillingDay, language]);

  const handleSave = async () => {
    const numAmt = parseFloat(modalAmount.replace(",", "."));
    if (!modalDescription.trim()) {
      Alert.alert(t("common.error"), "Por favor ingresa la descripción o fuente.");
      return;
    }
    if (isNaN(numAmt) || numAmt <= 0) {
      Alert.alert(t("common.error"), "El monto debe ser mayor a cero.");
      return;
    }

    setSaving(true);
    try {
      const isIncome = currentTab === "incomes";
      const payload: Partial<RecurringTransaction> = {
        amount: numAmt,
        currency,
        category: modalCategory,
        frequency: modalFrequency,
        biweekly_type: modalFrequency === "biweekly" ? modalBiweeklyType : undefined,
        billing_day:
          modalFrequency === "monthly"
            ? modalBillingDay
            : modalFrequency === "biweekly"
              ? 15
              : undefined,
        payment_method: isIncome ? undefined : modalPaymentMethod,
        start_date: new Date(modalStartDate).toISOString(),
        auto_register: modalAutoRegister,
        is_active: modalIsActive,
      };

      if (isIncome) {
        payload.source = modalDescription.trim();
      } else {
        payload.description = modalDescription.trim();
      }

      await onSave(payload, isIncome);
      onClose();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-[#0f172a] rounded-t-3xl border-t border-x border-white/10 p-5 pb-8 max-h-[90%] shadow-2xl shadow-black">
          <View className="flex-row justify-between items-center pb-3 border-b border-white/[0.06] mb-3">
            <Text className="text-lg font-extrabold text-white">
              {editingItem
                ? currentTab === "expenses"
                  ? t("recurring.editExpense")
                  : t("recurring.editIncome")
                : currentTab === "expenses"
                  ? t("recurring.newExpense")
                  : t("recurring.newIncome")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] justify-center items-center"
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Selector de Tipo para Nuevo Movimiento Fijo */}
          {!editingItem && (
            <View className="flex-row bg-card rounded-xl p-[3px] border border-white/[0.06] gap-1 mb-3">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${
                  currentTab === "expenses" ? "bg-rose-500" : ""
                }`}
                onPress={() => {
                  setCurrentTab("expenses");
                  setModalCategory(categories[0] || "Servicios");
                }}
                activeOpacity={0.8}
              >
                <ArrowDownRight
                  size={15}
                  color={currentTab === "expenses" ? "#ffffff" : "#f43f5e"}
                  strokeWidth={2.5}
                />
                <Text
                  className={`text-xs font-bold ${
                    currentTab === "expenses" ? "text-white" : "text-slate-400"
                  }`}
                >
                  Gasto Fijo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${
                  currentTab === "incomes" ? "bg-emerald-500" : ""
                }`}
                onPress={() => {
                  setCurrentTab("incomes");
                  setModalCategory("Salario");
                }}
                activeOpacity={0.8}
              >
                <ArrowUpRight
                  size={15}
                  color={currentTab === "incomes" ? "#ffffff" : "#10b981"}
                  strokeWidth={2.5}
                />
                <Text
                  className={`text-xs font-bold ${
                    currentTab === "incomes" ? "text-white" : "text-slate-400"
                  }`}
                >
                  Ingreso Fijo
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
          >
            {/* Monto & Moneda */}
            <View className="flex-row items-center justify-center bg-card rounded-2xl p-4 border border-white/[0.08]">
              <Text className="text-2xl font-bold text-slate-400 mr-2">
                {CURRENCY_SYMBOLS[currency] || "$"}
              </Text>
              <TextInput
                className="text-3xl font-extrabold text-white min-w-[120px] text-center"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={modalAmount}
                onChangeText={setModalAmount}
                autoFocus
              />
            </View>

            {/* Concepto / Fuente */}
            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t("common.description")}
              </Text>
              <TextInput
                className="bg-card rounded-xl px-3.5 py-3 border border-white/[0.08] text-white text-sm font-medium"
                placeholder={
                  currentTab === "expenses"
                    ? "Ej. Renta departamento, Suscripción Gym, Spotify"
                    : "Ej. Salario mensual, Clientes freelance, Alquiler"
                }
                placeholderTextColor="#64748b"
                value={modalDescription}
                onChangeText={setModalDescription}
              />
            </View>

            {/* Frecuencia de Pago */}
            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t("recurring.frequency")}
              </Text>
              <View className="flex-row gap-1.5">
                {RECURRING_FREQUENCIES.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    className={`flex-1 p-2 rounded-xl border items-center ${
                      modalFrequency === f.key
                        ? "bg-primary/20 border-primary"
                        : "bg-card border-white/[0.06]"
                    }`}
                    onPress={() => setModalFrequency(f.key)}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        modalFrequency === f.key ? "text-blue-400" : "text-slate-300"
                      }`}
                    >
                      {language === "en" ? f.labelEn : f.labelEs}
                    </Text>
                    <Text
                      className={`text-[9px] mt-0.5 ${
                        modalFrequency === f.key ? "text-blue-300" : "text-slate-500"
                      }`}
                    >
                      {f.subEs}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Opciones específicas para Quincenal (Esquema de quincena) */}
            {modalFrequency === "biweekly" && (
              <View className="bg-card rounded-2xl p-3.5 border border-white/[0.06] gap-2">
                <Text className="text-xs font-bold text-slate-300">
                  {language === "en" ? "Biweekly Schedule:" : "Esquema de quincena:"}
                </Text>
                <View className="gap-2">
                  {/* Opción 1: Día 15 y Fin de Mes */}
                  <TouchableOpacity
                    className={`flex-row items-center p-3 rounded-xl border gap-2.5 ${
                      modalBiweeklyType === "15_and_last_day"
                        ? "bg-blue-500/15 border-primary"
                        : "bg-slate-800 border-transparent"
                    }`}
                    onPress={() => setModalBiweeklyType("15_and_last_day")}
                    activeOpacity={0.8}
                  >
                    {modalBiweeklyType === "15_and_last_day" ? (
                      <CheckCircle2 size={18} color="#3b82f6" />
                    ) : (
                      <View className="w-4 h-4 rounded-full border border-slate-600" />
                    )}
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-xs font-bold ${
                            modalBiweeklyType === "15_and_last_day" ? "text-blue-400" : "text-white"
                          }`}
                        >
                          {language === "en" ? "15th & End of Month" : "Día 15 y Fin de Mes"}
                        </Text>
                        <View className="bg-blue-500/20 px-1.5 py-0.5 rounded">
                          <Text className="text-[10px] text-blue-400 font-bold">
                            15 y fin de mes
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[11px] text-slate-400 mt-0.5">
                        {language === "en"
                          ? "Typical payroll, salary, or labor payment dates"
                          : "Típico pago de planilla, nómina o quincena laboral"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Opción 2: Cada 15 días exactos */}
                  <TouchableOpacity
                    className={`flex-row items-center p-3 rounded-xl border gap-2.5 ${
                      modalBiweeklyType === "every_15_days"
                        ? "bg-blue-500/15 border-primary"
                        : "bg-slate-800 border-transparent"
                    }`}
                    onPress={() => setModalBiweeklyType("every_15_days")}
                    activeOpacity={0.8}
                  >
                    {modalBiweeklyType === "every_15_days" ? (
                      <CheckCircle2 size={18} color="#3b82f6" />
                    ) : (
                      <View className="w-4 h-4 rounded-full border border-slate-600" />
                    )}
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-xs font-bold ${
                            modalBiweeklyType === "every_15_days" ? "text-blue-400" : "text-white"
                          }`}
                        >
                          {language === "en" ? "Every 15 Exact Days" : "Cada 15 días exactos"}
                        </Text>
                        <View className="bg-slate-700 px-1.5 py-0.5 rounded">
                          <Text className="text-[10px] text-slate-300 font-bold">c/ 15 días</Text>
                        </View>
                      </View>
                      <Text className="text-[11px] text-slate-400 mt-0.5">
                        {language === "en"
                          ? "Regular intervals counted from the start date"
                          : "Intervalo regular a partir de la fecha de inicio"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Opciones específicas para Mensual (Día del mes a cobrar) */}
            {modalFrequency === "monthly" && (
              <View className="bg-card rounded-2xl p-3.5 border border-white/[0.06] gap-2.5">
                <Text className="text-xs font-bold text-slate-300">
                  {currentTab === "incomes"
                    ? language === "en"
                      ? "Day of month you receive payment:"
                      : "Día del mes que recibes el pago:"
                    : language === "en"
                      ? "Billing Day of Month:"
                      : "Día del mes a cobrar:"}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {[1, 5, 10, 15, 20, 25, 31].map((d) => {
                    const isSelected = modalBillingDay === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        className={`px-3 py-1.5 rounded-lg border ${
                          isSelected
                            ? "bg-primary/25 border-primary"
                            : "bg-slate-800 border-white/[0.05]"
                        }`}
                        onPress={() => setModalBillingDay(d)}
                        activeOpacity={0.8}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? "text-blue-400" : "text-slate-300"
                          }`}
                        >
                          {d === 31 ? (language === "en" ? "Last Day" : "Último día") : `Día ${d}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Stepper para ajuste fino de día */}
                <View className="flex-row items-center justify-between pt-1">
                  <Text className="text-xs text-slate-400">
                    {language === "en" ? "Fine-tune exact day:" : "Ajustar día exacto:"}
                  </Text>
                  <View className="flex-row items-center gap-1.5 bg-slate-800 rounded-lg p-1">
                    <TouchableOpacity
                      className="w-7 h-7 rounded bg-white/[0.06] justify-center items-center"
                      onPress={() => setModalBillingDay((prev) => Math.max(1, prev - 1))}
                      activeOpacity={0.7}
                    >
                      <Minus size={15} color="#ffffff" />
                    </TouchableOpacity>
                    <View className="px-2">
                      <Text className="text-xs font-bold text-white">
                        {modalBillingDay === 31
                          ? language === "en"
                            ? "Day 31 (Last)"
                            : "Día 31 (Fin)"
                          : `Día ${modalBillingDay}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="w-7 h-7 rounded bg-white/[0.06] justify-center items-center"
                      onPress={() => setModalBillingDay((prev) => Math.min(31, prev + 1))}
                      activeOpacity={0.7}
                    >
                      <Plus size={15} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Live preview de los próximos 3 cobros/pagos */}
                <View className="bg-slate-800/80 p-2.5 rounded-xl">
                  <Text className="text-[11px] text-slate-400 leading-4">
                    <Text className="font-bold text-slate-300">
                      {currentTab === "incomes"
                        ? language === "en"
                          ? "Next projected incomes: "
                          : "Próximos cobros: "
                        : language === "en"
                          ? "Next projected payments: "
                          : "Próximos cobros: "}
                    </Text>
                    {monthlyUpcomingDates.join(" · ")}
                  </Text>
                </View>
              </View>
            )}

            {/* Categoría con botón de crear nueva */}
            <View>
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("common.category")}
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={onOpenNewCategoryModal}
                  activeOpacity={0.7}
                >
                  <Plus size={12} color="#60a5fa" />
                  <Text className="text-xs font-bold text-blue-400">
                    {language === "en" ? "New Category" : "Nueva"}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {(categories.length > 0
                  ? categories
                  : ["Servicios", "Alimentación", "Vivienda", "Salario", "Otros"]
                ).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className={`px-3 py-1.5 rounded-full border ${
                      modalCategory === cat
                        ? "bg-primary/20 border-primary"
                        : "bg-card border-white/[0.08]"
                    }`}
                    onPress={() => setModalCategory(cat)}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        modalCategory === cat ? "text-blue-400 font-bold" : "text-slate-300"
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Método de Pago (solo gastos) */}
            {currentTab === "expenses" && (
              <View>
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t("common.paymentMethod")}
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <TouchableOpacity
                      key={pm}
                      className={`px-3 py-1.5 rounded-full border ${
                        modalPaymentMethod === pm
                          ? "bg-primary/20 border-primary"
                          : "bg-card border-white/[0.08]"
                      }`}
                      onPress={() => setModalPaymentMethod(pm)}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          modalPaymentMethod === pm ? "text-blue-400 font-bold" : "text-slate-300"
                        }`}
                      >
                        {pm}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Fecha de Inicio / Próximo Cobro */}
            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t("recurring.nextDue")}
              </Text>
              <TouchableOpacity
                className="flex-row items-center justify-between bg-card rounded-xl px-3.5 py-3 border border-white/[0.08]"
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center gap-2">
                  <View className="w-6 h-6 rounded-md bg-blue-500/15 justify-center items-center">
                    <Calendar size={14} color="#60a5fa" />
                  </View>
                  <Text className="text-sm font-medium text-white">
                    {modalStartDate || new Date().toISOString().split("T")[0]}
                  </Text>
                </View>
                <ChevronRight size={16} color="#64748b" />
              </TouchableOpacity>

              <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={modalStartDate}
                onSelectDate={(newDate) => {
                  setModalStartDate(newDate);
                  setShowDatePicker(false);
                }}
              />
            </View>

            {/* Switch de Auto-Registro */}
            <View className="flex-row items-center justify-between bg-card p-3.5 rounded-2xl border border-white/[0.06]">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <CalendarClock size={20} color="#34d399" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">
                    {language === "en" ? "Auto-Register in Balance" : "Registro Automático"}
                  </Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">
                    {language === "en"
                      ? "Registers into balance on due date automatically"
                      : "Registra en tu balance automáticamente al llegar la fecha"}
                  </Text>
                </View>
              </View>
              <Switch
                value={modalAutoRegister}
                onValueChange={setModalAutoRegister}
                trackColor={{ false: "#334155", true: "#10b981" }}
                thumbColor={modalAutoRegister ? "#ffffff" : "#94a3b8"}
              />
            </View>

            {/* Switch de Estado Activo */}
            <View className="flex-row items-center justify-between bg-card p-3.5 rounded-2xl border border-white/[0.06]">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-white">
                  {modalIsActive ? t("transactions.activeStatus") : t("transactions.pausedStatus")}
                </Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">
                  {modalIsActive
                    ? language === "en"
                      ? "Rule active and running"
                      : "Regla activa y en ejecución"
                    : language === "en"
                      ? "Rule temporarily paused"
                      : "Regla temporalmente pausada"}
                </Text>
              </View>
              <Switch
                value={modalIsActive}
                onValueChange={setModalIsActive}
                trackColor={{
                  false: "#334155",
                  true: currentTab === "incomes" ? "#10b981" : "#f43f5e",
                }}
                thumbColor={modalIsActive ? "#ffffff" : "#94a3b8"}
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center justify-center mt-3 shadow-lg ${
                currentTab === "incomes"
                  ? "bg-emerald-500 shadow-emerald-500/30"
                  : "bg-rose-500 shadow-rose-500/30"
              } ${saving ? "opacity-50" : ""}`}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-sm font-extrabold text-white">
                  {editingItem
                    ? currentTab === "expenses"
                      ? t("recurring.editExpense")
                      : t("recurring.editIncome")
                    : currentTab === "expenses"
                      ? t("recurring.newExpense")
                      : t("recurring.newIncome")}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
