from datetime import date

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.models import RevenueDaily, Transaction
from app.services.query_optimizer import refresh_materialized_view


def aggregate_transactions_to_daily_revenue(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    aggregation = (
        select(
            Transaction.transaction_date.label("date"),
            Transaction.region.label("region"),
            Transaction.category.label("category"),
            func.sum(Transaction.amount).label("total_revenue"),
            func.count(Transaction.id).label("transaction_count"),
            func.avg(Transaction.amount).label("avg_order_value"),
        )
        .group_by(
            Transaction.transaction_date,
            Transaction.region,
            Transaction.category,
        )
        .order_by(Transaction.transaction_date)
    )

    if start_date is not None:
        aggregation = aggregation.where(Transaction.transaction_date >= start_date)
    if end_date is not None:
        aggregation = aggregation.where(Transaction.transaction_date <= end_date)

    rows = [dict(row) for row in db.execute(aggregation).mappings().all()]
    if not rows:
        return 0

    stmt = insert(RevenueDaily).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=[RevenueDaily.date, RevenueDaily.region, RevenueDaily.category],
        set_={
            "total_revenue": stmt.excluded.total_revenue,
            "transaction_count": stmt.excluded.transaction_count,
            "avg_order_value": stmt.excluded.avg_order_value,
        },
    )
    db.execute(stmt)
    db.commit()
    refresh_materialized_view(db)
    return len(rows)
