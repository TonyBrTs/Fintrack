import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Currency, Language } from "../types";
import { translations } from "../lib/translations";
import { CURRENCY_SYMBOLS } from "../lib/currency";

const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Ignore error
  }
};

interface SettingsContextType {
  currency: Currency;
  currencySymbol: string;
  setCurrency: (c: Currency) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  convert: (amount: number, fromCurrency?: string, toCurrency?: Currency) => number;
  formatCurrency: (amount: number, fromCurrency?: string) => string;
  getConversionNote: (amount: number, fromCurrency?: string) => string | null;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const CURRENCY_KEY = "fintrack_pref_currency";
const LANGUAGE_KEY = "fintrack_pref_language";

const SettingsContext = createContext<SettingsContextType>({
  currency: "USD",
  currencySymbol: "$",
  setCurrency: () => {},
  language: "es",
  setLanguage: () => {},
  t: (path) => path,
  convert: (amount) => amount,
  formatCurrency: (amount) => `$${amount.toFixed(2)}`,
  getConversionNote: () => null,
  isSettingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [language, setLanguageState] = useState<Language>("es");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  useEffect(() => {
    safeGetItem(CURRENCY_KEY)
      .then((val) => {
        if (val && ["USD", "EUR", "GBP", "CRC"].includes(val)) {
          setCurrencyState(val as Currency);
        }
      })
      .catch(() => {});

    safeGetItem(LANGUAGE_KEY)
      .then((val) => {
        if (val && ["es", "en"].includes(val)) {
          setLanguageState(val as Language);
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    safeSetItem(CURRENCY_KEY, c);
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    safeSetItem(LANGUAGE_KEY, l);
  };

  // Traductor con soporte para claves anidadas tipo "summary.netSaving"
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split(".");
      const langDict = translations[language] || translations.es;
      let current: any = langDict;

      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = current[k];
        } else {
          // Fallback a español si no se encuentra
          let fallback: any = translations.es;
          for (const fbKey of keys) {
            if (fallback && typeof fallback === "object" && fbKey in fallback) {
              fallback = fallback[fbKey];
            } else {
              fallback = null;
              break;
            }
          }
          current = fallback || path;
          break;
        }
      }

      if (typeof current !== "string") {
        return path;
      }

      if (params) {
        let result = current;
        Object.entries(params).forEach(([paramKey, val]) => {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
        });
        return result;
      }

      return current;
    },
    [language]
  );

  // La moneda es estrictamente visual (como en la web de FinTrack)
  const convert = useCallback((amount: number): number => {
    return Number(amount) || 0;
  }, []);

  // Formateador de moneda: símbolo visual + número con 2 decimales
  const formatCurrency = useCallback(
    (amount: number): string => {
      const num = Number(amount) || 0;
      const symbol = CURRENCY_SYMBOLS[currency] || "$";

      const formattedNum = num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return `${symbol}${formattedNum}`;
    },
    [currency]
  );

  const getConversionNote = useCallback((): string | null => {
    return null;
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        currency,
        currencySymbol: CURRENCY_SYMBOLS[currency],
        setCurrency,
        language,
        setLanguage,
        t,
        convert,
        formatCurrency,
        getConversionNote,
        isSettingsOpen,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
