export interface DashboardFilters {
  start: string;
  end: string;
  region: string;
  category: string;
}

export const REGION_OPTIONS = ["North", "South", "East", "West"] as const;
export const CATEGORY_OPTIONS = ["Equities", "FX", "Commodities"] as const;

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isValidDateString(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function getDefaultDashboardFilters(): DashboardFilters {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 29);

  return {
    start: toInputDate(start),
    end: toInputDate(end),
    region: "",
    category: "",
  };
}

export function readDashboardFilters(searchParams: { get(name: string): string | null }): DashboardFilters {
  const defaults = getDefaultDashboardFilters();
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  return {
    start: isValidDateString(start) ? start! : defaults.start,
    end: isValidDateString(end) ? end! : defaults.end,
    region: searchParams.get("region") ?? defaults.region,
    category: searchParams.get("category") ?? defaults.category,
  };
}

export function buildDashboardSearchParams(filters: DashboardFilters) {
  const params = new URLSearchParams();
  params.set("start", filters.start);
  params.set("end", filters.end);

  if (filters.region) {
    params.set("region", filters.region);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  return params;
}
