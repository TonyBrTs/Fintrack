"use client";

import React from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingStateProps {
  message?: string;
  className?: string;
}

export function PageLoadingState({
  message = "Cargando...",
  className,
}: PageLoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 text-center select-none animate-in fade-in duration-300",
        className
      )}
    >
      <div className="relative flex flex-col items-center gap-4">
        {/* Glowing Logo matching initial app load */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-40 dark:opacity-60 animate-pulse" />
          <BrandLogo size={56} className="relative shadow-xl" priority />
        </div>

        {/* Centered spinner and message */}
        <div className="flex items-center gap-2.5 mt-1 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm font-medium tracking-tight animate-pulse">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}
