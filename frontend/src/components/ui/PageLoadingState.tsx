"use client";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";
import styles from "./PageLoadingState.module.css";

interface PageLoadingStateProps {
  message?: string;
  className?: string;
  fullscreen?: boolean;
}

export function PageLoadingState({
  message = "Cargando...",
  className,
  fullscreen = false,
}: PageLoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-4 py-16 text-center",
        fullscreen ? "fixed inset-0 z-50 bg-background" : "min-h-[60vh]",
        className
      )}
    >
      <div aria-hidden="true">
        <BrandLogo size={56} priority={fullscreen} />
      </div>
      <div
        aria-hidden="true"
        className={cn(styles.indicator, "h-1 w-28 rounded-full bg-action/15 text-action dark:text-blue-400")}
      />
      <span className="text-sm font-medium text-muted-foreground">{message}</span>
    </div>
  );
}
