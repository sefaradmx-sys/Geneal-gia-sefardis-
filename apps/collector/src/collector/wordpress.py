"""WordPress público (wp-json). No inicia sesión ni evade términos."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from html import unescape

import httpx

from collector.base import ConnectorDisabled, ConnectorNotConfigured, HarvestQuery, RawItem

CIVIC_MARKERS = (
    "anáhuac",
    "anahuac",
    "morton",
    "nuevo león",
    "nuevo leon",
)


def strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html or "")
    return unescape(re.sub(r"\s+", " ", text)).strip()


def is_civic(text: str, extra_phrases: list[str] | None = None) -> bool:
    haystack = text.casefold()
    markers = list(CIVIC_MARKERS)
    if extra_phrases:
        markers.extend(phrase.casefold() for phrase in extra_phrases if phrase)
    return any(marker in haystack for marker in markers)


def parse_wp_posts(payload: list, source_name: str = "news", author: str | None = None) -> list[RawItem]:
    items: list[RawItem] = []
    for post in payload:
        title = strip_html(str((post.get("title") or {}).get("rendered") or ""))
        body = strip_html(str((post.get("content") or {}).get("rendered") or post.get("excerpt", {}).get("rendered") or ""))
        text = f"{title}. {body}".strip(" .")
        if not text:
            continue
        published = None
        raw_date = post.get("date_gmt") or post.get("date")
        if raw_date:
            try:
                published = datetime.fromisoformat(str(raw_date).replace("Z", "+00:00"))
                if published.tzinfo is None:
                    published = published.replace(tzinfo=timezone.utc)
            except ValueError:
                published = None
        link = post.get("link")
        items.append(
            RawItem(
                source=source_name,
                external_id=f"wp-post-{post.get('id') or link or title[:80]}",
                text=text,
                url=link,
                author_handle=author,
                published_at=published,
                license_note="Nota pública vía WordPress REST API.",
                raw={"civic": is_civic(text), "post_id": post.get("id")},
            )
        )
    return items


def parse_wp_comments(payload: list, source_name: str = "web_public") -> list[RawItem]:
    items: list[RawItem] = []
    for comment in payload:
        text = strip_html(str((comment.get("content") or {}).get("rendered") or ""))
        if not text:
            continue
        published = None
        raw_date = comment.get("date_gmt") or comment.get("date")
        if raw_date:
            try:
                published = datetime.fromisoformat(str(raw_date).replace("Z", "+00:00"))
                if published.tzinfo is None:
                    published = published.replace(tzinfo=timezone.utc)
            except ValueError:
                published = None
        items.append(
            RawItem(
                source=source_name,
                external_id=f"wp-comment-{comment.get('id')}",
                text=text,
                url=comment.get("link"),
                author_handle=comment.get("author_name") or "comentarista",
                published_at=published,
                license_note="Comentario público vía WordPress REST API.",
                raw={"civic": is_civic(text), "comment_id": comment.get("id")},
            )
        )
    return items


def civic_count(items: list[RawItem]) -> int:
    return sum(1 for item in items if item.raw.get("civic"))


class WordpressConnector:
    name = "news"

    def __init__(self, site: str, enabled: bool = False, outlet: str = "WordPress"):
        self.site = (site or "").rstrip("/")
        self.enabled = enabled
        self.outlet = outlet

    async def harvest(self, query: HarvestQuery) -> list[RawItem]:
        if not self.enabled:
            raise ConnectorDisabled(self.name)
        if not self.site:
            raise ConnectorNotConfigured(self.name)
        posts_url = f"{self.site}/wp-json/wp/v2/posts"
        comments_url = f"{self.site}/wp-json/wp/v2/comments"
        found: list[RawItem] = []
        async with httpx.AsyncClient(timeout=20, headers={"User-Agent": "LA-MV-Census/0.1"}) as client:
            posts_resp = await client.get(posts_url, params={"per_page": 50})
            posts_resp.raise_for_status()
            comments_resp = await client.get(comments_url, params={"per_page": 50})
            comments_resp.raise_for_status()
        for item in [
            *parse_wp_posts(posts_resp.json(), author=self.outlet),
            *parse_wp_comments(comments_resp.json()),
        ]:
            if item.published_at and not (query.since <= item.published_at <= query.until):
                continue
            if not is_civic(item.text, query.phrases):
                continue
            found.append(item)
            if len(found) >= query.limit:
                return found
        return found
