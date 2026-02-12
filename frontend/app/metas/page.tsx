"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useState, useEffect } from "react";
import { getApiHeaders } from "@/lib/api";
import { Goal } from "@/types/index";
import { GoalCard } from "@/components/goals/GoalCard";
import { RegisterGoalModal } from "@/components/goals/RegisterGoalModal";
import { Plus, Loader2, Goal as GoalIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmDialog } from "@/components/expenses/DeleteConfirmDialog";
import { toast } from "sonner";

export default function GoalsPage() {
  const { translate } = useSettings();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/goals`,
        {
          headers: getApiHeaders(),
        },
      );
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/goals/${goalToDelete}`,
        {
          method: "DELETE",
          headers: getApiHeaders(),
        },
      );
      if (response.ok) {
        setIsDeleteDialogOpen(false);
        fetchGoals();
        toast.success(translate("goals.details.deleteSuccess"));
      } else {
        toast.error(translate("goals.details.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    } finally {
      setIsDeleting(false);
      setGoalToDelete(null);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  if (loading && goals.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-20 py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-action animate-spin opacity-50" />
        <p className="text-muted-foreground font-medium animate-pulse">
          {translate("common.loading")}
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-20 py-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setGoalToDelete(null);
          }}
          onConfirm={confirmDelete}
          loading={isDeleting}
          title={translate("goals.delete")}
          description={translate("goals.details.deleteConfirm")}
          confirmLabel={translate("goals.delete")}
          cancelLabel={translate("income.form.cancel")}
        />
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-15 bg-action rounded-full" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-titles dark:text-foreground">
              {translate("goals.title")}
            </h1>
          </div>
          <p className="text-secondary-titles dark:text-muted-foreground text-lg ml-5">
            {translate("goals.description")}
          </p>
        </div>
        <motion.button
          whileHover="hover"
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 bg-action hover:bg-action/90 text-white dark:bg-action/10 dark:hover:bg-action/20 dark:text-action px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 border border-transparent dark:border-action/20 cursor-pointer"
        >
          <motion.div
            initial={{ rotate: 0 }}
            variants={{
              hover: { rotate: 180 },
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </motion.div>
          {translate("goals.register")}
        </motion.button>
      </header>

      <RegisterGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchGoals}
      />

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-6 bg-muted rounded-full text-muted-foreground opacity-30">
            <GoalIcon size={64} />
          </div>
          <p className="text-muted-foreground max-w-sm">
            {translate("goals.emptyState")}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-action font-bold hover:underline cursor-pointer"
          >
            {translate("goals.register")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
    </main>
  );
}
