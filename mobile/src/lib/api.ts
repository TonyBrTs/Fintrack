import { supabase } from "./supabase";
import {
  Expense,
  Income,
  Goal,
  Category,
  FinancialSummary,
  RecurringTransaction,
  AIInsight,
} from "../types";
import {
  INITIAL_DEMO_EXPENSES,
  INITIAL_DEMO_INCOMES,
  INITIAL_DEMO_GOALS,
  INITIAL_DEMO_RECURRING,
  INITIAL_DEMO_CATEGORIES,
  INITIAL_DEMO_AI_INSIGHTS,
} from "./demoData";

export const getApiBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_API_URL || "https://fintrack-ihwb.onrender.com";
  return url.replace(/\/+$/, "");
};

// ============================================================
// ALMACÉN REACTIVO PARA MODO DEMO MÓVIL
// ============================================================
let demoActive = false;
let demoExpenses: Expense[] = JSON.parse(JSON.stringify(INITIAL_DEMO_EXPENSES));
let demoIncomes: Income[] = JSON.parse(JSON.stringify(INITIAL_DEMO_INCOMES));
let demoGoals: Goal[] = JSON.parse(JSON.stringify(INITIAL_DEMO_GOALS));
let demoRecurringExpenses: RecurringTransaction[] = JSON.parse(
  JSON.stringify(INITIAL_DEMO_RECURRING.filter((r) => r.category !== "Salario"))
);
let demoRecurringIncomes: RecurringTransaction[] = JSON.parse(
  JSON.stringify(INITIAL_DEMO_RECURRING.filter((r) => r.category === "Salario"))
);
let demoCategories: Category[] = JSON.parse(JSON.stringify(INITIAL_DEMO_CATEGORIES));

export const isDemoActive = () => demoActive;

export const setDemoMode = (active: boolean) => {
  demoActive = active;
  if (active) {
    // Restablecer si entra nuevamente al demo
    demoExpenses = JSON.parse(JSON.stringify(INITIAL_DEMO_EXPENSES));
    demoIncomes = JSON.parse(JSON.stringify(INITIAL_DEMO_INCOMES));
    demoGoals = JSON.parse(JSON.stringify(INITIAL_DEMO_GOALS));
    demoRecurringExpenses = JSON.parse(
      JSON.stringify(INITIAL_DEMO_RECURRING.filter((r) => r.category !== "Salario"))
    );
    demoRecurringIncomes = JSON.parse(
      JSON.stringify(INITIAL_DEMO_RECURRING.filter((r) => r.category === "Salario"))
    );
    demoCategories = JSON.parse(JSON.stringify(INITIAL_DEMO_CATEGORIES));
  }
};

const getHeaders = async (
  extraHeaders: Record<string, string> = {}
): Promise<Record<string, string>> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

const fetchJson = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const isFullUrl = endpoint.startsWith("http");
  const url = isFullUrl
    ? endpoint
    : `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = await getHeaders((options.headers as Record<string, string>) || {});

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      // Ignorar fallo de parseo
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

export const api = {
  // Configuración de modo demo
  isDemoActive: () => demoActive,
  setDemoMode,

  // Resumen reactivo calculado
  getSummary: async (month?: string, currency: string = "USD"): Promise<FinancialSummary> => {
    const [expenses, incomes] = await Promise.all([
      api.getExpenses().catch(() => []),
      api.getIncomes().catch(() => []),
    ]);

    const filteredExpenses =
      month && month !== "all"
        ? expenses.filter((e) => {
            const mKey = e.date && e.date.length >= 7 ? e.date.slice(0, 7) : "";
            return mKey === month;
          })
        : expenses;

    const filteredIncomes =
      month && month !== "all"
        ? incomes.filter((i) => {
            const mKey = i.date && i.date.length >= 7 ? i.date.slice(0, 7) : "";
            return mKey === month;
          })
        : incomes;

    const total_expenses = filteredExpenses.reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0
    );
    const total_incomes = filteredIncomes.reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0
    );
    const net_savings = total_incomes - total_expenses;
    const savings_rate =
      total_incomes > 0 ? ((total_incomes - total_expenses) / total_incomes) * 100 : 0;

    return {
      total_expenses,
      total_incomes,
      net_savings,
      savings_rate,
      currency,
    };
  },

  // Gastos
  getExpenses: async (): Promise<Expense[]> => {
    if (demoActive) {
      return [...demoExpenses];
    }
    return fetchJson<Expense[]>("/api/expenses");
  },
  createExpense: async (expense: Omit<Expense, "id" | "user_id">): Promise<Expense> => {
    if (demoActive) {
      const newExp: Expense = {
        id: `demo-exp-${Date.now()}`,
        user_id: "demo-user",
        ...expense,
      };
      demoExpenses.unshift(newExp);
      return newExp;
    }
    return fetchJson<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  },
  updateExpense: async (id: string, expense: Partial<Expense>): Promise<Expense> => {
    if (demoActive) {
      const idx = demoExpenses.findIndex((e) => e.id === id);
      if (idx !== -1) {
        demoExpenses[idx] = { ...demoExpenses[idx], ...expense };
        return demoExpenses[idx];
      }
      return { id, user_id: "demo-user", ...expense } as Expense;
    }
    return fetchJson<Expense>(`/api/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expense),
    });
  },
  deleteExpense: async (id: string): Promise<void> => {
    if (demoActive) {
      demoExpenses = demoExpenses.filter((e) => e.id !== id);
      return;
    }
    return fetchJson<void>(`/api/expenses/${id}`, {
      method: "DELETE",
    });
  },

  // Ingresos
  getIncomes: async (): Promise<Income[]> => {
    if (demoActive) {
      return [...demoIncomes];
    }
    return fetchJson<Income[]>("/api/incomes");
  },
  createIncome: async (income: Omit<Income, "id" | "user_id">): Promise<Income> => {
    if (demoActive) {
      const newInc: Income = {
        id: `demo-inc-${Date.now()}`,
        user_id: "demo-user",
        ...income,
      };
      demoIncomes.unshift(newInc);
      return newInc;
    }
    return fetchJson<Income>("/api/incomes", {
      method: "POST",
      body: JSON.stringify(income),
    });
  },
  updateIncome: async (id: string, income: Partial<Income>): Promise<Income> => {
    if (demoActive) {
      const idx = demoIncomes.findIndex((i) => i.id === id);
      if (idx !== -1) {
        demoIncomes[idx] = { ...demoIncomes[idx], ...income };
        return demoIncomes[idx];
      }
      return { id, user_id: "demo-user", ...income } as Income;
    }
    return fetchJson<Income>(`/api/incomes/${id}`, {
      method: "PUT",
      body: JSON.stringify(income),
    });
  },
  deleteIncome: async (id: string): Promise<void> => {
    if (demoActive) {
      demoIncomes = demoIncomes.filter((i) => i.id !== id);
      return;
    }
    return fetchJson<void>(`/api/incomes/${id}`, {
      method: "DELETE",
    });
  },

  // Metas
  getGoals: async (): Promise<Goal[]> => {
    if (demoActive) {
      return [...demoGoals];
    }
    return fetchJson<Goal[]>("/api/goals");
  },
  createGoal: async (goal: Omit<Goal, "id" | "user_id">): Promise<Goal> => {
    if (demoActive) {
      const newGoal: Goal = {
        id: `demo-goal-${Date.now()}`,
        user_id: "demo-user",
        ...goal,
      };
      demoGoals.unshift(newGoal);
      return newGoal;
    }
    return fetchJson<Goal>("/api/goals", {
      method: "POST",
      body: JSON.stringify(goal),
    });
  },
  updateGoal: async (id: string, goal: Partial<Goal>): Promise<Goal> => {
    if (demoActive) {
      const idx = demoGoals.findIndex((g) => g.id === id);
      if (idx !== -1) {
        demoGoals[idx] = { ...demoGoals[idx], ...goal };
        return demoGoals[idx];
      }
      return { id, user_id: "demo-user", ...goal } as Goal;
    }
    return fetchJson<Goal>(`/api/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(goal),
    });
  },
  deleteGoal: async (id: string): Promise<void> => {
    if (demoActive) {
      demoGoals = demoGoals.filter((g) => g.id !== id);
      return;
    }
    return fetchJson<void>(`/api/goals/${id}`, {
      method: "DELETE",
    });
  },

  // Categorías
  getCategories: async (): Promise<Category[]> => {
    if (demoActive) {
      return [...demoCategories];
    }
    return fetchJson<Category[]>("/api/categories");
  },
  createCategory: async (category: Omit<Category, "id" | "user_id">): Promise<Category> => {
    if (demoActive) {
      const newCat: Category = {
        id: `demo-cat-${Date.now()}`,
        user_id: "demo-user",
        ...category,
      };
      demoCategories.push(newCat);
      return newCat;
    }
    return fetchJson<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  },
  deleteCategory: async (id: string, _reassignTo?: string): Promise<void> => {
    if (demoActive) {
      demoCategories = demoCategories.filter((c) => c.id !== id);
      return;
    }
    return fetchJson<void>(`/api/categories/${id}`, {
      method: "DELETE",
    });
  },

  // Transacciones Fijas / Recurrentes
  getRecurringExpenses: async (): Promise<RecurringTransaction[]> => {
    if (demoActive) {
      return [...demoRecurringExpenses];
    }
    return fetchJson<RecurringTransaction[]>("/api/recurring-expenses");
  },
  createRecurringExpense: async (
    data: Partial<RecurringTransaction>
  ): Promise<RecurringTransaction> => {
    if (demoActive) {
      const item: RecurringTransaction = {
        id: `demo-rec-exp-${Date.now()}`,
        user_id: "demo-user",
        amount: Number(data.amount) || 0,
        currency: data.currency || "CRC",
        description: data.description || "Gasto Fijo",
        category: data.category || "Servicios",
        payment_method: data.payment_method || "Transferencia",
        frequency: data.frequency || "monthly",
        biweekly_type: data.biweekly_type,
        billing_day: data.billing_day,
        auto_register: data.auto_register ?? true,
        start_date: data.start_date || new Date().toISOString(),
        is_active: data.is_active ?? true,
      };
      demoRecurringExpenses.unshift(item);
      return item;
    }
    return fetchJson<RecurringTransaction>("/api/recurring-expenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateRecurringExpense: async (
    id: string,
    data: Partial<RecurringTransaction>
  ): Promise<RecurringTransaction> => {
    if (demoActive) {
      const idx = demoRecurringExpenses.findIndex((r) => r.id === id);
      if (idx !== -1) {
        demoRecurringExpenses[idx] = { ...demoRecurringExpenses[idx], ...data };
        return demoRecurringExpenses[idx];
      }
      return { id, user_id: "demo-user", ...data } as RecurringTransaction;
    }
    return fetchJson<RecurringTransaction>(`/api/recurring-expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteRecurringExpense: async (id: string): Promise<void> => {
    if (demoActive) {
      demoRecurringExpenses = demoRecurringExpenses.filter((r) => r.id !== id);
      return;
    }
    return fetchJson<void>(`/api/recurring-expenses/${id}`, {
      method: "DELETE",
    });
  },
  executeRecurringExpenseNow: async (id: string): Promise<void> => {
    if (demoActive) {
      const item = demoRecurringExpenses.find((r) => r.id === id);
      if (item) {
        await api.createExpense({
          amount: item.amount,
          currency: item.currency,
          description: item.description || "Compromiso Fijo",
          category: item.category,
          date: new Date().toISOString(),
          payment_method: item.payment_method || "Transferencia",
        });
      }
      return;
    }
    return fetchJson<void>(`/api/recurring-expenses/${id}/execute-now`, {
      method: "POST",
    });
  },
  syncRecurringExpenses: async (clientDate?: string): Promise<{ processed_count: number }> => {
    if (demoActive) {
      return { processed_count: 0 };
    }
    const query = clientDate ? `?client_date=${encodeURIComponent(clientDate)}` : "";
    return fetchJson<{ processed_count: number }>(`/api/recurring-expenses/sync${query}`, {
      method: "POST",
    });
  },

  getRecurringIncomes: async (): Promise<RecurringTransaction[]> => {
    if (demoActive) {
      return [...demoRecurringIncomes];
    }
    return fetchJson<RecurringTransaction[]>("/api/recurring-incomes");
  },
  createRecurringIncome: async (
    data: Partial<RecurringTransaction>
  ): Promise<RecurringTransaction> => {
    if (demoActive) {
      const item: RecurringTransaction = {
        id: `demo-rec-inc-${Date.now()}`,
        user_id: "demo-user",
        amount: Number(data.amount) || 0,
        currency: data.currency || "CRC",
        description: data.description || "Ingreso Fijo",
        source: data.source || "Salario",
        category: data.category || "Salario",
        payment_method: data.payment_method || "Transferencia",
        frequency: data.frequency || "monthly",
        biweekly_type: data.biweekly_type,
        billing_day: data.billing_day,
        auto_register: data.auto_register ?? true,
        start_date: data.start_date || new Date().toISOString(),
        is_active: data.is_active ?? true,
      };
      demoRecurringIncomes.unshift(item);
      return item;
    }
    return fetchJson<RecurringTransaction>("/api/recurring-incomes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateRecurringIncome: async (
    id: string,
    data: Partial<RecurringTransaction>
  ): Promise<RecurringTransaction> => {
    if (demoActive) {
      const idx = demoRecurringIncomes.findIndex((r) => r.id === id);
      if (idx !== -1) {
        demoRecurringIncomes[idx] = { ...demoRecurringIncomes[idx], ...data };
        return demoRecurringIncomes[idx];
      }
      return { id, user_id: "demo-user", ...data } as RecurringTransaction;
    }
    return fetchJson<RecurringTransaction>(`/api/recurring-incomes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteRecurringIncome: async (id: string): Promise<void> => {
    if (demoActive) {
      demoRecurringIncomes = demoRecurringIncomes.filter((r) => r.id !== id);
      return;
    }
    return fetchJson<void>(`/api/recurring-incomes/${id}`, {
      method: "DELETE",
    });
  },
  executeRecurringIncomeNow: async (id: string): Promise<void> => {
    if (demoActive) {
      const item = demoRecurringIncomes.find((r) => r.id === id);
      if (item) {
        await api.createIncome({
          amount: item.amount,
          currency: item.currency,
          source: item.source || item.description || "Ingreso Fijo",
          category: item.category,
          date: new Date().toISOString(),
          payment_method: item.payment_method || "Transferencia",
        });
      }
      return;
    }
    return fetchJson<void>(`/api/recurring-incomes/${id}/execute-now`, {
      method: "POST",
    });
  },
  syncRecurringIncomes: async (clientDate?: string): Promise<{ processed_count: number }> => {
    if (demoActive) {
      return { processed_count: 0 };
    }
    const query = clientDate ? `?client_date=${encodeURIComponent(clientDate)}` : "";
    return fetchJson<{ processed_count: number }>(`/api/recurring-incomes/sync${query}`, {
      method: "POST",
    });
  },

  // Motor de Asesoría AI
  getAIInsights: async (
    expenses: Expense[],
    incomes: Income[],
    goals: Goal[] = []
  ): Promise<AIInsight[]> => {
    if (demoActive) {
      return [...INITIAL_DEMO_AI_INSIGHTS];
    }
    const vercelUrl = "https://fintrack-six-opal.vercel.app/api/ai/insights";
    try {
      const res = await fetch(vercelUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenses, incomes, goals }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.insights) && data.insights.length > 0) {
          return data.insights;
        }
      }
    } catch {
      // Usar motor local si falla
    }

    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const totalInc = incomes.reduce((s, i) => s + i.amount, 0);
    const rate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;

    const insights: AIInsight[] = [];

    if (rate >= 20) {
      insights.push({
        type: "savings",
        title: "Excelente Capacidad de Ahorro",
        desc: `Estás reservando el ${rate.toFixed(1)}% de tus ingresos. Cumples holgadamente con la regla 50/30/20.`,
        priority: "low",
      });
    } else if (rate > 0) {
      insights.push({
        type: "optimization",
        title: "Margen de Optimización",
        desc: `Tu tasa de ahorro es de ${rate.toFixed(1)}%. Intenta reducir pequeños gastos hormiga para alcanzar el 20%.`,
        priority: "medium",
      });
    } else {
      insights.push({
        type: "warning",
        title: "Gastos Superan Ingresos",
        desc: "Tus gastos del período exceden lo percibido. Revisa tus categorías principales para detener el déficit.",
        priority: "high",
      });
    }

    return insights;
  },
};
