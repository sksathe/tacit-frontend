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
  const fallback = "https://tacit-backend-puvm.onrender.com";

  const fromEnv =
    (import.meta as any)?.env?.VITE_API_BASE_URL ??
    (import.meta as any)?.env?.VITE_API_URL ??
    "";

  return normalizeBaseUrl(String(fromEnv || fallback));
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
