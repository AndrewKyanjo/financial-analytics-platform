"""initial schema

Revision ID: 20260712_0001
Revises:
Create Date: 2026-07-12 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260712_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto')
    #op.execute('CREATE EXTENSION IF NOT EXISTS pg_stat_statements')

    op.create_table(
        "transactions",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("region", sa.String(length=100), nullable=False),
        sa.Column("customer_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("amount >= 0", name="transactions_amount_check"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_transactions_category", "transactions", ["category"], unique=False)
    op.create_index("idx_transactions_date", "transactions", ["transaction_date"], unique=False)
    op.create_index(
        "idx_transactions_date_region_category",
        "transactions",
        ["transaction_date", "region", "category"],
        unique=False,
    )
    op.create_index("idx_transactions_region", "transactions", ["region"], unique=False)

    op.create_table(
        "revenue_daily",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("region", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("total_revenue", sa.Numeric(14, 2), server_default=sa.text("0"), nullable=False),
        sa.Column("transaction_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("avg_order_value", sa.Numeric(12, 2), server_default=sa.text("0"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("date", "region", "category", name="uq_revenue_daily_date_region_category"),
    )
    op.create_index("idx_revenue_daily_date", "revenue_daily", ["date"], unique=False)
    op.create_index("idx_revenue_daily_region_category", "revenue_daily", ["region", "category"], unique=False)

    op.create_table(
        "kpi_snapshots",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("snapshot_time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("kpi_name", sa.String(length=100), nullable=False),
        sa.Column("kpi_value", sa.Numeric(14, 4), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_kpi_snapshots_time_name", "kpi_snapshots", ["snapshot_time", "kpi_name"], unique=False)

    op.create_table(
        "forecasts",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("forecast_date", sa.Date(), nullable=False),
        sa.Column("predicted_revenue", sa.Numeric(14, 2), nullable=False),
        sa.Column("lower_bound", sa.Numeric(14, 2), nullable=True),
        sa.Column("upper_bound", sa.Numeric(14, 2), nullable=True),
        sa.Column("model_version", sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_forecasts_date", "forecasts", ["forecast_date"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=20), server_default=sa.text("'viewer'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("role IN ('admin', 'viewer')", name="users_role_check"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.execute(
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_summary AS
        SELECT
            date,
            region,
            category,
            SUM(total_revenue) AS total_revenue,
            SUM(transaction_count) AS transaction_count
        FROM revenue_daily
        GROUP BY date, region, category
        WITH DATA
        """
    )
    op.create_index(
        "idx_mv_revenue_summary",
        "mv_revenue_summary",
        ["date", "region", "category"],
        unique=True,
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_revenue_daily_updated_at
        BEFORE UPDATE ON revenue_daily
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at()
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_revenue_daily_updated_at ON revenue_daily")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at")
    op.drop_index("idx_mv_revenue_summary", table_name="mv_revenue_summary")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_revenue_summary")
    op.drop_table("users")
    op.drop_index("idx_forecasts_date", table_name="forecasts")
    op.drop_table("forecasts")
    op.drop_index("idx_kpi_snapshots_time_name", table_name="kpi_snapshots")
    op.drop_table("kpi_snapshots")
    op.drop_index("idx_revenue_daily_region_category", table_name="revenue_daily")
    op.drop_index("idx_revenue_daily_date", table_name="revenue_daily")
    op.drop_table("revenue_daily")
    op.drop_index("idx_transactions_region", table_name="transactions")
    op.drop_index("idx_transactions_date_region_category", table_name="transactions")
    op.drop_index("idx_transactions_date", table_name="transactions")
    op.drop_index("idx_transactions_category", table_name="transactions")
    op.drop_table("transactions")
