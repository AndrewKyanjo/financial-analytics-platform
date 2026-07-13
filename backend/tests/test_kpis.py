def test_get_live_kpis_returns_current_metrics(client, viewer_token, seed_revenue_history):
    response = client.get(
        "/api/kpis/live",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert "snapshot_time" in payload
    metric_names = {metric["name"] for metric in payload["metrics"]}
    assert {
        "revenue_today",
        "transactions_today",
        "avg_order_value_today",
        "revenue_last_7d",
        "growth_vs_previous_7d",
    }.issubset(metric_names)
