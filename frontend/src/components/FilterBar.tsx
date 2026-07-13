"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  buildDashboardSearchParams,
  CATEGORY_OPTIONS,
  getDefaultDashboardFilters,
  readDashboardFilters,
  REGION_OPTIONS,
  type DashboardFilters,
} from "@/lib/filters";

export function FilterBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = readDashboardFilters(searchParams);

  const updateFilters = (nextFilters: DashboardFilters) => {
    const params = buildDashboardSearchParams(nextFilters);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-md rounded border border-outline-variant bg-surface-container-lowest p-md">
      <div className="flex flex-wrap items-center gap-md">
        <div className="flex flex-wrap items-center gap-sm rounded border border-outline-variant bg-surface-container-low p-sm transition-colors hover:bg-surface-container">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            calendar_today
          </span>
          <input
            type="date"
            value={filters.start}
            onChange={(event) => updateFilters({ ...filters, start: event.target.value })}
            className="bg-transparent text-body-md text-on-surface focus:outline-none"
            aria-label="Start date"
          />
          <span className="text-on-surface-variant">-</span>
          <input
            type="date"
            value={filters.end}
            onChange={(event) => updateFilters({ ...filters, end: event.target.value })}
            className="bg-transparent text-body-md text-on-surface focus:outline-none"
            aria-label="End date"
          />
        </div>

        <label className="flex items-center gap-sm rounded border border-outline-variant bg-surface-container-low p-sm transition-colors hover:bg-surface-container">
          <span className="text-label-mono font-label-mono uppercase text-on-surface-variant">
            Region:
          </span>
          <select
            value={filters.region}
            onChange={(event) => updateFilters({ ...filters, region: event.target.value })}
            className="bg-transparent pr-sm text-body-md text-on-surface focus:outline-none"
            aria-label="Region filter"
          >
            <option value="">All Regions</option>
            {REGION_OPTIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            expand_more
          </span>
        </label>

        <label className="flex items-center gap-sm rounded border border-outline-variant bg-surface-container-low p-sm transition-colors hover:bg-surface-container">
          <span className="text-label-mono font-label-mono uppercase text-on-surface-variant">
            Category:
          </span>
          <select
            value={filters.category}
            onChange={(event) => updateFilters({ ...filters, category: event.target.value })}
            className="bg-transparent pr-sm text-body-md text-on-surface focus:outline-none"
            aria-label="Category filter"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            expand_more
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={() => updateFilters(getDefaultDashboardFilters())}
        className="border-b border-transparent text-label-mono font-label-mono text-secondary transition-colors hover:border-secondary hover:text-on-secondary-fixed-variant"
      >
        Clear Filters
      </button>
    </div>
  );
}
