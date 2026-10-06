"use client";

import React from "react";
import { APIKeysManager } from "@/components/settings/APIKeysManager";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";
import { Sun, Moon, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, currency, setCurrency, iconSource, setIconSource } = useSettings();
  const mounted = useHydrated();

  const isEs = language === "es";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isEs ? "Configuración y Ajustes" : "Settings & Preferences"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEs
              ? "Administra tus preferencias, claves de API y automatizaciones de n8n"
              : "Manage your preferences, API keys, and n8n automations"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Preferences Card */}
        <div className="p-5 bg-card/60 border border-border/70 rounded-2xl space-y-5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>{isEs ? "Preferencias Generales" : "General Preferences"}</span>
          </h2>

          {/* Theme */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {isEs ? "Tema Visual" : "Theme"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  mounted && theme === "light"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-secondary/60 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun size={15} />
                <span>{isEs ? "Claro" : "Light"}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  mounted && theme === "dark"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-secondary/60 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon size={15} />
                <span>{isEs ? "Oscuro" : "Dark"}</span>
              </button>
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {isEs ? "Moneda Principal" : "Currency"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["USD", "EUR", "GBP", "CRC"] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    currency === curr
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400 shadow-xs"
                      : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {isEs ? "Idioma" : "Language"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage("es")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  language === "es"
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400 shadow-xs"
                    : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400 shadow-xs"
                    : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Icon style */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {isEs ? "Estilo de Íconos" : "Icon Style"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "phosphor", label: "Phosphor" },
                { id: "tabler", label: "Tabler" },
                { id: "lucide", label: "Lucide" },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setIconSource(style.id as "phosphor" | "tabler" | "lucide")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    iconSource === style.id
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400 shadow-xs"
                      : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Automations & API Keys Card */}
        <div className="p-5 bg-card/60 border border-border/70 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>{isEs ? "Automatizaciones (n8n)" : "Automations (n8n)"}</span>
          </h2>
          {user ? (
            <APIKeysManager />
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Inicia sesión para gestionar tus claves de API
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
