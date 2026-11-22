"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useState, useEffect, useMemo } from "react";
import { goalService } from "@/services";
import { Goal } from "@/types/index";
import { GoalCard } from "@/components/goals/GoalCard";
import { RegisterGoalModal } from "@/components/goals/RegisterGoalModal";
import { KPICard } from "@/components/ui/KPICard";
import { NavGoalsIcon } from "@/components/ui/AppIcons";
import { PageLoadingState } from "@/components/ui/PageLoadingState";
import { Plus, Trophy, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmDialog } from "@/components/expenses/DeleteConfirmDialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function GoalsPage() {
  const { translate, currencySymbol, language } = useSettings();
  const isEs = language !== "en";
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
      const res = await goalService.getGoals();
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
      const res = await goalService.deleteGoal(goalToDelete);
      if (res.ok) {
        setIsDeleteDialogOpen(false);
        fetchGoals();
        toast.success(translate("goals.details.deleteSuccess") || "Meta eliminada");
      } else {
        toast.error(
          res.error || translate("goals.details.deleteError") || "Error al eliminar la meta"
        );
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
  }, [user?.id]);

  const safeGoals = useMemo(() => (Array.isArray(goals) ? goals : []), [goals]);

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
    return <PageLoadingState message={translate("common.loading") || "Cargando metas..."} />;
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20 md:pb-6">
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setGoalToDelete(null);
          }}
          onConfirm={confirmDelete}
          loading={isDeleting}
          title={translate("goals.delete") || "Eliminar meta"}
          description={
            translate("goals.details.deleteConfirm") ||
            "¿Estás seguro de que deseas eliminar esta meta?"
          }
          confirmLabel={translate("goals.delete") || "Eliminar"}
          cancelLabel={translate("income.form.cancel") || "Cancelar"}
        />

        {/* Compact Mobile-First Header */}
        <header className="flex items-center justify-between gap-3 pb-3 sm:pb-5 border-b border-border/40">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground truncate">
              {translate("goals.title") || "Metas Financieras"}
            </h1>
            <p className="hidden sm:block text-sm text-muted-foreground mt-1 leading-relaxed max-w-lg">
              {translate("goals.description") ||
                "Define tus objetivos de ahorro, visualiza tu avance y celebra cada logro."}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer h-10 shrink-0"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>{translate("goals.register") || "Nueva Meta"}</span>
          </motion.button>
        </header>

        <RegisterGoalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchGoals}
        />

        {/* Mobile Compact Goals Summary (< sm) */}
        {goals.length > 0 && (
          <section className="sm:hidden bg-card border border-border/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {isEs ? "Total acumulado" : "Total saved"}
                </span>
                <p className="font-mono tabular-nums text-2xl font-black tracking-tight text-foreground mt-0.5 truncate">
                  {currencySymbol}
                  {formatCurrency(totalSaved)}
                </p>
                <span className="font-mono tabular-nums text-[11px] text-muted-foreground font-medium">
                  {isEs ? "de" : "of"} {currencySymbol}
                  {formatCurrency(totalTarget)}
                </span>
              </div>
              <span className="font-mono tabular-nums text-xs font-extrabold px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                {overallProgress.toFixed(1)}%
              </span>
            </div>

            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">
                    {isEs ? "Activas" : "Active"}
                  </span>
                  <span className="font-mono tabular-nums text-xs font-bold text-foreground">
                    {goals.length} {goals.length === 1 ? (isEs ? "meta" : "goal") : isEs ? "metas" : "goals"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">
                    {isEs ? "Cumplidas" : "Completed"}
                  </span>
                  <span className="font-mono tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {completedGoalsCount} / {goals.length}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Desktop Metrics Row (>= sm) */}
        {goals.length > 0 && (
          <section className="hidden sm:grid sm:grid-cols-3 gap-4 md:gap-6">
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
              icon={<Target size={22} className="text-amber-500" />}
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
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center space-y-4 bg-card/60 dark:bg-card/40 rounded-3xl border border-dashed border-border/80">
            <div className="p-5 bg-action/10 rounded-2xl text-action">
              <NavGoalsIcon size={48} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-titles dark:text-foreground">
                Comienza tu primera meta de ahorro
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {translate("goals.emptyState") ||
                  "No tienes metas registradas. Crea una para visualizar tu progreso."}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="min-h-[44px] px-4 text-action dark:text-blue-400 font-bold hover:underline cursor-pointer text-sm touch-manipulation"
            >
              + {translate("goals.register") || "Crear primera meta"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            <AnimatePresence>
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <GoalCard goal={goal} onDelete={handleDelete} onRefresh={fetchGoals} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Mobile Floating Action Button (FAB) */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label={translate("goals.register") || "Nueva Meta"}
          className="md:hidden fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 h-14 px-5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer touch-manipulation"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>{isEs ? "Meta" : "Goal"}</span>
        </button>
      </div>
    </ProtectedRoute>
  );
}
