from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.entities import AuditLog, Classification, Mention, MentionTarget, MonitoringTarget, Study
from app.services.textutil import clean_text, contains_phrase, fold_text, normalized_hash
from collector.base import RawItem

_LABELED = {"positive", "negative", "neutral"}


def label_from_upload(sentiment: str | None, confidence: float | None) -> tuple[str, float, bool, str]:
    if sentiment is None or sentiment not in _LABELED:
        return "neutral", 0.0, True, "sin_modelo"
    value = 1.0 if confidence is None else float(confidence)
    return sentiment, value, value < 0.45, "carga_manual"


def matched_targets(text: str, targets: list[MonitoringTarget], hint: str | None) -> list[MonitoringTarget]:
    hint_key = fold_text(hint or "").strip()
    chosen: list[MonitoringTarget] = []
    seen: set = set()
    for target in targets:
        phrases = [target.name, *[alias.phrase for alias in target.aliases]]
        hint_phrases = list(phrases)
        if target.key:
            hint_phrases.append(target.key)
            if len(fold_text(target.key).strip()) >= 3:
                phrases.append(target.key)
        hinted = bool(hint_key) and any(fold_text(phrase).strip() == hint_key for phrase in hint_phrases if phrase)
        mentioned = any(contains_phrase(text, phrase) for phrase in phrases if phrase)
        if not hinted and not mentioned:
            continue
        if target.id in seen:
            continue
        seen.add(target.id)
        chosen.append(target)
    return chosen


def _load_targets(session: Session, study: Study) -> list[MonitoringTarget]:
    return list(
        session.scalars(
            select(MonitoringTarget)
            .where(MonitoringTarget.study_id == study.id)
            .options(selectinload(MonitoringTarget.aliases))
        ).all()
    )


def persist_raw_items(session: Session, study: Study, items: list[RawItem], user_id) -> dict:
    existing_hashes = set(
        session.scalars(select(Mention.normalized_hash).where(Mention.study_id == study.id)).all()
    )
    existing_external = set(
        session.scalars(
            select(Mention.external_id).where(Mention.study_id == study.id)
        ).all()
    )
    targets = _load_targets(session, study)
    created = skipped = review = 0
    now = datetime.now(timezone.utc)
    for item in items:
        digest = normalized_hash(item.text)
        external_id = (item.external_id or "").strip()[:120] or f"auto-{digest[:32]}"
        if digest in existing_hashes or external_id in existing_external:
            skipped += 1
            continue
        published = item.published_at or now
        if published.tzinfo is None:
            published = published.replace(tzinfo=timezone.utc)
        mention = Mention(
            organization_id=study.organization_id,
            study_id=study.id,
            source_kind=item.source if item.source in {
                "news", "x", "youtube", "reddit", "facebook", "web_public", "manual_upload"
            } else "manual_upload",
            external_id=external_id,
            text_original=item.text,
            text_clean=clean_text(item.text),
            published_at=published,
            collected_at=now,
            url=item.url,
            author_handle=item.author_handle,
            author_followers=item.author_followers,
            likes=item.likes,
            replies=item.replies,
            shares=item.shares,
            views=item.views,
            geo_state=item.geo_state,
            geo_municipality=item.geo_municipality,
            theme=item.theme,
            license_note=item.license_note,
            normalized_hash=digest,
            is_synthetic=False,
        )
        session.add(mention)
        session.flush()
        sentiment, confidence, needs_review, model_name = label_from_upload(item.sentiment, item.confidence)
        session.add(
            Classification(
                mention_id=mention.id,
                sentiment=sentiment,
                stance=item.stance or "not_applicable",
                emotion="",
                toxicity=0,
                irony=0,
                confidence=confidence,
                model_name=model_name,
                needs_review=needs_review,
            )
        )
        relevance = 1.0 if item.relevance is None else float(item.relevance)
        for target in matched_targets(item.text, targets, item.target_hint):
            session.add(MentionTarget(mention_id=mention.id, target_id=target.id, relevance=relevance))
        if needs_review:
            review += 1
        existing_hashes.add(digest)
        existing_external.add(external_id)
        created += 1
    session.add(
        AuditLog(
            organization_id=study.organization_id,
            user_id=user_id,
            action="upload",
            resource=f"study:{study.id}",
            detail=f"creadas={created} omitidas={skipped} revision={review}",
        )
    )
    session.commit()
    return {"created": created, "skipped": skipped, "review": review}
