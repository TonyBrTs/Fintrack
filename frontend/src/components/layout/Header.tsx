"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Moon, Sun, LogOut, LogIn, Settings, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { BrandLogo } from "./BrandLogo";
import { SettingsDrawer } from "./SettingsDrawer";
import Link from "next/link";

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const { translate, openSettings, language } = useSettings();
  const isEs = language === "es";
  const { user, signOut, openAuthModal } = useAuth();
  const mounted = useHydrated();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "FT";

  const displayName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Usuario";

  return (
    <>
      <header className="h-16 px-4 md:px-10 lg:px-20 flex items-center justify-between transition-colors duration-300">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer"
        >
          <BrandLogo
            variant="full"
            size={32}
            priority
            className="group-hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Right Actions: Theme Toggle, Mobile Hamburger Menu, Profile / Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Quick Switcher (Desktop only - on mobile it is in the hamburger menu) */}
          <button
            onClick={toggleTheme}
            aria-label={isEs ? "Alternar tema" : "Toggle theme"}
            className="hidden md:flex p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-blue-600 bg-slate-100/90 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-blue-400 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer shadow-xs"
          >
            {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile Hamburger Menu (Opens Drawer on Mobile with all options) */}
          <button
            onClick={openSettings}
            aria-label={isEs ? "Menú de navegación y ajustes" : "Navigation and settings menu"}
            className="md:hidden p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-blue-600 bg-slate-100/90 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-blue-400 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer shadow-xs"
          >
            <Menu size={20} />
          </button>

          {/* Profile / Auth (Desktop only - on mobile it is inside the hamburger menu) */}
          <div className="hidden md:flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={isEs ? "Perfil y Ajustes" : "Profile and Settings"}
                    className="flex items-center gap-2 p-0.5 rounded-full ring-2 ring-blue-500/30 hover:ring-blue-500/70 transition-all cursor-pointer outline-none focus-visible:ring-action"
                  >
                    <Avatar size="lg">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <div className="px-3 py-2">
                    <p className="text-xs font-bold text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={openSettings}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4 text-action dark:text-blue-400" />
                    <span>
                      {translate("settingsDrawer.preferences") ||
                        (isEs ? "Ajustes y Preferencias" : "Settings & Preferences")}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-rose-500 hover:text-rose-600 cursor-pointer focus:text-rose-600 focus:bg-rose-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>
                      {translate("settingsDrawer.signOut") ||
                        (isEs ? "Cerrar Sesión" : "Sign Out")}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <LogIn size={14} />
                <span>
                  {translate("settingsDrawer.signIn") || (isEs ? "Iniciar Sesión" : "Sign In")}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global Settings Drawer */}
      <SettingsDrawer />
    </>
  );
}
