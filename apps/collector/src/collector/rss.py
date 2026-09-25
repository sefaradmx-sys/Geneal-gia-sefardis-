from datetime import timezone
from email.utils import parsedate_to_datetime

import feedparser
import httpx

from collector.base import ConnectorDisabled, ConnectorNotConfigured, HarvestQuery, RawItem


def parse_feed(payload: str | bytes, source_name: str = "news") -> list[RawItem]:
    parsed = feedparser.parse(payload)
    items: list[RawItem] = []
    for entry in parsed.entries:
        title = (entry.get("title") or "").strip()
        summary = (entry.get("summary") or entry.get("description") or "").strip()
        text = f"{title}. {summary}".strip(" .")
        if not text:
            continue
        published = None
        if entry.get("published"):
            try:
                published = parsedate_to_datetime(entry.published)
                if published.tzinfo is None:
                    published = published.replace(tzinfo=timezone.utc)
            except (TypeError, ValueError):
                published = None
        link = entry.get("link")
        items.append(
            RawItem(
                source=source_name,
                external_id=entry.get("id") or link or title[:80],
                text=text,
                url=link,
                author_handle=entry.get("author"),
                published_at=published,
                license_note="Nota pública vía RSS.",
                raw={"title": title},
            )
        )
    return items


class RssConnector:
    name = "news"

    def __init__(self, feeds: list[str], enabled: bool = False):
        self.feeds = feeds
        self.enabled = enabled

    async def harvest(self, query: HarvestQuery) -> list[RawItem]:
        if not self.enabled:
            raise ConnectorDisabled(self.name)
        if not self.feeds:
            raise ConnectorNotConfigured(self.name)
        found: list[RawItem] = []
        async with httpx.AsyncClient(timeout=20, headers={"User-Agent": "LA-MV-Census/0.1"}) as client:
            for feed in self.feeds:
                response = await client.get(feed)
                response.raise_for_status()
                for item in parse_feed(response.content):
                    if item.published_at and not (query.since <= item.published_at <= query.until):
                        continue
                    haystack = item.text.casefold()
                    if query.phrases and not any(phrase.casefold() in haystack for phrase in query.phrases):
                        continue
                    found.append(item)
                    if len(found) >= query.limit:
                        return found
        return found
