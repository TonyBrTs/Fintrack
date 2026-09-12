"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Loader2, Check } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types";
import { toast } from "sonner";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "expense" | "income";
  onSuccess?: (newCategory: Category) => void;
}

const COLOR_OPTIONS = [
  { name: "blue", label: "Azul", bg: "bg-blue-500", border: "border-blue-500" },
  { name: "emerald", label: "Esmeralda", bg: "bg-emerald-500", border: "border-emerald-500" },
  { name: "purple", label: "Púrpura", bg: "bg-purple-500", border: "border-purple-500" },
  { name: "amber", label: "Ámbar", bg: "bg-amber-500", border: "border-amber-500" },
  { name: "rose", label: "Rosa", bg: "bg-rose-500", border: "border-rose-500" },
  { name: "cyan", label: "Cian", bg: "bg-cyan-500", border: "border-cyan-500" },
  { name: "indigo", label: "Índigo", bg: "bg-indigo-500", border: "border-indigo-500" },
  { name: "slate", label: "Gris", bg: "bg-slate-500", border: "border-slate-500" },
];

export function CategoryModal({
  isOpen,
  onClose,
  defaultType = "expense",
  onSuccess,
}: CategoryModalProps) {
  const { createCategory } = useCategories();
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">(defaultType);
  const [color, setColor] = useState("blue");
  const [loading, setLoading] = useState(false);

  // Sync defaultType when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setName("");
      setColor(defaultType === "expense" ? "blue" : "emerald");
    }
  }, [isOpen, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Por favor ingresa un nombre para la categoría");
      return;
    }

    setLoading(true);
    try {
      const res = await createCategory(trimmed, type, color);
      if (res.ok && res.category) {
        onSuccess?.(res.category);
        onClose();
        setName("");
      } else if (res.error) {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl bg-card border border-border/80 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Tag size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Nueva Categoría Personalizada
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Crea una categoría propia para clasificar tus finanzas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo de categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Aplica para
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  type === "expense"
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  type === "income"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Ingresos
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nombre de la categoría
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mascotas, Cursos, Gimnasio..."
              maxLength={50}
              className="h-10 text-sm font-medium rounded-xl border-border/80 focus-visible:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Selector de color */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Color de identificación
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setColor(opt.name)}
                  className={`w-8 h-8 rounded-full ${opt.bg} flex items-center justify-center transition-transform cursor-pointer hover:scale-110 ${
                    color === opt.name
                      ? "ring-2 ring-offset-2 ring-foreground/60 scale-105"
                      : "opacity-80"
                  }`}
                  title={opt.label}
                >
                  {color === opt.name && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer min-w-24 shadow-md shadow-blue-500/20"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : "Guardar Categoría"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
