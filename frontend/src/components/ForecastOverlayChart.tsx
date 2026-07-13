"use client";

import { Line } from "react-chartjs-2";

import "@/lib/chart-config";

import { formatCompactCurrency, formatShortDate } from "@/lib/format";
import type { ForecastPoint, RevenuePoint } from "@/lib/types";

interface ForecastOverlayChartProps {
  actuals: RevenuePoint[];
  forecasts: ForecastPoint[];
  loading?: boolean;
  error?: string | null;
}

export function ForecastOverlayChart({
  actuals,
  forecasts,
  loading,
  error,
}: ForecastOverlayChartProps) {
  const combinedLabels = [
    ...actuals.map((point) => point.date),
    ...forecasts.map((point) => point.forecast_date),
  ];
  const actualSeries = actuals.map((point) => point.total_revenue);
  const lowerSeries = [
    ...actuals.map(() => null),
    ...forecasts.map((point) => point.lower_bound),
  ];
  const upperSeries = [
    ...actuals.map(() => null),
    ...forecasts.map((point) => point.upper_bound),
  ];
  const forecastSeries = [
    ...actuals.map(() => null),
    ...forecasts.map((point) => point.predicted_revenue),
  ];
  const todayMarker =
    actuals.length > 0 && combinedLabels.length > 1
      ? ((actuals.length - 1) / (combinedLabels.length - 1)) * 100
      : 0;

  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
      <div className="absolute top-lg right-lg z-10 flex gap-md">
        <div className="flex items-center gap-xs">
          <div className="h-3 w-3 rounded-full bg-tertiary" />
          <span className="text-label-mono font-label-mono text-on-surface-variant">Actuals</span>
        </div>
        <div className="flex items-center gap-xs">
          <div className="h-3 w-3 rounded-full bg-secondary-fixed-dim" />
          <span className="text-label-mono font-label-mono text-on-surface-variant">Predicted</span>
        </div>
        <div className="flex items-center gap-xs">
          <div className="h-3 w-3 border border-outline-variant bg-surface-variant opacity-50" />
          <span className="text-label-mono font-label-mono text-on-surface-variant">
            Confidence (95%)
          </span>
        </div>
      </div>

      <div className="relative mt-xl h-[360px]">
        {loading ? (
          <div className="flex h-full animate-pulse items-center justify-center rounded bg-surface-container-low">
            <span className="text-body-md text-on-surface-variant">Loading forecast model output...</span>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded border border-error/30 bg-error-container px-md text-center text-body-md text-on-error-container">
            {error}
          </div>
        ) : combinedLabels.length > 0 ? (
          <>
            <div
              className="pointer-events-none absolute top-0 bottom-10 z-10 border-l border-dashed border-error"
              style={{ left: `${todayMarker}%` }}
            >
              <span className="absolute top-0 -left-5 rounded bg-surface px-1 text-label-mono font-label-mono text-error">
                Today
              </span>
            </div>
            <Line
              data={{
                labels: combinedLabels.map((label) => formatShortDate(label)),
                datasets: [
                  {
                    label: "Actuals",
                    data: [...actualSeries, ...forecasts.map(() => null)],
                    borderColor: "#000000",
                    backgroundColor: "#000000",
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.35,
                    spanGaps: true,
                  },
                  {
                    label: "Lower Bound",
                    data: lowerSeries,
                    borderColor: "rgba(216, 226, 255, 0)",
                    pointRadius: 0,
                    tension: 0.35,
                    spanGaps: true,
                  },
                  {
                    label: "Confidence (95%)",
                    data: upperSeries,
                    borderColor: "rgba(216, 226, 255, 0)",
                    backgroundColor: "rgba(216, 226, 255, 0.4)",
                    fill: "-1",
                    pointRadius: 0,
                    tension: 0.35,
                    spanGaps: true,
                  },
                  {
                    label: "Predicted",
                    data: forecastSeries,
                    borderColor: "#0058be",
                    backgroundColor: "#0058be",
                    borderDash: [8, 4],
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.35,
                    spanGaps: true,
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
                      label: (context) => {
                        if (context.parsed.y === null) {
                          return "";
                        }

                        return `${context.dataset.label}: ${formatCompactCurrency(Number(context.parsed.y ?? 0))}`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      maxTicksLimit: 8,
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
          </>
        ) : (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-outline-variant bg-surface-container-low px-md text-center text-body-md text-on-surface-variant">
            Forecast data will appear here once the model has enough history to train.
          </div>
        )}
      </div>
    </div>
  );
}
