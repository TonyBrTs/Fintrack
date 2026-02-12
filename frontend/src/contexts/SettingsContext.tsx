"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/translations";

type Language = "en" | "es";
type Currency = "USD" | "EUR" | "GBP" | "CRC";

interface SettingsContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  currencySymbol: string;
  translate: (path: string) => string;
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
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("USD");

  // Load settings from localStorage on mount (Client-side only)
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    const savedCurrency = localStorage.getItem("currency") as Currency;

    if (savedLanguage && ["en", "es"].includes(savedLanguage)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguage(savedLanguage);
    }
    if (savedCurrency && ["USD", "EUR", "GBP", "CRC"].includes(savedCurrency)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrency(savedCurrency);
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

  const translate = (path: string): string => {
    const keys = path.split(".");
    let result: unknown = translations[language];
    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }
    return typeof result === "string" ? result : path;
  };

  const value = {
    language,
    currency,
    setLanguage,
    setCurrency,
    currencySymbol: currencySymbols[currency],
    translate,
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
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
