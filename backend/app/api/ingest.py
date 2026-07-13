from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import insert
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.models import Transaction, User
from app.db.session import get_db
from app.schemas.schemas import IngestResponse
from app.services.etl import aggregate_transactions_to_daily_revenue

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.post("", response_model=IngestResponse)
async def ingest_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    import pandas as pd

    contents = await file.read()
    try:
        frame = pd.read_csv(BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid CSV file") from exc

    required_columns = {"transaction_date", "amount", "category", "region"}
    if not required_columns.issubset(frame.columns):
        missing = sorted(required_columns - set(frame.columns))
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing)}",
        )
    if frame.empty:
        raise HTTPException(status_code=400, detail="CSV file does not contain any rows")

    frame["transaction_date"] = pd.to_datetime(frame["transaction_date"]).dt.date
    if "customer_id" not in frame.columns:
        frame["customer_id"] = None
    records = frame.where(pd.notnull(frame), None).to_dict(orient="records")

    db.execute(insert(Transaction), records)
    db.commit()

    min_date = min(record["transaction_date"] for record in records)
    max_date = max(record["transaction_date"] for record in records)
    aggregated_rows = aggregate_transactions_to_daily_revenue(db, min_date, max_date)

    return {
        "inserted_transactions": len(records),
        "aggregated_rows": aggregated_rows,
        "refreshed_materialized_view": True,
    }
