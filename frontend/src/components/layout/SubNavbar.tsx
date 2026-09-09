"use client";

import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Goal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";

export function SubNavbar() {
  const pathname = usePathname();
  const { translate } = useSettings();

  const navItems = [
    {
      name: translate("nav.summary") || "Resumen",
      href: "/",
      icon: LayoutDashboard,
      activeColor: "text-blue-500",
    },
    {
      name: translate("nav.expenses") || "Gastos",
      href: "/expenses",
      icon: TrendingDown,
      activeColor: "text-rose-500",
    },
    {
      name: translate("nav.income") || "Ingresos",
      href: "/incomes",
      icon: TrendingUp,
      activeColor: "text-emerald-500",
    },
    {
      name: translate("nav.goals") || "Metas",
      href: "/goals",
      icon: Goal,
      activeColor: "text-purple-500",
    },
  ];

  return (
    <nav aria-label="Navegación principal" className="w-full border-t border-border/40 bg-background/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-2 flex items-center justify-start sm:justify-center overflow-x-auto scrollbar-hide">
        <div className="inline-flex items-center gap-1 p-1 bg-secondary/60 dark:bg-slate-900/60 rounded-2xl border border-border/60 shadow-xs">
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
                      ? "text-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSubTab"
                    className="absolute inset-0 bg-card dark:bg-card rounded-xl border border-border/70 shadow-xs"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon
                    size={16}
                    className={`transition-colors ${
                      isActive ? item.activeColor : "text-muted-foreground"
                    }`}
                  />
                  <span>{item.name}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
