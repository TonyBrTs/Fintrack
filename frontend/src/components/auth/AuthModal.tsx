"use client";

import React, { useState, useEffect } from "react";
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
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
        setAuthModalMode("update_password");
        openAuthModal("update_password");
      }
    }
  }, [setAuthModalMode, openAuthModal]);

  const getFriendlyAuthError = (msg?: string): string => {
    if (!msg)
      return isEs
        ? "Ocurrió un inconveniente. Por favor, intenta de nuevo."
        : "An error occurred. Please try again.";
    const lower = msg.toLowerCase();
    if (
      lower.includes("invalid login credentials") ||
      lower.includes("invalid credentials")
    ) {
      return isEs
        ? "Correo electrónico o contraseña incorrectos."
        : "Invalid email or password.";
    }
    if (
      lower.includes("user already registered") ||
      lower.includes("already registered")
    ) {
      return isEs
        ? "Ya existe una cuenta registrada con este correo electrónico."
        : "An account already exists with this email.";
    }
    if (lower.includes("email not confirmed")) {
      return isEs
        ? "Por favor confirma tu correo electrónico antes de ingresar."
        : "Please confirm your email address before signing in.";
    }
    if (
      lower.includes("password should be at least") ||
      lower.includes("least 6 characters")
    ) {
      return isEs
        ? "La contraseña debe tener al menos 6 caracteres."
        : "Password must be at least 6 characters.";
    }
    if (lower.includes("rate limit") || lower.includes("too many requests")) {
      return isEs
        ? "Demasiados intentos en poco tiempo. Por favor espera un momento."
        : "Too many attempts. Please wait a moment.";
    }
    if (lower.includes("network") || lower.includes("failed to fetch")) {
      return isEs
        ? "No se pudo conectar con el servicio. Verifica tu conexión a internet."
        : "Could not reach authentication service.";
    }
    return msg;
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(getFriendlyAuthError(error.message));
      }
    } catch {
      toast.error(
        isEs
          ? "No se pudo conectar con Google. Por favor, intenta nuevamente."
          : "Could not connect to Google. Please try again."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mode: Update Password (from recovery link)
    if (isUpdatePassword) {
      if (!password) {
        toast.error(
          isEs
            ? "Por favor ingresa una nueva contraseña"
            : "Please enter a new password"
        );
        return;
      }
      if (password.length < 6) {
        toast.error(
          isEs
            ? "La contraseña debe tener al menos 6 caracteres"
            : "Password must be at least 6 characters"
        );
        return;
      }
      if (password !== confirmPassword) {
        toast.error(
          isEs ? "Las contraseñas no coinciden" : "Passwords do not match"
        );
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await updatePassword(password);
        if (error) {
          toast.error(getFriendlyAuthError(error.message));
        } else {
          toast.success(
            isEs
              ? "¡Contraseña actualizada con éxito!"
              : "Password updated successfully!"
          );
          setPassword("");
          setConfirmPassword("");
          closeAuthModal();
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Mode: Forgot Password
    if (isForgotPassword) {
      if (!email) {
        toast.error(
          isEs
            ? "Por favor ingresa tu correo electrónico"
            : "Please enter your email address"
        );
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          toast.error(getFriendlyAuthError(error.message));
        } else {
          toast.success(
            isEs
              ? "¡Enlace enviado! Revisa tu bandeja de entrada para restablecer tu contraseña."
              : "Recovery link sent! Check your inbox to reset your password."
          );
          openAuthModal("login");
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Mode: Login / Register
    if (!email || !password) {
      toast.error(
        isEs
          ? "Por favor completa todos los campos"
          : "Please complete all fields"
      );
      return;
    }

    if (password.length < 6) {
      toast.error(
        isEs
          ? "La contraseña debe tener al menos 6 caracteres"
          : "Password must be at least 6 characters"
      );
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
        const { error, needsEmailConfirmation } = await signUpWithEmail(
          email,
          password,
          fullName
        );
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
          toast.success(
            isEs
              ? "¡Cuenta creada exitosamente!"
              : "Account created successfully!"
          );
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
    <Dialog
      open={isAuthModalOpen}
      onOpenChange={(open) => !open && closeAuthModal()}
    >
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border border-border/70 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-2xl">
        {/* Top Header Banner */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
            {isForgotPassword || isUpdatePassword ? (
              <KeyRound size={24} />
            ) : (
              <ShieldCheck size={24} />
            )}
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {isLogin && (isEs ? "Iniciar Sesión" : "Welcome Back")}
              {isRegister &&
                (isEs ? "Crear Cuenta en FinTrack" : "Create your Account")}
              {isForgotPassword &&
                (isEs ? "Recuperar Contraseña" : "Reset Password")}
              {isUpdatePassword &&
                (isEs ? "Nueva Contraseña" : "Create New Password")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {isLogin &&
                (isEs
                  ? "Accede a tus finanzas, transacciones y metas personales"
                  : "Access your finances, transactions and personal goals")}
              {isRegister &&
                (isEs
                  ? "Tus datos financieros aislados y encriptados de extremo a extremo"
                  : "Your financial data strictly isolated and protected")}
              {isForgotPassword &&
                (isEs
                  ? "Ingresa tu correo para recibir un enlace seguro de recuperación"
                  : "Enter your email to receive a secure recovery link")}
              {isUpdatePassword &&
                (isEs
                  ? "Ingresa tu nueva contraseña para volver a acceder a tu cuenta"
                  : "Enter your new password to regain access to your account")}
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switch Tabs (Only shown in login/register) */}
          {(isLogin || isRegister) && (
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
                  isRegister
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isEs ? "Registrarse" : "Register"}
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4">
          {/* Google Sign-In Button (shown in login and register) */}
          {(isLogin || isRegister) && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full h-11 flex items-center justify-center gap-3 bg-card hover:bg-secondary/80 text-foreground font-semibold text-sm rounded-xl border border-border/80 shadow-xs transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>
                  {isEs ? "Continuar con Google" : "Continue with Google"}
                </span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-border/60" />
                <span className="absolute bg-card px-2.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {isEs ? "o con correo" : "or with email"}
                </span>
              </div>
            </>
          )}

          {/* Full Name (Only register) */}
          <AnimatePresence mode="wait">
            {isRegister && (
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

          {/* Email (Login, Register, Forgot Password) */}
          {!isUpdatePassword && (
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
          )}

          {/* Password (Login, Register, Update Password) */}
          {!isForgotPassword && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock size={13} className="text-muted-foreground" />
                  {isUpdatePassword
                    ? isEs
                      ? "Nueva Contraseña"
                      : "New Password"
                    : isEs
                    ? "Contraseña"
                    : "Password"}
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => openAuthModal("forgot_password")}
                    className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 hover:underline cursor-pointer"
                  >
                    {isEs ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
                  </button>
                )}
                {isRegister && (
                  <span className="text-[10px] text-muted-foreground">
                    {isEs ? "Mín. 6 caracteres" : "Min. 6 chars"}
                  </span>
                )}
              </div>
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
          )}

          {/* Confirm Password (Only Update Password) */}
          {isUpdatePassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock size={13} className="text-muted-foreground" />
                {isEs ? "Confirmar Nueva Contraseña" : "Confirm New Password"}
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary/40 border-border/70 focus:border-blue-500 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-[0.99] mt-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isLogin && (isEs ? "Iniciar Sesión" : "Sign In")}
            {isRegister && (isEs ? "Crear Cuenta Gratuita" : "Create Free Account")}
            {isForgotPassword &&
              (isEs ? "Enviar Enlace de Recuperación" : "Send Recovery Link")}
            {isUpdatePassword &&
              (isEs ? "Guardar Nueva Contraseña" : "Update Password")}
          </Button>

          {/* Bottom Switch Links */}
          {(isLogin || isRegister) && (
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
                {isLogin
                  ? isEs
                    ? "Regístrate aquí"
                    : "Sign up here"
                  : isEs
                  ? "Inicia sesión"
                  : "Sign in"}
              </button>
            </p>
          )}

          {isForgotPassword && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ArrowLeft size={13} />
                <span>{isEs ? "Volver a Iniciar Sesión" : "Back to Sign In"}</span>
              </button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

