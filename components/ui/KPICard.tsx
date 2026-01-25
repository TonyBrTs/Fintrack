import type { ReactNode } from "react";

interface KPICardProps {
  title: string;
  amount: string;
  icon?: ReactNode;
}

export function KPICard({ title, amount, icon }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm p-6 flex items-center justify-between transition-colors duration-300">
      <div>
        <h3 className="text-secondary-titles dark:text-muted-foreground text-sm font-medium">
          {title}
        </h3>
        <p className="text-titles dark:text-foreground text-2xl font-bold mt-2">
          {amount}
        </p>
      </div>
      {icon && (
        <div className="p-2 bg-background dark:bg-secondary rounded-lg text-action dark:text-primary">
          {icon}
        </div>
      )}
    </div>
  );
}
