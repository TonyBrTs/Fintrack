"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth, type AuthModalMode } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import {
  Mail,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/layout/BrandLogo";

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

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
  const [errors, setErrors] = useState<FormErrors>({});

  const isLogin = authModalMode === "login";
  const isRegister = authModalMode === "register";
  const isForgotPassword = authModalMode === "forgot_password";
  const isUpdatePassword = authModalMode === "update_password";

  const isEs = language === "es";

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, text: "", color: "bg-slate-700" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      return {
        level: 1,
        text: isEs ? "Débil" : "Weak",
        textColor: "text-rose-400",
        barColor: "bg-rose-500",
      };
    }
    if (score === 2 || score === 3) {
      return {
        level: 2,
        text: isEs ? "Media" : "Medium",
        textColor: "text-amber-400",
        barColor: "bg-amber-500",
      };
    }
    return {
      level: 3,
      text: isEs ? "Fuerte" : "Strong",
      textColor: "text-emerald-400",
      barColor: "bg-emerald-400",
    };
  }, [password, isEs]);

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

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const getFriendlyAuthError = (
    msg?: string
  ): { message: string; field?: keyof FormErrors } => {
    if (!msg) {
      return {
        message: isEs
          ? "Ocurrió un inconveniente. Por favor, intenta de nuevo."
          : "An error occurred. Please try again.",
      };
    }
    const lower = msg.toLowerCase();
    if (
      lower.includes("invalid login credentials") ||
      lower.includes("invalid credentials") ||
      lower.includes("invalid username or password")
    ) {
      return {
        message: isEs
          ? "Correo electrónico o contraseña incorrectos."
          : "Invalid email or password.",
        field: "password",
      };
    }
    if (
      lower.includes("user already registered") ||
      lower.includes("already registered") ||
      lower.includes("user_already_exists") ||
      lower.includes("already in use")
    ) {
      return {
        message: isEs
          ? "Ya existe una cuenta registrada con este correo electrónico. Inicia sesión o recupera tu contraseña."
          : "An account already exists with this email. Please sign in or reset your password.",
        field: "email",
      };
    }
    if (lower.includes("email not confirmed")) {
      return {
        message: isEs
          ? "Por favor confirma tu correo electrónico antes de ingresar."
          : "Please confirm your email address before signing in.",
        field: "email",
      };
    }
    if (
      lower.includes("password should be at least") ||
      lower.includes("password is too short")
    ) {
      if (isLogin) {
        return {
          message: isEs
            ? "Correo electrónico o contraseña incorrectos."
            : "Invalid email or password.",
          field: "password",
        };
      }
      return {
        message: isEs
          ? "La contraseña debe tener al menos 6 caracteres."
          : "Password must be at least 6 characters.",
        field: "password",
      };
    }
    if (lower.includes("rate limit") || lower.includes("too many requests")) {
      return {
        message: isEs
          ? "Demasiados intentos seguidos. Por favor espera unos momentos antes de reintentar."
          : "Too many requests. Please wait a moment before trying again.",
      };
    }
    return { message: msg };
  };

  const switchModalMode = (mode: AuthModalMode) => {
    setErrors({});
    setAuthModalMode(mode);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(getFriendlyAuthError(error.message).message);
      }
    } catch {
      toast.error(
        isEs
          ? "No fue posible conectar con Google. Por favor, intenta de nuevo."
          : "Could not connect to Google. Please try again."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    // 1. Validation for Update Password
    if (isUpdatePassword) {
      if (!password) {
        newErrors.password = isEs
          ? "Por favor escribe una nueva contraseña."
          : "Please enter a new password.";
      } else if (password.length < 6) {
        newErrors.password = isEs
          ? "La contraseña debe tener al menos 6 caracteres."
          : "Password must be at least 6 characters.";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = isEs
          ? "Por favor confirma tu nueva contraseña."
          : "Please confirm your new password.";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = isEs
          ? "Las contraseñas no coinciden."
          : "Passwords do not match.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error(Object.values(newErrors)[0]);
        return;
      }

      setErrors({});
      setIsLoading(true);
      try {
        const { error } = await updatePassword(password);
        if (error) {
          const friendly = getFriendlyAuthError(error.message);
          toast.error(friendly.message);
          if (friendly.field) setErrors({ [friendly.field]: friendly.message });
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

    // 2. Validation for Forgot Password
    if (isForgotPassword) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        newErrors.email = isEs
          ? "Por favor ingresa tu correo electrónico."
          : "Please enter your email address.";
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        newErrors.email = isEs
          ? "Ingresa un correo electrónico válido."
          : "Please enter a valid email address.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error(Object.values(newErrors)[0]);
        return;
      }

      setErrors({});
      setIsLoading(true);
      try {
        const { error } = await resetPasswordForEmail(trimmedEmail);
        if (error) {
          const friendly = getFriendlyAuthError(error.message);
          toast.error(friendly.message);
          if (friendly.field) setErrors({ [friendly.field]: friendly.message });
        } else {
          toast.success(
            isEs
              ? "¡Enlace enviado! Revisa tu correo para restablecer tu contraseña."
              : "Recovery link sent! Check your inbox to reset your password."
          );
          switchModalMode("login");
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. Validation for Login & Register
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = isEs
        ? "Por favor ingresa tu correo electrónico."
        : "Please enter your email address.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = isEs
        ? "Ingresa un formato de correo válido (ej: usuario@correo.com)."
        : "Please enter a valid email format (e.g. user@domain.com).";
    }

    if (isRegister) {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        newErrors.fullName = isEs
          ? "Por favor ingresa tu nombre completo."
          : "Please enter your full name.";
      } else if (trimmedName.length < 2) {
        newErrors.fullName = isEs
          ? "El nombre debe tener al menos 2 caracteres."
          : "Name must be at least 2 characters.";
      }
    }

    if (!password) {
      newErrors.password = isEs
        ? "Por favor ingresa tu contraseña."
        : "Please enter your password.";
    } else if (isRegister && password.length < 6) {
      newErrors.password = isEs
        ? "La contraseña debe tener al menos 6 caracteres."
        : "Password must be at least 6 characters.";
    }

    if (isRegister) {
      if (!confirmPassword) {
        newErrors.confirmPassword = isEs
          ? "Por favor confirma tu contraseña."
          : "Please confirm your password.";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = isEs
          ? "Las contraseñas no coinciden."
          : "Passwords do not match.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(trimmedEmail, password);
        if (error) {
          const friendly = getFriendlyAuthError(error.message);
          toast.error(friendly.message);
          if (friendly.field) {
            setErrors({ [friendly.field]: friendly.message });
          }
        } else {
          toast.success(isEs ? "¡Bienvenido de nuevo!" : "Welcome back!");
          setEmail("");
          setPassword("");
          closeAuthModal();
        }
      } else {
        const { error, needsEmailConfirmation } = await signUpWithEmail(
          trimmedEmail,
          password,
          fullName
        );
        if (error) {
          const friendly = getFriendlyAuthError(error.message);
          toast.error(friendly.message);
          if (friendly.field) {
            setErrors({ [friendly.field]: friendly.message });
          }
        } else if (needsEmailConfirmation) {
          toast.info(
            isEs
              ? "Hemos enviado un correo de confirmación. Por favor, verifica tu bandeja de entrada."
              : "We sent a confirmation link. Please check your inbox.",
            { duration: 6000 }
          );
          closeAuthModal();
        } else {
          toast.success(
            isEs
              ? "¡Cuenta creada exitosamente! Bienvenido a FinTrack."
              : "Account created successfully! Welcome to FinTrack."
          );
          closeAuthModal();
        }
      }
    } catch {
      toast.error(
        isEs
          ? "Ocurrió un error inesperado. Por favor intenta de nuevo."
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isAuthModalOpen}
      onOpenChange={(open) => !open && closeAuthModal()}
    >
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0b101d] shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] rounded-3xl text-slate-900 dark:text-slate-100">
        <div className="pt-8 pb-2 px-6 sm:px-8 flex flex-col items-center text-center relative">
          {/* Top Brand Logo Emblem */}
          <div className="relative group mb-4">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-3xl blur-lg opacity-40 dark:opacity-60 group-hover:opacity-75 transition duration-300" />
            <BrandLogo size={60} className="relative shadow-xl dark:shadow-2xl rounded-2xl" priority />
          </div>

          <DialogHeader className="text-center p-0">
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isLogin && (isEs ? "Inicia Sesión en FinTrack" : "Sign In to FinTrack")}
              {isRegister &&
                (isEs ? "Crea tu Cuenta" : "Create Your Account")}
              {isForgotPassword &&
                (isEs ? "Recuperar Contraseña" : "Reset Password")}
              {isUpdatePassword &&
                (isEs ? "Nueva Contraseña" : "Create New Password")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 space-y-4">
          {/* Full Name Input (Only Register) */}
          <AnimatePresence mode="wait">
            {isRegister && (
              <motion.div
                key="fullname-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                <label
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  htmlFor="fullname"
                >
                  {isEs ? "Nombre completo" : "Full Name"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User size={16} />
                  </div>
                  <input
                    id="fullname"
                    type="text"
                    placeholder={isEs ? "ej. Alejandro Morales" : "e.g. John Doe"}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName)
                        setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    className={`w-full bg-slate-50/90 dark:bg-[#060911] border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-xl py-2.5 pl-10 pr-3.5 outline-none transition duration-200 shadow-2xs ${
                      errors.fullName
                        ? "border-rose-500 dark:border-rose-500/90 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                        : "border-slate-300/80 dark:border-slate-800 focus:bg-white dark:focus:bg-[#060911] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/25"
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Input Field */}
          {!isUpdatePassword && (
            <div className="space-y-1.5">
              <label
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                htmlFor="email"
              >
                {isEs ? "Correo Electrónico" : "Email Address"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full bg-slate-50/90 dark:bg-[#060911] border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-xl py-2.5 pl-10 pr-3.5 outline-none transition duration-200 shadow-2xs ${
                    errors.email
                      ? "border-rose-500 dark:border-rose-500/90 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-300/80 dark:border-slate-800 focus:bg-white dark:focus:bg-[#060911] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/25"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          )}

          {/* Password Input Field */}
          {!isForgotPassword && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  htmlFor="password"
                >
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
                    onClick={() => switchModalMode("forgot_password")}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-semibold cursor-pointer"
                  >
                    {isEs ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg
                    className="w-4 h-4 text-slate-400 dark:text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isRegister
                      ? isEs
                        ? "Mínimo 6 caracteres..."
                        : "Minimum 6 characters..."
                      : "••••••••••••"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full bg-slate-50/90 dark:bg-[#060911] border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-xl py-2.5 pl-10 pr-10 outline-none transition duration-200 shadow-2xs ${
                    errors.password
                      ? "border-rose-500 dark:border-rose-500/90 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-300/80 dark:border-slate-800 focus:bg-white dark:focus:bg-[#060911] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/25"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}

              {/* Password Strength Indicator (Register mode) */}
              {isRegister && password && (
                <div className="pt-1 space-y-1">
                  <div className="flex gap-1.5">
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength.level >= 1
                          ? passwordStrength.barColor
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength.level >= 2
                          ? passwordStrength.barColor
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength.level >= 3
                          ? passwordStrength.barColor
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                    <span>
                      {isEs ? "Fortaleza de contraseña" : "Password strength"}
                    </span>
                    <span className={`font-medium ${passwordStrength.textColor}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password Field (Register and Update Password) */}
          {(isRegister || isUpdatePassword) && (
            <div className="space-y-1.5">
              <label
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                htmlFor="confirm-password"
              >
                {isEs ? "Confirmar contraseña" : "Confirm Password"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <svg
                    className="w-4 h-4 text-slate-400 dark:text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={
                    isEs ? "Repite tu contraseña..." : "Repeat your password..."
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                  }}
                  className={`w-full bg-slate-50/90 dark:bg-[#060911] border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-xl py-2.5 pl-10 pr-10 outline-none transition duration-200 shadow-2xs ${
                    errors.confirmPassword
                      ? "border-rose-500 dark:border-rose-500/90 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-300/80 dark:border-slate-800 focus:bg-white dark:focus:bg-[#060911] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/25"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar confirmación"
                      : "Ver confirmación"
                  }
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 group relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:to-indigo-600 active:scale-[0.99] transition-all duration-200 shadow-md shadow-blue-500/20 dark:shadow-[0_0_22px_rgba(99,102,241,0.45)] cursor-pointer disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            <span>
              {isLogin && (isEs ? "Iniciar Sesión" : "Sign In")}
              {isRegister && (isEs ? "Crear Cuenta" : "Create Account")}
              {isForgotPassword &&
                (isEs ? "Enviar Enlace de Recuperación" : "Send Recovery Link")}
              {isUpdatePassword &&
                (isEs ? "Guardar Nueva Contraseña" : "Update Password")}
            </span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Divider & Social Auth */}
          {(isLogin || isRegister) && (
            <>
              <div className="relative my-5">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center"
                >
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-500 border border-slate-200 dark:bg-[#0b101d] dark:text-slate-400 dark:border-slate-800 uppercase tracking-wider text-[11px] rounded-full shadow-2xs">
                    {isLogin
                      ? isEs
                        ? "o continúa con"
                        : "or continue with"
                      : isEs
                      ? "o regístrate con"
                      : "or register with"}
                  </span>
                </div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300/80 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-[#060911] dark:hover:bg-[#0f172a] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all w-full cursor-pointer active:scale-[0.99] disabled:opacity-50 shadow-xs hover:border-slate-400 dark:hover:border-slate-700"
              >
                {isGoogleLoading ? (
                  <Loader2 size={16} className="animate-spin text-blue-500 mr-1" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Google</span>
              </button>
            </>
          )}

          {/* Bottom Switch Links */}
          {(isLogin || isRegister) && (
            <div className="text-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isLogin
                  ? isEs
                    ? "¿No tienes cuenta todavía?"
                    : "Don't have an account yet?"
                  : isEs
                    ? "¿Ya tienes una cuenta?"
                    : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => switchModalMode(isLogin ? "register" : "login")}
                  className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-indigo-400 transition-colors ml-1 cursor-pointer"
                >
                  {isLogin
                    ? isEs
                      ? "Regístrate aquí"
                      : "Sign up here"
                    : isEs
                      ? "Iniciar sesión"
                      : "Sign in"}
                </button>
              </p>
            </div>
          )}

          {isForgotPassword && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchModalMode("login")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
              >
                <ArrowLeft size={13} />
                <span>
                  {isEs ? "Volver a Iniciar Sesión" : "Back to Sign In"}
                </span>
              </button>
            </div>
          )}

          {/* Security Status Badge from Stitch */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <svg
              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>
              {isEs
                ? "Tus datos financieros son 100% privados y seguros"
                : "Your financial data is 100% private and secure"}
            </span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
