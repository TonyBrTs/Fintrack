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
import { Tag, Loader2, Check, ArrowDownRight, ArrowUpRight } from "lucide-react";
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
  { name: "blue", label: "Azul", bg: "bg-blue-500", ring: "ring-blue-500" },
  { name: "emerald", label: "Esmeralda", bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { name: "purple", label: "Púrpura", bg: "bg-purple-500", ring: "ring-purple-500" },
  { name: "amber", label: "Ámbar", bg: "bg-amber-500", ring: "ring-amber-500" },
  { name: "rose", label: "Rosa", bg: "bg-rose-500", ring: "ring-rose-500" },
  { name: "cyan", label: "Cian", bg: "bg-cyan-500", ring: "ring-cyan-500" },
  { name: "indigo", label: "Índigo", bg: "bg-indigo-500", ring: "ring-indigo-500" },
  { name: "slate", label: "Gris", bg: "bg-slate-500", ring: "ring-slate-500" },
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
        toast.success(`Categoría "${res.category.name}" creada exitosamente`);
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
      <DialogContent
        overlayClassName="z-[300]"
        className="z-[301] sm:max-w-[440px] max-w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto rounded-2xl bg-card border border-border/80 shadow-2xl p-5 sm:p-6"
      >
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Tag size={20} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Nueva Categoría Personalizada
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Crea una categoría propia para clasificar tus finanzas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo de categoría con botones grandes táctiles */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Aplica para
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`min-h-[44px] py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === "expense"
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <ArrowDownRight size={14} />
                <span>Gastos</span>
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`min-h-[44px] py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === "income"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <ArrowUpRight size={14} />
                <span>Ingresos</span>
              </button>
            </div>
          </div>

          {/* Nombre de la categoría (con tamaño de fuente anti-zoom en móvil) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Nombre de la categoría
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mascotas, Cursos, Gimnasio..."
              maxLength={50}
              className="h-11 sm:h-10 text-base sm:text-sm font-medium rounded-xl border-border/80 focus-visible:ring-blue-500"
            />
          </div>

          {/* Selector de color con touch targets accesibles */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Color identificador
            </label>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2.5 pt-1">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setColor(opt.name)}
                  aria-label={`Seleccionar color ${opt.label}`}
                  className={`min-w-[40px] min-h-[40px] rounded-xl ${opt.bg} flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    color === opt.name
                      ? "ring-2 ring-offset-2 ring-foreground/70 scale-105 shadow-md"
                      : "opacity-85 hover:opacity-100"
                  }`}
                  title={opt.label}
                >
                  {color === opt.name && <Check size={16} className="text-white drop-shadow font-bold" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción adaptables en móvil */}
          <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2.5 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] sm:min-h-[38px] rounded-xl text-xs font-semibold cursor-pointer w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-h-[44px] sm:min-h-[38px] rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer w-full sm:w-auto shadow-md shadow-blue-500/20"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : "Guardar Categoría"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
