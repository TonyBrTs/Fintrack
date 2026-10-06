"use client";

import React from "react";
import { SettingsView } from "@/components/settings/SettingsView";
import { useSettings } from "@/contexts/SettingsContext";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const { language } = useSettings();
  const isEs = language === "es";

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/60">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isEs ? "Ajustes y Configuración" : "Settings & Preferences"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEs
              ? "Personalización visual, seguridad de cuenta, claves de API y accesibilidad"
              : "Appearance, account security, API keys, and accessibility"}
          </p>
        </div>
      </div>

      {/* Main Categorized Settings Container */}
      <div className="bg-card/60 border border-border/70 rounded-3xl shadow-sm overflow-hidden min-h-[560px]">
        <SettingsView />
      </div>
    </div>
  );
}
