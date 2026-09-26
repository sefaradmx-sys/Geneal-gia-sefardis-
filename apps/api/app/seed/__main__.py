import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.entities import (
    Alert,
    Alias,
    Classification,
    Insight,
    Mention,
    MentionTarget,
    MonitoringTarget,
    Organization,
    Source,
    Study,
    User,
)
from app.seed.factory import LICENSE_NOTE, TARGET_SPECS, build_demo_mentions
from app.services.scoring import ScoringConfig, config_to_dict
from app.services.summary import build_summary, snapshot_study
from app.services.textutil import clean_text, normalized_hash

log = logging.getLogger("seed")

STUDY_SLUG = "sentimiento-gobierno-coahuila-30-dias"
SOURCE_STATUS = {
    "news": "disabled",
    "x": "not_configured",
    "youtube": "not_configured",
    "reddit": "not_configured",
    "web_public": "disabled",
    "manual_upload": "active",
    "facebook": "not_configured",
}


def ensure_admin(session, settings) -> User:
    existing = session.scalar(select(User).where(User.username == settings.bootstrap_admin_user))
    if existing:
        return existing
    if not settings.bootstrap_admin_password:
        raise RuntimeError("BOOTSTRAP_ADMIN_PASSWORD vacío")
    org = session.scalar(select(Organization).where(Organization.slug == "la-mv-census"))
    if org is None:
        org = Organization(name="Casa matriz", slug="la-mv-census")
        session.add(org)
        session.flush()
    user = User(
        organization_id=org.id,
        email=settings.bootstrap_admin_email,
        username=settings.bootstrap_admin_user,
        password_hash=hash_password(settings.bootstrap_admin_password),
        role="superadmin",
    )
    session.add(user)
    session.flush()
    log.info("usuario inicial listo")
    return user


def seed_demo(session, admin: User, now: datetime) -> None:
    if session.scalar(select(Study.id).where(Study.slug == STUDY_SLUG)):
        log.info("estudio de demostración ya existe")
        return
    rows = build_demo_mentions(now)
    study = Study(
        organization_id=admin.organization_id,
        name="Sentimiento Gobierno de Coahuila — 30 días",
        slug=STUDY_SLUG,
        description="Estudio de demostración con menciones sintéticas. Mide el índice de sentimiento digital del gobierno estatal y tres perfiles ficticios.",
        window_start=(now - timedelta(days=30)).date(),
        window_end=now.date(),
        scoring_config=config_to_dict(ScoringConfig()),
        is_demo=True,
        created_by=admin.id,
    )
    session.add(study)
    session.flush()
    targets = {}
    for spec in TARGET_SPECS:
        target = MonitoringTarget(
            organization_id=admin.organization_id,
            study_id=study.id,
            key=spec["key"],
            name=spec["name"],
            kind=spec["kind"],
            comparable=spec["comparable"],
            description=spec["description"],
        )
        session.add(target)
        session.flush()
        for phrase, kind in spec["aliases"]:
            session.add(Alias(target_id=target.id, phrase=phrase, kind=kind))
        targets[spec["key"]] = target
    for kind, status in SOURCE_STATUS.items():
        session.add(
            Source(
                organization_id=admin.organization_id,
                study_id=study.id,
                kind=kind,
                status=status,
                config={},
            )
        )
    for row in rows:
        mention = Mention(
            organization_id=admin.organization_id,
            study_id=study.id,
            source_kind=row.source_kind,
            external_id=row.external_id,
            text_original=row.text,
            text_clean=clean_text(row.text),
            published_at=row.published_at,
            collected_at=now,
            url=f"https://demo.la-mv-census.local/m/{row.external_id}",
            author_handle=row.author_handle,
            author_followers=row.followers,
            likes=row.likes,
            replies=row.replies,
            shares=row.shares,
            views=row.views,
            geo_state=row.geo_state,
            geo_municipality=row.geo_municipality,
            theme=row.theme,
            license_note=LICENSE_NOTE,
            normalized_hash=normalized_hash(row.text),
            is_synthetic=True,
            is_bot=row.is_bot,
        )
        session.add(mention)
        session.flush()
        session.add(
            Classification(
                mention_id=mention.id,
                sentiment=row.sentiment,
                stance=row.stance,
                emotion=row.emotion,
                toxicity=row.toxicity,
                irony=row.irony,
                confidence=row.confidence,
                model_name="semilla_demo",
                needs_review=row.confidence < 0.45,
            )
        )
        session.add(
            MentionTarget(
                mention_id=mention.id,
                target_id=targets[row.target_key].id,
                relevance=row.relevance,
            )
        )
    session.flush()
    study.targets = list(targets.values())
    summary = build_summary(session, study)
    for preference in summary.preferences:
        session.add(Insight(study_id=study.id, body=preference.headline))
    for alert in summary.alerts:
        session.add(
            Alert(
                organization_id=admin.organization_id,
                study_id=study.id,
                target_id=alert.target_id,
                rule=alert.rule,
                message=alert.message,
                delta_points=alert.delta_points,
            )
        )
    snapshot_study(session, study)
    log.info("estudio de demostración cargado con %s menciones", len(rows))


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    settings = get_settings()
    session = SessionLocal()
    try:
        admin = ensure_admin(session, settings)
        if settings.demo_seed:
            seed_demo(session, admin, datetime.now(timezone.utc))
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
