from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.security import hash_password
from app.db.models import RevenueDaily, User
from app.db.session import SessionLocal, get_db
from app.main import app
from app.services.query_optimizer import refresh_materialized_view


def _reset_database(db):
    db.execute(
        text(
            """
            TRUNCATE TABLE
                forecasts,
                kpi_snapshots,
                revenue_daily,
                transactions,
                users
            RESTART IDENTITY CASCADE
            """
        )
    )
    db.commit()
    refresh_materialized_view(db)


def _seed_users(db):
    db.add_all(
        [
            User(
                email="admin@example.com",
                hashed_password=hash_password("adminpass"),
                role="admin",
            ),
            User(
                email="viewer@example.com",
                hashed_password=hash_password("viewerpass"),
                role="viewer",
            ),
        ]
    )
    db.commit()


@pytest.fixture()
def db_session():
    db = SessionLocal()
    setup_complete = False
    try:
        try:
            _reset_database(db)
            _seed_users(db)
        except OperationalError as exc:
            pytest.fail(
                "Could not connect to PostgreSQL. Set DATABASE_URL in backend/.env to a working "
                "financial_analytics database before running tests."
            )
        setup_complete = True
        yield db
    finally:
        if setup_complete:
            _reset_database(db)
        db.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_token(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "adminpass"},
    )
    return response.json()["access_token"]


@pytest.fixture()
def viewer_token(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "viewer@example.com", "password": "viewerpass"},
    )
    return response.json()["access_token"]


@pytest.fixture()
def seed_revenue_history(db_session):
    today = date.today()
    rows = []
    regions = ["North", "South", "East", "West"]
    categories = ["Equities", "FX", "Commodities"]

    for day_offset in range(60):
        current_date = today - timedelta(days=(59 - day_offset))
        base_value = 1000 + (day_offset * 35)
        for region_index, region in enumerate(regions, start=1):
            for category_index, category in enumerate(categories, start=1):
                revenue = base_value + (region_index * 20) + (category_index * 10)
                tx_count = 10 + region_index + category_index
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
    return rows
