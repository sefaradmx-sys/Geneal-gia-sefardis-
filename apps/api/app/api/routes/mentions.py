from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.db import get_db
from app.core.deps import get_current_user, require_writer
from app.models.entities import Classification, Mention, Study, User
from app.schemas.dto import MentionOut, MentionPage, UploadResult
from app.services.ingest import persist_raw_items
from collector.manual import parse_upload

router = APIRouter(tags=["mentions"])


def _to_out(mention: Mention) -> MentionOut:
    classification = mention.classification
    return MentionOut(
        id=mention.id,
        text_original=mention.text_original,
        source_kind=mention.source_kind,
        published_at=mention.published_at,
        url=mention.url,
        author_handle=mention.author_handle,
        sentiment=classification.sentiment if classification else None,
        stance=classification.stance if classification else None,
        theme=mention.theme,
        geo_state=mention.geo_state,
        geo_municipality=mention.geo_municipality,
        is_synthetic=mention.is_synthetic,
        confidence=classification.confidence if classification else None,
    )


def mentions_statement(
    study_id: UUID,
    *,
    source: str | None = None,
    sentiment: str | None = None,
    stance: str | None = None,
    geo_state: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    filters = [Mention.study_id == study_id]
    if source:
        filters.append(Mention.source_kind == source)
    if geo_state:
        filters.append(Mention.geo_state == geo_state)
    if date_from:
        filters.append(Mention.published_at >= date_from)
    if date_to:
        filters.append(Mention.published_at <= date_to)
    stmt = (
        select(Mention)
        .where(*filters)
        .options(selectinload(Mention.classification))
        .order_by(Mention.published_at.desc())
    )
    if sentiment or stance:
        stmt = stmt.join(Mention.classification)
        if sentiment:
            stmt = stmt.where(Classification.sentiment == sentiment)
        if stance:
            stmt = stmt.where(Classification.stance == stance)
    return stmt


@router.get("/mentions", response_model=MentionPage)
def list_mentions(
    study_id: UUID,
    source: str | None = None,
    sentiment: str | None = None,
    stance: str | None = None,
    geo_state: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    study = session.get(Study, study_id)
    if study is None or (user.role != "superadmin" and study.organization_id != user.organization_id):
        raise HTTPException(status_code=404, detail="Estudio no encontrado")
    stmt = mentions_statement(
        study_id,
        source=source,
        sentiment=sentiment,
        stance=stance,
        geo_state=geo_state,
        date_from=date_from,
        date_to=date_to,
    )
    total = session.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = session.scalars(stmt.limit(min(limit, 100)).offset(offset)).unique().all()
    return MentionPage(items=[_to_out(row) for row in rows], total=int(total))


@router.post("/studies/{study_id}/uploads", response_model=UploadResult)
async def upload_mentions(
    study_id: UUID,
    file: UploadFile = File(...),
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_writer(user)
    study = session.get(Study, study_id)
    if study is None or (user.role != "superadmin" and study.organization_id != user.organization_id):
        raise HTTPException(status_code=404, detail="Estudio no encontrado")
    content = await file.read()
    if len(content) > 5_000_000:
        raise HTTPException(status_code=413, detail="El archivo supera 5 MB")
    try:
        items = parse_upload(content, file.filename or "datos.csv")
    except (ValueError, KeyError, UnicodeError) as exc:
        raise HTTPException(status_code=422, detail="No se pudo leer el archivo") from exc
    for item in items:
        if item.published_at is None:
            item.published_at = datetime.now(timezone.utc)
    result = persist_raw_items(session, study, items, user.id)
    return UploadResult(**result)
