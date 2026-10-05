import React, { useState } from "react";
import { View, Modal } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../screens/DashboardScreen";
import { TransactionsScreen } from "../screens/TransactionsScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { GoalsScreen } from "../screens/GoalsScreen";
import { RecurringScreen } from "../screens/RecurringScreen";
import { CustomTabBar } from "./CustomTabBar";
import { QuickActionModal } from "../components/QuickActionModal";
import { AddExpenseModal } from "../components/AddExpenseModal";
import { AddIncomeModal } from "../components/AddIncomeModal";
import { SettingsModal } from "../components/SettingsModal";
import { useSettings } from "../context/SettingsContext";

const Tab = createBottomTabNavigator();

// Pantalla fantasma para el slot central '+'
const EmptyScreen = () => <View />;

export const TabNavigator: React.FC = () => {
  const { isSettingsOpen, closeSettings } = useSettings();
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} onOpenCreate={() => setShowQuickModal(true)} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Inicio" component={DashboardScreen} />
        <Tab.Screen name="Movimientos" component={TransactionsScreen} />
        <Tab.Screen name="Nuevo" component={EmptyScreen} />
        <Tab.Screen name="Reportes" component={ReportsScreen} />
        <Tab.Screen name="Metas" component={GoalsScreen} />
      </Tab.Navigator>

      {/* Modal de Acción Rápida estilo Instagram '+' con 3 opciones */}
      <QuickActionModal
        visible={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        onSelectExpense={() => setShowExpenseModal(true)}
        onSelectIncome={() => setShowIncomeModal(true)}
        onSelectRecurring={() => setShowRecurringModal(true)}
      />

      <AddExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={() => {}}
      />
      <AddIncomeModal
        visible={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSuccess={() => {}}
      />

      {/* Modal de Recurrentes abierto directamente desde (+) */}
      <Modal
        visible={showRecurringModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecurringModal(false)}
      >
        <RecurringScreen onBack={() => setShowRecurringModal(false)} />
      </Modal>

      {/* Modal Global de Configuración & Perfil disponible para todas las pantallas */}
      <SettingsModal visible={isSettingsOpen} onClose={closeSettings} />
    </>
  );
};
