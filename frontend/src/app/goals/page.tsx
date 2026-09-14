"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useState, useEffect, useMemo } from "react";
import { safeFetch } from "@/lib/api";
import { Goal } from "@/types/index";
import { GoalCard } from "@/components/goals/GoalCard";
import { RegisterGoalModal } from "@/components/goals/RegisterGoalModal";
import { KPICard } from "@/components/ui/KPICard";
import { NavGoalsIcon } from "@/components/ui/AppIcons";
import { Plus, Loader2, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmDialog } from "@/components/expenses/DeleteConfirmDialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function GoalsPage() {
  const { translate, currencySymbol } = useSettings();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await safeFetch<Goal[]>("/api/goals");
      if (res.ok) {
        setGoals(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // Safe fallback
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setGoalToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      setIsDeleting(true);
      const res = await safeFetch(`/api/goals/${goalToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteDialogOpen(false);
        fetchGoals();
        toast.success(translate("goals.details.deleteSuccess") || "Meta eliminada");
      } else {
        toast.error(res.error || translate("goals.details.deleteError") || "Error al eliminar la meta");
      }
    } catch {
      toast.error(translate("goals.details.deleteError") || "Error al eliminar la meta");
    } finally {
      setIsDeleting(false);
      setGoalToDelete(null);
    }
  };

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }
    fetchGoals();
  }, [user]);

  const safeGoals = useMemo(() => Array.isArray(goals) ? goals : [], [goals]);

  const totalSaved = useMemo(() => {
    return safeGoals.reduce((acc, curr) => acc + curr.current_amount, 0);
  }, [safeGoals]);

  const totalTarget = useMemo(() => {
    return safeGoals.reduce((acc, curr) => acc + curr.target_amount, 0);
  }, [safeGoals]);

  const overallProgress = useMemo(() => {
    if (totalTarget === 0) return 0;
    return Math.min((totalSaved / totalTarget) * 100, 100);
  }, [totalSaved, totalTarget]);

  const completedGoalsCount = useMemo(() => {
    return goals.filter((g) => g.current_amount >= g.target_amount).length;
  }, [goals]);

  if (loading && goals.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-20 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-action animate-spin opacity-60" />
        <p className="text-muted-foreground font-medium animate-pulse text-sm">
          {translate("common.loading") || "Cargando metas..."}
        </p>
      </main>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-7xl mx-auto">
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setGoalToDelete(null);
        }}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title={translate("goals.delete") || "Eliminar meta"}
        description={translate("goals.details.deleteConfirm") || "¿Estás seguro de que deseas eliminar esta meta?"}
        confirmLabel={translate("goals.delete") || "Eliminar"}
        cancelLabel={translate("income.form.cancel") || "Cancelar"}
      />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2">
            <Trophy size={12} className="text-amber-500" />
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Objetivos Financieros</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-titles dark:text-foreground">
            {translate("goals.title") || "Metas Financieras"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {translate("goals.description") || "Define tus objetivos de ahorro y sigue tu progreso"}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          {translate("goals.register") || "Nueva Meta"}
        </motion.button>
      </header>

      <RegisterGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchGoals}
      />

      {/* Metrics Row */}
      {goals.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <KPICard
            title="Total Acumulado en Metas"
            amount={`${currencySymbol}${formatCurrency(totalSaved)}`}
            trend={`de ${currencySymbol}${formatCurrency(totalTarget)}`}
            trendType="up"
            icon={<NavGoalsIcon size={22} className="text-action dark:text-blue-400" />}
          />
          <KPICard
            title="Progreso Global"
            amount={`${overallProgress.toFixed(1)}%`}
            trend={overallProgress >= 50 ? "Buen avance" : "En progreso"}
            trendType={overallProgress >= 50 ? "up" : "neutral"}
            icon={<Sparkles size={22} className="text-amber-500" />}
          />
          <KPICard
            title="Metas Cumplidas"
            amount={`${completedGoalsCount} / ${goals.length}`}
            trend={completedGoalsCount > 0 ? "¡Objetivos logrados!" : "Aún sin completar"}
            trendType={completedGoalsCount > 0 ? "up" : "neutral"}
            icon={<Trophy size={22} className="text-emerald-500" />}
          />
        </section>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card/60 dark:bg-card/40 rounded-3xl border border-dashed border-border/80">
          <div className="p-5 bg-action/10 rounded-2xl text-action">
            <NavGoalsIcon size={48} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-titles dark:text-foreground">
              Comienza tu primera meta de ahorro
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {translate("goals.emptyState") || "No tienes metas registradas. Crea una para visualizar tu progreso."}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-action dark:text-blue-400 font-bold hover:underline cursor-pointer text-sm"
          >
            + {translate("goals.register") || "Crear primera meta"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <GoalCard
                  goal={goal}
                  onDelete={handleDelete}
                  onRefresh={fetchGoals}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
