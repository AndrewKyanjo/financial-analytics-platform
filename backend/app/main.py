from datetime import datetime, timezone

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import auth, forecast, ingest, kpis, revenue
from app.core.config import settings
from app.db.session import get_db, get_last_query_metrics
from app.schemas.schemas import HealthResponse

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(kpis.router)
app.include_router(revenue.router)
app.include_router(forecast.router)
app.include_router(ingest.router)


@app.get("/api/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    metrics = get_last_query_metrics()
    return {
        "status": "ok",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc),
        "last_query_ms": metrics.last_query_ms,
    }
