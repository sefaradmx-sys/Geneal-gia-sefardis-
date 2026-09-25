from datetime import datetime, timezone

import httpx

from collector.base import ConnectorNotConfigured, HarvestQuery, RawItem


def parse_listing(payload: dict) -> list[RawItem]:
    children = payload.get("data", {}).get("children", [])
    items: list[RawItem] = []
    for child in children:
        data = child.get("data", {})
        text = (data.get("selftext") or data.get("title") or "").strip()
        if not text:
            continue
        created = data.get("created_utc")
        published = datetime.fromtimestamp(created, tz=timezone.utc) if created else None
        items.append(
            RawItem(
                source="reddit",
                external_id=data.get("id") or data.get("name") or text[:40],
                text=text,
                url="https://www.reddit.com" + data.get("permalink", ""),
                author_handle=data.get("author"),
                published_at=published,
                likes=int(data.get("ups") or 0),
                replies=int(data.get("num_comments") or 0),
                license_note="Contenido público de la API de Reddit.",
            )
        )
    return items


class RedditConnector:
    name = "reddit"

    def __init__(self, client_id: str, client_secret: str, user_agent: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.user_agent = user_agent

    async def harvest(self, query: HarvestQuery) -> list[RawItem]:
        if not self.client_id or not self.client_secret:
            raise ConnectorNotConfigured(self.name)
        async with httpx.AsyncClient(timeout=20, headers={"User-Agent": self.user_agent}) as client:
            token_response = await client.post(
                "https://www.reddit.com/api/v1/access_token",
                auth=(self.client_id, self.client_secret),
                data={"grant_type": "client_credentials"},
            )
            token_response.raise_for_status()
            token = token_response.json()["access_token"]
            search = await client.get(
                "https://oauth.reddit.com/search",
                headers={"Authorization": f"Bearer {token}"},
                params={"q": " OR ".join(query.phrases), "sort": "new", "limit": min(query.limit, 50)},
            )
            search.raise_for_status()
        return parse_listing(search.json())
