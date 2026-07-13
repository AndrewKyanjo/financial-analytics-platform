from datetime import date, datetime, timedelta, timezone
from time import perf_counter

from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session


def fetch_revenue_timeseries(
    db: Session,
    start: date,
    end: date,
    region: str | None = None,
    category: str | None = None,
) -> tuple[list[dict], str]:
    params = {
        "start": start,
        "end": end,
        "region": region,
        "category": category,
    }
    query = """
        SELECT
            date,
            SUM(total_revenue) AS total_revenue,
            SUM(transaction_count) AS transaction_count,
            COALESCE(
                SUM(total_revenue) / NULLIF(SUM(transaction_count), 0),
                0
            ) AS avg_order_value
        FROM {source}
        WHERE date BETWEEN :start AND :end
          AND (:region IS NULL OR region = :region)
          AND (:category IS NULL OR category = :category)
        GROUP BY date
        ORDER BY date
    """

    for source in ("mv_revenue_summary", "revenue_daily"):
        try:
            rows = db.execute(text(query.format(source=source)), params).mappings().all()
            return [dict(row) for row in rows], source
        except ProgrammingError:
            db.rollback()
            if source == "revenue_daily":
                raise

    return [], "revenue_daily"


def fetch_live_kpis(db: Session) -> dict:
    today = date.today()
    params = {
        "today": today,
        "last_7_start": today - timedelta(days=6),
        "prev_7_start": today - timedelta(days=13),
        "prev_7_end": today - timedelta(days=7),
    }
    statement = text(
        """
        SELECT
            COALESCE(SUM(CASE WHEN date = :today THEN total_revenue ELSE 0 END), 0) AS revenue_today,
            COALESCE(SUM(CASE WHEN date = :today THEN transaction_count ELSE 0 END), 0) AS transactions_today,
            COALESCE(
                SUM(CASE WHEN date = :today THEN total_revenue ELSE 0 END) /
                NULLIF(SUM(CASE WHEN date = :today THEN transaction_count ELSE 0 END), 0),
                0
            ) AS avg_order_value_today,
            COALESCE(SUM(CASE WHEN date BETWEEN :last_7_start AND :today THEN total_revenue ELSE 0 END), 0) AS revenue_last_7d,
            COALESCE(SUM(CASE WHEN date BETWEEN :prev_7_start AND :prev_7_end THEN total_revenue ELSE 0 END), 0) AS revenue_prev_7d
        FROM revenue_daily
        """
    )
    row = db.execute(statement, params).mappings().one()
    previous_revenue = float(row["revenue_prev_7d"] or 0)
    revenue_last_7d = float(row["revenue_last_7d"] or 0)
    growth = 0.0
    if previous_revenue:
        growth = ((revenue_last_7d - previous_revenue) / previous_revenue) * 100

    return {
        "snapshot_time": datetime.now(timezone.utc),
        "metrics": [
            {"name": "revenue_today", "value": float(row["revenue_today"] or 0), "unit": "currency"},
            {"name": "transactions_today", "value": float(row["transactions_today"] or 0), "unit": "count"},
            {
                "name": "avg_order_value_today",
                "value": float(row["avg_order_value_today"] or 0),
                "unit": "currency",
            },
            {"name": "revenue_last_7d", "value": revenue_last_7d, "unit": "currency"},
            {"name": "growth_vs_previous_7d", "value": growth, "unit": "percent"},
        ],
    }


def refresh_materialized_view(db: Session) -> bool:
    bind = db.get_bind()
    with bind.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        connection.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_summary"))
    return True


def measure_query_time(func, *args, **kwargs) -> tuple[object, float]:
    started_at = perf_counter()
    result = func(*args, **kwargs)
    elapsed_ms = (perf_counter() - started_at) * 1000
    return result, elapsed_ms
