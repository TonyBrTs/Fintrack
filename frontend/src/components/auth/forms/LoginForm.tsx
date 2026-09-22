"use client";

import React, { useState } from "react";
import { Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { FormErrors, EMAIL_REGEX, getFriendlyAuthError } from "./authHelpers";
import { toast } from "sonner";

interface LoginFormProps {
  onSuccess: () => void;
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  isEs?: boolean;
}

export function LoginForm({
  onSuccess,
  onForgotPassword,
  onSwitchToRegister,
  signInWithEmail,
  signInWithGoogle,
  isEs = true,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(getFriendlyAuthError(error.message, isEs, true).message);
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
        ? "Por favor ingresa tu contraseña."
        : "Please enter your password.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        const friendly = getFriendlyAuthError(error.message, isEs, true);
        toast.error(friendly.message);
        if (friendly.field) {
          setErrors({ [friendly.field]: friendly.message });
        }
      } else {
        toast.success(
          isEs ? "¡Bienvenido de nuevo!" : "Welcome back!"
        );
        onSuccess();
      }
    } catch {
      toast.error(
        isEs
          ? "Ocurrió un error al iniciar sesión. Intenta nuevamente."
          : "An error occurred while signing in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            htmlFor="login-email"
          >
            {isEs ? "Correo Electrónico" : "Email Address"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Mail size={16} />
            </div>
            <input
              id="login-email"
              type="email"
              placeholder="nombre@correo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              htmlFor="login-password"
            >
              {isEs ? "Contraseña" : "Password"}
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition cursor-pointer"
            >
              {isEs ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
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
              <span>{isEs ? "Iniciar Sesión" : "Sign In"}</span>
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

      {/* Toggle to Register */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isEs ? "¿No tienes una cuenta aún?" : "Don't have an account yet?"}{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition cursor-pointer"
          >
            {isEs ? "Regístrate gratis" : "Sign up free"}
          </button>
        </p>
      </div>
    </div>
  );
}
