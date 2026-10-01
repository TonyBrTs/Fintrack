import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Currency } from '../types';
import { Settings, X, Globe, DollarSign, LogOut, ShieldCheck, User, Check, Tag, Plus, Sparkles } from 'lucide-react-native';
import { CategoryModal } from './CategoryModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
  { code: 'CRC', name: 'Colón Costarricense', symbol: '₡' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { currency, setCurrency, language, setLanguage, t } = useSettings();
  const { user, signOut, isDemoMode } = useAuth();
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      isDemoMode ? 'Salir del Modo Demo' : t('settings.logout'),
      isDemoMode ? '¿Deseas salir del modo demostración móvil?' : t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isDemoMode ? 'Salir del Demo' : t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            onClose();
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/75 justify-end" onPress={onClose}>
        <Pressable className="bg-[#0a0f1d] rounded-t-[28px] px-5 pt-3.5 pb-10 max-h-[90%] border-t border-white/10" onPress={(e) => e.stopPropagation()}>
          <View className="w-9 h-1 rounded-sm bg-slate-700 self-center mb-4" />

          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-blue-500/15 items-center justify-center">
                <Settings size={18} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-lg font-extrabold text-white">{t('settings.title')}</Text>
                <Text className="text-xs text-slate-400 mt-0.5">{t('settings.subtitle')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center">
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
            {/* Perfil */}
            <View className="gap-2">
              <Text className="text-[13px] font-bold text-slate-300 uppercase tracking-wider">{t('settings.account')}</Text>
              <View className="flex-row items-center p-3.5 bg-slate-900 rounded-2xl border border-white/5 gap-3">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${isDemoMode ? 'bg-amber-500/15' : 'bg-slate-800'}`}>
                  {isDemoMode ? <Sparkles size={20} color="#f59e0b" /> : <User size={20} color="#3b82f6" />}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[15px] font-bold text-white" numberOfLines={1}>
                      {isDemoMode ? 'Usuario Demostración' : (user?.email?.split('@')[0] || t('common.user'))}
                    </Text>
                    {isDemoMode && (
                      <View className="bg-amber-500/20 px-1.5 py-0.5 rounded-md">
                        <Text className="text-amber-400 text-[10px] font-extrabold">MODO DEMO</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                    {isDemoMode ? 'Datos interactivos locales' : user?.email}
                  </Text>
                </View>
              </View>
            </View>

            {/* Moneda Visual */}
            <View className="gap-2">
              <View className="flex-row items-center gap-1.5">
                <DollarSign size={15} color="#60a5fa" />
                <Text className="text-[13px] font-bold text-slate-300 uppercase tracking-wider">{t('settings.currency')}</Text>
              </View>
              <Text className="text-xs text-slate-500 mb-1.5">{t('settings.currencySub')}</Text>

              <View className="flex-row flex-wrap gap-2.5">
                {CURRENCIES.map((curr) => {
                  const isSelected = currency === curr.code;
                  return (
                    <TouchableOpacity
                      key={curr.code}
                      className={`w-[48%] p-3.5 rounded-2xl border ${
                        isSelected ? 'bg-blue-950 border-blue-500' : 'bg-slate-900 border-white/5'
                      }`}
                      onPress={() => setCurrency(curr.code)}
                      activeOpacity={0.8}
                    >
                      <View className="flex-row justify-between items-center mb-1.5">
                        <Text className={`text-[22px] font-extrabold ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                          {curr.symbol}
                        </Text>
                        {isSelected && (
                          <View className="w-4.5 h-4.5 rounded-full bg-blue-500 items-center justify-center">
                            <Check size={12} color="#ffffff" />
                          </View>
                        )}
                      </View>
                      <View className="gap-0.5">
                        <Text className={`text-sm font-bold ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                          {curr.code}
                        </Text>
                        <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                          {curr.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Idioma */}
            <View className="gap-2">
              <View className="flex-row items-center gap-1.5">
                <Globe size={15} color="#60a5fa" />
                <Text className="text-[13px] font-bold text-slate-300 uppercase tracking-wider">{t('settings.language')}</Text>
              </View>

              <View className="flex-row gap-2.5">
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-between py-3.5 px-4 rounded-xl border ${
                    language === 'es' ? 'bg-blue-500/15 border-blue-500' : 'bg-slate-900 border-white/5'
                  }`}
                  onPress={() => setLanguage('es')}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-semibold ${language === 'es' ? 'text-white font-bold' : 'text-slate-400'}`}>
                    Español (ES)
                  </Text>
                  {language === 'es' && <Check size={14} color="#3b82f6" />}
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-between py-3.5 px-4 rounded-xl border ${
                    language === 'en' ? 'bg-blue-500/15 border-blue-500' : 'bg-slate-900 border-white/5'
                  }`}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-semibold ${language === 'en' ? 'text-white font-bold' : 'text-slate-400'}`}>
                    English (US)
                  </Text>
                  {language === 'en' && <Check size={14} color="#3b82f6" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Categorías Personalizadas */}
            <View className="gap-2">
              <View className="flex-row items-center gap-1.5">
                <Tag size={15} color="#60a5fa" />
                <Text className="text-[13px] font-bold text-slate-300 uppercase tracking-wider">
                  {language === 'en' ? 'Categories' : 'Categorías'}
                </Text>
              </View>
              <Text className="text-xs text-slate-500 mb-1.5">
                {language === 'en'
                  ? 'Create custom categories to organize your expenses and incomes'
                  : 'Crea categorías personalizadas para tus gastos e ingresos'}
              </Text>

              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 bg-blue-600 py-3 px-4 rounded-xl"
                onPress={() => setShowCategoryModal(true)}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#ffffff" />
                <Text className="text-white text-[13px] font-bold">
                  {language === 'en' ? 'New Category' : 'Nueva Categoría Personalizada'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Acerca de */}
            <View className="gap-2">
              <Text className="text-[13px] font-bold text-slate-300 uppercase tracking-wider">{t('settings.version')}</Text>
              <View className="flex-row items-center gap-2 p-3 bg-slate-900 rounded-xl border border-white/5">
                <ShieldCheck size={16} color="#10b981" />
                <Text className="text-[11px] text-slate-500 flex-1">
                  FinTrack v2.1 • PostgreSQL Supabase RLS • Gemini AI
                </Text>
              </View>
            </View>

            {/* Botón Salir */}
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 py-3.5 bg-rose-500/10 rounded-xl border border-rose-500/25 mt-1"
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <LogOut size={16} color="#f43f5e" />
              <Text className="text-sm font-bold text-rose-500">
                {isDemoMode ? 'Salir del Modo Demo' : t('settings.logout')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>

      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />
    </Modal>
  );
};
