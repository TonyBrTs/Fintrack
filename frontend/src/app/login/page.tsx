"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Sun, Moon, Globe } from "lucide-react";
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  UpdatePasswordForm,
} from "@/components/auth/forms";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
  } = useAuth();
  const { language, setLanguage } = useSettings();
  const { theme, setTheme } = useTheme();

  const [mode, setMode] = useState<
    "login" | "register" | "forgot_password" | "update_password"
  >("login");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for password recovery hash on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        hash.includes("type=recovery") ||
        search.includes("reset_password=true")
      ) {
        setMode("update_password");
      }
    }
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot_password";
  const isUpdatePassword = mode === "update_password";

  const isEs = language === "es";

  return (
    <div className="bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white antialiased relative overflow-x-hidden transition-colors duration-300">
      {/* Ambient Glow Behind Central Area */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,rgba(99,102,241,0.04)_45%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,rgba(99,102,241,0.03)_45%,transparent_70%)] blur-[70px] pointer-events-none z-0"
      />

      {/* Top Header */}
      <header className="w-full relative z-20 border-b border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#070b14]/90 backdrop-blur-xl px-4 lg:px-8 py-3.5 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <BrandLogo variant="full" size={28} priority />
          </div>

          {/* Right Header Controls: Theme & Language */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
              className="p-2 text-slate-700 hover:text-blue-600 bg-slate-100/90 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-blue-400 dark:bg-[#0b101d] dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl transition cursor-pointer shadow-xs"
            >
              {mounted && theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100/90 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-blue-400 dark:bg-[#0b101d] dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl transition cursor-pointer shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{language.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-4 sm:my-8">
        {/* Solid Rich Dark Card Container */}
        <div className="w-full max-w-[440px] rounded-3xl p-6 sm:p-8 relative z-10 transition-all bg-white dark:bg-[#0b101d] border border-slate-200/90 dark:border-slate-800/90 shadow-xl dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.95)]">
          {/* Brand Logo Emblem */}
          <div className="flex justify-center mb-5">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-3xl blur-lg opacity-40 dark:opacity-60 group-hover:opacity-75 transition duration-300" />
              <BrandLogo
                size={64}
                className="relative shadow-xl dark:shadow-2xl rounded-2xl"
                priority
              />
            </div>
          </div>

          {/* Card Titles */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isLogin &&
                (isEs ? "Inicia Sesión en FinTrack" : "Sign In to FinTrack")}
              {isRegister &&
                (isEs ? "Crea tu Cuenta" : "Create Your Account")}
              {isForgotPassword &&
                (isEs ? "Recuperar Contraseña" : "Reset Password")}
              {isUpdatePassword &&
                (isEs ? "Nueva Contraseña" : "Create New Password")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isLogin &&
                (isEs
                  ? "Mantén tus finanzas en orden y controla tus ingresos y gastos"
                  : "Keep your finances in order and manage your income and expenses")}
              {isRegister &&
                (isEs
                  ? "Lleva el control de tus ingresos, gastos y metas de ahorro en un solo lugar"
                  : "Track your income, expenses, and savings goals all in one place")}
              {isForgotPassword &&
                (isEs
                  ? "Ingresa tu correo para recuperar el acceso a tus finanzas"
                  : "Enter your email to regain access to your account")}
              {isUpdatePassword &&
                (isEs
                  ? "Ingresa tu nueva contraseña para proteger tu cuenta"
                  : "Enter your new password to protect your account")}
            </p>
          </div>

          {/* Render Active Form Component */}
          {isLogin && (
            <LoginForm
              onSuccess={() => router.replace("/")}
              onForgotPassword={() => setMode("forgot_password")}
              onSwitchToRegister={() => setMode("register")}
              signInWithEmail={signInWithEmail}
              signInWithGoogle={signInWithGoogle}
              isEs={isEs}
            />
          )}

          {isRegister && (
            <RegisterForm
              onSuccess={(needsConfirmation) => {
                if (needsConfirmation) {
                  setMode("login");
                } else {
                  router.replace("/");
                }
              }}
              onSwitchToLogin={() => setMode("login")}
              signUpWithEmail={signUpWithEmail}
              signInWithGoogle={signInWithGoogle}
              isEs={isEs}
            />
          )}

          {isForgotPassword && (
            <ForgotPasswordForm
              onBackToLogin={() => setMode("login")}
              resetPasswordForEmail={resetPasswordForEmail}
              isEs={isEs}
            />
          )}

          {isUpdatePassword && (
            <UpdatePasswordForm
              onSuccess={() => {
                setMode("login");
                router.replace("/");
              }}
              updatePassword={updatePassword}
              isEs={isEs}
            />
          )}
        </div>
      </main>
    </div>
  );
}
