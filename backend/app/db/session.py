from dataclasses import dataclass
from threading import Lock
from time import perf_counter

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


@dataclass
class QueryMetrics:
    last_query_ms: float | None = None
    last_statement: str | None = None


_query_metrics = QueryMetrics()
_query_metrics_lock = Lock()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(
    conn,
    cursor,
    statement,
    parameters,
    context,
    executemany,
):
    context._query_start_time = perf_counter()


@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(
    conn,
    cursor,
    statement,
    parameters,
    context,
    executemany,
):
    elapsed_ms = (perf_counter() - context._query_start_time) * 1000
    with _query_metrics_lock:
        _query_metrics.last_query_ms = round(elapsed_ms, 3)
        _query_metrics.last_statement = statement


def get_last_query_metrics() -> QueryMetrics:
    with _query_metrics_lock:
        return QueryMetrics(
            last_query_ms=_query_metrics.last_query_ms,
            last_statement=_query_metrics.last_statement,
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
