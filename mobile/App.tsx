import "./global.css";
import React from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SettingsProvider } from "./src/context/SettingsContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { TabNavigator } from "./src/navigation/TabNavigator";

// Silenciar advertencias benignas de reconexión HMR en desarrollo
LogBox.ignoreLogs(["Cannot connect to Expo CLI", "Could not open editor"]);

const MainNavigator: React.FC = () => {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-[#07090e] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return session || user ? (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  ) : (
    <LoginScreen />
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <StatusBar style="light" />
          <MainNavigator />
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
