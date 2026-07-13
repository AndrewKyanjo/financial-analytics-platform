"use client";

import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import { useSearchParams } from "next/navigation";

import "@/lib/chart-config";

import { apiClient, extractApiErrorMessage } from "@/lib/apiClient";
import { formatCompactCurrency, formatShortDate } from "@/lib/format";
import { readDashboardFilters } from "@/lib/filters";
import type { RevenueSeriesResponse } from "@/lib/types";

function downloadSeriesCsv(rows: RevenueSeriesResponse["data"]) {
  const header = "date,total_revenue,transaction_count,avg_order_value";
  const lines = rows.map(
    (row) =>
      `${row.date},${row.total_revenue},${row.transaction_count},${row.avg_order_value}`,
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "revenue-timeseries.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function RevenueChart() {
  const searchParams = useSearchParams();
  const filters = readDashboardFilters(searchParams);
  const revenueQuery = useQuery({
    queryKey: ["revenue-series", filters.start, filters.end, filters.region, filters.category],
    queryFn: async () => {
      const response = await apiClient.get<RevenueSeriesResponse>("/api/revenue", {
        params: {
          start: filters.start,
          end: filters.end,
          region: filters.region || undefined,
          category: filters.category || undefined,
        },
      });

      return response.data;
    },
  });

  return (
    <div className="flex h-96 flex-col rounded border border-outline-variant bg-surface-container-lowest p-md lg:col-span-7">
      <div className="mb-md flex items-center justify-between">
        <div>
          <h2 className="text-headline-sm font-headline-sm text-primary">Revenue Over Time</h2>
          {revenueQuery.data ? (
            <p className="mt-xs text-label-mono font-label-mono text-on-surface-variant">
              Source: {revenueQuery.data.source}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => revenueQuery.data && downloadSeriesCsv(revenueQuery.data.data)}
          className="rounded p-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!revenueQuery.data}
          aria-label="Download revenue time series"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
        </button>
      </div>

      <div className="relative flex-1">
        {revenueQuery.isLoading ? (
          <div className="flex h-full animate-pulse items-center justify-center rounded bg-surface-container-low">
            <span className="text-body-md text-on-surface-variant">Loading revenue trend...</span>
          </div>
        ) : revenueQuery.isError ? (
          <div className="flex h-full items-center justify-center rounded border border-error/30 bg-error-container px-md text-center text-body-md text-on-error-container">
            {extractApiErrorMessage(revenueQuery.error)}
          </div>
        ) : revenueQuery.data && revenueQuery.data.data.length > 0 ? (
          <Line
            data={{
              labels: revenueQuery.data.data.map((point) => formatShortDate(point.date)),
              datasets: [
                {
                  label: "Revenue",
                  data: revenueQuery.data.data.map((point) => point.total_revenue),
                  borderColor: "#0058be",
                  backgroundColor: "rgba(0, 88, 190, 0.12)",
                  fill: true,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  tension: 0.35,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: "index",
                intersect: false,
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => formatCompactCurrency(Number(context.parsed.y ?? 0)),
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    maxTicksLimit: 6,
                  },
                },
                y: {
                  ticks: {
                    callback: (value) => formatCompactCurrency(Number(value)),
                  },
                },
              },
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-outline-variant bg-surface-container-low px-md text-center text-body-md text-on-surface-variant">
            No revenue points matched the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
