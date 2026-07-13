import asyncio

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import require_roles
from app.db.models import User
from app.db.session import SessionLocal, get_db
from app.schemas.schemas import KpiSnapshotResponse
from app.services.query_optimizer import fetch_live_kpis

router = APIRouter(prefix="/api/kpis", tags=["kpis"])


@router.get("/live", response_model=KpiSnapshotResponse)
def get_live_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "viewer")),
):
    return fetch_live_kpis(db)


@router.websocket("/ws/kpis")
async def kpi_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            db = SessionLocal()
            try:
                payload = KpiSnapshotResponse.model_validate(fetch_live_kpis(db))
                await websocket.send_json(payload.model_dump(mode="json"))
            finally:
                db.close()
            await asyncio.sleep(settings.kpi_push_interval_seconds)
    except WebSocketDisconnect:
        pass
