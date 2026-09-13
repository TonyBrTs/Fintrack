"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { SubNavbar } from "@/components/layout/SubNavbar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Loader2 } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isAuthRoute = pathname === "/login";

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isAuthRoute) {
        router.replace("/login");
      } else if (user && isAuthRoute) {
        router.replace("/");
      }
    }
  }, [user, isLoading, isAuthRoute, router]);

  // Initial session loading splash
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080c15] text-slate-100">
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-60 animate-pulse" />
            <BrandLogo size={56} className="relative shadow-2xl" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-xs font-medium text-slate-400 tracking-wide">
              Cargando sesión segura...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated on /login: Render auth page directly (no navigation bars)
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Unauthenticated trying to access protected page: Waiting for router.replace("/login")
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080c15]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Authenticated: Render full application with Header, SubNavbar, Main Content and BottomNavbar
  return (
    <>
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-background/80 border-b border-border/60 transition-colors duration-300">
        <Header />
        <SubNavbar />
      </div>
      <main className="w-full max-w-360 mx-auto px-4 md:px-10 lg:px-20 pb-24 md:pb-12 pt-3 md:pt-6">
        {children}
      </main>
      <BottomNavbar />
    </>
  );
}
