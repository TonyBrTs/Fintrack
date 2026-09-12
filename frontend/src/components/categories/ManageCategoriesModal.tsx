"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Shield, Tag, AlertTriangle, Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types";
import { CategoryModal } from "./CategoryModal";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "expense" | "income";
}

export function ManageCategoriesModal({
  isOpen,
  onClose,
  type = "expense",
}: ManageCategoriesModalProps) {
  const { categories, deleteCategory } = useCategories(type);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inUseConflict, setInUseConflict] = useState<{
    category: Category;
    count: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (cat: Category, reassignTo?: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteCategory(cat.id, reassignTo);
      if (!res.ok && res.inUse) {
        setInUseConflict({
          category: cat,
          count: res.count || 1,
        });
      } else if (res.ok) {
        setInUseConflict(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const customCategories = categories.filter((c) => !c.is_default);
  const systemCategories = categories.filter((c) => c.is_default);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col rounded-2xl bg-card border border-border/80 shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Tag size={20} />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Administrar Categorías
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {type === "expense" ? "Categorías de Gastos" : "Fuentes de Ingresos"}
                  </DialogDescription>
                </div>
              </div>

              <Button
                onClick={() => setIsCreateOpen(true)}
                size="sm"
                className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                <span>Nueva</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-3 pr-1">
            {/* Categorías Personalizadas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Mis Categorías ({customCategories.length})</span>
              </h4>

              {customCategories.length === 0 ? (
                <div className="p-5 text-center rounded-xl bg-secondary/30 border border-dashed border-border/70">
                  <p className="text-xs text-muted-foreground">
                    Aún no tienes categorías personalizadas. ¡Crea una para comenzar!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {customCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/60 hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full bg-${cat.color || "blue"}-500 shrink-0`} />
                        <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                      </div>

                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={isDeleting}
                        title="Eliminar categoría"
                        className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categorías del Sistema */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield size={13} className="text-blue-500" />
                <span>Predeterminadas del Sistema ({systemCategories.length})</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {systemCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-secondary/20 border border-border/40 text-xs font-medium text-muted-foreground"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold">
                      Sistema
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para crear categoría */}
      <CategoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultType={type}
      />

      {/* Diálogo de advertencia cuando la categoría está en uso */}
      {inUseConflict && (
        <Dialog open={!!inUseConflict} onOpenChange={(open) => !open && setInUseConflict(null)}>
          <DialogContent className="sm:max-w-[440px] rounded-2xl bg-card border border-border/80 shadow-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="text-base font-bold text-foreground">
                  Categoría en uso
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  La categoría <strong className="text-foreground">&ldquo;{inUseConflict.category.name}&rdquo;</strong> está asignada a{" "}
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">
                    {inUseConflict.count} transacción(es)
                  </strong>
                  .
                </DialogDescription>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-secondary/40 p-3 rounded-xl border border-border/60 mt-2">
              Para no dejar registros huérfanos, puedes reasignar automáticamente esas transacciones a la categoría{" "}
              <strong className="text-foreground">&ldquo;Otros&rdquo;</strong> antes de borrarla.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setInUseConflict(null)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDelete(inUseConflict.category, "Otros")}
                disabled={isDeleting}
                className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <span>Reasignar a &ldquo;Otros&rdquo; y Eliminar</span>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
