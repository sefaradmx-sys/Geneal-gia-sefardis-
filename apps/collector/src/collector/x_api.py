from datetime import datetime

import httpx

from collector.base import ConnectorNotConfigured, HarvestQuery, RawItem


def parse_recent_search(payload: dict) -> list[RawItem]:
    users = {user.get("id"): user for user in payload.get("includes", {}).get("users", [])}
    items: list[RawItem] = []
    for tweet in payload.get("data", []):
        text = (tweet.get("text") or "").strip()
        if not text:
            continue
        created = tweet.get("created_at")
        published = datetime.fromisoformat(created.replace("Z", "+00:00")) if created else None
        metrics = tweet.get("public_metrics") or {}
        author = users.get(tweet.get("author_id"), {})
        items.append(
            RawItem(
                source="x",
                external_id=tweet.get("id") or text[:40],
                text=text,
                url=f"https://x.com/i/web/status/{tweet.get('id')}" if tweet.get("id") else None,
                author_handle=author.get("username"),
                author_followers=int(author.get("public_metrics", {}).get("followers_count") or 0),
                published_at=published,
                likes=int(metrics.get("like_count") or 0),
                replies=int(metrics.get("reply_count") or 0),
                shares=int(metrics.get("retweet_count") or 0),
                views=int(metrics.get("impression_count") or 0),
                license_note="Post público vía API oficial de X.",
            )
        )
    return items


class XConnector:
    name = "x"

    def __init__(self, bearer_token: str):
        self.bearer_token = bearer_token

    async def harvest(self, query: HarvestQuery) -> list[RawItem]:
        if not self.bearer_token:
            raise ConnectorNotConfigured(self.name)
        params = {
            "query": " OR ".join(query.phrases),
            "max_results": min(max(query.limit, 10), 100),
            "tweet.fields": "created_at,public_metrics,author_id,lang",
            "expansions": "author_id",
            "user.fields": "username,public_metrics",
            "start_time": query.since.isoformat().replace("+00:00", "Z"),
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                "https://api.x.com/2/tweets/search/recent",
                headers={"Authorization": f"Bearer {self.bearer_token}"},
                params=params,
            )
            response.raise_for_status()
        return parse_recent_search(response.json())
