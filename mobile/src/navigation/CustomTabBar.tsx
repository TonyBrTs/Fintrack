import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, ArrowLeftRight, Plus, BarChart3, Target } from "lucide-react-native";
import { useSettings } from "../context/SettingsContext";

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onOpenCreate: () => void;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onOpenCreate,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useSettings();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 14);

  // Escalas animadas para cada una de las 5 pestañas (simétricas con '+' en el centro)
  const scales = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  const animatePress = (index: number) => {
    if (scales[index]) {
      Animated.sequence([
        Animated.timing(scales[index], {
          toValue: 0.82,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scales[index], {
          toValue: 1,
          friction: 3.5,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const getLocalizedLabel = (name: string) => {
    switch (name) {
      case "Inicio":
        return t("nav.summary");
      case "Movimientos":
        return t("nav.transactions");
      case "Nuevo":
        return t("nav.new");
      case "Reportes":
        return t("nav.reports");
      case "Metas":
        return t("nav.goals");
      default:
        return name;
    }
  };

  return (
    <View
      className="flex-row bg-black border-t border-neutral-800 pt-2.5 items-center justify-around"
      style={{ paddingBottom: bottomPadding }}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const isCenterButton = route.name === "Nuevo";

        const onPress = () => {
          animatePress(index);

          if (isCenterButton) {
            onOpenCreate();
            return;
          }

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Botón '+' central exactamente simétrico (posición 3 de 5)
        if (isCenterButton) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.85}
              className="flex-1 items-center justify-center"
            >
              <Animated.View
                className="w-[42px] h-[42px] rounded-full bg-blue-600 justify-center items-center border-2 border-black"
                style={{ transform: [{ scale: scales[index] || 1 }] }}
              >
                <Plus size={22} color="#ffffff" strokeWidth={3} />
              </Animated.View>
            </TouchableOpacity>
          );
        }

        const getIcon = () => {
          const color = isFocused ? "#ffffff" : "#71717a";
          const strokeWidth = isFocused ? 2.5 : 1.8;

          switch (route.name) {
            case "Inicio":
              return <Home size={22} color={color} strokeWidth={strokeWidth} />;
            case "Movimientos":
              return <ArrowLeftRight size={22} color={color} strokeWidth={strokeWidth} />;
            case "Reportes":
              return <BarChart3 size={22} color={color} strokeWidth={strokeWidth} />;
            case "Metas":
              return <Target size={22} color={color} strokeWidth={strokeWidth} />;
            default:
              return <Home size={22} color={color} strokeWidth={strokeWidth} />;
          }
        };

        const label = getLocalizedLabel(route.name);

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            className="flex-1 items-center justify-center py-0.5"
          >
            <Animated.View
              className="items-center justify-center h-[26px]"
              style={{ transform: [{ scale: scales[index] || 1 }] }}
            >
              {getIcon()}
            </Animated.View>

            <Text
              className={`text-[9.5px] mt-[3px] tracking-tight ${
                isFocused ? "text-white font-bold" : "text-zinc-500 font-semibold"
              }`}
              numberOfLines={1}
            >
              {label}
            </Text>

            {isFocused && <View className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
