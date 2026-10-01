import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { Tag, X, Plus, Trash2, Shield, AlertCircle } from 'lucide-react-native';
import { api } from '../lib/api';
import { Category } from '../types';
import { useSettings } from '../context/SettingsContext';
import { CategoryModal } from './CategoryModal';

interface ManageCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income';
  onCategoriesChanged?: () => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  visible,
  onClose,
  defaultType = 'expense',
  onCategoriesChanged,
}) => {
  const { t, language } = useSettings();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(defaultType);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setActiveTab(defaultType);
      loadCategories();
    }
  }, [visible, defaultType]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e: any) {
      console.warn('Error al cargar categorías', e);
    } finally {
      setLoading(false);
    }
  };

  const currentCategories = categories.filter((c) => (c.type || 'expense') === activeTab);
  const customCategories = currentCategories.filter((c) => !c.is_default);
  const systemCategories = currentCategories.filter((c) => c.is_default);

  const handleDeleteCategory = (cat: Category) => {
    Alert.alert(
      language === 'en' ? 'Delete Category' : 'Eliminar Categoría',
      language === 'en'
        ? `Are you sure you want to delete "${cat.name}"? If it is being used in transactions, they will be reassigned to "Otros".`
        : `¿Estás seguro de eliminar "${cat.name}"? Si está en uso, sus transacciones se reasignarán automáticamente a "Otros".`,
      [
        { text: language === 'en' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        {
          text: language === 'en' ? 'Delete' : 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(cat.id);
            try {
              await api.deleteCategory(cat.id, 'Otros');
              await loadCategories();
              onCategoriesChanged?.();
              Alert.alert(
                t('common.success'),
                language === 'en' ? 'Category deleted' : 'Categoría eliminada'
              );
            } catch (e: any) {
              Alert.alert(
                t('common.error'),
                e?.message || (language === 'en' ? 'Could not delete category' : 'No se pudo eliminar la categoría')
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCreatedCategory = () => {
    loadCategories();
    onCategoriesChanged?.();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable className="flex-1 bg-black/75 justify-end" onPress={onClose}>
          <Pressable className="bg-[#0d1527] rounded-t-[28px] px-5 pt-3 max-h-[85%] border border-blue-500/20" onPress={(e) => e.stopPropagation()}>
            <View className="w-[42px] h-1 bg-slate-700 rounded-sm self-center mb-4" />

            {/* Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-800">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-[38px] h-[38px] rounded-xl bg-blue-500/15 items-center justify-center">
                  <Tag size={18} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-[17px] font-bold text-slate-100">
                    {language === 'en' ? 'Manage Categories' : 'Administrar Categorías'}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {activeTab === 'expense'
                      ? language === 'en'
                        ? 'Expense Categories'
                        : 'Categorías de Gastos'
                      : language === 'en'
                      ? 'Income Sources'
                      : 'Fuentes de Ingresos'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center" onPress={onClose}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Segmented Control de Tipo */}
            <View className="flex-row bg-[#111c33] rounded-xl p-[3px] my-3.5">
              <TouchableOpacity
                className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'expense' ? 'bg-blue-600' : ''}`}
                onPress={() => setActiveTab('expense')}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-[13px] ${activeTab === 'expense' ? 'text-white font-bold' : 'text-slate-400 font-semibold'}`}
                >
                  {language === 'en' ? 'Expenses' : 'Gastos'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'income' ? 'bg-blue-600' : ''}`}
                onPress={() => setActiveTab('income')}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-[13px] ${activeTab === 'income' ? 'text-white font-bold' : 'text-slate-400 font-semibold'}`}
                >
                  {language === 'en' ? 'Incomes' : 'Ingresos'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón Añadir Categoría */}
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 bg-blue-600 rounded-2xl py-3 mb-3.5"
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-white text-sm font-bold">
                {language === 'en'
                  ? `Add ${activeTab === 'expense' ? 'Expense' : 'Income'} Category`
                  : `Añadir categoría de ${activeTab === 'expense' ? 'gasto' : 'ingreso'}`}
              </Text>
            </TouchableOpacity>

            {/* Lista con Scroll */}
            {loading ? (
              <View className="py-8 items-center gap-2">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-xs text-slate-400">
                  {language === 'en' ? 'Loading categories...' : 'Cargando categorías...'}
                </Text>
              </View>
            ) : (
              <ScrollView
                className="flex-grow-0"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Mis Categorías Personalizadas */}
                <View className="mb-2">
                  <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {language === 'en'
                      ? `My Categories (${customCategories.length})`
                      : `Mis Categorías (${customCategories.length})`}
                  </Text>

                  {customCategories.length === 0 ? (
                    <View className="flex-row items-center gap-2 bg-slate-800/40 border border-dashed border-slate-700 rounded-xl p-3.5">
                      <AlertCircle size={16} color="#64748b" />
                      <Text className="text-xs text-slate-400 flex-1">
                        {language === 'en'
                          ? 'No custom categories yet. Tap above to create one!'
                          : 'Aún no tienes categorías personalizadas. ¡Toca arriba para crear una!'}
                      </Text>
                    </View>
                  ) : (
                    customCategories.map((cat) => (
                      <View key={cat.id} className="flex-row items-center justify-between bg-[#111c33] border border-slate-800 rounded-xl px-3 py-2.5 mb-2">
                        <View className="flex-row items-center gap-2.5 flex-1">
                          <View
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cat.color || '#3b82f6' }}
                          />
                          <Text className="text-[13px] font-semibold text-slate-100">{cat.name}</Text>
                        </View>
                        <TouchableOpacity
                          className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center ml-2"
                          onPress={() => handleDeleteCategory(cat)}
                          disabled={deletingId === cat.id}
                        >
                          {deletingId === cat.id ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Trash2 size={16} color="#ef4444" />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>

                {/* Categorías del Sistema */}
                <View className="mb-2 mt-4">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Shield size={14} color="#3b82f6" />
                    <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'en'
                        ? `System Defaults (${systemCategories.length})`
                        : `Predeterminadas del Sistema (${systemCategories.length})`}
                    </Text>
                  </View>

                  <View className="gap-1.5">
                    {systemCategories.map((cat) => (
                      <View key={cat.id} className="flex-row items-center justify-between bg-[#111c33]/50 border border-slate-800/60 rounded-xl px-3 py-2.5">
                        <View className="flex-row items-center gap-2 flex-1">
                          <View
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color || '#64748b' }}
                          />
                          <Text className="text-xs font-medium text-slate-300" numberOfLines={1}>
                            {cat.name}
                          </Text>
                        </View>
                        <View className="px-1.5 py-0.5 rounded-md bg-slate-800">
                          <Text className="text-[10px] font-semibold text-slate-400">
                            {language === 'en' ? 'System' : 'Sistema'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Submodal para Crear Nueva Categoría */}
      <CategoryModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultType={activeTab}
        onSuccess={handleCreatedCategory}
      />
    </>
  );
};
