"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/auth-store";
import { useThemeStore } from "@/lib/theme-store";

function navLinkClass(active: boolean) {
  if (active) {
    return "text-secondary dark:text-secondary-fixed-dim border-b-2 border-secondary dark:border-secondary-fixed-dim pb-1 font-semibold h-full flex items-center pt-2 opacity-80 scale-95 transition-transform";
  }

  return "text-label-mono font-label-mono text-on-surface-variant dark:text-surface-variant hover:text-on-surface dark:hover:text-inverse-on-surface pb-1 h-full flex items-center pt-2 hover:bg-surface-container dark:hover:bg-inverse-surface transition-colors duration-150 px-sm rounded-t";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface pt-16">
      <nav className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-grid-margin dark:border-outline dark:bg-surface-container-high">
        <div className="flex items-center gap-md">
          <Link
            href="/"
            className="text-headline-md font-headline-md tracking-tight text-primary dark:text-inverse-primary"
          >
            Financial Analytics
          </Link>
          <div className="relative ml-lg hidden md:block">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="w-64 rounded border border-outline-variant bg-surface-container-low py-sm pr-sm pl-xl text-body-md text-on-surface transition-colors duration-150 placeholder:text-on-surface-variant focus:border-transparent focus:ring-2 focus:ring-secondary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex h-full items-center gap-xl">
          <div className="hidden h-full items-center gap-md pt-1 md:flex">
            <Link href="/" className={navLinkClass(pathname === "/")}>
              Dashboard
            </Link>
            <Link href="/forecast" className={navLinkClass(pathname.startsWith("/forecast"))}>
              Forecast
            </Link>
          </div>

          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded p-xs text-on-surface-variant transition-colors duration-150 hover:bg-surface-container hover:text-on-surface"
              aria-label="Toggle dark mode"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <span className="material-symbols-outlined">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {token ? (
              <>
                <div
                  className="hidden items-center gap-xs rounded border border-outline-variant bg-surface-container-low px-sm py-xs text-label-mono font-label-mono uppercase text-on-surface-variant md:flex"
                  title={`Signed in as ${role}`}
                >
                  <span className="material-symbols-outlined text-[16px]">account_circle</span>
                  {role}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="rounded p-xs text-on-surface-variant transition-colors duration-150 hover:bg-surface-container hover:text-on-surface"
                  aria-label="Log out"
                  title="Log out"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="ml-md rounded bg-primary px-md py-sm text-label-mono font-label-mono text-on-primary transition-colors hover:bg-primary/90"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
