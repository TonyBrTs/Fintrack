"use client";

import React from "react";
import { calculatePasswordStrength } from "./authHelpers";

interface PasswordStrengthMeterProps {
  password?: string;
  isEs?: boolean;
}

export function PasswordStrengthMeter({
  password = "",
  isEs = true,
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = calculatePasswordStrength(password, isEs);

  return (
    <div className="space-y-1 pt-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500 dark:text-slate-400">
          {isEs ? "Seguridad de contraseña" : "Password strength"}
        </span>
        <span className={`font-semibold ${strength.textColor}`}>
          {strength.label}
        </span>
      </div>
      <div className="flex gap-1 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full flex-1 rounded-full transition-all duration-300 ${
            strength.score >= 1 ? strength.barColor : "bg-transparent"
          }`}
        />
        <div
          className={`h-full flex-1 rounded-full transition-all duration-300 ${
            strength.score >= 2 ? strength.barColor : "bg-transparent"
          }`}
        />
        <div
          className={`h-full flex-1 rounded-full transition-all duration-300 ${
            strength.score >= 3 ? strength.barColor : "bg-transparent"
          }`}
        />
      </div>
    </div>
  );
}
