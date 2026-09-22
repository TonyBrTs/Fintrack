"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  UpdatePasswordForm,
} from "./forms";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    setAuthModalMode,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
  } = useAuth();
  const { language } = useSettings();

  const isLogin = authModalMode === "login";
  const isRegister = authModalMode === "register";
  const isForgotPassword = authModalMode === "forgot_password";
  const isUpdatePassword = authModalMode === "update_password";

  const isEs = language === "es";

  // Check for password recovery hash on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        hash.includes("type=recovery") ||
        search.includes("reset_password=true")
      ) {
        openAuthModal("update_password");
      }
    }
  }, [openAuthModal]);

  return (
    <Dialog
      open={isAuthModalOpen}
      onOpenChange={(open) => !open && closeAuthModal()}
    >
      <DialogContent className="sm:max-w-[440px] p-6 sm:p-8 bg-white dark:bg-[#0b101d] border-slate-200/90 dark:border-slate-800/90 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Brand Logo Emblem */}
        <div className="flex justify-center mb-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-2xl blur-md opacity-40 dark:opacity-60 group-hover:opacity-75 transition duration-300" />
            <BrandLogo
              size={48}
              className="relative shadow-xl rounded-xl"
              priority
            />
          </div>
        </div>

        {/* Dialog Header */}
        <DialogHeader className="text-center space-y-1.5 pb-2">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isLogin &&
              (isEs ? "Inicia Sesión en FinTrack" : "Sign In to FinTrack")}
            {isRegister &&
              (isEs ? "Crea tu Cuenta" : "Create Your Account")}
            {isForgotPassword &&
              (isEs ? "Recuperar Contraseña" : "Reset Password")}
            {isUpdatePassword &&
              (isEs ? "Nueva Contraseña" : "Create New Password")}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {isLogin &&
              (isEs
                ? "Mantén tus finanzas en orden y controla tus ingresos y gastos"
                : "Keep your finances in order and manage your income and expenses")}
            {isRegister &&
              (isEs
                ? "Lleva el control de tus finanzas personales y metas en un solo lugar"
                : "Track your income, expenses, and savings goals all in one place")}
            {isForgotPassword &&
              (isEs
                ? "Ingresa tu correo para recuperar el acceso a tus finanzas"
                : "Enter your email to regain access to your account")}
            {isUpdatePassword &&
              (isEs
                ? "Ingresa tu nueva contraseña para proteger tu cuenta"
                : "Enter your new password to protect your account")}
          </DialogDescription>
        </DialogHeader>

        {/* Render Active Form Component */}
        <div className="mt-2">
          {isLogin && (
            <LoginForm
              onSuccess={closeAuthModal}
              onForgotPassword={() => setAuthModalMode("forgot_password")}
              onSwitchToRegister={() => setAuthModalMode("register")}
              signInWithEmail={signInWithEmail}
              signInWithGoogle={async () => {
                const res = await signInWithGoogle();
                if (!res.error) closeAuthModal();
                return res;
              }}
              isEs={isEs}
            />
          )}

          {isRegister && (
            <RegisterForm
              onSuccess={(needsConfirmation) => {
                if (needsConfirmation) {
                  setAuthModalMode("login");
                } else {
                  closeAuthModal();
                }
              }}
              onSwitchToLogin={() => setAuthModalMode("login")}
              signUpWithEmail={signUpWithEmail}
              signInWithGoogle={async () => {
                const res = await signInWithGoogle();
                if (!res.error) closeAuthModal();
                return res;
              }}
              isEs={isEs}
            />
          )}

          {isForgotPassword && (
            <ForgotPasswordForm
              onBackToLogin={() => setAuthModalMode("login")}
              resetPasswordForEmail={resetPasswordForEmail}
              isEs={isEs}
            />
          )}

          {isUpdatePassword && (
            <UpdatePasswordForm
              onSuccess={() => {
                setAuthModalMode("login");
                closeAuthModal();
              }}
              updatePassword={updatePassword}
              isEs={isEs}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
