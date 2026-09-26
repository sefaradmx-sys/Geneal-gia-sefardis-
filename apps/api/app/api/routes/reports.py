from datetime import datetime, timezone
from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from fpdf import FPDF
from openpyxl import Workbook
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.routes.studies import _study_or_404
from app.core.db import get_db
from app.core.deps import get_current_user, require_writer
from app.models.entities import Alert, AuditLog, Mention, MonitoringTarget, Report, User
from app.schemas.dto import AlertRecord
from app.services.brief_pdf import build_brief_pdf
from app.services.scoring import DISCLAIMER
from app.services.summary import build_summary

router = APIRouter(tags=["reports"])

_SENTIMENT = {"positive": "positivo", "negative": "negativo", "neutral": "neutro"}
_STANCE = {"in_favor": "a favor", "against": "en contra", "not_applicable": "no aplica"}


def _latin(text: str) -> str:
    return text.encode("latin-1", "replace").decode("latin-1")


def mentions_workbook(rows: list[Mention]) -> bytes:
    book = Workbook()
    sheet = book.active
    sheet.title = "Menciones"
    sheet.append(
        [
            "Texto",
            "Fuente",
            "Publicado",
            "Sentimiento",
            "Postura",
            "Tema",
            "Estado",
            "Municipio",
            "Confianza",
            "Sintetica",
            "Autor",
            "URL",
        ]
    )
    for mention in rows:
        classification = mention.classification
        sentiment = classification.sentiment if classification else ""
        stance = classification.stance if classification else ""
        confidence = classification.confidence if classification else None
        sheet.append(
            [
                mention.text_original,
                mention.source_kind,
                mention.published_at.isoformat() if mention.published_at else "",
                _SENTIMENT.get(sentiment, sentiment),
                _STANCE.get(stance, stance),
                mention.theme or "",
                mention.geo_state or "",
                mention.geo_municipality or "",
                confidence,
                "si" if mention.is_synthetic else "no",
                mention.author_handle or "",
                mention.url or "",
            ]
        )
    buffer = BytesIO()
    book.save(buffer)
    return buffer.getvalue()


def study_pdf(title: str, first_page: list[str], second_page: list[str]) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=16)
    for paragraphs in (first_page, second_page):
        pdf.add_page()
        pdf.set_font("Helvetica", size=16)
        pdf.multi_cell(0, 8, _latin(title))
        pdf.ln(2)
        pdf.set_font("Helvetica", size=11)
        for paragraph in paragraphs:
            pdf.multi_cell(0, 6, _latin(paragraph))
            pdf.ln(2)
    return bytes(pdf.output())


def _record(session: Session, user: User, study_id: UUID, fmt: str) -> None:
    session.add(
        Report(
            organization_id=user.organization_id,
            study_id=study_id,
            format=fmt,
            storage_key=f"inline:{fmt}:{datetime.now(timezone.utc).isoformat()}",
            created_by=user.id,
        )
    )
    session.add(
        AuditLog(
            organization_id=user.organization_id,
            user_id=user.id,
            action=f"export_{fmt}",
            resource=f"study:{study_id}",
            detail=f"exportación {fmt}",
        )
    )


@router.get("/studies/{study_id}/alert-log", response_model=list[AlertRecord])
def alert_log(
    study_id: UUID,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    study = _study_or_404(session, user, study_id)
    rows = session.execute(
        select(Alert, MonitoringTarget.name)
        .join(MonitoringTarget, MonitoringTarget.id == Alert.target_id)
        .where(Alert.study_id == study.id)
        .order_by(Alert.triggered_at.desc())
    ).all()
    return [
        AlertRecord(
            id=alert.id,
            target_name=name,
            rule=alert.rule,
            message=alert.message,
            delta_points=alert.delta_points,
            triggered_at=alert.triggered_at,
            acknowledged_at=alert.acknowledged_at,
        )
        for alert, name in rows
    ]


@router.post("/studies/{study_id}/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    study_id: UUID,
    alert_id: UUID,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_writer(user)
    study = _study_or_404(session, user, study_id)
    alert = session.get(Alert, alert_id)
    if alert is None or alert.study_id != study.id:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.acknowledged_at = datetime.now(timezone.utc)
    session.add(
        AuditLog(
            organization_id=user.organization_id,
            user_id=user.id,
            action="acknowledge_alert",
            resource=f"alert:{alert.id}",
            detail=alert.rule,
        )
    )
    session.commit()
    return {"acknowledged": True}


@router.get("/studies/{study_id}/exports/xlsx")
def export_xlsx(
    study_id: UUID,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    study = _study_or_404(session, user, study_id)
    rows = list(
        session.scalars(
            select(Mention)
            .where(Mention.study_id == study.id)
            .options(selectinload(Mention.classification))
            .order_by(Mention.published_at.desc())
            .limit(5000)
        ).all()
    )
    _record(session, user, study.id, "xlsx")
    session.commit()
    payload = mentions_workbook(rows)
    return Response(
        content=payload,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="la-mv-census.xlsx"'},
    )


@router.get("/studies/{study_id}/exports/pdf")
def export_pdf(
    study_id: UUID,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    study = _study_or_404(session, user, study_id)
    summary = build_summary(session, study)
    mentions = list(
        session.scalars(
            select(Mention)
            .where(Mention.study_id == study.id)
            .options(selectinload(Mention.classification))
            .order_by(Mention.published_at.asc())
            .limit(500)
        ).all()
    )
    _record(session, user, study.id, "pdf")
    session.commit()
    payload = build_brief_pdf(summary, mentions)
    return Response(
        content=payload,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="la-mv-census.pdf"'},
    )
