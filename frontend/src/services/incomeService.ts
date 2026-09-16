import { safeFetch, SafeFetchResult } from "@/lib/api";
import type { Income, RecurringIncomeSyncResult } from "@/types";

export type CreateIncomeInput = Omit<Income, "id">;
export type UpdateIncomeInput = Partial<Omit<Income, "id">>;

/**
 * Service to manage Income transactions adhering to the Single Responsibility Principle (SRP).
 * Isolates all HTTP network communication and response parsing for incomes.
 */
export const incomeService = {
  /**
   * Retrieves all incomes for the authenticated user.
   */
  async getIncomes(): Promise<SafeFetchResult<Income[]>> {
    return safeFetch<Income[]>("/api/incomes");
  },

  /**
   * Creates a new income transaction.
   */
  async createIncome(data: CreateIncomeInput): Promise<SafeFetchResult<Income>> {
    return safeFetch<Income>("/api/incomes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing income by ID.
   */
  async updateIncome(id: string, data: UpdateIncomeInput): Promise<SafeFetchResult<Income>> {
    return safeFetch<Income>(`/api/incomes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes an income by ID.
   */
  async deleteIncome(id: string): Promise<SafeFetchResult<{ message: string }>> {
    return safeFetch<{ message: string }>(`/api/incomes/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Synchronizes and registers pending recurring incomes for the current cycle.
   */
  async syncRecurringIncomes(clientDate?: string): Promise<SafeFetchResult<RecurringIncomeSyncResult>> {
    const dateQuery = clientDate ? `?client_date=${encodeURIComponent(clientDate)}` : "";
    return safeFetch<RecurringIncomeSyncResult>(`/api/recurring-incomes/sync${dateQuery}`, {
      method: "POST",
    });
  },
};
