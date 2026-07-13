from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import require_roles
from app.db.models import User
from app.db.session import get_db
from app.schemas.schemas import ForecastResponse, ForecastRetrainResponse
from app.services.forecasting import get_latest_forecast, train_and_store_forecast

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("", response_model=ForecastResponse)
def get_forecast(
    horizon: int = Query(default=settings.default_forecast_horizon, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "viewer")),
):
    forecast = get_latest_forecast(db, horizon=horizon)
    if forecast is None or forecast["horizon"] < horizon:
        try:
            forecast = train_and_store_forecast(db, horizon=horizon)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    return forecast


@router.post("/retrain", response_model=ForecastRetrainResponse)
def retrain_forecast(
    horizon: int = Query(default=settings.default_forecast_horizon, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    try:
        return train_and_store_forecast(db, horizon=horizon)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
