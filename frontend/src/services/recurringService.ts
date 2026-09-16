import { safeFetch, SafeFetchResult } from "@/lib/api";
import type {
  Expense,
  Income,
  RecurringExpense,
  RecurringIncome,
  RecurringSyncResult,
  RecurringIncomeSyncResult,
} from "@/types";

export type CreateRecurringExpenseInput = Omit<RecurringExpense, "id" | "next_due_date"> & {
  next_due_date?: string | Date;
};
export type UpdateRecurringExpenseInput = Partial<Omit<RecurringExpense, "id">>;

export type CreateRecurringIncomeInput = Omit<RecurringIncome, "id" | "next_due_date"> & {
  next_due_date?: string | Date;
};
export type UpdateRecurringIncomeInput = Partial<Omit<RecurringIncome, "id">>;

/**
 * Service to manage Recurring Expenses and Incomes adhering to SRP and DIP.
 * Abstracts all recurrence endpoints, immediate executions, and synchronization.
 */
export const recurringService = {
  // ==================== RECURRING EXPENSES ====================

  /**
   * Retrieves all scheduled recurring expenses.
   */
  async getRecurringExpenses(): Promise<SafeFetchResult<RecurringExpense[]>> {
    return safeFetch<RecurringExpense[]>("/api/recurring-expenses");
  },

  /**
   * Creates a new scheduled recurring expense.
   */
  async createRecurringExpense(data: CreateRecurringExpenseInput): Promise<SafeFetchResult<RecurringExpense>> {
    return safeFetch<RecurringExpense>("/api/recurring-expenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing recurring expense.
   */
  async updateRecurringExpense(
    id: string,
    data: UpdateRecurringExpenseInput
  ): Promise<SafeFetchResult<RecurringExpense>> {
    return safeFetch<RecurringExpense>(`/api/recurring-expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a recurring expense schedule.
   */
  async deleteRecurringExpense(id: string): Promise<SafeFetchResult<{ message: string }>> {
    return safeFetch<{ message: string }>(`/api/recurring-expenses/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Immediately generates a transaction for the current cycle ahead of schedule.
   */
  async executeRecurringExpenseNow(id: string): Promise<SafeFetchResult<{ message: string; expense: Expense }>> {
    return safeFetch<{ message: string; expense: Expense }>(`/api/recurring-expenses/${id}/execute-now`, {
      method: "POST",
    });
  },

  /**
   * Triggers processing and synchronization of all due recurring expenses.
   */
  async syncRecurringExpenses(clientDate?: string): Promise<SafeFetchResult<RecurringSyncResult>> {
    const query = clientDate ? `?client_date=${encodeURIComponent(clientDate)}` : "";
    return safeFetch<RecurringSyncResult>(`/api/recurring-expenses/sync${query}`, {
      method: "POST",
    });
  },

  // ==================== RECURRING INCOMES ====================

  /**
   * Retrieves all scheduled recurring incomes.
   */
  async getRecurringIncomes(): Promise<SafeFetchResult<RecurringIncome[]>> {
    return safeFetch<RecurringIncome[]>("/api/recurring-incomes");
  },

  /**
   * Creates a new scheduled recurring income.
   */
  async createRecurringIncome(data: CreateRecurringIncomeInput): Promise<SafeFetchResult<RecurringIncome>> {
    return safeFetch<RecurringIncome>("/api/recurring-incomes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing recurring income.
   */
  async updateRecurringIncome(
    id: string,
    data: UpdateRecurringIncomeInput
  ): Promise<SafeFetchResult<RecurringIncome>> {
    return safeFetch<RecurringIncome>(`/api/recurring-incomes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a recurring income schedule.
   */
  async deleteRecurringIncome(id: string): Promise<SafeFetchResult<{ message: string }>> {
    return safeFetch<{ message: string }>(`/api/recurring-incomes/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Immediately generates a transaction for the current cycle ahead of schedule.
   */
  async executeRecurringIncomeNow(id: string): Promise<SafeFetchResult<{ message: string; income: Income }>> {
    return safeFetch<{ message: string; income: Income }>(`/api/recurring-incomes/${id}/execute-now`, {
      method: "POST",
    });
  },

  /**
   * Triggers processing and synchronization of all due recurring incomes.
   */
  async syncRecurringIncomes(clientDate?: string): Promise<SafeFetchResult<RecurringIncomeSyncResult>> {
    const query = clientDate ? `?client_date=${encodeURIComponent(clientDate)}` : "";
    return safeFetch<RecurringIncomeSyncResult>(`/api/recurring-incomes/sync${query}`, {
      method: "POST",
    });
  },
};
