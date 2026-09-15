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

  const clientDate = typeof window !== "undefined"
    ? new Date().toLocaleDateString("en-CA")
    : new Date().toISOString().split("T")[0];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Date": clientDate,
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
  isUnauthorized?: boolean;
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
  const isInternalRoute = endpoint.startsWith("/api/ai");
  const url = endpoint.startsWith("http")
    ? endpoint
    : isInternalRoute
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const timeout = options.timeoutMs ?? 15000;
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
      let rawError = "";
      let errorCode = "";
      try {
        const body = await res.json();
        if (body?.error) rawError = String(body.error);
        else if (body?.message) rawError = String(body.message);
        if (body?.code) errorCode = String(body.code);
      } catch {
        // Body is not JSON
      }

      let errorMsg = "No se pudo completar la operación. Por favor, intenta nuevamente.";
      let isUnauthorized = false;

      if (res.status === 401) {
        isUnauthorized = true;
        errorMsg = "Tu sesión ha expirado o necesitas iniciar sesión para continuar.";
        currentToken = null;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth:unauthorized", {
              detail: { endpoint, status: 401, error: errorMsg, code: errorCode },
            })
          );
        }
      } else if (res.status === 403) {
        isUnauthorized = true;
        errorMsg = "No tienes permisos para realizar esta acción.";
      } else if (res.status === 404) {
        errorMsg = "El registro o recurso solicitado no fue encontrado.";
      } else if (res.status >= 500) {
        errorMsg = "El servicio experimentó un inconveniente temporal. Por favor, intenta de nuevo en unos momentos.";
      } else if (
        rawError &&
        !rawError.toLowerCase().includes("database") &&
        !rawError.toLowerCase().includes("sql") &&
        !rawError.toLowerCase().includes("syntax") &&
        !rawError.toLowerCase().includes("pq:")
      ) {
        errorMsg = rawError;
      }

      return {
        ok: false,
        status: res.status,
        data: null,
        error: errorMsg,
        isUnauthorized,
      };
    }

    if (res.status === 204) {
      return { ok: true, status: 204, data: null as T };
    }

    let data = null;
    const text = await res.text();
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON response body
      }
    }

    return { ok: true, status: res.status, data: data as T };
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    const errorMsg = isTimeout
      ? "El servicio tardó demasiado en responder. Por favor, intenta de nuevo en unos momentos."
      : "No se pudo comunicar con el servicio en este momento. Por favor, verifica tu conexión a internet o intenta nuevamente.";
    return { ok: false, status: 0, data: null, error: errorMsg };
  }
}
