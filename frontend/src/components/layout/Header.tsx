'use client';

import { Sheet } from '@/components/ui/Sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSettings } from '@/contexts/SettingsContext';
import { Check, Globe, Menu, Moon, Sun, LayoutDashboard, TrendingDown, TrendingUp, Goal } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { BrandLogo } from './BrandLogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  return (
    <header className="h-16 px-4 md:px-10 lg:px-20 flex items-center justify-between transition-colors duration-300">
      {/* Logo with modern custom mark */}
      <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer">
        <BrandLogo size={36} className="group-hover:scale-105 transition-transform" />
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-titles dark:text-foreground">
            Fin<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Track</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-action/10 text-action dark:bg-blue-500/15 dark:text-blue-400 border border-action/20 dark:border-blue-500/20">
            PRO
          </span>
        </div>
      </Link>

      {/* Right side: Icons and Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <DesktopMenu />
        <MobileMenu />
      </div>
    </header>
  );
}

// ----------------------------------------------------------------------
// DESKTOP MENU COMPONENT
// ----------------------------------------------------------------------

function DesktopMenu() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, currency, setCurrency, translate } = useSettings();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="hidden md:flex items-center gap-2">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="p-2.5 rounded-xl text-secondary-titles hover:text-action hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer"
      >
        {mounted && theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            aria-label="Settings"
            className="p-2.5 rounded-xl text-secondary-titles hover:text-action hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer outline-none flex items-center gap-1.5"
          >
            <Globe size={19} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{language}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>{translate('header.language')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setLanguage('en')}>
              <span>English</span>
              {language === 'en' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('es')}>
              <span>Español</span>
              {language === 'es' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{translate('header.currency')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setCurrency('USD')}>
              <span>USD ($)</span>
              {currency === 'USD' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrency('EUR')}>
              <span>EUR (€)</span>
              {currency === 'EUR' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrency('GBP')}>
              <span>GBP (£)</span>
              {currency === 'GBP' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrency('CRC')}>
              <span>CRC (₡)</span>
              {currency === 'CRC' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Avatar (Desktop Only) */}
      <Avatar size="lg" className="cursor-pointer hidden md:flex">
        <AvatarImage src="https://github.com/shadcn.png" alt="TonyBrTs" />
        <AvatarFallback className="bg-action text-white font-medium text-sm">TA</AvatarFallback>
      </Avatar>
    </div>
  );
}

// ----------------------------------------------------------------------
// MOBILE MENU COMPONENT
// ----------------------------------------------------------------------

function MobileMenu() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, currency, setCurrency, translate } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const navItems = [
    {
      name: translate('nav.summary') || 'Resumen',
      href: '/',
      icon: <LayoutDashboard size={18} className="text-blue-500" />,
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    {
      name: translate('nav.expenses') || 'Gastos',
      href: '/expenses',
      icon: <TrendingDown size={18} className="text-rose-500" />,
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    },
    {
      name: translate('nav.income') || 'Ingresos',
      href: '/incomes',
      icon: <TrendingUp size={18} className="text-emerald-500" />,
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    {
      name: translate('nav.goals') || 'Metas',
      href: '/goals',
      icon: <Goal size={18} className="text-purple-500" />,
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    },
  ];

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/60 text-foreground transition-all active:scale-95 cursor-pointer shadow-xs"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <Sheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={translate('header.settings') || 'Ajustes'}
      >
        <div className="flex flex-col gap-5 pb-6">
          {/* User Profile Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-secondary/50 dark:bg-card/60 border border-border/60 rounded-2xl">
            <Avatar size="lg" className="ring-2 ring-blue-500/30">
              <AvatarImage src="https://github.com/shadcn.png" alt="TonyBrTs" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm">
                TA
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-foreground font-bold text-sm truncate">TonyBrTs</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-muted-foreground text-xs truncate">tony@example.com</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1 block">
              {translate('nav.summary') ? 'Navegación' : 'Navigation'}
            </span>
            {navItems.map((nav) => {
              const isActive = pathname === nav.href;
              return (
                <Link
                  key={nav.href}
                  href={nav.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-action/10 dark:bg-blue-500/15 text-action dark:text-blue-400 border border-action/20 dark:border-blue-500/30'
                      : 'hover:bg-secondary/70 text-foreground border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${nav.bg}`}>
                      {nav.icon}
                    </div>
                    <span>{nav.name}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-action dark:bg-blue-400 mr-2" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="h-px bg-border/60 w-full" />

          {/* Theme Toggle */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
              Tema
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/60 dark:bg-card/50 rounded-xl border border-border/50">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mounted && theme === 'light'
                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun size={15} className="text-amber-500" />
                <span>Claro</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mounted && theme === 'dark'
                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon size={15} className="text-blue-400" />
                <span>Oscuro</span>
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
              {translate('header.language')}
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/60 dark:bg-card/50 rounded-xl border border-border/50">
              <button
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'es'
                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Español
              </button>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
              {translate('header.currency')}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['USD', 'EUR', 'GBP', 'CRC'] as const).map((curr) => {
                const isSelected = currency === curr;
                return (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-action/10 dark:bg-blue-500/15 border-action/40 dark:border-blue-500/40 text-action dark:text-blue-400 shadow-xs'
                        : 'bg-card/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    {curr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
