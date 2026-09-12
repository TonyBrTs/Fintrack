import type { ReactNode } from "react";

interface KPICardProps {
  title: string;
  amount: string;
  icon?: ReactNode;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
}

export function KPICard({ title, amount, icon, trend, trendType }: KPICardProps) {
  return (
    <div className="group relative overflow-hidden bg-card dark:bg-card/75 border border-slate-200/90 dark:border-border/60 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:border-action/40 dark:hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300">
      {/* Subtle decorative glow */}
      <div className="absolute -right-12 -top-12 w-28 h-28 bg-action/5 rounded-full blur-2xl group-hover:bg-action/10 transition-colors pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <p className="text-2xl lg:text-3xl font-black tracking-tight text-titles dark:text-foreground">
            {amount}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  trendType === "up"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : trendType === "down"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {trend}
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div className="p-3 rounded-2xl bg-secondary/80 dark:bg-slate-800/80 border border-border/50 text-foreground group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
