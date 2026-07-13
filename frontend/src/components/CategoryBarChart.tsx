"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar } from "react-chartjs-2";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import "@/lib/chart-config";

import { apiClient, extractApiErrorMessage } from "@/lib/apiClient";
import { CATEGORY_OPTIONS, readDashboardFilters, REGION_OPTIONS } from "@/lib/filters";
import type { RevenueSeriesResponse } from "@/lib/types";

type BreakdownMode = "category" | "region";

function sumRevenue(response: RevenueSeriesResponse) {
  return response.data.reduce((total, point) => total + point.total_revenue, 0);
}

export function CategoryBarChart() {
  const [mode, setMode] = useState<BreakdownMode>("category");
  const searchParams = useSearchParams();
  const filters = readDashboardFilters(searchParams);
  const selectedValues =
    mode === "category"
      ? filters.category
        ? [filters.category]
        : [...CATEGORY_OPTIONS]
      : filters.region
        ? [filters.region]
        : [...REGION_OPTIONS];

  const breakdownQuery = useQuery({
    queryKey: ["revenue-breakdown", mode, filters.start, filters.end, filters.region, filters.category],
    queryFn: async () => {
      const rows = await Promise.all(
        selectedValues.map(async (value) => {
          const response = await apiClient.get<RevenueSeriesResponse>("/api/revenue", {
            params:
              mode === "category"
                ? {
                    start: filters.start,
                    end: filters.end,
                    region: filters.region || undefined,
                    category: value,
                  }
                : {
                    start: filters.start,
                    end: filters.end,
                    region: value,
                    category: filters.category || undefined,
                  },
          });

          return {
            label: value,
            total: sumRevenue(response.data),
          };
        }),
      );

      return rows.sort((left, right) => right.total - left.total);
    },
  });

  return (
    <div className="flex h-96 flex-col rounded border border-outline-variant bg-surface-container-lowest p-md lg:col-span-5">
      <div className="mb-md flex items-center justify-between">
        <h2 className="text-headline-sm font-headline-sm text-primary">Revenue by Category</h2>
        <div className="flex rounded border border-outline-variant bg-surface-container-low p-xs">
          <button
            type="button"
            onClick={() => setMode("category")}
            className={`rounded px-sm py-xs text-label-mono font-label-mono transition-colors ${
              mode === "category"
                ? "border border-outline-variant/50 bg-surface-container-lowest text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Category
          </button>
          <button
            type="button"
            onClick={() => setMode("region")}
            className={`rounded px-sm py-xs text-label-mono font-label-mono transition-colors ${
              mode === "region"
                ? "border border-outline-variant/50 bg-surface-container-lowest text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Region
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        {breakdownQuery.isLoading ? (
          <div className="flex h-full animate-pulse items-center justify-center rounded bg-surface-container-low">
            <span className="text-body-md text-on-surface-variant">Loading breakdown...</span>
          </div>
        ) : breakdownQuery.isError ? (
          <div className="flex h-full items-center justify-center rounded border border-error/30 bg-error-container px-md text-center text-body-md text-on-error-container">
            {extractApiErrorMessage(breakdownQuery.error)}
          </div>
        ) : breakdownQuery.data && breakdownQuery.data.length > 0 ? (
          <Bar
            data={{
              labels: breakdownQuery.data.map((item) => item.label),
              datasets: [
                {
                  label: "Revenue",
                  data: breakdownQuery.data.map((item) => item.total),
                  backgroundColor: ["#0058be", "#565e74", "#b7c8e1", "#c6c6cd"],
                  borderRadius: 4,
                  borderSkipped: false,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(Number(context.parsed.x ?? 0)),
                  },
                },
              },
              scales: {
                x: {
                  ticks: {
                    callback: (value) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(Number(value)),
                  },
                },
                y: {
                  grid: { display: false },
                },
              },
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-outline-variant bg-surface-container-low px-md text-center text-body-md text-on-surface-variant">
            No breakdown values matched the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
