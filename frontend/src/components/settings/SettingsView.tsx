"use client";

import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Palette,
  Shield,
  Eye,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Lock,
  Sparkles,
  Type,
  ZapOff,
  X,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { APIKeysManager } from "./APIKeysManager";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

type SettingsTab = "personalizacion" | "seguridad" | "accesibilidad";

interface SettingsViewProps {
  onCloseDrawer?: () => void;
}

export function SettingsView({ onCloseDrawer }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("personalizacion");
  const { theme, setTheme } = useTheme();
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    iconSource,
    setIconSource,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
    largeFont,
    setLargeFont,
  } = useSettings();

  const { user, signOut, openAuthModal } = useAuth();
  const mounted = useHydrated();
  const isEs = language === "es";

  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "FT";
  const displayName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    (isEs ? "Invitado" : "Guest");
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    undefined;

  const tabs = [
    {
      id: "personalizacion" as const,
      label: isEs ? "Personalización" : "Appearance",
      title: isEs ? "Personalización" : "Appearance & Theme",
      subtitle: isEs
        ? "Ajusta la apariencia visual, tema, monedas e íconos de FinTrack."
        : "Customize visual appearance, theme, currency, and icon styles.",
      icon: Palette,
      color: "text-blue-500",
    },
    {
      id: "seguridad" as const,
      label: isEs ? "Seguridad" : "Security",
      title: isEs ? "Seguridad y Accesos" : "Security & Access",
      subtitle: isEs
        ? "Gestiona tu cuenta, claves de API para integraciones y protocolos de cifrado."
        : "Manage your account, API keys for external automations, and encryption.",
      icon: Shield,
      color: "text-emerald-500",
    },
    {
      id: "accesibilidad" as const,
      label: isEs ? "Accesibilidad" : "Accessibility",
      title: isEs ? "Accesibilidad" : "Accessibility",
      subtitle: isEs
        ? "Opciones de contraste, movimiento reducido y tipografía accesible."
        : "Contrast options, reduced motion, and adaptive accessible typography.",
      icon: Eye,
      color: "text-purple-500",
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const renderTabContent = () => {
    switch (activeTab) {
      case "personalizacion":
        return (
          <div className="space-y-5">
            {/* Visual Theme */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
                {isEs ? "Tema Visual" : "Theme"}
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 dark:bg-card/40 rounded-2xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mounted && theme === "light"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun size={16} className="text-amber-500" />
                  <span>{isEs ? "Claro" : "Light"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mounted && theme === "dark"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon size={16} className="text-blue-400" />
                  <span>{isEs ? "Oscuro" : "Dark"}</span>
                </button>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
                {isEs ? "Moneda Principal" : "Main Currency"}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(["USD", "EUR", "GBP", "CRC"] as const).map((curr) => {
                  const isSelected = currency === curr;
                  return (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "bg-card/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {curr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
                {isEs ? "Idioma de la Interfaz" : "Language"}
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 dark:bg-card/40 rounded-2xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setLanguage("es")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    language === "es"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Español
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Icon Style Selection */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
                {isEs ? "Estilo de Íconos" : "Icon Style"}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "phosphor", label: "Phosphor" },
                  { id: "tabler", label: "Tabler" },
                  { id: "lucide", label: "Lucide" },
                ].map((style) => {
                  const isSelected = iconSource === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setIconSource(style.id as "phosphor" | "tabler" | "lucide")}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "bg-card/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "seguridad":
        return (
          <div className="space-y-5">
            {/* User Account / Session Card */}
            {user ? (
              <div className="p-3.5 bg-secondary/40 dark:bg-card/60 border border-border/60 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar size="lg" className="ring-2 ring-emerald-500/30 shrink-0">
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground font-bold text-xs sm:text-sm truncate">
                        {displayName}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    </div>
                    <span className="text-muted-foreground text-[11px] truncate">{user.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    onCloseDrawer?.();
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                  title={isEs ? "Cerrar sesión" : "Sign out"}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-secondary/40 border border-border/60 rounded-2xl flex flex-col gap-2.5 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                  <UserIcon size={20} />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  {isEs ? "Inicia sesión para sincronizar tu cuenta" : "Sign in to sync your account"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onCloseDrawer?.();
                    openAuthModal("login");
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {isEs ? "Iniciar Sesión" : "Sign In"}
                </button>
              </div>
            )}

            {/* API Keys & Automations */}
            {user && (
              <div className="pt-1">
                <APIKeysManager />
              </div>
            )}

            {/* Encryption & Security info */}
            <div className="p-3 bg-secondary/30 dark:bg-card/40 border border-border/50 rounded-xl flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Lock size={13} className="text-emerald-500 shrink-0" />
                <span>{isEs ? "Cifrado en tránsito y base de datos segura" : "Encrypted & secure storage"}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                TLS / SHA-256
              </span>
            </div>
          </div>
        );

      case "accesibilidad":
        return (
          <div className="space-y-3.5">
            {/* Reduced Motion Toggle */}
            <div className="p-3.5 bg-secondary/40 dark:bg-card/50 border border-border/60 rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ZapOff size={15} className="text-purple-500 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    {isEs ? "Reducir movimiento" : "Reduce motion"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEs
                    ? "Minimiza animaciones y transiciones de pantalla para evitar fatiga visual."
                    : "Minimizes transitions and movement across screens."}
                </p>
              </div>
              <Switch
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
                colorScheme="blue"
                size="sm"
              />
            </div>

            {/* High Contrast Toggle */}
            <div className="p-3.5 bg-secondary/40 dark:bg-card/50 border border-border/60 rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    {isEs ? "Alto contraste" : "High contrast"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEs
                    ? "Aumenta la definición de los bordes y el contraste del texto para mayor claridad."
                    : "Increases border borders and text contrast for easier readability."}
                </p>
              </div>
              <Switch
                checked={highContrast}
                onCheckedChange={setHighContrast}
                colorScheme="blue"
                size="sm"
              />
            </div>

            {/* Large Font Scale Toggle */}
            <div className="p-3.5 bg-secondary/40 dark:bg-card/50 border border-border/60 rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Type size={15} className="text-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    {isEs ? "Texto ampliado" : "Large text"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isEs
                    ? "Aumenta ligeramente el tamaño de la tipografía para facilitar la lectura."
                    : "Slightly increases font sizes for comfortable reading."}
                </p>
              </div>
              <Switch
                checked={largeFont}
                onCheckedChange={setLargeFont}
                colorScheme="blue"
                size="sm"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden select-none">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col justify-between border-r border-border/60 bg-secondary/35 dark:bg-slate-900/50 p-4 shrink-0">
        <div className="space-y-5">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <SettingsIcon size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-foreground font-bold text-sm tracking-tight truncate">
                {isEs ? "Configuración" : "Settings"}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate font-medium">
                FinTrack Preferences
              </p>
            </div>
          </div>

          {/* Vertical Navigation Tabs */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-card dark:bg-slate-800 text-foreground font-bold shadow-xs border border-border/70"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 font-medium"
                  }`}
                >
                  <Icon size={16} className={isActive ? tab.color : "text-muted-foreground"} />
                  <span className="truncate flex-1">{tab.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card at the bottom of the sidebar */}
        <div className="pt-3 border-t border-border/60">
          {user ? (
            <div className="p-2.5 bg-card/70 dark:bg-slate-800/60 rounded-2xl border border-border/60 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar size="sm" className="ring-1 ring-emerald-500/30 shrink-0">
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-[10px]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-foreground font-bold text-xs truncate">
                    {displayName}
                  </span>
                  <span className="text-muted-foreground text-[10px] truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  onCloseDrawer?.();
                }}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                title={isEs ? "Cerrar sesión" : "Sign out"}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onCloseDrawer?.();
                openAuthModal("login");
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <UserIcon size={14} />
              <span>{isEs ? "Iniciar Sesión" : "Sign In"}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Desktop Content Pane */}
      <main className="hidden md:flex flex-1 flex-col min-w-0 overflow-hidden bg-background/50 dark:bg-card/20">
        {/* Header with Title, Description and Close 'X' Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div>
            <h3 className="text-foreground font-bold text-base lg:text-lg tracking-tight">
              {currentTab.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentTab.subtitle}
            </p>
          </div>
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="w-8 h-8 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label={isEs ? "Cerrar configuración" : "Close settings"}
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {renderTabContent()}

          {/* System Footer Info */}
          <div className="pt-4 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>FinTrack v2.0 • Supabase</span>
            </div>
            <span>{isEs ? "Protegido en la Nube" : "Cloud Protected"}</span>
          </div>
        </div>
      </main>

      {/* Mobile Settings View */}
      <div className="flex md:hidden flex-col h-full w-full overflow-hidden bg-background">
        {/* Mobile Top App Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0 bg-background/95">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <SettingsIcon size={16} />
            </div>
            <h2 className="text-foreground font-bold text-sm tracking-tight">
              {isEs ? "Configuración" : "Settings"}
            </h2>
          </div>
          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="w-8 h-8 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              aria-label={isEs ? "Cerrar" : "Close"}
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Mobile Segmented Category Bar */}
        <div className="px-3 pt-2.5 pb-1 shrink-0">
          <div className="grid grid-cols-3 p-1 bg-secondary/60 dark:bg-card/70 rounded-2xl border border-border/60 gap-1 select-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <Icon size={14} className={isActive ? tab.color : "text-muted-foreground"} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain">
          {renderTabContent()}

          {/* System Footer Info */}
          <div className="pt-3 pb-6 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>FinTrack v2.0 • Supabase</span>
            </div>
            <span>{isEs ? "Protegido en la Nube" : "Cloud Protected"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
