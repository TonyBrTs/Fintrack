"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, signInWithEmail, signUpWithEmail } = useAuth();
  const { language } = useSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = authModalMode === "login";

  const isEs = language === "es";

  const getFriendlyAuthError = (msg?: string): string => {
    if (!msg) return isEs ? "Ocurrió un inconveniente. Por favor, intenta de nuevo." : "An error occurred. Please try again.";
    const lower = msg.toLowerCase();
    if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
      return isEs ? "Correo electrónico o contraseña incorrectos." : "Invalid email or password.";
    }
    if (lower.includes("user already registered") || lower.includes("already registered")) {
      return isEs ? "Ya existe una cuenta registrada con este correo electrónico." : "An account already exists with this email.";
    }
    if (lower.includes("email not confirmed")) {
      return isEs ? "Por favor confirma tu correo electrónico antes de ingresar." : "Please confirm your email address before signing in.";
    }
    if (lower.includes("password should be at least") || lower.includes("least 6 characters")) {
      return isEs ? "La contraseña debe tener al menos 6 caracteres." : "Password must be at least 6 characters.";
    }
    if (lower.includes("rate limit") || lower.includes("too many requests")) {
      return isEs ? "Demasiados intentos en poco tiempo. Por favor espera un momento." : "Too many attempts. Please wait a moment.";
    }
    if (lower.includes("network") || lower.includes("failed to fetch")) {
      return isEs ? "No se pudo conectar con el servicio. Verifica tu conexión a internet." : "Could not reach authentication service.";
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(isEs ? "Por favor completa todos los campos" : "Please complete all fields");
      return;
    }

    if (password.length < 6) {
      toast.error(isEs ? "La contraseña debe tener al menos 6 caracteres" : "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast.error(getFriendlyAuthError(error.message));
        } else {
          toast.success(isEs ? "¡Bienvenido de nuevo!" : "Welcome back!");
          setEmail("");
          setPassword("");
        }
      } else {
        const { error, needsEmailConfirmation } = await signUpWithEmail(email, password, fullName);
        if (error) {
          toast.error(getFriendlyAuthError(error.message));
        } else if (needsEmailConfirmation) {
          toast.info(
            isEs
              ? "Revisa tu correo para confirmar tu cuenta y acceder."
              : "Check your email to confirm your account and sign in."
          );
          closeAuthModal();
        } else {
          toast.success(isEs ? "¡Cuenta creada exitosamente!" : "Account created successfully!");
          setEmail("");
          setPassword("");
          setFullName("");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border border-border/70 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-2xl">
        {/* Top Header Banner */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
            <ShieldCheck size={24} />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {isLogin
                ? isEs
                  ? "Iniciar Sesión"
                  : "Welcome Back"
                : isEs
                ? "Crear Cuenta en FinTrack"
                : "Create your Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {isLogin
                ? isEs
                  ? "Accede a tus finanzas, transacciones y metas personales"
                  : "Access your finances, transactions and personal goals"
                : isEs
                ? "Tus datos financieros aislados y encriptados de extremo a extremo"
                : "Your financial data strictly isolated and protected"}
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switch Tabs */}
          <div className="flex p-1 mt-4 bg-secondary/80 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isLogin
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEs ? "Iniciar Sesión" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isLogin
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEs ? "Registrarse" : "Register"}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User size={13} className="text-muted-foreground" />
                  {isEs ? "Nombre Completo" : "Full Name"}
                </label>
                <Input
                  type="text"
                  placeholder={isEs ? "Ej. Antonio Castro" : "e.g. John Doe"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary/40 border-border/70 focus:border-blue-500 rounded-xl"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail size={13} className="text-muted-foreground" />
              {isEs ? "Correo Electrónico" : "Email Address"}
            </label>
            <Input
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary/40 border-border/70 focus:border-blue-500 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock size={13} className="text-muted-foreground" />
                {isEs ? "Contraseña" : "Password"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isEs ? "Mín. 6 caracteres" : "Min. 6 chars"}
              </span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary/40 border-border/70 focus:border-blue-500 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-[0.99] mt-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isLogin
              ? isEs
                ? "Iniciar Sesión"
                : "Sign In"
              : isEs
              ? "Crear Cuenta Gratuita"
              : "Create Free Account"}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground mt-2">
            {isLogin
              ? isEs
                ? "¿No tienes cuenta todavía? "
                : "Don't have an account yet? "
              : isEs
              ? "¿Ya tienes cuenta? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => openAuthModal(isLogin ? "register" : "login")}
              className="font-bold text-blue-500 hover:text-blue-600 hover:underline cursor-pointer ml-1"
            >
              {isLogin ? (isEs ? "Regístrate aquí" : "Sign up here") : (isEs ? "Inicia sesión" : "Sign in")}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
