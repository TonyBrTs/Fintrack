"use client";

import {
  NavSummaryIcon,
  NavExpensesIcon,
  NavIncomeIcon,
  NavGoalsIcon,
} from "@/components/ui/AppIcons";
import { FileText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";

export function SubNavbar() {
  const pathname = usePathname();
  const { translate, openSettings, isSettingsOpen } = useSettings();

  const navItems = [
    {
      name: translate("nav.summary") || "Resumen",
      href: "/",
      icon: NavSummaryIcon,
      activeColor: "text-blue-500",
    },
    {
      name: translate("nav.expenses") || "Gastos",
      href: "/expenses",
      icon: NavExpensesIcon,
      activeColor: "text-rose-500",
    },
    {
      name: translate("nav.income") || "Ingresos",
      href: "/incomes",
      icon: NavIncomeIcon,
      activeColor: "text-emerald-500",
    },
    {
      name: translate("nav.goals") || "Metas",
      href: "/goals",
      icon: NavGoalsIcon,
      activeColor: "text-purple-500",
    },
    {
      name: translate("nav.reports") || "Reportes",
      href: "/reports",
      icon: FileText,
      activeColor: "text-indigo-500",
    },
  ];

  return (
    <nav aria-label="Navegación principal de escritorio" className="hidden md:block w-full border-t border-slate-200/80 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-2 flex items-center justify-start sm:justify-center overflow-x-auto scrollbar-hide">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900/80 rounded-2xl border border-slate-300/80 dark:border-slate-800 shadow-xs">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shrink-0 select-none
                  ${
                    isActive
                      ? "text-slate-900 dark:text-foreground font-bold"
                      : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/40"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon
                    size={16}
                    className={`transition-colors ${
                      isActive ? item.activeColor : "text-slate-500 dark:text-muted-foreground"
                    }`}
                  />
                  <span>{item.name}</span>
                </span>
              </Link>
            );
          })}

          <div className="w-px h-5 bg-slate-300/80 dark:bg-slate-700/80 mx-1 self-center" />

          <button
            type="button"
            onClick={openSettings}
            className={`
              relative flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shrink-0 select-none
              ${
                isSettingsOpen
                  ? "text-slate-900 dark:text-foreground font-bold bg-white dark:bg-slate-800 shadow-sm border border-slate-200/90 dark:border-slate-700"
                  : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/40"
              }
            `}
          >
            <Settings
              size={16}
              className={`transition-colors ${
                isSettingsOpen ? "text-blue-500" : "text-slate-500 dark:text-muted-foreground"
              }`}
            />
            <span>{translate("nav.settings") || "Ajustes"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
