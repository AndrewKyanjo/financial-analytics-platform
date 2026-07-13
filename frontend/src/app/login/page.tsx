"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { apiClient, extractApiErrorMessage } from "@/lib/apiClient";
import type { TokenResponse } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("viewer@example.com");
  const [password, setPassword] = useState("viewerpass");
  const [rememberMe, setRememberMe] = useState(true);
  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<TokenResponse>("/api/auth/login", {
        email,
        password,
      });
      return response.data;
    },
    onSuccess: (response) => {
      setSession(
        {
          token: response.access_token,
          role: response.role,
          expiresAt: Date.now() + response.expires_in * 1000,
        },
        rememberMe,
      );
      router.replace("/");
    },
  });

  useEffect(() => {
    if (isHydrated && token) {
      router.replace("/");
    }
  }, [isHydrated, token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low p-md">
      <div className="w-full max-w-[28rem] min-w-[20rem]">
        <div className="mb-xl text-center">
          <h1 className="flex items-center justify-center gap-sm text-headline-md font-headline-md tracking-tight text-primary">
            <span aria-hidden="true" className="material-symbols-outlined text-secondary">
              analytics
            </span>
            Financial Analytics
          </h1>
          <p className="mt-sm text-body-md font-body-md text-on-surface-variant">
            Secure access to professional market insights.
          </p>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-xl">
          <form
            className="space-y-lg"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate();
            }}
          >
            {loginMutation.isError ? (
              <div className="rounded border border-error/30 bg-error-container px-md py-sm text-body-md text-on-error-container">
                {extractApiErrorMessage(loginMutation.error)}
              </div>
            ) : null}

            <div className="space-y-xs">
              <label
                htmlFor="email"
                className="block text-label-mono font-label-mono uppercase text-on-surface"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm">
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-outline">
                    mail
                  </span>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="professional@firm.com"
                  className="block w-full rounded border border-outline-variant bg-surface-container-lowest py-sm pr-sm pl-xl text-body-md text-on-surface transition-shadow focus:border-secondary focus:ring-2 focus:ring-secondary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-xs">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-label-mono font-label-mono uppercase text-on-surface"
                >
                  Password
                </label>
                <Link
                  href="/login"
                  className="text-label-mono font-label-mono text-secondary transition-colors hover:text-secondary-container"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm">
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-outline">
                    lock
                  </span>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="block w-full rounded border border-outline-variant bg-surface-container-lowest py-sm pr-sm pl-xl text-body-md text-on-surface transition-shadow focus:border-secondary focus:ring-2 focus:ring-secondary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-outline-variant text-secondary focus:ring-secondary"
              />
              <label
                htmlFor="remember-me"
                className="ml-sm block cursor-pointer text-body-md font-body-md text-on-surface-variant"
              >
                Remember this device for 30 days
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex w-full justify-center rounded border border-transparent bg-primary px-md py-sm text-label-mono font-label-mono uppercase text-on-primary transition-colors duration-150 hover:bg-surface-tint focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-lg border-t border-outline-variant pt-lg text-center">
            <p className="text-body-md font-body-md text-on-surface-variant">
              Need an enterprise account?{" "}
              <a
                href="mailto:sales@example.com"
                className="text-[14px] font-headline-sm text-secondary transition-colors hover:text-secondary-container"
              >
                Contact Sales
              </a>
            </p>
          </div>
        </div>

        <footer className="mt-xl text-center">
          <p className="text-label-mono font-label-mono uppercase text-outline">
            (c) 2026 Financial Analytics Platform. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
