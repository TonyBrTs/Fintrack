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
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export function SubNavbar() {
  const pathname = usePathname();
  const { translate } = useSettings();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const navItems = [
    {
      name: translate("nav.summary"),
      href: "/",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: translate("nav.expenses"),
      href: "/expenses",
      icon: <TrendingDown size={20} />,
    },
    {
      name: translate("nav.income"),
      href: "/incomes",
      icon: <TrendingUp size={20} />,
    },
    {
      name: translate("nav.goals"),
      href: "/goals",
      icon: <Goal size={20} />,
    },
  ];

  return (
    <>
      {/* Desktop/Tablet View (Top Bar) */}
      <div className="hidden md:flex bg-white dark:bg-card border-b border-gray-100 dark:border-border items-center px-4 md:px-20 overflow-x-auto whitespace-nowrap transition-colors duration-300 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onMouseEnter={() => setHoveredTab(item.name)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`
                relative px-4 py-4 font-medium transition-colors cursor-pointer
                ${
                  isActive
                    ? "text-action dark:text-blue-400"
                    : "text-gray-500 hover:text-action/70 dark:text-gray-400 dark:hover:text-white"
                }
              `}
            >
              {item.name}

              {/* Active Tab Sliding Underline */}
              {isActive && (
                <motion.span
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 w-full h-0.75 bg-action dark:bg-blue-400 rounded-t-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Hover Underline (only if not active) */}
              {!isActive && hoveredTab === item.name && (
                <motion.span
                  layoutId="hoverTab"
                  className="absolute bottom-0 left-0 w-full h-0.75 bg-action/70 dark:bg-gray-600 rounded-t-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile View (Bottom Bar - WhatsApp Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-gray-200 dark:border-border flex justify-between items-center px-6 py-2 z-50 transition-colors duration-300 text-[10px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-1 cursor-pointer relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute inset-0 bg-action/10 dark:bg-blue-400/20 rounded-full -z-10 w-16 h-8 mx-auto top-0"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <div
                className={`
                  px-5 py-1 rounded-full transition-colors z-10
                  ${
                    isActive
                      ? "text-action dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }
                `}
              >
                {item.icon}
              </div>
              <span
                className={`
                  font-medium
                  ${
                    isActive
                      ? "text-action dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }
                `}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
