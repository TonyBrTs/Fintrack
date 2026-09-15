"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import {
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function SettingsDrawer() {
  const { theme, setTheme } = useTheme();
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    iconSource,
    setIconSource,
    translate,
    isSettingsOpen,
    closeSettings,
  } = useSettings();
  const { user, signOut, openAuthModal } = useAuth();
  const mounted = useHydrated();

  const isEs = language === "es";

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "FT";

  const displayName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    (isEs ? "Invitado" : "Guest");

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    undefined;

  return (
    <Sheet
      isOpen={isSettingsOpen}
      onClose={closeSettings}
      title={translate("settingsDrawer.title") || (isEs ? "Ajustes y Configuración" : "Settings & Preferences")}
    >
      <div className="flex flex-col gap-5 pb-8">
        {/* User Profile Card */}
        {user ? (
          <div className="flex items-center justify-between p-3.5 bg-secondary/50 dark:bg-card/60 border border-border/60 rounded-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar size="lg" className="ring-2 ring-blue-500/30 shrink-0">
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground font-bold text-sm truncate">
                    {displayName}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <span className="text-muted-foreground text-xs truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                signOut();
                closeSettings();
              }}
              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer shrink-0"
              title={translate("settingsDrawer.signOut") || (isEs ? "Cerrar sesión" : "Sign out")}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl flex flex-col gap-2.5 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center mx-auto">
              <UserIcon size={20} />
            </div>
            <p className="text-xs font-semibold text-foreground">
              {translate("settingsDrawer.signInPrompt") ||
                (isEs
                  ? "Inicia sesión para sincronizar tus finanzas"
                  : "Sign in to synchronize and protect your finances")}
            </p>
            <button
              onClick={() => {
                closeSettings();
                openAuthModal("login");
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {translate("settingsDrawer.signIn") || (isEs ? "Iniciar Sesión" : "Sign In")}
            </button>
          </div>
        )}



        {/* Visual Theme Selection */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
            {translate("settingsDrawer.theme") || (isEs ? "Tema Visual" : "Visual Theme")}
          </span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/60 dark:bg-card/50 rounded-xl border border-border/50">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mounted && theme === "light"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun size={15} className="text-amber-500" />
              <span>{translate("settingsDrawer.light") || (isEs ? "Claro" : "Light")}</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mounted && theme === "dark"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon size={15} className="text-blue-400" />
              <span>{translate("settingsDrawer.dark") || (isEs ? "Oscuro" : "Dark")}</span>
            </button>
          </div>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
            {translate("settingsDrawer.currency") || (isEs ? "Moneda Principal" : "Main Currency")}
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["USD", "EUR", "GBP", "CRC"] as const).map((curr) => {
              const isSelected = currency === curr;
              return (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    isSelected
                      ? "bg-action/10 dark:bg-blue-500/15 border-action/40 dark:border-blue-500/40 text-action dark:text-blue-400 shadow-xs"
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
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
            {translate("settingsDrawer.language") || (isEs ? "Idioma" : "Language")}
          </span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/60 dark:bg-card/50 rounded-xl border border-border/50">
            <button
              onClick={() => setLanguage("es")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === "es"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Español
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === "en"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Icon Style Selection */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
            {translate("settingsDrawer.iconStyle") || (isEs ? "Estilo de Íconos" : "Icon Style")}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "phosphor", label: "Phosphor" },
              { id: "tabler", label: "Tabler" },
              { id: "lucide", label: "Lucide" },
            ].map((style) => {
              const isSelected = iconSource === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() =>
                    setIconSource(
                      style.id as "phosphor" | "tabler" | "lucide",
                    )
                  }
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    isSelected
                      ? "bg-action/10 dark:bg-blue-500/15 border-action/40 dark:border-blue-500/40 text-action dark:text-blue-400 shadow-xs"
                      : "bg-card/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* System Info */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>FinTrack v2.0 • Supabase Auth</span>
          </div>
          <span>{translate("settingsDrawer.cloudSafe") || (isEs ? "Protegido en la Nube" : "Cloud Protected")}</span>
        </div>
      </div>
    </Sheet>
  );
}
