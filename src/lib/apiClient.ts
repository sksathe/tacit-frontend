type ApiClientOptions = {
  baseUrl?: string;
};

export type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  token?: string;
  headers?: Record<string, string>;
};

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getApiBaseUrl(): string {
  const fromEnv =
    (import.meta as any)?.env?.VITE_API_BASE_URL ??
    (import.meta as any)?.env?.VITE_API_URL ??
    "";

  // 1. Explicit env var wins (Render prod, custom setups, etc.)
  if (String(fromEnv || "").trim()) {
    return normalizeBaseUrl(String(fromEnv));
  }

  // 2. Local dev convenience: if frontend is running on localhost, default to local backend
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
      return normalizeBaseUrl("http://localhost:3001");
    }
  }

  // 3. Production must set VITE_API_BASE_URL at build time (see .env.example).
  // Do not fall back to a stale backend — that causes 404s for newer routes (e.g. MANU).
  if (typeof window !== "undefined") {
    console.warn(
      "[apiClient] VITE_API_BASE_URL is not set. Set it to your deployed backend URL and rebuild the frontend.",
    );
  }
  return "";
}

export function createApiClient(opts: ApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(opts.baseUrl ?? getApiBaseUrl());

  async function request(path: string, options: ApiRequestOptions = {}) {
    const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      ...(options.headers ?? {}),
    };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });

    return res;
  }

  async function requestJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const res = await request(path, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers ?? {}),
      },
    });

    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as any;
        message = body?.error || body?.message || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return (await res.json()) as T;
  }

  return { request, requestJson };
}

export const apiClient = createApiClient();
