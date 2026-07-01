import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { API_URL } from "../config";
import { tokenStorage } from "../auth/storage";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Called when the refresh token is also invalid -> force a logout.
let onAuthFailure: (() => void) | null = null;
export function setOnAuthFailure(cb: () => void) {
  onAuthFailure = cb;
}

// Attach the access token to every request.
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const access = await tokenStorage.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// On 401, try to refresh the access token once, then replay the request.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStorage.getRefresh();
  if (!refresh) return null;
  try {
    // Use a bare axios call so we don't loop through the interceptors.
    const resp = await axios.post(`${API_URL}/api/auth/token/refresh/`, { refresh });
    const newAccess: string = resp.data.access;
    const newRefresh: string | undefined = resp.data.refresh;
    if (newRefresh) {
      await tokenStorage.save(newAccess, newRefresh);
    } else {
      await tokenStorage.saveAccess(newAccess);
    }
    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      // De-duplicate concurrent refreshes.
      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const newAccess = await refreshing;

      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }

      // Refresh failed -> log the user out.
      await tokenStorage.clear();
      onAuthFailure?.();
    }

    return Promise.reject(error);
  }
);

/** Turn an axios error into a human-friendly message. */
export function getErrorMessage(error: unknown, fallback = "Algo deu errado."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; errors?: Record<string, string[] | string> }
      | undefined;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first)) return first[0];
      if (typeof first === "string") return first;
    }
    if (data?.detail) return data.detail;
    if (error.code === "ECONNABORTED") return "Tempo de conexão esgotado.";
    if (!error.response) return "Não foi possível conectar ao servidor.";
  }
  return fallback;
}
