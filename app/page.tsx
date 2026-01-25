import { KPICard } from "@/components/ui/KPICard";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

export default function SummaryPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Fila de Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Saldo Total"
          amount="$5,240.00"
          icon={<Wallet size={24} />}
        />
        <KPICard
          title="Ingresos"
          amount="$2,850.00"
          icon={<TrendingUp size={24} className="text-income" />}
        />
        <KPICard
          title="Gastos"
          amount="$1,310.00"
          icon={<TrendingDown size={24} className="text-expense" />}
        />
        <KPICard
          title="Ahorro Neto"
          amount="$1,540.00"
          icon={<PiggyBank size={24} />}
        />
      </div>
    </div>
  );
}
