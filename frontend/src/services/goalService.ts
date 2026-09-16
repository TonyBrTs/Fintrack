import { safeFetch, SafeFetchResult } from "@/lib/api";
import type { Goal } from "@/types";

export type CreateGoalInput = Omit<Goal, "id">;
export type UpdateGoalInput = Partial<Goal>;

/**
 * Service to manage Savings Goals adhering to SRP and DIP.
 * Abstracts REST calls for goals.
 */
export const goalService = {
  /**
   * Retrieves all goals for the authenticated user.
   */
  async getGoals(): Promise<SafeFetchResult<Goal[]>> {
    return safeFetch<Goal[]>("/api/goals");
  },

  /**
   * Creates a new savings goal.
   */
  async createGoal(data: CreateGoalInput): Promise<SafeFetchResult<Goal>> {
    return safeFetch<Goal>("/api/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing goal by ID.
   */
  async updateGoal(id: string, data: UpdateGoalInput): Promise<SafeFetchResult<Goal>> {
    return safeFetch<Goal>(`/api/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a goal by ID.
   */
  async deleteGoal(id: string): Promise<SafeFetchResult<{ message: string }>> {
    return safeFetch<{ message: string }>(`/api/goals/${id}`, {
      method: "DELETE",
    });
  },
};
