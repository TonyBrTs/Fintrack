"use client";

import { Sheet } from "@/components/ui/Sheet";
import { useSettings } from "@/contexts/SettingsContext";
import { SettingsView } from "@/components/settings/SettingsView";

export function SettingsDrawer() {
  const { isSettingsOpen, closeSettings, translate, language } = useSettings();
  const isEs = language === "es";

  return (
    <Sheet
      isOpen={isSettingsOpen}
      onClose={closeSettings}
      title={
        translate("settingsDrawer.title") ||
        (isEs ? "Ajustes y Configuración" : "Settings & Preferences")
      }
    >
      <div className="pb-8">
        <SettingsView onCloseDrawer={closeSettings} />
      </div>
    </Sheet>
  );
}
