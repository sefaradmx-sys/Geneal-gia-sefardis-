from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.entities import AuditLog, Classification, Mention, MentionTarget, MonitoringTarget, Study
from app.services.textutil import clean_text, normalized_hash
from collector.base import RawItem


def match_target_relevance(haystack: str, name: str, aliases: list[str]) -> float | None:
    phrases = [name, *aliases]
    matched = [phrase for phrase in phrases if phrase and phrase.casefold() in haystack.casefold()]
    if not matched:
        return None
    return 0.95 if any(len(phrase) >= 10 for phrase in matched) else 0.72


def _link_mention_to_targets(session: Session, study: Study, mention: Mention) -> None:
    targets = session.scalars(
        select(MonitoringTarget)
        .where(MonitoringTarget.study_id == study.id)
        .options(selectinload(MonitoringTarget.aliases))
    ).all()
    haystack = f"{mention.text_clean} {mention.theme or ''}"
    for target in targets:
        relevance = match_target_relevance(haystack, target.name, [alias.phrase for alias in target.aliases])
        if relevance is None:
            continue
        session.add(MentionTarget(mention_id=mention.id, target_id=target.id, relevance=relevance))


def persist_raw_items(session: Session, study: Study, items: list[RawItem], user_id) -> dict:
    existing_hashes = set(
        session.scalars(select(Mention.normalized_hash).where(Mention.study_id == study.id)).all()
    )
    existing_external = set(
        session.scalars(
            select(Mention.external_id).where(Mention.study_id == study.id)
        ).all()
    )
    created = skipped = review = 0
    now = datetime.now(timezone.utc)
    for item in items:
        digest = normalized_hash(item.text)
        if digest in existing_hashes or item.external_id in existing_external:
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
            external_id=item.external_id[:120],
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
        has_label = item.sentiment in {"positive", "negative", "neutral"} and item.confidence is not None
        needs_review = not has_label or (item.confidence or 0) < 0.45
        session.add(
            Classification(
                mention_id=mention.id,
                sentiment=item.sentiment or "neutral",
                stance=item.stance or "not_applicable",
                emotion="",
                toxicity=0,
                irony=0,
                confidence=item.confidence or 0,
                model_name="carga_manual" if has_label else "sin_modelo",
                needs_review=needs_review,
            )
        )
        if needs_review:
            review += 1
        _link_mention_to_targets(session, study, mention)
        existing_hashes.add(digest)
        existing_external.add(item.external_id)
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
