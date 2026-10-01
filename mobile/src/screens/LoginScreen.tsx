import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react-native';
import { BrandLogo } from '../components/BrandLogo';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInDemo } = useAuth();

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email.trim(), password);
        if (error) {
          Alert.alert('Error de registro', error.message);
        } else {
          Alert.alert(
            '¡Registro exitoso!',
            'Revisa tu bandeja de entrada si tu cuenta requiere confirmación por correo.'
          );
        }
      } else {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          Alert.alert('Error al ingresar', error.message);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#090d16]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="items-center mb-8">
          <BrandLogo size={42} variant="full" className="mb-2" />
          <Text className="text-sm text-slate-400 mt-1.5 text-center">Gestión financiera personal inteligente</Text>
        </View>

        <View className="bg-slate-900 rounded-[20px] p-6 border border-gray-800">
          <Text className="text-xl font-bold text-gray-50 mb-1.5">
            {isSignUp ? 'Crear una cuenta' : 'Bienvenido de nuevo'}
          </Text>
          <Text className="text-[13px] text-gray-400 mb-5 leading-[18px]">
            {isSignUp
              ? 'Ingresa tus datos para comenzar a monitorear tus finanzas'
              : 'Ingresa a tu cuenta para ver tu balance y movimientos'}
          </Text>

          <View className="mb-4">
            <Text className="text-[13px] font-semibold text-slate-300 mb-1.5">Correo Electrónico</Text>
            <TextInput
              className="bg-gray-800 text-white text-[15px] rounded-xl px-3.5 py-3 border border-gray-700"
              placeholder="tu@email.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[13px] font-semibold text-slate-300 mb-1.5">Contraseña</Text>
            <TextInput
              className="bg-gray-800 text-white text-[15px] rounded-xl px-3.5 py-3 border border-gray-700"
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className={`bg-blue-600 rounded-xl py-3.5 items-center justify-center mt-2 ${
              submitting ? 'opacity-60' : ''
            }`}
            onPress={handleAuth}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-[15px] font-bold">
                {isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 items-center"
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text className="text-blue-400 text-[13px] font-medium">
              {isSignUp
                ? '¿Ya tienes una cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate aquí'}
            </Text>
          </TouchableOpacity>

          {/* Divisor hacia Modo Demo */}
          <View className="flex-row items-center my-5 gap-2.5">
            <View className="flex-1 h-px bg-white/10" />
            <Text className="text-[10px] font-bold text-slate-500 tracking-wider">O EXPLORA SIN CUENTA</Text>
            <View className="flex-1 h-px bg-white/10" />
          </View>

          {/* Botón de acceso a Demo Móvil */}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-2xl py-3"
            onPress={signInDemo}
            activeOpacity={0.85}
          >
            <Sparkles size={16} color="#60a5fa" />
            <Text className="text-blue-400 text-sm font-bold">Probar Modo Demo Móvil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
