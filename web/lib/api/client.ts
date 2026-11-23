import type { ApiErrorPayload } from "@/lib/api/types";

const TOKEN_KEY = "uptake:token";
export const TOKEN_EVENT = "uptake:token-change";
export const UNAUTHORIZED_EVENT = "uptake:unauthorized";
const API_PREFIX = "/api";

export class ApiRequestError extends Error {
  status: number;
  issues?: Record<string, string[]>;

  constructor(status: number, message: string, issues?: Record<string, string[]>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.issues = issues;
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

type QueryValue = string | number | boolean | null | undefined;

function buildPath(path: string, params?: Record<string, QueryValue>) {
  if (!params) return path;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const query = search.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_PREFIX}${path}`, { ...init, headers });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }

    if (response.status === 401 && token && path !== "/auth/login" && path !== "/auth/register") {
      setToken(null);
      if (typeof window !== "undefined") window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new ApiRequestError(response.status, payload?.error ?? "Erro inesperado", payload?.issues);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get<T>(path: string, params?: Record<string, QueryValue>) {
    return request<T>(buildPath(path, params), { method: "GET" });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
  },
  patch<T>(path: string, body: unknown) {
    return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  },
  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" });
  },
};
