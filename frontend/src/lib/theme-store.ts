"use client";

import { create } from "zustand";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "financial-analytics-theme";

interface ThemeState {
  theme: ThemeMode;
  isHydrated: boolean;
  hydrate: () => void;
  toggleTheme: () => void;
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
}

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  isHydrated: false,
  hydrate: () => {
    const theme = getPreferredTheme();
    applyTheme(theme);
    set({
      theme,
      isHydrated: true,
    });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }

    applyTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));
