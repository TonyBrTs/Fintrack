"use client";

import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconFileText,
  IconLayoutDashboard,
  IconShieldCheck,
  IconTarget,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

const mainItems = [
  { href: "/", label: "nav.summary", icon: IconLayoutDashboard },
  { href: "/expenses", label: "nav.expenses", icon: IconArrowUpRight },
  { href: "/incomes", label: "nav.income", icon: IconArrowDownLeft },
  { href: "/goals", label: "nav.goals", icon: IconTarget },
  { href: "/reports", label: "nav.reports", icon: IconFileText },
];

const vaultItem = { href: "/vault", label: "nav.vault", icon: IconShieldCheck };

interface MainNavigationProps {
  showVault: boolean;
  variant?: "desktop" | "mobile";
}

export function MainNavigation({ showVault, variant = "mobile" }: MainNavigationProps) {
  const pathname = usePathname();
  const { language, translate } = useSettings();
  const items = showVault ? [...mainItems, vaultItem] : mainItems;

  if (variant === "desktop") {
    return (
      <nav
        aria-label={language === "es" ? "Navegación principal" : "Main navigation"}
        className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/70 border border-border/70"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action",
                isActive
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                  : "text-slate-600 dark:text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/50 border border-transparent"
              )}
            >
              <Icon aria-hidden="true" size={17} stroke={2} className="shrink-0" />
              <span>{translate(label)}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label={language === "es" ? "Navegación principal" : "Main navigation"}
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-2 pb-[env(safe-area-inset-bottom)] print:hidden"
    >
      <div className="mx-auto flex max-w-md gap-1 py-1">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-[11px] leading-tight font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action aria-[current=page]:bg-action/10 aria-[current=page]:font-semibold aria-[current=page]:text-action touch-manipulation"
            >
              <Icon aria-hidden="true" size={18} stroke={2} className="shrink-0" />
              <span className="truncate max-w-full">{translate(label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
