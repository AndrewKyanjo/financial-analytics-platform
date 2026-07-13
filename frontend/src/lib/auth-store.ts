"use client";

import { create } from "zustand";

import type { UserRole } from "@/lib/types";

const AUTH_STORAGE_KEY = "financial-analytics-auth";
const AUTH_MARKER_COOKIE = "financial_analytics_session";

interface AuthSession {
  token: string;
  role: UserRole;
  expiresAt: number;
}

interface AuthState extends AuthSession {
  isHydrated: boolean;
  hydrate: () => void;
  setSession: (session: AuthSession, remember: boolean) => void;
  logout: () => void;
}

const emptySession: AuthSession = {
  token: "",
  role: "viewer",
  expiresAt: 0,
};

function clearBrowserSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_MARKER_COOKIE}=; Max-Age=0; Path=/; SameSite=Strict`;
}

function writeSessionMarker(expiresAt: number) {
  if (typeof window === "undefined") {
    return;
  }

  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie =
    `${AUTH_MARKER_COOKIE}=active; Max-Age=${maxAge}; Path=/; SameSite=Strict${secureFlag}`;
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.token || session.expiresAt <= Date.now()) {
      clearBrowserSession();
      return null;
    }

    writeSessionMarker(session.expiresAt);
    return session;
  } catch {
    clearBrowserSession();
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...emptySession,
  isHydrated: false,
  hydrate: () => {
    const storedSession = readStoredSession();

    set({
      ...(storedSession ?? emptySession),
      isHydrated: true,
    });
  },
  setSession: (session, remember) => {
    if (typeof window !== "undefined") {
      if (remember) {
        // The JWT lives in memory first and is mirrored to localStorage only for refresh persistence.
        // A production app should move this to a backend-issued httpOnly cookie because any JS-readable
        // storage remains exposed to XSS. The cookie marker below is non-sensitive and only tracks presence.
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }

      writeSessionMarker(session.expiresAt);
    }

    set(session);
  },
  logout: () => {
    clearBrowserSession();
    set(emptySession);
  },
}));
