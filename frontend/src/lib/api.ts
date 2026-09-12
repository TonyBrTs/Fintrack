import { supabase } from "./supabaseClient";

let currentToken: string | null = null;

// Keep token cache updated synchronously in memory
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data: { session } }) => {
    currentToken = session?.access_token ?? null;
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    currentToken = session?.access_token ?? null;
  });
}

/**
 * Get sanitized API Base URL with fallback to local backend
 */
export const getApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return url.replace(/\/+$/, "");
};

/**
 * Common headers for all API requests. Automatically injects Supabase JWT bearer token.
 */
export const getApiHeaders = (extraHeaders: Record<string, string> = {}): Record<string, string> => {
  let token = currentToken;

  // Fallback to localStorage synchronous lookup if token not yet loaded in memory
  if (!token && typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed?.access_token || parsed?.currentSession?.access_token || null;
            if (token) {
              currentToken = token;
              break;
            }
          }
        }
      }
    } catch {
      // Ignore localStorage access errors
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

export interface SafeFetchResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

/**
 * Safe fetch wrapper that handles timeouts, server errors, and network disconnects
 * without throwing unhandled exceptions that break the Next.js runtime.
 */
export async function safeFetch<T = unknown>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<SafeFetchResult<T>> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const timeout = options.timeoutMs ?? 7000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = getApiHeaders(options.headers as Record<string, string>);
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      let errorMsg = `Error del servidor (${res.status})`;
      try {
        const body = await res.json();
        if (body?.error) errorMsg = body.error;
        else if (body?.message) errorMsg = body.message;
      } catch {
        // Body is not JSON
      }
      return { ok: false, status: res.status, data: null, error: errorMsg };
    }

    const data = await res.json();
    return { ok: true, status: res.status, data: data as T };
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    const errorMsg = isTimeout
      ? "Tiempo de espera agotado al contactar con el backend."
      : "No se pudo establecer conexión con el backend. Asegúrate de que el servidor esté encendido.";
    return { ok: false, status: 0, data: null, error: errorMsg };
  }
}
