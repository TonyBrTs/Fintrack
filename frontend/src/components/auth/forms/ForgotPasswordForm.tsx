"use client";

import React, { useState } from "react";
import { Mail, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { FormErrors, EMAIL_REGEX, getFriendlyAuthError } from "./authHelpers";
import { toast } from "sonner";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  isEs?: boolean;
}

export function ForgotPasswordForm({
  onBackToLogin,
  resetPasswordForEmail,
  isEs = true,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) {
        const friendly = getFriendlyAuthError(error.message, isEs, false);
        toast.error(friendly.message);
      } else {
        toast.success(
          isEs
            ? "Enlace enviado. Revisa tu bandeja de entrada o carpeta de spam."
            : "Reset link sent. Please check your inbox or spam folder."
        );
        onBackToLogin();
      }
    } catch {
      toast.error(
        isEs
          ? "No se pudo enviar el correo de recuperación."
          : "Could not send reset password email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      <div className="space-y-1.5">
        <label
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          htmlFor="forgot-email"
        >
          {isEs ? "Correo Electrónico" : "Email Address"}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Mail size={16} />
          </div>
          <input
            id="forgot-email"
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl py-2.5 px-4 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/25 hover:shadow-blue-600/35 cursor-pointer mt-2 active:scale-[0.99]"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span>{isEs ? "Enviar Enlace" : "Send Reset Link"}</span>
        )}
      </button>

      {/* Back to Login Button */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition py-2 cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>{isEs ? "Volver a Iniciar Sesión" : "Back to Sign In"}</span>
      </button>
    </form>
  );
}
