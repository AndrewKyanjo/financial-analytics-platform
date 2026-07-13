from sqlalchemy import select

from app.db.models import Forecast


def test_get_forecast_trains_and_returns_rows(client, viewer_token, seed_revenue_history, db_session):
    response = client.get(
        "/api/forecast?horizon=5",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["horizon"] == 5
    assert len(payload["forecasts"]) == 5
    assert payload["accuracy"]["holdout_points"] >= 1

    stored_rows = db_session.scalars(select(Forecast)).all()
    assert len(stored_rows) >= 5
