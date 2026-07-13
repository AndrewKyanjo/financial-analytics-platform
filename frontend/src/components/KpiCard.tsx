"use client";

import { Line } from "react-chartjs-2";

import "@/lib/chart-config";

type KpiTone = "positive" | "negative" | "neutral";

interface KpiCardProps {
  label: string;
  value: string;
  sparkline: number[];
  loading?: boolean;
  error?: string | null;
  delta?: {
    label: string;
    tone: KpiTone;
  };
}

function deltaClasses(tone: KpiTone) {
  if (tone === "positive") {
    return "bg-[#e6f4ea] text-[#006837]";
  }

  if (tone === "negative") {
    return "bg-error-container text-error";
  }

  return "bg-secondary-fixed text-on-secondary-fixed";
}

function sparklineColor(tone: KpiTone) {
  if (tone === "negative") {
    return "#565e74";
  }

  return "#0058be";
}

export function KpiCard({ label, value, sparkline, loading, error, delta }: KpiCardProps) {
  const series = sparkline.length > 0 ? sparkline : [0, 0, 0, 0, 0, 0];
  const tone = delta?.tone ?? "neutral";

  return (
    <div className="group rounded border border-outline-variant bg-surface-container-lowest p-md transition-colors hover:bg-surface-container-low">
      <div className="mb-sm flex items-start justify-between">
        <h3 className="text-label-mono font-label-mono uppercase text-on-surface-variant">{label}</h3>
        <span className="material-symbols-outlined cursor-pointer text-[18px] text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100">
          more_vert
        </span>
      </div>

      {loading ? (
        <div className="space-y-md">
          <div className="h-8 w-24 animate-pulse rounded bg-surface-container" />
          <div className="h-8 animate-pulse rounded bg-surface-container" />
        </div>
      ) : error ? (
        <div className="rounded border border-error/30 bg-error-container px-sm py-sm text-body-md text-on-error-container">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-md flex items-baseline gap-sm">
            <span className="text-headline-md font-headline-md tabular-nums text-primary">{value}</span>
            {delta ? (
              <span
                className={`inline-flex items-center gap-xs rounded px-sm py-xs text-label-mono font-label-mono ${deltaClasses(tone)}`}
              >
                <span className="material-symbols-outlined text-[12px] font-bold">
                  {tone === "negative" ? "arrow_downward" : "arrow_upward"}
                </span>
                {delta.label}
              </span>
            ) : null}
          </div>

          <div className="h-8 w-full opacity-70">
            <Line
              data={{
                labels: series.map((_, index) => index + 1),
                datasets: [
                  {
                    data: series,
                    borderColor: sparklineColor(tone),
                    backgroundColor: sparklineColor(tone),
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0.35,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: false },
                },
                scales: {
                  x: { display: false },
                  y: { display: false },
                },
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
