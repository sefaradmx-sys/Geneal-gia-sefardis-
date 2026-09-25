import asyncio
import logging

from collector.base import ConnectorDisabled, ConnectorNotConfigured, HarvestQuery
from collector.reddit import RedditConnector
from collector.rss import RssConnector
from collector.web_public import PublicWebConnector
from collector.x_api import XConnector
from collector.youtube import YoutubeConnector

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("collector")


def build_connectors():
    from app.core.config import get_settings

    settings = get_settings()
    return [
        RssConnector(settings.rss_feed_list, enabled=settings.collect_rss),
        YoutubeConnector(settings.youtube_api_key),
        RedditConnector(settings.reddit_client_id, settings.reddit_client_secret, settings.reddit_user_agent),
        XConnector(settings.x_bearer_token),
        PublicWebConnector(settings.user_agent, settings.web_delay_seconds, settings.web_daily_cap),
    ]


async def run_once() -> None:
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    query = HarvestQuery(phrases=[], since=now - timedelta(days=1), until=now, allowlist=None)
    for connector in build_connectors():
        try:
            items = await connector.harvest(query)
            log.info("conector %s entregó %s elementos", connector.name, len(items))
        except ConnectorNotConfigured:
            log.info("conector %s no configurado", connector.name)
        except ConnectorDisabled:
            log.info("conector %s apagado", connector.name)
        except Exception:
            log.exception("conector %s falló", connector.name)


async def main() -> None:
    while True:
        await run_once()
        await asyncio.sleep(900)


if __name__ == "__main__":
    asyncio.run(main())
