"use client";

import axios from "axios";

import { useAuthStore } from "@/lib/auth-store";

const fallbackApiUrl = "http://localhost:8000";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url ?? "");

    if (status === 401 && !requestUrl.includes("/api/auth/login")) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

export function extractApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((entry) => {
          if (typeof entry?.msg === "string") {
            return entry.msg;
          }

          return null;
        })
        .filter(Boolean)
        .join(", ");
    }

    return error.message || "Request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
