"use client";

import { ArrowDownLeft, ArrowUpRight, LayoutDashboard, ShieldCheck, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";

const mainItems = [
  { href: "/", label: "nav.summary", icon: LayoutDashboard },
  { href: "/expenses", label: "nav.expenses", icon: ArrowUpRight },
  { href: "/incomes", label: "nav.income", icon: ArrowDownLeft },
  { href: "/goals", label: "nav.goals", icon: Target },
];

const vaultItem = { href: "/vault", label: "nav.vault", icon: ShieldCheck };

export function MainNavigation({ showVault }: { showVault: boolean }) {
  const pathname = usePathname();
  const { language, translate } = useSettings();
  const items = showVault ? [...mainItems, vaultItem] : mainItems;

  return (
    <nav
      aria-label={language === "es" ? "Navegación principal" : "Main navigation"}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] print:hidden md:static md:px-10 lg:px-20"
    >
      <div className="mx-auto flex max-w-md gap-1 py-1 md:mx-0 md:max-w-none">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-[11px] leading-tight font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action aria-[current=page]:bg-action/10 aria-[current=page]:font-semibold aria-[current=page]:text-action md:min-h-11 md:flex-none md:flex-row md:gap-2 md:px-3 md:text-sm"
            >
              <Icon aria-hidden="true" size={18} strokeWidth={2} className="shrink-0" />
              <span>{translate(label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
