"use client";

import { Moon, Globe, Settings, Bell, Sun, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
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
        <button
          onClick={toggleTheme}
          className="text-secondary-titles hover:text-action transition-colors cursor-pointer"
        >
          {mounted && theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-secondary-titles hover:text-action transition-colors cursor-pointer hidden md:block outline-none">
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
              <DropdownMenuItem onClick={() => setCurrency("JPY")}>
                <span>JPY (¥)</span>
                {currency === "JPY" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="text-secondary-titles hover:text-action transition-colors cursor-pointer hidden md:block">
          <Settings size={20} />
        </button>
        <button className="text-secondary-titles hover:text-action transition-colors cursor-pointer">
          <Bell size={20} />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-action flex items-center justify-center font-medium text-sm cursor-pointer text-white">
          TA
        </div>
      </div>
    </header>
  );
}
