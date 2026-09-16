import { safeFetch, SafeFetchResult } from "@/lib/api";
import type { Expense, RecurringSyncResult } from "@/types";

export type CreateExpenseInput = Omit<Expense, "id">;
export type UpdateExpenseInput = Partial<Omit<Expense, "id">>;

/**
 * Service to manage Expense transactions adhering to the Single Responsibility Principle (SRP).
 * All HTTP transport, URL mapping, and payload formatting are isolated here.
 */
export const expenseService = {
  /**
   * Retrieves all expenses for the authenticated user.
   */
  async getExpenses(): Promise<SafeFetchResult<Expense[]>> {
    return safeFetch<Expense[]>("/api/expenses");
  },

  /**
   * Creates a new expense transaction.
   */
  async createExpense(data: CreateExpenseInput): Promise<SafeFetchResult<Expense>> {
    return safeFetch<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing expense by ID.
   */
  async updateExpense(id: string, data: UpdateExpenseInput): Promise<SafeFetchResult<Expense>> {
    return safeFetch<Expense>(`/api/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes an expense by ID.
   */
  async deleteExpense(id: string): Promise<SafeFetchResult<{ message: string }>> {
    return safeFetch<{ message: string }>(`/api/expenses/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Synchronizes and registers pending recurring expenses for the current cycle.
   */
  async syncRecurringExpenses(clientDate?: string): Promise<SafeFetchResult<RecurringSyncResult>> {
    const dateQuery = clientDate ? `?client_date=${encodeURIComponent(clientDate)}` : "";
    return safeFetch<RecurringSyncResult>(`/api/recurring-expenses/sync${dateQuery}`, {
      method: "POST",
    });
  },
};
