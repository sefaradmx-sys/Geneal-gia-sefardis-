import logging
from datetime import datetime, time, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.entities import MonitoringTarget, Study
from app.services.ingest import persist_raw_items
from collector.base import ConnectorDisabled, ConnectorNotConfigured, HarvestQuery
from collector.reddit import RedditConnector
from collector.rss import RssConnector
from collector.web_public import PublicWebConnector
from collector.x_api import XConnector
from collector.youtube import YoutubeConnector

log = logging.getLogger("collector")


def build_connectors():
    settings = get_settings()
    return [
        RssConnector(settings.rss_feed_list, enabled=settings.collect_rss),
        YoutubeConnector(settings.youtube_api_key),
        RedditConnector(settings.reddit_client_id, settings.reddit_client_secret, settings.reddit_user_agent),
        XConnector(settings.x_bearer_token),
        PublicWebConnector(settings.user_agent, settings.web_delay_seconds, settings.web_daily_cap),
    ]


def phrases_for_targets(targets: list[MonitoringTarget]) -> list[str]:
    phrases: list[str] = []
    seen: set[str] = set()
    for target in targets:
        candidates = [target.name, *[alias.phrase for alias in target.aliases]]
        for phrase in candidates:
            text = (phrase or "").strip()
            key = text.casefold()
            if not text or key in seen:
                continue
            seen.add(key)
            phrases.append(text)
    return phrases


async def harvest_studies(session: Session) -> dict:
    studies = list(
        session.scalars(
            select(Study).options(selectinload(Study.targets).selectinload(MonitoringTarget.aliases))
        ).all()
    )
    connectors = build_connectors()
    created = 0
    touched = 0
    for study in studies:
        phrases = phrases_for_targets(study.targets)
        if not phrases:
            continue
        start = datetime.combine(study.window_start, time.min, tzinfo=timezone.utc)
        end = datetime.combine(study.window_end, time(23, 59, 59), tzinfo=timezone.utc)
        until = min(datetime.now(timezone.utc), end)
        if until < start:
            continue
        query = HarvestQuery(phrases=phrases, since=start, until=until, limit=100)
        touched += 1
        for connector in connectors:
            try:
                items = await connector.harvest(query)
            except ConnectorNotConfigured:
                log.info("conector %s no configurado", connector.name)
                continue
            except ConnectorDisabled:
                log.info("conector %s apagado", connector.name)
                continue
            except Exception:
                log.exception("conector %s falló", connector.name)
                continue
            if not items:
                continue
            result = persist_raw_items(session, study, items, None)
            created += int(result["created"])
            log.info("estudio %s conector %s %s", study.slug, connector.name, result)
    return {"studies": touched, "created": created}
