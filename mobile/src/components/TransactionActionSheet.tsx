import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { Expense, Income } from '../types';
import {
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Tag,
  CreditCard,
  Copy,
  Check,
  Hash,
  Repeat,
} from 'lucide-react-native';

export type ActionSheetTransaction = {
  id: string;
  type: 'expense' | 'income';
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod?: string;
  raw: Expense | Income;
};

interface TransactionActionSheetProps {
  visible: boolean;
  transaction: ActionSheetTransaction | null;
  onClose: () => void;
  onEdit: (tx: ActionSheetTransaction) => void;
  onDelete: (id: string, title: string, type: 'expense' | 'income') => Promise<void> | void;
}

export const TransactionActionSheet: React.FC<TransactionActionSheetProps> = ({
  visible,
  transaction,
  onClose,
  onEdit,
  onDelete,
}) => {
  const insets = useSafeAreaInsets();
  const { formatCurrency, t, language } = useSettings();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animaciones de entrada/salida
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(350)).current;

  useEffect(() => {
    if (visible) {
      setConfirmDelete(false);
      setDeleting(false);
      setCopied(false);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 350,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropAnim, slideAnim]);

  if (!transaction && !visible) return null;

  const isExp = transaction?.type === 'expense';
  const isRecurring =
    transaction?.id?.startsWith('rec_') ||
    transaction?.id?.startsWith('rec-') ||
    Boolean((transaction?.raw as any)?.frequency);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleCopyId = () => {
    if (transaction?.id) {
      if (typeof navigator !== 'undefined' && (navigator as any)?.clipboard?.writeText) {
        (navigator as any).clipboard.writeText(transaction.id);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditPress = () => {
    if (!transaction) return;
    onClose();
    setTimeout(() => {
      onEdit(transaction);
    }, 150);
  };

  const handleConfirmDelete = async () => {
    if (!transaction) return;
    setDeleting(true);
    try {
      await onDelete(transaction.id, transaction.title, transaction.type);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Fondo semi-transparente que cierra al tocar */}
        <Animated.View
          className="absolute inset-0 bg-black/75"
          style={{ opacity: backdropAnim }}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Hoja Inferior (Bottom Sheet) */}
        <Animated.View
          className="bg-slate-900 rounded-t-[28px] border-t border-white/10 px-5 gap-4 shadow-2xl"
          style={{
            paddingBottom: Math.max(insets.bottom + 12, 24),
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Indicador de arrastre táctil */}
          <View className="items-center py-3">
            <View className="w-11 h-1 rounded-sm bg-white/20" />
          </View>

          {/* Tarjeta de Resumen del Movimiento */}
          {transaction && (
            <View className="bg-slate-800 rounded-2xl p-4.5 border border-white/5 gap-2.5">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl ${
                      isExp ? 'bg-rose-500/15' : 'bg-emerald-500/15'
                    }`}
                  >
                    {isExp ? (
                      <ArrowDownRight size={14} color="#f43f5e" />
                    ) : (
                      <ArrowUpRight size={14} color="#10b981" />
                    )}
                    <Text
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isExp ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                    >
                      {isExp
                        ? language === 'en'
                          ? 'Expense'
                          : 'Gasto'
                        : language === 'en'
                        ? 'Income'
                        : 'Ingreso'}
                    </Text>
                  </View>

                  {isRecurring && (
                    <View className="flex-row items-center gap-1 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                      <Repeat size={11} color="#818cf8" />
                      <Text className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                        {language === 'en' ? 'Recurring' : 'Recurrente'}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center gap-1.5">
                  <Calendar size={12} color="#64748b" />
                  <Text className="text-xs text-slate-400 font-medium">
                    {formatDate(transaction.date)}
                  </Text>
                </View>
              </View>

              {/* Monto Grande Destacado */}
              <Text
                className={`text-[32px] font-black tracking-tight ${
                  isExp ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {isExp ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </Text>

              {/* Título / Concepto */}
              <Text className="text-base font-bold text-white" numberOfLines={2}>
                {transaction.title}
              </Text>

              {/* Píldoras de Categoría y Método */}
              <View className="flex-row flex-wrap gap-2 pt-1">
                <View className="flex-row items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-white/5">
                  <Tag size={12} color="#60a5fa" />
                  <Text className="text-xs text-slate-300 font-semibold">{transaction.category}</Text>
                </View>

                {transaction.paymentMethod && (
                  <View className="flex-row items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-white/5">
                    <CreditCard size={12} color="#34d399" />
                    <Text className="text-xs text-slate-300 font-semibold">{transaction.paymentMethod}</Text>
                  </View>
                )}
              </View>

              {/* ID de Transacción con Botón de Copiar */}
              <TouchableOpacity
                className="flex-row items-center justify-between bg-slate-950 rounded-lg px-2.5 py-1.5 border border-white/5 mt-1"
                onPress={handleCopyId}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                  <Hash size={12} color="#64748b" />
                  <Text className="text-[11px] text-slate-500 font-mono" numberOfLines={1}>
                    ID: {transaction.id}
                  </Text>
                </View>
                <View
                  className={`flex-row items-center gap-1 px-2 py-0.5 rounded ${
                    copied ? 'bg-emerald-500/15' : 'bg-white/5'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={11} color="#10b981" />
                      <Text className="text-[10px] text-emerald-500 font-bold">
                        {language === 'en' ? 'Copied' : 'Copiado'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Copy size={11} color="#94a3b8" />
                      <Text className="text-[10px] text-slate-400 font-semibold">
                        {language === 'en' ? 'Copy' : 'Copiar'}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Menú de Acciones o Vista de Confirmación */}
          {!confirmDelete ? (
            <View className="gap-2.5 pt-1">
              {/* Botón Táctil: Editar */}
              <TouchableOpacity
                className="flex-row items-center bg-slate-800 p-3.5 rounded-2xl border border-white/5 gap-3.5"
                onPress={handleEditPress}
                activeOpacity={0.7}
              >
                <View className="w-[42px] h-[42px] rounded-xl bg-blue-500/15 items-center justify-center">
                  <Edit2 size={18} color="#60a5fa" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[15px] font-bold text-white">
                    {t('transactions.editAction') || 'Editar Movimiento'}
                  </Text>
                  <Text className="text-xs text-slate-400">
                    {t('transactions.editActionDesc') || 'Modificar monto, concepto o fecha'}
                  </Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>

              {/* Botón Táctil: Eliminar */}
              <TouchableOpacity
                className="flex-row items-center bg-rose-500/10 p-3.5 rounded-2xl border border-rose-500/25 gap-3.5"
                onPress={() => setConfirmDelete(true)}
                activeOpacity={0.7}
              >
                <View className="w-[42px] h-[42px] rounded-xl bg-rose-500/15 items-center justify-center">
                  <Trash2 size={18} color="#f43f5e" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[15px] font-bold text-rose-500">
                    {t('transactions.deleteAction') || 'Eliminar Movimiento'}
                  </Text>
                  <Text className="text-xs text-slate-400">
                    {t('transactions.deleteActionDesc') || 'Borrar este registro permanentemente'}
                  </Text>
                </View>
                <ChevronRight size={18} color="#f43f5e" />
              </TouchableOpacity>

              {/* Botón Cancelar */}
              <TouchableOpacity
                className="py-3.5 items-center justify-center rounded-2xl bg-slate-800 mt-1"
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-bold text-slate-400">
                  {t('transactions.cancelBtn') || 'Cancelar'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Vista de Confirmación Táctil Móvil */
            <View className="items-center py-2.5 gap-3">
              <View className="w-14 h-14 rounded-full bg-rose-500/15 items-center justify-center mb-1">
                <AlertTriangle size={28} color="#f43f5e" />
              </View>

              <Text className="text-[17px] font-extrabold text-white text-center">
                {t('transactions.confirmDeleteQuestion') || '¿Deseas eliminar este registro?'}
              </Text>
              <Text className="text-[13px] text-slate-400 text-center leading-[18px] px-3">
                {t('transactions.confirmDeleteDesc') ||
                  'Esta acción no se puede deshacer y afectará tu balance.'}
              </Text>

              <View className="flex-row gap-3 w-full mt-2">
                <TouchableOpacity
                  className="flex-1 py-3.5 rounded-2xl bg-slate-800 items-center justify-center border border-white/10"
                  onPress={() => setConfirmDelete(false)}
                  activeOpacity={0.7}
                  disabled={deleting}
                >
                  <Text className="text-sm font-bold text-slate-300">
                    {t('transactions.cancelBtn') || 'Volver'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-[1.3] flex-row gap-2 py-3.5 rounded-2xl bg-rose-500 items-center justify-center ${
                    deleting ? 'opacity-50' : ''
                  }`}
                  onPress={handleConfirmDelete}
                  activeOpacity={0.8}
                  disabled={deleting}
                >
                  <Trash2 size={16} color="#ffffff" />
                  <Text className="text-sm font-extrabold text-white">
                    {deleting
                      ? t('transactions.executing') || 'Eliminando...'
                      : t('transactions.deleteConfirmBtn') || 'Sí, Eliminar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};
