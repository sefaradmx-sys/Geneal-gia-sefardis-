from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.db import get_db
from app.core.deps import get_current_user, require_writer
from app.models.entities import Alias, MonitoringTarget, Study, User
from app.schemas.dto import (
    AliasCreate,
    AliasOut,
    AskRequest,
    AskResponse,
    SeriesPoint,
    StudyCreate,
    StudyListItem,
    StudyOut,
    StudyPatch,
    StudySummary,
    TargetCreate,
    TargetOut,
    TargetPatch,
)
from app.services.scoring import DISCLAIMER, ScoringConfig, config_to_dict
from app.services.summary import _series, build_summary, collect
from app.services.textutil import slugify

router = APIRouter(tags=["studies"])


def _study_or_404(session: Session, user: User, study_id: UUID) -> Study:
    study = session.scalar(
        select(Study).where(Study.id == study_id).options(selectinload(Study.targets).selectinload(MonitoringTarget.aliases))
    )
    if study is None or (user.role != "superadmin" and study.organization_id != user.organization_id):
        raise HTTPException(status_code=404, detail="Estudio no encontrado")
    return study


def _unique_slug(session: Session, organization_id: UUID, name: str) -> str:
    base = slugify(name)
    slug = base
    counter = 2
    while session.scalar(select(Study.id).where(Study.organization_id == organization_id, Study.slug == slug)):
        slug = f"{base[:70]}-{counter}"
        counter += 1
    return slug


@router.get("/studies", response_model=list[StudyListItem])
def list_studies(session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(Study).order_by(Study.created_at.desc())
    if user.role != "superadmin":
        stmt = stmt.where(Study.organization_id == user.organization_id)
    studies = list(session.scalars(stmt).all())
    counts = dict(
        session.execute(
            select(MonitoringTarget.study_id, func.count())
            .group_by(MonitoringTarget.study_id)
        ).all()
    )
    return [
        StudyListItem(
            id=study.id,
            name=study.name,
            slug=study.slug,
            description=study.description,
            window_start=study.window_start,
            window_end=study.window_end,
            is_demo=study.is_demo,
            target_count=int(counts.get(study.id, 0)),
        )
        for study in studies
    ]


@router.post("/studies", response_model=StudyOut)
def create_study(
    body: StudyCreate,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_writer(user)
    if body.window_end < body.window_start:
        raise HTTPException(status_code=422, detail="La fecha final es anterior a la inicial")
    study = Study(
        organization_id=user.organization_id,
        name=body.name.strip(),
        slug=_unique_slug(session, user.organization_id, body.name),
        description=body.description,
        window_start=body.window_start,
        window_end=body.window_end,
        scoring_config=body.scoring_config or config_to_dict(ScoringConfig()),
        is_demo=False,
        created_by=user.id,
    )
    session.add(study)
    session.commit()
    return _study_or_404(session, user, study.id)


@router.get("/studies/{study_id}", response_model=StudyOut)
def get_study(study_id: UUID, session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _study_or_404(session, user, study_id)


@router.patch("/studies/{study_id}", response_model=StudyOut)
def patch_study(
    study_id: UUID,
    body: StudyPatch,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_writer(user)
    study = _study_or_404(session, user, study_id)
    if body.name is not None:
        study.name = body.name.strip()
    if body.description is not None:
        study.description = body.description
    if body.window_start is not None:
        study.window_start = body.window_start
    if body.window_end is not None:
        study.window_end = body.window_end
    if study.window_end < study.window_start:
        raise HTTPException(status_code=422, detail="La fecha final es anterior a la inicial")
    if body.scoring_config is not None:
        study.scoring_config = body.scoring_config
    session.commit()
    return _study_or_404(session, user, study.id)


@router.delete("/studies/{study_id}")
def delete_study(study_id: UUID, session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_writer(user)
    study = _study_or_404(session, user, study_id)
    session.execute(sql_delete(Study).where(Study.id == study.id))
    session.commit()
    return {"deleted": True}


@router.post("/studies/{study_id}/targets", response_model=TargetOut)
def create_target(
    study_id: UUID,
    body: TargetCreate,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_writer(user)
    study = _study_or_404(session, user, study_id)
    if body.kind not in {"politician", "government", "state", "party", "topic", "institution"}:
        raise HTTPException(status_code=422, detail="Tipo de objetivo desconocido")
    target = MonitoringTarget(
        organization_id=study.organization_id,
        study_id=study.id,
        name=body.name.strip(),
        kind=body.kind,
        comparable=body.comparable,
        description=body.description,
    )
    session.add(target)
    session.commit()
    session.refresh(target)
    target.aliases = []
    return target


def _target_or_404(session: Session, user: User, target_id: UUID) -> MonitoringTarget:
    target = session.scalar(
        select(MonitoringTarget)
        .where(MonitoringTarget.id == target_id)
        .options(selectinload(MonitoringTarget.aliases))
    )
    if target is None or (user.role != "superadmin" and target.organization_id != user.organization_id):
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    return target


@router.patch("/targets/{target_id}", response_model=TargetOut)
def patch_target(
    target_id: UUID,
    body: TargetPatch,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_writer(user)
    target = _target_or_404(session, user, target_id)
    if body.name is not None:
        target.name = body.name.strip()
    if body.comparable is not None:
        target.comparable = body.comparable
    if body.description is not None:
        target.description = body.description
    session.commit()
    return _target_or_404(session, user, target.id)


@router.delete("/targets/{target_id}")
def delete_target(target_id: UUID, session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_writer(user)
    target = _target_or_404(session, user, target_id)
    session.execute(sql_delete(MonitoringTarget).where(MonitoringTarget.id == target.id))
    session.commit()
    return {"deleted": True}


@router.post("/targets/{target_id}/aliases", response_model=AliasOut)
def create_alias(
    target_id: UUID,
    body: AliasCreate,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_writer(user)
    target = _target_or_404(session, user, target_id)
    if body.kind not in {"name", "nickname", "hashtag", "account"}:
        raise HTTPException(status_code=422, detail="Tipo de alias desconocido")
    alias = Alias(target_id=target.id, phrase=body.phrase.strip(), kind=body.kind)
    session.add(alias)
    session.commit()
    session.refresh(alias)
    return alias


@router.delete("/aliases/{alias_id}")
def delete_alias(alias_id: UUID, session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_writer(user)
    alias = session.get(Alias, alias_id)
    if alias is None:
        raise HTTPException(status_code=404, detail="Alias no encontrado")
    _target_or_404(session, user, alias.target_id)
    session.delete(alias)
    session.commit()
    return {"deleted": True}


@router.get("/studies/{study_id}/summary", response_model=StudySummary)
def study_summary(study_id: UUID, session: Session = Depends(get_db), user: User = Depends(get_current_user)):
    study = _study_or_404(session, user, study_id)
    return build_summary(session, study)


@router.get("/studies/{study_id}/targets/{target_id}/series", response_model=list[SeriesPoint])
def target_series(
    study_id: UUID,
    target_id: UUID,
    source: str | None = None,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    study = _study_or_404(session, user, study_id)
    summary = build_summary(session, study)
    found = next((item for item in summary.targets if item.id == target_id), None)
    if found is None:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    if source is None:
        return found.series
    scored, _as_of, config = collect(session, study)
    rows = [row for row in scored if row.target_id == target_id and row.mention.source_kind == source]
    return _series(rows, config.neutral_factor)


@router.get("/studies/{study_id}/compare")
def compare_targets(
    study_id: UUID,
    ids: str,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    study = _study_or_404(session, user, study_id)
    wanted = {UUID(part) for part in ids.split(",") if part.strip()}
    summary = build_summary(session, study)
    return {
        "disclaimer": summary.disclaimer,
        "targets": [item for item in summary.targets if item.id in wanted],
        "preferences": [
            item
            for item in summary.preferences
            if item.left_id in wanted and item.right_id in wanted
        ],
    }


@router.post("/studies/{study_id}/ask", response_model=AskResponse)
def ask(
    study_id: UUID,
    body: AskRequest,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    study = _study_or_404(session, user, study_id)
    summary = build_summary(session, study)
    tokens = [token for token in body.question.casefold().split() if len(token) > 3]
    ranked = []
    for item in summary.evidence:
        haystack = item.text.casefold()
        score = sum(1 for token in tokens if token in haystack)
        ranked.append((score, item))
    ranked.sort(key=lambda pair: (pair[0], pair[1].weight), reverse=True)
    picked = [item for score, item in ranked if score > 0][:5] or summary.evidence[:5]
    alert_text = summary.alerts[0].message if summary.alerts else ""
    if any(word in body.question.casefold() for word in ("negativ", "subio", "subió", "baj")) and alert_text:
        answer = alert_text
    elif summary.preferences:
        answer = summary.preferences[0].headline
    else:
        answer = "No hay un hallazgo calculado para esa pregunta en la ventana del estudio."
    if picked:
        answer = f"{answer} Estas menciones están guardadas y sostienen la lectura."
    return AskResponse(mode="lexical", answer=answer, evidence=picked, disclaimer=DISCLAIMER)
