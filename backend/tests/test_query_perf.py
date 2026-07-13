from datetime import date, timedelta
from time import perf_counter

from app.db.models import RevenueDaily
from app.services.query_optimizer import fetch_revenue_timeseries, refresh_materialized_view


def test_revenue_aggregation_query_completes_under_threshold(db_session):
    today = date.today()
    rows = []
    regions = [f"Region-{index}" for index in range(1, 21)]
    categories = [f"Category-{index}" for index in range(1, 9)]

    for day_offset in range(180):
        current_date = today - timedelta(days=(179 - day_offset))
        base_value = 5000 + (day_offset * 15)
        for region_index, region in enumerate(regions, start=1):
            for category_index, category in enumerate(categories, start=1):
                revenue = base_value + (region_index * 25) + (category_index * 5)
                tx_count = 20 + region_index + category_index
                rows.append(
                    RevenueDaily(
                        date=current_date,
                        region=region,
                        category=category,
                        total_revenue=revenue,
                        transaction_count=tx_count,
                        avg_order_value=round(revenue / tx_count, 2),
                    )
                )

    db_session.add_all(rows)
    db_session.commit()
    refresh_materialized_view(db_session)

    started_at = perf_counter()
    data, source = fetch_revenue_timeseries(
        db=db_session,
        start=today - timedelta(days=89),
        end=today,
    )
    elapsed_seconds = perf_counter() - started_at

    assert source == "mv_revenue_summary"
    assert len(data) == 90
    assert elapsed_seconds < 1.2
