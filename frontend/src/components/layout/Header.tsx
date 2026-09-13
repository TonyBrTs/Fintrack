'use client';

import { Sheet } from '@/components/ui/Sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useAuth } from '@/contexts/AuthContext';
import { Check, Globe, Menu, Moon, Sun, LayoutDashboard, TrendingDown, TrendingUp, Goal, LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

import { BrandLogo } from './BrandLogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  return (
    <header className="h-16 px-4 md:px-10 lg:px-20 flex items-center justify-between transition-colors duration-300">
      {/* Logo with theme-aware full mark */}
      <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer">
        <BrandLogo variant="full" size={32} priority className="group-hover:opacity-90 transition-opacity" />
        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-action/10 text-action dark:bg-blue-500/15 dark:text-blue-400 border border-action/20 dark:border-blue-500/20">
          PRO
        </span>
      </Link>

      {/* Right side: Icons, Auth and Avatar */}
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
  const { user, signOut, openAuthModal } = useAuth();
  const mounted = useHydrated();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isEs = language === 'es';

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'FT';

  const displayName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split('@')[0] ||
    'Usuario';

  return (
    <div className="hidden md:flex items-center gap-2">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="p-2.5 rounded-xl text-slate-700 hover:text-blue-600 bg-slate-100/90 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-blue-400 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer shadow-xs"
      >
        {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            aria-label="Settings"
            className="px-3 py-2 rounded-xl text-slate-700 hover:text-blue-600 bg-slate-100/90 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-blue-400 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer outline-none flex items-center gap-1.5 shadow-xs"
          >
            <Globe size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{language}</span>
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

      {/* User Profile or Login Button */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 pl-1 cursor-pointer">
              <Avatar size="lg" className="ring-2 ring-blue-500/30 hover:ring-blue-500/60 transition-all">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="end">
            <div className="px-3 py-2">
              <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-rose-500 hover:text-rose-600 cursor-pointer focus:text-rose-600 focus:bg-rose-500/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isEs ? 'Cerrar Sesión' : 'Sign Out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          onClick={() => openAuthModal('login')}
          className="ml-1 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <LogIn size={14} />
          <span>{isEs ? 'Iniciar Sesión' : 'Sign In'}</span>
        </button>
      )}
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
  const { user, signOut, openAuthModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mounted = useHydrated();

  const isEs = language === 'es';

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'FT';

  const displayName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split('@')[0] ||
    (isEs ? 'Invitado' : 'Guest');

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
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-100 transition-all active:scale-95 cursor-pointer shadow-xs"
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
          {user ? (
            <div className="flex items-center justify-between p-3.5 bg-secondary/50 dark:bg-card/60 border border-border/60 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar size="lg" className="ring-2 ring-blue-500/30 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground font-bold text-sm truncate">{displayName}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  </div>
                  <span className="text-muted-foreground text-xs truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer shrink-0"
                title={isEs ? "Cerrar sesión" : "Sign out"}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl flex flex-col gap-2.5 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center mx-auto">
                <UserIcon size={20} />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {isEs ? "Inicia sesión para proteger tus finanzas" : "Sign in to protect your finances"}
              </p>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isEs ? "Iniciar Sesión" : "Sign In"}
              </button>
            </div>
          )}

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
