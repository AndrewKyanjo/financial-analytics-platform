from __future__ import annotations

from datetime import datetime, timedelta, timezone
from math import sqrt

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Forecast, RevenueDaily


def _load_daily_revenue_frame(db: Session) -> pd.DataFrame:
    import pandas as pd

    rows = db.execute(
        select(
            RevenueDaily.date.label("date"),
            func.sum(RevenueDaily.total_revenue).label("revenue"),
        )
        .group_by(RevenueDaily.date)
        .order_by(RevenueDaily.date)
    ).all()
    return pd.DataFrame(rows, columns=["date", "revenue"])


def _build_regression_pipeline() -> Pipeline:
    from sklearn.linear_model import LinearRegression
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import PolynomialFeatures

    return Pipeline(
        steps=[
            (
                "poly",
                PolynomialFeatures(
                    degree=settings.forecast_polynomial_degree,
                    include_bias=False,
                ),
            ),
            ("regressor", LinearRegression()),
        ]
    )


def train_and_store_forecast(db: Session, horizon: int) -> dict:
    import numpy as np
    import pandas as pd
    from sklearn.metrics import mean_absolute_error, mean_squared_error

    history = _load_daily_revenue_frame(db)
    if history.empty or len(history) < 5:
        raise ValueError("At least 5 daily revenue points are required to train a forecast.")

    history["date"] = pd.to_datetime(history["date"])
    history["revenue"] = history["revenue"].astype(float)
    history["day_index"] = (history["date"] - history["date"].min()).dt.days

    holdout_points = max(1, min(7, len(history) // 4))
    train_frame = history.iloc[:-holdout_points].copy()
    test_frame = history.iloc[-holdout_points:].copy()
    if train_frame.empty:
        train_frame = history.iloc[:-1].copy()
        test_frame = history.iloc[-1:].copy()

    model = _build_regression_pipeline()
    model.fit(train_frame[["day_index"]], train_frame["revenue"])

    test_predictions = model.predict(test_frame[["day_index"]])
    mae = float(mean_absolute_error(test_frame["revenue"], test_predictions))
    rmse = float(sqrt(mean_squared_error(test_frame["revenue"], test_predictions)))
    residual_std = float(np.std(test_frame["revenue"] - test_predictions)) or max(rmse, 1.0)

    model.fit(history[["day_index"]], history["revenue"])
    last_index = int(history["day_index"].max())
    last_date = history["date"].max().date()
    future_indices = np.arange(last_index + 1, last_index + horizon + 1)
    future_predictions = model.predict(pd.DataFrame({"day_index": future_indices}))

    generated_at = datetime.now(timezone.utc)
    model_version = settings.forecast_model_version

    db.execute(delete(Forecast).where(Forecast.generated_at < generated_at - timedelta(days=30)))

    forecast_rows = []
    for offset, predicted_value in enumerate(future_predictions, start=1):
        center = max(float(predicted_value), 0.0)
        lower_bound = max(center - (1.96 * residual_std), 0.0)
        upper_bound = center + (1.96 * residual_std)
        forecast_rows.append(
            Forecast(
                generated_at=generated_at,
                forecast_date=last_date + timedelta(days=offset),
                predicted_revenue=round(center, 2),
                lower_bound=round(lower_bound, 2),
                upper_bound=round(upper_bound, 2),
                model_version=model_version,
            )
        )

    db.add_all(forecast_rows)
    db.commit()

    return {
        "generated_at": generated_at,
        "model_version": model_version,
        "horizon": horizon,
        "accuracy": {
            "mae": mae,
            "rmse": rmse,
            "holdout_points": len(test_frame),
        },
        "forecasts": [
            {
                "forecast_date": row.forecast_date,
                "predicted_revenue": float(row.predicted_revenue),
                "lower_bound": float(row.lower_bound) if row.lower_bound is not None else None,
                "upper_bound": float(row.upper_bound) if row.upper_bound is not None else None,
            }
            for row in forecast_rows
        ],
        "inserted_rows": len(forecast_rows),
    }


def get_latest_forecast(db: Session, horizon: int) -> dict | None:
    latest_generated_at = db.scalar(select(func.max(Forecast.generated_at)))
    if latest_generated_at is None:
        return None

    rows = db.scalars(
        select(Forecast)
        .where(Forecast.generated_at == latest_generated_at)
        .order_by(Forecast.forecast_date)
        .limit(horizon)
    ).all()
    if not rows:
        return None

    return {
        "generated_at": latest_generated_at,
        "model_version": rows[0].model_version,
        "horizon": len(rows),
        "accuracy": {
            "mae": None,
            "rmse": None,
            "holdout_points": 0,
        },
        "forecasts": [
            {
                "forecast_date": row.forecast_date,
                "predicted_revenue": float(row.predicted_revenue),
                "lower_bound": float(row.lower_bound) if row.lower_bound is not None else None,
                "upper_bound": float(row.upper_bound) if row.upper_bound is not None else None,
            }
            for row in rows
        ],
    }
