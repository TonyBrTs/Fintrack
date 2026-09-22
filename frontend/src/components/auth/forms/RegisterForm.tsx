"use client";

import React, { useState } from "react";
import { User, Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { FormErrors, EMAIL_REGEX, getFriendlyAuthError } from "./authHelpers";
import { toast } from "sonner";

interface RegisterFormProps {
  onSuccess: (needsEmailConfirmation?: boolean) => void;
  onSwitchToLogin: () => void;
  signUpWithEmail: (
    email: string,
    pass: string,
    fullName?: string
  ) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  isEs?: boolean;
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
  signUpWithEmail,
  signInWithGoogle,
  isEs = true,
}: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(getFriendlyAuthError(error.message, isEs, false).message);
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

    if (!fullName.trim()) {
      newErrors.fullName = isEs
        ? "Por favor ingresa tu nombre completo."
        : "Please enter your full name.";
    }

    if (!email) {
      newErrors.email = isEs
        ? "Por favor ingresa tu correo electrónico."
        : "Please enter your email.";
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = isEs
        ? "Formato de correo electrónico inválido."
        : "Invalid email format.";
    }

    if (!password) {
      newErrors.password = isEs
        ? "Por favor ingresa una contraseña."
        : "Please enter a password.";
    } else if (password.length < 6) {
      newErrors.password = isEs
        ? "La contraseña debe tener al menos 6 caracteres."
        : "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = isEs
        ? "Por favor confirma tu contraseña."
        : "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = isEs
        ? "Las contraseñas no coinciden."
        : "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { error, needsEmailConfirmation } = await signUpWithEmail(
        email,
        password,
        fullName
      );
      if (error) {
        const friendly = getFriendlyAuthError(error.message, isEs, false);
        toast.error(friendly.message);
        if (friendly.field) {
          setErrors({ [friendly.field]: friendly.message });
        }
      } else {
        if (needsEmailConfirmation) {
          toast.info(
            isEs
              ? "Hemos enviado un correo de confirmación. Por favor, verifica tu bandeja de entrada."
              : "We sent a confirmation link. Please check your inbox.",
            { duration: 6000 }
          );
          onSuccess(true);
        } else {
          toast.success(
            isEs
              ? "¡Cuenta creada exitosamente! Bienvenido a FinTrack."
              : "Account created successfully! Welcome to FinTrack."
          );
          onSuccess(false);
        }
      }
    } catch {
      toast.error(
        isEs
          ? "Ocurrió un error inesperado al registrarte."
          : "An unexpected error occurred during sign up."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name Field */}
        <div className="space-y-1.5">
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            htmlFor="register-fullname"
          >
            {isEs ? "Nombre completo" : "Full Name"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <User size={16} />
            </div>
            <input
              id="register-fullname"
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
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            htmlFor="register-email"
          >
            {isEs ? "Correo Electrónico" : "Email Address"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Mail size={16} />
            </div>
            <input
              id="register-email"
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

        {/* Password Field with Strength Meter */}
        <div className="space-y-1.5">
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            htmlFor="register-password"
          >
            {isEs ? "Contraseña" : "Password"}
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`w-full bg-slate-50/90 dark:bg-[#060911] border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-xl py-2.5 pl-3.5 pr-10 outline-none transition duration-200 shadow-2xs ${
                errors.password
                  ? "border-rose-500 dark:border-rose-500/90 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-300/80 dark:border-slate-800 focus:bg-white dark:focus:bg-[#060911] focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/25"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
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
          <PasswordStrengthMeter password={password} isEs={isEs} />
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            htmlFor="register-confirm-password"
          >
            {isEs ? "Confirmar Contraseña" : "Confirm Password"}
          </label>
          <div className="relative">
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
              }}
              className={`w-full bg-slate-50/90 dark:bg-[#060911] border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-xl py-2.5 pl-3.5 pr-10 outline-none transition duration-200 shadow-2xs ${
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
                  ? "Ocultar confirmación de contraseña"
                  : "Ver confirmación de contraseña"
              }
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl py-2.5 px-4 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/25 hover:shadow-blue-600/35 cursor-pointer mt-2 active:scale-[0.99]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{isEs ? "Crear Cuenta" : "Create Account"}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Social Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white dark:bg-[#0b101d] px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
          {isEs ? "o bien" : "or"}
        </span>
      </div>

      {/* Google OAuth Button */}
      <GoogleAuthButton
        isLoading={isGoogleLoading}
        onClick={handleGoogleSignIn}
        isEs={isEs}
      />

      {/* Toggle to Login */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isEs ? "¿Ya tienes una cuenta?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition cursor-pointer"
          >
            {isEs ? "Inicia sesión" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
