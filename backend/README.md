# Backend

## Environment

Set these in `backend/.env` before running the API:

```env
DATABASE_URL=postgresql+psycopg2://<user>:<password>@localhost:5432/financial_analytics
JWT_SECRET_KEY=<your-secret>
```

## Run Migrations

From the `backend/` directory:

```bash
alembic upgrade head
```

If your local `financial_analytics` database already has `db/schema.sql` applied, stamp that schema as the Alembic baseline once:

```bash
alembic stamp head
```

## Seed Data

1. Create at least one admin user in `users` with a `passlib` bcrypt hash.
2. Start the API and use `POST /api/ingest` with a CSV that includes `transaction_date`, `amount`, `category`, `region`, and optional `customer_id`.
3. The ingest endpoint inserts raw transactions, runs the ETL upsert into `revenue_daily`, and refreshes `mv_revenue_summary`.

## Start The Server

From the `backend/` directory:

```bash
uvicorn app.main:app --reload
```
