"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { MainNavigation } from "@/components/layout/MainNavigation";
import { canAccessVault } from "@/lib/vaultAccess";
import { PageLoadingState } from "@/components/ui/PageLoadingState";
import { useSettings } from "@/contexts/SettingsContext";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { language, translate } = useSettings();
  const showVault = canAccessVault(user?.email);
  const isVaultRoute = pathname === "/vault" || pathname.startsWith("/vault/");

  const isAuthRoute = pathname === "/login";
  const isPublicUtilityRoute =
    pathname === "/version" || pathname === "/commit" || pathname === "/health";

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isAuthRoute && !isPublicUtilityRoute) {
        router.replace("/login");
      } else if (user && (isAuthRoute || (isVaultRoute && !showVault))) {
        router.replace("/");
      }
    }
  }, [user, isLoading, isAuthRoute, isPublicUtilityRoute, isVaultRoute, showVault, router]);

  // Render standalone public utility pages (/version, /commit, /health) immediately without splash or navbars
  if (isPublicUtilityRoute) {
    return <>{children}</>;
  }

  // Initial session loading splash
  if (isLoading) {
    return (
      <PageLoadingState
        fullscreen
        message={language === "es" ? "Cargando sesión segura..." : "Loading secure session..."}
      />
    );
  }

  // Unauthenticated on /login: Render auth page directly (no navigation bars)
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Unauthenticated trying to access protected page: Waiting for router.replace("/login")
  if (!user) {
    return <PageLoadingState fullscreen message={translate("common.loading")} />;
  }

  return (
    <>
      <div className="print:hidden sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <Header showVault={showVault} />
      </div>
      <main className="w-full max-w-360 mx-auto px-4 md:px-10 lg:px-20 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12 pt-3 md:pt-6 print:p-0 print:m-0 print:max-w-none print:w-full">
        {(!isVaultRoute || showVault) && children}
      </main>
      <MainNavigation showVault={showVault} variant="mobile" />
    </>
  );
}
