"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ForecastOverlayChart } from "@/components/ForecastOverlayChart";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, extractApiErrorMessage } from "@/lib/apiClient";
import { formatCurrency, formatLongDate, formatTimestamp } from "@/lib/format";
import { getDefaultDashboardFilters } from "@/lib/filters";
import type { ForecastResponse, RevenueSeriesResponse } from "@/lib/types";

const HORIZON_DAYS = 30;
const ROWS_PER_PAGE = 6;

function forecastRiskLevel(predictedRevenue: number, lowerBound: number | null, upperBound: number | null) {
  const range = (upperBound ?? predictedRevenue) - (lowerBound ?? predictedRevenue);
  const ratio = predictedRevenue > 0 ? range / predictedRevenue : 0;

  if (ratio < 0.12) {
    return {
      label: "Low",
      className: "bg-secondary-fixed text-on-secondary-fixed",
    };
  }

  if (ratio < 0.24) {
    return {
      label: "Medium",
      className: "bg-tertiary-fixed text-on-tertiary-fixed",
    };
  }

  return {
    label: "High",
    className: "bg-error-container text-on-error-container",
  };
}

function downloadForecastCsv(rows: ForecastResponse["forecasts"]) {
  const header = "forecast_date,predicted_revenue,lower_bound,upper_bound";
  const lines = rows.map(
    (row) =>
      `${row.forecast_date},${row.predicted_revenue},${row.lower_bound ?? ""},${row.upper_bound ?? ""}`,
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "forecast-output.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ForecastPage() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [page, setPage] = useState(1);
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const defaultRange = getDefaultDashboardFilters();
  const actualRevenueQuery = useQuery({
    queryKey: ["forecast-actual-series", defaultRange.start, defaultRange.end],
    queryFn: async () => {
      const response = await apiClient.get<RevenueSeriesResponse>("/api/revenue", {
        params: {
          start: defaultRange.start,
          end: defaultRange.end,
        },
      });
      return response.data;
    },
    enabled: isHydrated && Boolean(token),
  });
  const forecastQuery = useQuery({
    queryKey: ["forecast", HORIZON_DAYS],
    queryFn: async () => {
      const response = await apiClient.get<ForecastResponse>("/api/forecast", {
        params: { horizon: HORIZON_DAYS },
      });
      return response.data;
    },
    enabled: isHydrated && Boolean(token),
  });
  const retrainMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ForecastResponse>("/api/forecast/retrain", null, {
        params: { horizon: HORIZON_DAYS },
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["forecast"] });
    },
  });

  if (!isHydrated) {
    return (
      <main className="mx-auto flex max-w-[1440px] flex-col gap-xl px-grid-margin py-xl">
        <div className="h-20 animate-pulse rounded bg-surface-container-low" />
        <div className="h-[420px] animate-pulse rounded-xl bg-surface-container-low" />
      </main>
    );
  }

  if (!token) {
    return (
      <main className="mx-auto grid max-w-[960px] gap-grid-gutter px-grid-margin py-xl">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center">
          <h1 className="text-headline-md font-headline-md text-primary">Forecast insights are protected.</h1>
          <p className="mt-sm text-body-lg text-on-surface-variant">
            Sign in with a viewer or admin account to load forecast charts and model output.
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

  const forecastRows = forecastQuery.data?.forecasts ?? [];
  const visibleRows = highRiskOnly
    ? forecastRows.filter((row) => forecastRiskLevel(row.predicted_revenue, row.lower_bound, row.upper_bound).label === "High")
    : forecastRows;
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / ROWS_PER_PAGE));
  const clampedPage = Math.min(page, pageCount);
  const pagedRows = visibleRows.slice((clampedPage - 1) * ROWS_PER_PAGE, clampedPage * ROWS_PER_PAGE);
  const chartError = forecastQuery.isError
    ? extractApiErrorMessage(forecastQuery.error)
    : actualRevenueQuery.isError
      ? extractApiErrorMessage(actualRevenueQuery.error)
      : retrainMutation.isError
        ? extractApiErrorMessage(retrainMutation.error)
        : null;

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-xl px-grid-margin py-xl">
      <div className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h1 className="text-display-lg font-display-lg text-primary">Revenue Forecast Insight</h1>
          <p className="mt-sm text-body-lg font-body-lg text-on-surface-variant">
            Predictive modeling for the next {HORIZON_DAYS} days of fiscal performance.
          </p>
          {forecastQuery.data ? (
            <p className="mt-sm text-label-mono font-label-mono uppercase text-on-surface-variant">
              Model {forecastQuery.data.model_version} | Generated{" "}
              {formatTimestamp(forecastQuery.data.generated_at)}
            </p>
          ) : null}
        </div>

        {role === "admin" ? (
          <button
            type="button"
            onClick={() => retrainMutation.mutate()}
            disabled={retrainMutation.isPending}
            className="flex items-center gap-xs rounded-lg border border-outline-variant bg-secondary-container px-md py-sm text-label-mono font-label-mono text-on-secondary-container transition-colors hover:bg-secondary hover:text-on-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="material-symbols-outlined">model_training</span>
            {retrainMutation.isPending ? "Retraining..." : "Retrain Model"}
          </button>
        ) : null}
      </div>

      <ForecastOverlayChart
        actuals={actualRevenueQuery.data?.data ?? []}
        forecasts={forecastRows}
        loading={forecastQuery.isLoading || actualRevenueQuery.isLoading}
        error={chartError}
      />

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container px-lg py-md">
          <h2 className="text-headline-sm font-headline-sm text-primary">Tabular Forecast Output</h2>
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={() => downloadForecastCsv(forecastRows)}
              disabled={!forecastRows.length}
              className="rounded border border-outline-variant p-sm text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Download forecast table"
            >
              <span className="material-symbols-outlined text-sm">download</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHighRiskOnly((current) => !current);
                setPage(1);
              }}
              className={`rounded border border-outline-variant p-sm transition-colors ${
                highRiskOnly
                  ? "bg-surface-container-high text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
              aria-label="Toggle high-risk rows"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-label-mono font-label-mono uppercase tracking-wider text-on-surface-variant">
                <th className="p-md font-medium">Date Period</th>
                <th className="p-md text-right font-medium">Predicted Revenue</th>
                <th className="p-md text-right font-medium">Lower Bound (95%)</th>
                <th className="p-md text-right font-medium">Upper Bound (95%)</th>
                <th className="p-md text-center font-medium">Variance Risk</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md text-on-surface">
              {forecastQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-surface-variant">
                    <td className="p-md" colSpan={5}>
                      <div className="h-10 animate-pulse rounded bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : pagedRows.length > 0 ? (
                pagedRows.map((row) => {
                  const risk = forecastRiskLevel(
                    row.predicted_revenue,
                    row.lower_bound,
                    row.upper_bound,
                  );

                  return (
                    <tr
                      key={row.forecast_date}
                      className="border-b border-surface-variant transition-colors hover:bg-surface-container"
                    >
                      <td className="p-md">{formatLongDate(row.forecast_date)}</td>
                      <td className="p-md text-right font-medium text-primary">
                        {formatCurrency(row.predicted_revenue)}
                      </td>
                      <td className="p-md text-right text-on-surface-variant">
                        {formatCurrency(row.lower_bound ?? row.predicted_revenue)}
                      </td>
                      <td className="p-md text-right text-on-surface-variant">
                        {formatCurrency(row.upper_bound ?? row.predicted_revenue)}
                      </td>
                      <td className="p-md text-center">
                        <span
                          className={`inline-flex items-center rounded px-2 py-1 text-label-mono font-label-mono ${risk.className}`}
                        >
                          {risk.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-lg text-center text-body-md text-on-surface-variant"
                  >
                    {highRiskOnly
                      ? "No high-risk forecast rows matched the current model output."
                      : "No forecast rows are available yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant px-lg py-md text-label-mono font-label-mono text-on-surface-variant">
          <span>
            Showing {visibleRows.length === 0 ? 0 : (clampedPage - 1) * ROWS_PER_PAGE + 1} to{" "}
            {Math.min(clampedPage * ROWS_PER_PAGE, visibleRows.length)} of {visibleRows.length} periods
          </span>
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={clampedPage === 1}
              className="rounded border border-outline-variant px-sm py-xs transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={clampedPage === pageCount}
              className="rounded border border-outline-variant px-sm py-xs transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
