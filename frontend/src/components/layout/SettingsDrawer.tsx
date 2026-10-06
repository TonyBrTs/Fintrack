"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { SettingsView } from "@/components/settings/SettingsView";

export function SettingsDrawer() {
  const { isSettingsOpen, closeSettings, translate, language } = useSettings();
  const [mounted, setMounted] = useState(false);
  const isEs = language === "es";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (isSettingsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSettingsOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSettings}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm cursor-pointer"
          />

          {/* Centered Modal Card (Claude / ChatGPT style) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-[101] w-full max-w-lg sm:max-w-xl max-h-[88vh] sm:max-h-[82vh] bg-card/98 dark:bg-[#0b101b]/98 backdrop-blur-2xl border border-border/80 dark:border-slate-800/90 rounded-3xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <h2 className="text-foreground font-bold text-sm sm:text-base tracking-tight">
                  {translate("settingsDrawer.title") ||
                    (isEs ? "Ajustes y Configuración" : "Settings & Preferences")}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSettings}
                className="w-8 h-8 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar ajustes"
              >
                <X size={17} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              <SettingsView onCloseDrawer={closeSettings} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
