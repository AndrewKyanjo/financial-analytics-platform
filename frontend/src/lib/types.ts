export type UserRole = "admin" | "viewer";

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  role: UserRole;
  expires_in: number;
}

export interface KpiMetric {
  name:
    | "revenue_today"
    | "transactions_today"
    | "avg_order_value_today"
    | "revenue_last_7d"
    | "growth_vs_previous_7d";
  value: number;
  unit: "currency" | "count" | "percent";
}

export interface KpiSnapshotResponse {
  snapshot_time: string;
  metrics: KpiMetric[];
}

export interface RevenuePoint {
  date: string;
  total_revenue: number;
  transaction_count: number;
  avg_order_value: number;
}

export interface RevenueSeriesResponse {
  start: string;
  end: string;
  region: string | null;
  category: string | null;
  source: string;
  data: RevenuePoint[];
}

export interface ForecastAccuracy {
  mae: number | null;
  rmse: number | null;
  holdout_points: number;
}

export interface ForecastPoint {
  forecast_date: string;
  predicted_revenue: number;
  lower_bound: number | null;
  upper_bound: number | null;
}

export interface ForecastResponse {
  generated_at: string;
  model_version: string;
  horizon: number;
  accuracy: ForecastAccuracy;
  forecasts: ForecastPoint[];
}

export interface ForecastRetrainResponse extends ForecastResponse {
  inserted_rows: number;
}
