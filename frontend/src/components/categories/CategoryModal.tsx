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
import { CATEGORY_ICON_OPTIONS, CategoryAvatar } from "@/components/categories/CategoryIcon";
import { cn, getCategoryStyle } from "@/lib/utils";
import { Loader2, Check, ArrowDownRight, ArrowUpRight } from "lucide-react";
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
  { name: "blue", label: "Azul", bg: "bg-blue-500" },
  { name: "emerald", label: "Esmeralda", bg: "bg-emerald-500" },
  { name: "purple", label: "Púrpura", bg: "bg-purple-500" },
  { name: "amber", label: "Ámbar", bg: "bg-amber-500" },
  { name: "rose", label: "Rosa", bg: "bg-rose-500" },
  { name: "cyan", label: "Cian", bg: "bg-cyan-500" },
  { name: "indigo", label: "Índigo", bg: "bg-indigo-500" },
  { name: "pink", label: "Fucsia", bg: "bg-pink-500" },
  { name: "orange", label: "Naranja", bg: "bg-orange-500" },
  { name: "teal", label: "Turquesa", bg: "bg-teal-500" },
  { name: "slate", label: "Gris", bg: "bg-slate-500" },
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
  const [icon, setIcon] = useState("utensils");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setName("");
      setColor(defaultType === "expense" ? "blue" : "emerald");
      setIcon(defaultType === "expense" ? "shopping-bag" : "briefcase");
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
      const res = await createCategory(trimmed, type, color, icon);
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

  const selectedTheme = getCategoryStyle(color);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="z-[300]"
        className="z-[301] sm:max-w-[460px] max-w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto rounded-2xl bg-card border border-border/80 shadow-2xl p-5 sm:p-6"
      >
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <CategoryAvatar category={color} iconKey={icon} size="lg" />
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground truncate">
                {name.trim() || "Nueva Categoría"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Elige un nombre, color e ícono representativo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo de categoría */}
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

          {/* Nombre */}
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

          {/* Selector de color */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Color identificador
            </label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setColor(opt.name)}
                  aria-label={`Seleccionar color ${opt.label}`}
                  className={`w-9 h-9 rounded-xl ${opt.bg} flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    color === opt.name
                      ? "ring-2 ring-offset-2 ring-foreground/70 scale-105 shadow-md"
                      : "opacity-85 hover:opacity-100"
                  }`}
                  title={opt.label}
                >
                  {color === opt.name && (
                    <Check size={15} className="text-white drop-shadow font-bold" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de ícono */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Ícono
            </label>
            <div className="grid grid-cols-6 gap-2 pt-0.5">
              {CATEGORY_ICON_OPTIONS.map((opt) => {
                const IconComp = opt.icon;
                const isSelected = icon === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIcon(opt.key)}
                    title={opt.label}
                    aria-label={opt.label}
                    aria-pressed={isSelected}
                    className={cn(
                      "min-h-[42px] rounded-xl border flex items-center justify-center transition-all cursor-pointer touch-manipulation",
                      isSelected
                        ? cn(selectedTheme.bg, selectedTheme.text, selectedTheme.border, "ring-2 ring-offset-1 ring-current/30 scale-105")
                        : "bg-secondary/40 border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <IconComp size={18} strokeWidth={2.1} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2.5 pt-3 border-t border-border/40">
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
