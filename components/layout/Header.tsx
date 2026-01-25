"use client";

import { motion } from "framer-motion";
import { Moon, Globe, Settings, Bell, Sun, Check, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Sheet } from "@/components/ui/Sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, currency, setCurrency, t } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-18 bg-white dark:bg-card border-b border-gray-100 dark:border-border px-8 flex items-center justify-between transition-colors duration-300">
      {/* Logo */}
      <h1 className="text-titles dark:text-foreground font-bold text-xl">
        FinTrack AI
      </h1>

      {/* Right side: Icons and Avatar */}
      <div className="flex items-center gap-5">
        {/* Desktop Icons */}
        <div className="hidden md:flex items-center gap-5">
          <button
            onClick={toggleTheme}
            className="text-secondary-titles hover:text-action transition-colors cursor-pointer"
          >
            {mounted && theme === "dark" ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-secondary-titles hover:text-action transition-colors cursor-pointer outline-none">
                <Globe size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>{t("header.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  <span>English</span>
                  {language === "en" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("es")}>
                  <span>Español</span>
                  {language === "es" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t("header.currency")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setCurrency("USD")}>
                  <span>USD ($)</span>
                  {currency === "USD" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrency("EUR")}>
                  <span>EUR (€)</span>
                  {currency === "EUR" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrency("GBP")}>
                  <span>GBP (£)</span>
                  {currency === "GBP" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrency("CRC")}>
                  <span>CRC (₡)</span>
                  {currency === "CRC" && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="text-secondary-titles hover:text-action transition-colors cursor-pointer mr-0.5">
            <Bell size={20} />
          </button>
        </div>

        {/* Mobile Burger Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden text-secondary-titles hover:text-action transition-colors cursor-pointer"
        >
          <Menu size={24} />
        </button>

        <button className="text-secondary-titles hover:text-action transition-colors cursor-pointer hidden md:block">
          <Settings size={20} />
        </button>

        {/* Avatar (Desktop Only) */}
        <div className="w-10 h-10 rounded-full bg-action items-center justify-center font-medium text-sm cursor-pointer text-white hidden md:flex">
          TA
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={t("header.settings") || "Settings"}
      >
        <div className="flex flex-col gap-8">
          {/* User Profile Section */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-action flex items-center justify-center font-bold text-white shadow-lg shadow-action/20">
              TA
            </div>
            <div className="flex flex-col">
              <span className="text-titles dark:text-foreground font-bold">
                TonyBrTs
              </span>
              <span className="text-secondary-titles text-xs opacity-70">
                tony@example.com
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-secondary-titles font-medium">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <button
              onClick={toggleTheme}
              className="w-12 h-6 rounded-full bg-gray-100 dark:bg-gray-800 relative transition-colors"
            >
              <motion.div
                layout
                initial={false}
                animate={{
                  x: theme === "dark" ? 24 : 0,
                  backgroundColor: theme === "dark" ? "#60a5fa" : "#facc15",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
                className="absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm"
              />
            </button>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

          {/* Language Selection */}
          <div className="space-y-4">
            <h3 className="text-titles dark:text-foreground font-semibold text-sm">
              {t("header.language")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                  language === "en"
                    ? "bg-action border-action text-white"
                    : "border-gray-200 dark:border-gray-800 text-secondary-titles"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("es")}
                className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                  language === "es"
                    ? "bg-action border-action text-white"
                    : "border-gray-200 dark:border-gray-800 text-secondary-titles"
                }`}
              >
                Español
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

          {/* Currency Selection */}
          <div className="space-y-4">
            <h3 className="text-titles dark:text-foreground font-semibold text-sm">
              {t("header.currency")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {["USD", "EUR", "GBP", "CRC"].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr as typeof currency)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                    currency === curr
                      ? "bg-action border-action text-white"
                      : "border-gray-200 dark:border-gray-800 text-secondary-titles"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </header>
  );
}
