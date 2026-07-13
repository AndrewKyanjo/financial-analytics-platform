from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class TransactionCreate(BaseModel):
    transaction_date: date
    amount: float
    category: str
    region: str
    customer_id: int | None = None


class TransactionRead(TransactionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class RevenuePoint(BaseModel):
    date: date
    total_revenue: float
    transaction_count: int
    avg_order_value: float


class RevenueSeriesResponse(BaseModel):
    start: date
    end: date
    region: str | None = None
    category: str | None = None
    source: str
    data: list[RevenuePoint]


class KpiMetric(BaseModel):
    name: str
    value: float
    unit: str


class KpiSnapshotResponse(BaseModel):
    snapshot_time: datetime
    metrics: list[KpiMetric]


class ForecastAccuracy(BaseModel):
    mae: float | None = None
    rmse: float | None = None
    holdout_points: int = 0


class ForecastPoint(BaseModel):
    forecast_date: date
    predicted_revenue: float
    lower_bound: float | None = None
    upper_bound: float | None = None


class ForecastResponse(BaseModel):
    generated_at: datetime
    model_version: str
    horizon: int
    accuracy: ForecastAccuracy
    forecasts: list[ForecastPoint]


class ForecastRetrainResponse(ForecastResponse):
    inserted_rows: int


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    expires_in: int


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: str
    created_at: datetime


class IngestResponse(BaseModel):
    inserted_transactions: int
    aggregated_rows: int
    refreshed_materialized_view: bool


class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: datetime
    last_query_ms: float | None = None
