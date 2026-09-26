from datetime import datetime

import httpx

from collector.base import ConnectorNotConfigured, HarvestQuery, RawItem


def parse_comment_threads(payload: dict) -> list[RawItem]:
    items: list[RawItem] = []
    for thread in payload.get("items", []):
        snippet = thread.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
        text = (snippet.get("textOriginal") or "").strip()
        if not text:
            continue
        published = snippet.get("publishedAt")
        published_at = datetime.fromisoformat(published.replace("Z", "+00:00")) if published else None
        items.append(
            RawItem(
                source="youtube",
                external_id=thread.get("id") or snippet.get("authorChannelId", {}).get("value") or text[:40],
                text=text,
                url=f"https://www.youtube.com/watch?v={snippet.get('videoId')}" if snippet.get("videoId") else None,
                author_handle=snippet.get("authorDisplayName"),
                published_at=published_at,
                likes=int(snippet.get("likeCount") or 0),
                replies=int(thread.get("snippet", {}).get("totalReplyCount") or 0),
                license_note="Comentario público de YouTube Data API.",
                raw={"video_id": snippet.get("videoId")},
            )
        )
    return items


class YoutubeConnector:
    name = "youtube"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def harvest(self, query: HarvestQuery) -> list[RawItem]:
        if not self.api_key:
            raise ConnectorNotConfigured(self.name)
        params = {
            "part": "snippet",
            "q": " OR ".join(query.phrases) or "Coahuila",
            "type": "video",
            "maxResults": min(query.limit, 10),
            "key": self.api_key,
            "publishedAfter": query.since.isoformat().replace("+00:00", "Z"),
        }
        async with httpx.AsyncClient(timeout=20) as client:
            search = await client.get("https://www.googleapis.com/youtube/v3/search", params=params)
            search.raise_for_status()
            video_ids = [
                item.get("id", {}).get("videoId")
                for item in search.json().get("items", [])
                if item.get("id", {}).get("videoId")
            ]
            found: list[RawItem] = []
            for video_id in video_ids:
                comments = await client.get(
                    "https://www.googleapis.com/youtube/v3/commentThreads",
                    params={
                        "part": "snippet",
                        "videoId": video_id,
                        "maxResults": 20,
                        "key": self.api_key,
                        "textFormat": "plainText",
                    },
                )
                if comments.status_code >= 400:
                    continue
                found.extend(parse_comment_threads(comments.json()))
                if len(found) >= query.limit:
                    break
        return found[: query.limit]
