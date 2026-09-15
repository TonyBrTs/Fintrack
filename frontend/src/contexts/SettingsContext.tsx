"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/translations";

type Language = "en" | "es";
type Currency = "USD" | "EUR" | "GBP" | "CRC";
export type IconSource = "phosphor" | "tabler" | "lucide";

interface SettingsContextType {
  language: Language;
  currency: Currency;
  iconSource: IconSource;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  setIconSource: (source: IconSource) => void;
  currencySymbol: string;
  translate: (path: string, fallback?: string) => string;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CRC: "₡",
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("es");
  const [currency, setCurrency] = useState<Currency>("CRC");
  const [iconSource, setIconSource] = useState<IconSource>("phosphor");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  // Load settings from localStorage on mount (Client-side only)
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    const savedCurrency = localStorage.getItem("currency") as Currency;
    const savedIconSource = localStorage.getItem("iconSource") as IconSource;

    if (savedLanguage && ["en", "es"].includes(savedLanguage)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguage(savedLanguage);
    }
    if (savedCurrency && ["USD", "EUR", "GBP", "CRC"].includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
    if (savedIconSource && ["phosphor", "tabler", "lucide"].includes(savedIconSource)) {
      setIconSource(savedIconSource);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
    }
  }, [language]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currency", currency);
    }
  }, [currency]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("iconSource", iconSource);
    }
  }, [iconSource]);

  const translate = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let result: unknown = translations[language];
    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        if (fallback !== undefined) return fallback;
        if (path.startsWith("categories.")) return path.slice("categories.".length);
        if (path.startsWith("sources.")) return path.slice("sources.".length);
        return "";
      }
    }
    if (typeof result === "string") return result;
    if (fallback !== undefined) return fallback;
    if (path.startsWith("categories.")) return path.slice("categories.".length);
    if (path.startsWith("sources.")) return path.slice("sources.".length);
    return "";
  };

  const value = {
    language,
    currency,
    iconSource,
    setLanguage,
    setCurrency,
    setIconSource,
    currencySymbol: currencySymbols[currency],
    translate,
    isSettingsOpen,
    setIsSettingsOpen,
    openSettings,
    closeSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    return {
      language: "en" as Language,
      currency: "USD" as Currency,
      iconSource: "phosphor" as IconSource,
      setLanguage: () => {},
      setCurrency: () => {},
      setIconSource: () => {},
      currencySymbol: "$",
      translate: (_path: string, fallback?: string) => fallback || "",
      isSettingsOpen: false,
      setIsSettingsOpen: () => {},
      openSettings: () => {},
      closeSettings: () => {},
    };
  }
  return context;
};
