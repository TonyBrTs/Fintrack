export const PAYMENT_METHODS = [
  "Tarjeta de Débito",
  "Tarjeta de Crédito",
  "Efectivo",
  "Transferencia",
] as const;

export const CATEGORY_COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#f97316", // orange
  "#64748b", // slate
] as const;

export interface CategoryTheme {
  primary: string;
  lightBg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  Emergencia: {
    primary: "#f59e0b",
    lightBg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.35)",
    badgeBg: "rgba(245, 158, 11, 0.14)",
    badgeText: "#fbbf24",
  },
  Viajes: {
    primary: "#a855f7",
    lightBg: "rgba(168, 85, 247, 0.15)",
    border: "rgba(168, 85, 247, 0.35)",
    badgeBg: "rgba(168, 85, 247, 0.14)",
    badgeText: "#c084fc",
  },
  Inversión: {
    primary: "#10b981",
    lightBg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.35)",
    badgeBg: "rgba(16, 185, 129, 0.14)",
    badgeText: "#34d399",
  },
  Vivienda: {
    primary: "#06b6d4",
    lightBg: "rgba(6, 182, 212, 0.15)",
    border: "rgba(6, 182, 212, 0.35)",
    badgeBg: "rgba(6, 182, 212, 0.14)",
    badgeText: "#22d3ee",
  },
  Vehículo: {
    primary: "#f97316",
    lightBg: "rgba(249, 115, 22, 0.15)",
    border: "rgba(249, 115, 22, 0.35)",
    badgeBg: "rgba(249, 115, 22, 0.14)",
    badgeText: "#fb923c",
  },
  Educación: {
    primary: "#ec4899",
    lightBg: "rgba(236, 72, 153, 0.15)",
    border: "rgba(236, 72, 153, 0.35)",
    badgeBg: "rgba(236, 72, 153, 0.14)",
    badgeText: "#f472b6",
  },
  Ahorro: {
    primary: "#38bdf8",
    lightBg: "rgba(56, 189, 248, 0.15)",
    border: "rgba(56, 189, 248, 0.35)",
    badgeBg: "rgba(56, 189, 248, 0.14)",
    badgeText: "#38bdf8",
  },
  Otros: {
    primary: "#818cf8",
    lightBg: "rgba(129, 140, 248, 0.15)",
    border: "rgba(129, 140, 248, 0.35)",
    badgeBg: "rgba(129, 140, 248, 0.14)",
    badgeText: "#a5b4fc",
  },
};

export const getCategoryTheme = (category?: string, isCompleted?: boolean): CategoryTheme => {
  if (isCompleted) {
    return {
      primary: "#10b981",
      lightBg: "rgba(16, 185, 129, 0.18)",
      border: "rgba(16, 185, 129, 0.45)",
      badgeBg: "rgba(16, 185, 129, 0.18)",
      badgeText: "#10b981",
    };
  }
  return CATEGORY_THEMES[category || "Ahorro"] || CATEGORY_THEMES["Ahorro"];
};

export const RECURRING_FREQUENCIES = [
  {
    key: "biweekly",
    labelEs: "Quincenal",
    labelEn: "Biweekly",
    subEs: "Pago quincena",
    subEn: "Biweekly pay",
  },
  {
    key: "monthly",
    labelEs: "Mensual",
    labelEn: "Monthly",
    subEs: "Día fijo al mes",
    subEn: "Fixed day/mo",
  },
  {
    key: "weekly",
    labelEs: "Semanal",
    labelEn: "Weekly",
    subEs: "Cada semana",
    subEn: "Every week",
  },
  {
    key: "yearly",
    labelEs: "Anual",
    labelEn: "Yearly",
    subEs: "Una vez al año",
    subEn: "Once a year",
  },
] as const;

export const GOAL_CATEGORIES = [
  "Ahorro",
  "Emergencia",
  "Viajes",
  "Inversión",
  "Vivienda",
  "Vehículo",
  "Educación",
  "Otros",
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Vivienda",
  "Servicios",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Otros",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "Salario",
  "Freelance",
  "Inversiones",
  "Negocio",
  "Regalo",
  "Ventas",
  "Otros",
] as const;
