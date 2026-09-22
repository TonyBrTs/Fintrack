"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { FormErrors, getFriendlyAuthError } from "./authHelpers";
import { toast } from "sonner";

interface UpdatePasswordFormProps {
  onSuccess: () => void;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  isEs?: boolean;
}

export function UpdatePasswordForm({
  onSuccess,
  updatePassword,
  isEs = true,
}: UpdatePasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

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
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        const friendly = getFriendlyAuthError(error.message, isEs, false);
        toast.error(friendly.message);
      } else {
        toast.success(
          isEs
            ? "Contraseña actualizada exitosamente."
            : "Password updated successfully."
        );
        onSuccess();
      }
    } catch {
      toast.error(
        isEs
          ? "No se pudo actualizar la contraseña. Por favor intenta de nuevo."
          : "Could not update password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* New Password Field */}
      <div className="space-y-1.5">
        <label
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          htmlFor="update-password"
        >
          {isEs ? "Nueva Contraseña" : "New Password"}
        </label>
        <div className="relative">
          <input
            id="update-password"
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
          htmlFor="update-confirm-password"
        >
          {isEs ? "Confirmar Nueva Contraseña" : "Confirm New Password"}
        </label>
        <div className="relative">
          <input
            id="update-confirm-password"
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
          <span>{isEs ? "Guardar Contraseña" : "Save Password"}</span>
        )}
      </button>
    </form>
  );
}
