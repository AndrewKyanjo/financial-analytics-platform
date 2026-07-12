-- ============================================================
-- Real-Time Financial Analytics Platform — PostgreSQL Schema
-- Run with: psql -U fin_app_user -d financial_analytics -f schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extensions
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;  -- needed for query performance benchmarking

-- ------------------------------------------------------------
-- 2. Core Tables
-- ------------------------------------------------------------

-- Raw transaction-level data
CREATE TABLE IF NOT EXISTS transactions (
    id                BIGSERIAL PRIMARY KEY,
    transaction_date  DATE NOT NULL,
    amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    category          VARCHAR(100) NOT NULL,
    region            VARCHAR(100) NOT NULL,
    customer_id       BIGINT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily aggregated revenue (populated by the ETL service)
CREATE TABLE IF NOT EXISTS revenue_daily (
    id                 BIGSERIAL PRIMARY KEY,
    date               DATE NOT NULL,
    region             VARCHAR(100) NOT NULL,
    category           VARCHAR(100) NOT NULL,
    total_revenue      NUMERIC(14,2) NOT NULL DEFAULT 0,
    transaction_count  INTEGER NOT NULL DEFAULT 0,
    avg_order_value    NUMERIC(12,2) NOT NULL DEFAULT 0,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (date, region, category)
);

-- Point-in-time KPI values (for the live dashboard / websocket feed)
CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id             BIGSERIAL PRIMARY KEY,
    snapshot_time  TIMESTAMPTZ NOT NULL DEFAULT now(),
    kpi_name       VARCHAR(100) NOT NULL,
    kpi_value      NUMERIC(14,4) NOT NULL,
    metadata       JSONB
);

-- Forecast outputs (regression model results)
CREATE TABLE IF NOT EXISTS forecasts (
    id                 BIGSERIAL PRIMARY KEY,
    generated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    forecast_date      DATE NOT NULL,
    predicted_revenue  NUMERIC(14,2) NOT NULL,
    lower_bound        NUMERIC(14,2),
    upper_bound        NUMERIC(14,2),
    model_version      VARCHAR(50) NOT NULL
);

-- Optional: users table (for the auth/RBAC improvement item)
CREATE TABLE IF NOT EXISTS users (
    id               BIGSERIAL PRIMARY KEY,
    email            VARCHAR(255) UNIQUE NOT NULL,
    hashed_password  TEXT NOT NULL,
    role             VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. Indexes (target: sub-1.2s aggregation over 500K+ rows)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_date               ON transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category            ON transactions (category);
CREATE INDEX IF NOT EXISTS idx_transactions_region              ON transactions (region);
CREATE INDEX IF NOT EXISTS idx_transactions_date_region_category ON transactions (transaction_date, region, category);

CREATE INDEX IF NOT EXISTS idx_revenue_daily_date              ON revenue_daily (date);
CREATE INDEX IF NOT EXISTS idx_revenue_daily_region_category    ON revenue_daily (region, category);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_time_name          ON kpi_snapshots (snapshot_time, kpi_name);

CREATE INDEX IF NOT EXISTS idx_forecasts_date                  ON forecasts (forecast_date);

-- ------------------------------------------------------------
-- 4. Materialized View — fast pre-aggregated dashboard reads
-- ------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_summary AS
SELECT
    date,
    region,
    category,
    SUM(total_revenue)      AS total_revenue,
    SUM(transaction_count)  AS transaction_count
FROM revenue_daily
GROUP BY date, region, category
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_revenue_summary
    ON mv_revenue_summary (date, region, category);

-- Refresh this on a schedule (e.g., after each ETL run) via:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_summary;

-- ------------------------------------------------------------
-- 5. Trigger — auto-update `updated_at` on revenue_daily
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_revenue_daily_updated_at ON revenue_daily;
CREATE TRIGGER trg_revenue_daily_updated_at
    BEFORE UPDATE ON revenue_daily
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 6. Grants (adjust role name if different from fin_app_user)
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fin_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fin_app_user;
GRANT SELECT ON mv_revenue_summary TO fin_app_user;