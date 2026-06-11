import { BUILD_TIME_API_BASE_URL } from "@/generated/apiBase";

declare global {
  interface Window {
    __TACIT_API_BASE__?: string;
  }
}

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

function readConfiguredApiBase(): string {
  const fromWindow =
    typeof window !== "undefined" ? String(window.__TACIT_API_BASE__ ?? "").trim() : "";
  const fromEnv =
    String(
      (import.meta as any)?.env?.VITE_API_BASE_URL ??
        (import.meta as any)?.env?.VITE_API_URL ??
        "",
    ).trim();
  const fromBuild = String(BUILD_TIME_API_BASE_URL ?? "").trim();

  return fromWindow || fromEnv || fromBuild;
}

export function getApiBaseUrl(): string {
  const configured = readConfiguredApiBase();

  // 1. Explicit build/runtime config wins (Render prod, custom setups, etc.)
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  // 2. Local dev convenience: if frontend is running on localhost, default to local backend
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
      return normalizeBaseUrl("http://localhost:3001");
    }
  }

  // 3. Same-origin /api/* — works when the static host rewrites /api to the backend (see render.yaml).
  if (typeof window !== "undefined") {
    console.warn(
      "[apiClient] No API base URL in this build. Using same-origin /api/* — configure VITE_API_BASE_URL at build time or add a host rewrite to your backend.",
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

  function apiConfigHint(requestUrl: string): string {
    if (!baseUrl) {
      return " No API base URL in this build. Set VITE_API_BASE_URL on the frontend service, clear build cache, redeploy, OR add a /api/* rewrite to your backend on the static host (see render.yaml). Check /config.json on the deployed site to verify what was baked in.";
    }
    if (baseUrl.includes("localhost")) {
      return ` This build points at ${baseUrl} (localhost). Set VITE_API_BASE_URL to your deployed backend URL and rebuild.`;
    }
    if (requestUrl.includes("onrender.com") && !requestUrl.includes("/api/")) {
      return " Request may be hitting the frontend host instead of the backend API service.";
    }
    return ` Check that ${baseUrl} is your backend (not frontend) and that the latest backend is deployed with /api routes.`;
  }

  async function parseJsonBody<T>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (contentType.includes("text/html") || raw.trimStart().startsWith("<!")) {
      throw new Error(
        `API returned HTML instead of JSON (configured base: ${baseUrl || "(empty)"}).${apiConfigHint(res.url)} Full URL: ${res.url}`,
      );
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`API returned invalid JSON.${apiConfigHint(res.url)}`);
    }
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
        const body = await parseJsonBody<{ error?: string; message?: string }>(res);
        message = body?.error || body?.message || message;
      } catch (err) {
        if (err instanceof Error && err.message.includes("HTML")) {
          throw err;
        }
      }
      throw new Error(message);
    }

    return parseJsonBody<T>(res);
  }

  return { request, requestJson };
}

export const apiClient = createApiClient();
