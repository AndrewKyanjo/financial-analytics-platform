from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import CheckConstraint, Date, DateTime, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="transactions_amount_check"),
        Index("idx_transactions_date", "transaction_date"),
        Index("idx_transactions_category", "category"),
        Index("idx_transactions_region", "region"),
        Index("idx_transactions_date_region_category", "transaction_date", "region", "category"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_id: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class RevenueDaily(Base):
    __tablename__ = "revenue_daily"
    __table_args__ = (
        UniqueConstraint("date", "region", "category", name="uq_revenue_daily_date_region_category"),
        Index("idx_revenue_daily_date", "date"),
        Index("idx_revenue_daily_region_category", "region", "category"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    total_revenue: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        server_default="0",
    )
    transaction_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )
    avg_order_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default="0",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class KpiSnapshot(Base):
    __tablename__ = "kpi_snapshots"
    __table_args__ = (Index("idx_kpi_snapshots_time_name", "snapshot_time", "kpi_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    snapshot_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    kpi_name: Mapped[str] = mapped_column(String(100), nullable=False)
    kpi_value: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB, nullable=True)


class Forecast(Base):
    __tablename__ = "forecasts"
    __table_args__ = (Index("idx_forecasts_date", "forecast_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False)
    predicted_revenue: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    lower_bound: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    upper_bound: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'viewer')", name="users_role_check"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, server_default="viewer")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
