"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Shield, Lock, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, openAuthModal } = useAuth();
  const { language } = useSettings();
  const isEs = language === "es";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {isEs ? "Cargando sesión segura..." : "Verifying secure session..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center min-h-[65vh] px-4 py-12 text-center"
      >
        <div className="relative p-1 rounded-3xl bg-gradient-to-b from-blue-500/20 via-indigo-500/10 to-transparent max-w-lg w-full border border-border/70 shadow-2xl backdrop-blur-xl">
          <div className="p-8 sm:p-10 bg-card/90 rounded-[22px] flex flex-col items-center">
            {/* Glowing Shield Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                <Shield size={32} />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {isEs ? "Organiza tus Finanzas" : "Organize Your Finances"}
            </h2>

            <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
              {isEs
                ? "Lleva el registro de tus ingresos y gastos, define metas de ahorro y toma el control de tu dinero."
                : "Track your income and expenses, set savings goals, and take control of your money."}
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-6 w-full text-left">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                <TrendingUp size={15} className="text-blue-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground">
                  {isEs ? "Control de ingresos y gastos" : "Income & expense tracking"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                <Lock size={15} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground">
                  {isEs ? "Finanzas 100% privadas" : "100% private finances"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <Button
                onClick={() => openAuthModal("login")}
                variant="outline"
                className="flex-1 h-11 rounded-xl font-bold border-border/80 hover:bg-secondary cursor-pointer"
              >
                {isEs ? "Iniciar Sesión" : "Sign In"}
              </Button>
              <Button
                onClick={() => openAuthModal("register")}
                className="flex-1 h-11 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{isEs ? "Crear Cuenta" : "Get Started"}</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
