"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import { SettingsView } from "@/components/settings/SettingsView";

export function SettingsDrawer() {
  const { isSettingsOpen, closeSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background body scrolling ONLY on desktop/tablet to eliminate mobile layout-shift/flicker
  useEffect(() => {
    if (!isSettingsOpen) return;

    // Check if on desktop breakpoint to prevent mobile scrollbar jump and address bar jitter
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    if (isDesktop) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow || "";
      };
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSettings();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain">
          {/* Backdrop: Solid dark on mobile to avoid GPU blur stutter/flicker, subtle blur on desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={closeSettings}
            className="fixed inset-0 bg-slate-950/75 md:backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Card:
              - Mobile: Native full-screen settings view (h-[100dvh] w-full rounded-none bg-background)
              - Desktop: Centered 2-column modal (w-[92vw] max-w-4xl h-[600px] max-h-[85vh] rounded-3xl bg-card border shadow-2xl)
          */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-[101] w-full h-[100dvh] md:h-[600px] md:max-h-[86vh] md:w-[92vw] md:max-w-4xl bg-background md:bg-card/98 md:backdrop-blur-2xl border-0 md:border md:border-border/80 dark:md:border-slate-800/90 rounded-none md:rounded-3xl shadow-none md:shadow-2xl md:shadow-black/50 flex flex-col overflow-hidden overscroll-contain transform-gpu will-change-transform"
          >
            <SettingsView onCloseDrawer={closeSettings} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
