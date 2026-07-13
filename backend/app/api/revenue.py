from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.models import User
from app.db.session import get_db
from app.schemas.schemas import RevenueSeriesResponse
from app.services.query_optimizer import fetch_revenue_timeseries

router = APIRouter(prefix="/api/revenue", tags=["revenue"])


@router.get("", response_model=RevenueSeriesResponse)
def get_revenue(
    start: date | None = Query(default=None),
    end: date | None = Query(default=None),
    region: str | None = Query(default=None),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "viewer")),
):
    resolved_end = end or date.today()
    resolved_start = start or (resolved_end - timedelta(days=29))
    if resolved_start > resolved_end:
        raise HTTPException(status_code=400, detail="start must be on or before end")

    rows, source = fetch_revenue_timeseries(
        db=db,
        start=resolved_start,
        end=resolved_end,
        region=region,
        category=category,
    )
    return {
        "start": resolved_start,
        "end": resolved_end,
        "region": region,
        "category": category,
        "source": source,
        "data": [
            {
                "date": row["date"],
                "total_revenue": float(row["total_revenue"] or 0),
                "transaction_count": int(row["transaction_count"] or 0),
                "avg_order_value": float(row["avg_order_value"] or 0),
            }
            for row in rows
        ],
    }
