import { safeFetch, SafeFetchResult } from "@/lib/api";
import type { APIKey, CreateAPIKeyResponse } from "@/types";

/**
 * Service to manage automation API keys (for n8n, scripts, webhooks).
 */
export const apiKeyService = {
  /**
   * Retrieves all API keys generated for the current user.
   */
  async getKeys(): Promise<SafeFetchResult<APIKey[]>> {
    return safeFetch<APIKey[]>("/api/api-keys");
  },

  /**
   * Generates a new cryptographically secure API key.
   */
  async createKey(name: string): Promise<SafeFetchResult<CreateAPIKeyResponse>> {
    return safeFetch<CreateAPIKeyResponse>("/api/api-keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  /**
   * Revokes and permanently deletes an API key.
   */
  async deleteKey(id: string): Promise<SafeFetchResult<{ message: string }>> {
    return safeFetch<{ message: string }>(`/api/api-keys/${id}`, {
      method: "DELETE",
    });
  },
};
