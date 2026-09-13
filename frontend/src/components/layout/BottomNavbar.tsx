"use client";

import {
  NavSummaryIcon,
  NavExpensesIcon,
  NavIncomeIcon,
  NavGoalsIcon,
} from "@/components/ui/AppIcons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";

export function BottomNavbar() {
  const pathname = usePathname();
  const { translate } = useSettings();

  const navItems = [
    {
      name: translate("nav.summary") || "Resumen",
      href: "/",
      icon: NavSummaryIcon,
      activeColor: "text-blue-500",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      name: translate("nav.expenses") || "Gastos",
      href: "/expenses",
      icon: NavExpensesIcon,
      activeColor: "text-rose-500",
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    {
      name: translate("nav.income") || "Ingresos",
      href: "/incomes",
      icon: NavIncomeIcon,
      activeColor: "text-emerald-500",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      name: translate("nav.goals") || "Metas",
      href: "/goals",
      icon: NavGoalsIcon,
      activeColor: "text-purple-500",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1.5 px-3 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] dark:shadow-2xl transition-all"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all select-none cursor-pointer min-h-[50px] active:scale-95 ${
                isActive
                  ? "text-slate-900 dark:text-foreground font-bold"
                  : "text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBottomNavTab"
                  className="absolute inset-0 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/90 dark:border-slate-700/60 shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-1">
                <div
                  className={`p-1 rounded-xl transition-all duration-200 ${
                    isActive ? item.badgeColor : ""
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors ${
                      isActive ? item.activeColor : "text-slate-400 dark:text-muted-foreground"
                    }`}
                  />
                </div>
                <span
                  className={`text-[11px] leading-tight tracking-tight transition-colors ${
                    isActive ? "font-bold text-slate-900 dark:text-foreground" : "font-medium text-slate-500 dark:text-muted-foreground"
                  }`}
                >
                  {item.name}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
