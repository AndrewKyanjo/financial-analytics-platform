"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { CategoryBarChart } from "@/components/CategoryBarChart";
import { FilterBar } from "@/components/FilterBar";
import { KpiCard } from "@/components/KpiCard";
import { RevenueChart } from "@/components/RevenueChart";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, extractApiErrorMessage } from "@/lib/apiClient";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import type { KpiMetric, KpiSnapshotResponse } from "@/lib/types";
import { useKpiSocket } from "@/lib/websocket";

function toMetricMap(metrics: KpiMetric[]) {
  return Object.fromEntries(metrics.map((metric) => [metric.name, metric]));
}

function toTrendLabel(value: number) {
  const absolute = Math.abs(value);
  if (absolute < 0.05) {
    return { label: "Flat", tone: "neutral" as const };
  }

  return {
    label: `${Math.abs(value).toFixed(1)}%`,
    tone: value >= 0 ? ("positive" as const) : ("negative" as const),
  };
}

export default function DashboardPage() {
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const kpiQuery = useQuery({
    queryKey: ["live-kpis"],
    queryFn: async () => {
      const response = await apiClient.get<KpiSnapshotResponse>("/api/kpis/live");
      return response.data;
    },
    enabled: isHydrated && Boolean(token),
  });
  const liveSocket = useKpiSocket({
    enabled: Boolean(token),
    initialPayload: kpiQuery.data ?? null,
  });
  const liveSnapshot = liveSocket.data ?? kpiQuery.data ?? null;

  if (!isHydrated) {
    return (
      <main className="mx-auto grid max-w-[1440px] gap-grid-gutter px-grid-margin py-lg">
        <div className="h-16 animate-pulse rounded border border-outline-variant bg-surface-container-low" />
        <div className="grid grid-cols-1 gap-grid-gutter md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded border border-outline-variant bg-surface-container-low"
            />
          ))}
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="mx-auto grid max-w-[960px] gap-grid-gutter px-grid-margin py-xl">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center">
          <h1 className="text-headline-md font-headline-md text-primary">Live dashboard access requires sign in.</h1>
          <p className="mt-sm text-body-lg text-on-surface-variant">
            Authenticate first to load protected KPI, revenue, and forecast data from the FastAPI backend.
          </p>
          <Link
            href="/login"
            className="mt-lg inline-flex rounded bg-primary px-md py-sm text-label-mono font-label-mono text-on-primary transition-colors hover:bg-primary/90"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  const metricMap = toMetricMap(liveSnapshot?.metrics ?? []);
  const growthMetric = metricMap.growth_vs_previous_7d?.value ?? 0;
  const dashboardCards = [
    {
      label: "Revenue Today",
      value: formatCompactCurrency(metricMap.revenue_today?.value ?? 0),
      sparkline: liveSocket.history.revenue_today ?? [metricMap.revenue_today?.value ?? 0],
      delta: toTrendLabel(growthMetric),
    },
    {
      label: "Avg Order Value",
      value: formatCompactCurrency(metricMap.avg_order_value_today?.value ?? 0),
      sparkline:
        liveSocket.history.avg_order_value_today ?? [metricMap.avg_order_value_today?.value ?? 0],
    },
    {
      label: "Transactions Today",
      value:
        (metricMap.transactions_today?.value ?? 0) >= 1000
          ? formatCompactNumber(metricMap.transactions_today?.value ?? 0)
          : formatNumber(metricMap.transactions_today?.value ?? 0),
      sparkline:
        liveSocket.history.transactions_today ?? [metricMap.transactions_today?.value ?? 0],
    },
    {
      label: "Growth vs Previous 7D",
      value: formatPercent(growthMetric),
      sparkline:
        liveSocket.history.growth_vs_previous_7d ?? [metricMap.growth_vs_previous_7d?.value ?? 0],
      delta: toTrendLabel(growthMetric),
    },
  ];

  return (
    <main className="mx-auto grid max-w-[1440px] gap-grid-gutter px-grid-margin py-lg">
      <FilterBar />

      {liveSocket.error ? (
        <div className="rounded border border-error/30 bg-error-container px-md py-sm text-body-md text-on-error-container">
          {liveSocket.error}
        </div>
      ) : null}

      {kpiQuery.isError ? (
        <div className="rounded border border-error/30 bg-error-container px-md py-sm text-body-md text-on-error-container">
          {extractApiErrorMessage(kpiQuery.error)}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-grid-gutter md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            sparkline={card.sparkline}
            delta={card.delta}
            loading={kpiQuery.isLoading && !liveSnapshot}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-grid-gutter lg:grid-cols-12">
        <RevenueChart />
        <CategoryBarChart />
      </div>
    </main>
  );
}
