import { safeFetch, SafeFetchResult } from "@/lib/api";
import type { Category } from "@/types";

export interface CreateCategoryInput {
  name: string;
  type: "expense" | "income";
  color?: string;
  icon?: string;
}

export interface DeleteCategoryResponse {
  message?: string;
  in_use?: boolean;
  count?: number;
  category_name?: string;
  reassigned?: boolean;
  reassigned_to?: string;
  reassigned_count?: number;
}

/**
 * Service to manage custom Categories adhering to SRP and DIP.
 * Isolates all category API communications.
 */
export const categoryService = {
  /**
   * Retrieves categories optionally filtered by type (expense or income).
   */
  async getCategories(filterType?: "expense" | "income"): Promise<SafeFetchResult<Category[]>> {
    const query = filterType ? `?type=${filterType}` : "";
    return safeFetch<Category[]>(`/api/categories${query}`);
  },

  /**
   * Creates a new custom category.
   */
  async createCategory(data: CreateCategoryInput): Promise<SafeFetchResult<Category>> {
    return safeFetch<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a category by ID, with optional reassignment of associated transactions.
   */
  async deleteCategory(id: string, reassignTo?: string): Promise<SafeFetchResult<DeleteCategoryResponse>> {
    const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : "";
    return safeFetch<DeleteCategoryResponse>(`/api/categories/${id}${query}`, {
      method: "DELETE",
    });
  },
};
