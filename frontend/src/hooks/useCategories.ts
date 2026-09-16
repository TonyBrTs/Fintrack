"use client";

import { useState, useEffect, useCallback } from "react";
import { categoryService } from "@/services";
import { Category } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: "default-exp-1", name: "Alimentación", type: "expense", color: "emerald", icon: "utensils", is_default: true },
  { id: "default-exp-2", name: "Transporte", type: "expense", color: "blue", icon: "car", is_default: true },
  { id: "default-exp-3", name: "Servicios", type: "expense", color: "amber", icon: "zap", is_default: true },
  { id: "default-exp-4", name: "Entretenimiento", type: "expense", color: "purple", icon: "film", is_default: true },
  { id: "default-exp-5", name: "Salud", type: "expense", color: "rose", icon: "heart-pulse", is_default: true },
  { id: "default-exp-6", name: "Metas", type: "expense", color: "cyan", icon: "target", is_default: true },
  { id: "default-exp-7", name: "Otros", type: "expense", color: "slate", icon: "more-horizontal", is_default: true },
];

const DEFAULT_INCOME_SOURCES: Category[] = [
  { id: "default-inc-1", name: "Salario", type: "income", color: "emerald", icon: "briefcase", is_default: true },
  { id: "default-inc-2", name: "Freelance", type: "income", color: "blue", icon: "laptop", is_default: true },
  { id: "default-inc-3", name: "Inversiones", type: "income", color: "purple", icon: "trending-up", is_default: true },
  { id: "default-inc-4", name: "Regalo", type: "income", color: "pink", icon: "gift", is_default: true },
  { id: "default-inc-5", name: "Otros", type: "income", color: "slate", icon: "more-horizontal", is_default: true },
];

export interface DeleteCategoryResult {
  ok: boolean;
  inUse?: boolean;
  count?: number;
  error?: string;
  categoryName?: string;
}

export function useCategories(filterType?: "expense" | "income") {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(() => {
    if (filterType === "expense") return DEFAULT_EXPENSE_CATEGORIES;
    if (filterType === "income") return DEFAULT_INCOME_SOURCES;
    return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_SOURCES];
  });
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      if (filterType === "expense") setCategories(DEFAULT_EXPENSE_CATEGORIES);
      else if (filterType === "income") setCategories(DEFAULT_INCOME_SOURCES);
      else setCategories([...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_SOURCES]);
      return;
    }

    try {
      setLoading(true);
      const res = await categoryService.getCategories(filterType);

      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      } else {
        // Fallback to default
        if (filterType === "expense") setCategories(DEFAULT_EXPENSE_CATEGORIES);
        else if (filterType === "income") setCategories(DEFAULT_INCOME_SOURCES);
        else setCategories([...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_SOURCES]);
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, [user?.id, filterType]);

  useEffect(() => {
    fetchCategories();

    const handleUpdate = () => {
      fetchCategories();
    };

    window.addEventListener("categories:updated", handleUpdate);
    return () => {
      window.removeEventListener("categories:updated", handleUpdate);
    };
  }, [fetchCategories]);

  const createCategory = async (
    name: string,
    type: "expense" | "income",
    color: string = "blue",
    icon: string = "tag"
  ): Promise<{ ok: boolean; category?: Category; error?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, error: "El nombre de la categoría es requerido." };
    }

    const res = await categoryService.createCategory({ name: trimmed, type, color, icon });

    if (!res.ok) {
      return { ok: false, error: res.error || "No se pudo crear la categoría." };
    }

    toast.success("Categoría creada exitosamente");
    window.dispatchEvent(new CustomEvent("categories:updated"));
    return { ok: true, category: res.data || undefined };
  };

  const deleteCategory = async (
    id: string,
    reassignTo?: string
  ): Promise<DeleteCategoryResult> => {
    const res = await categoryService.deleteCategory(id, reassignTo);

    if (res.status === 409) {
      return {
        ok: false,
        inUse: true,
        count: res.data?.count,
        categoryName: res.data?.category_name,
        error: res.error,
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: res.error || "No fue posible eliminar la categoría.",
      };
    }

    toast.success(
      reassignTo
        ? `Categoría eliminada y transacciones reasignadas a "${reassignTo}".`
        : "Categoría eliminada exitosamente."
    );
    window.dispatchEvent(new CustomEvent("categories:updated"));
    return { ok: true };
  };

  return {
    categories,
    loading,
    refetch: fetchCategories,
    createCategory,
    deleteCategory,
  };
}
