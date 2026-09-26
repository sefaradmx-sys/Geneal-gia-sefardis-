import asyncio
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx

from collector.base import ConnectorNotConfigured, HarvestQuery, RawItem
from collector.limits import DailyCap


def robots_allowed(robots_txt: str, url: str, user_agent: str) -> bool:
    parser = RobotFileParser()
    parser.parse(robots_txt.splitlines())
    return parser.can_fetch(user_agent, url)


def host_allowed(url: str, allowlist: list[str]) -> bool:
    host = urlparse(url).hostname or ""
    return any(host == item or host.endswith("." + item) for item in allowlist)


class PublicWebConnector:
    name = "web_public"

    def __init__(self, user_agent: str, delay_seconds: float, daily_cap: int):
        self.user_agent = user_agent
        self.delay_seconds = delay_seconds
        self.cap = DailyCap(daily_cap)

    async def harvest(self, query: HarvestQuery) -> list[RawItem]:
        if not query.allowlist:
            raise ConnectorNotConfigured(self.name)
        urls = [phrase for phrase in query.phrases if phrase.startswith("http")]
        found: list[RawItem] = []
        async with httpx.AsyncClient(timeout=20, headers={"User-Agent": self.user_agent}, follow_redirects=True) as client:
            for url in urls:
                if not host_allowed(url, query.allowlist):
                    continue
                if not self.cap.allow():
                    break
                origin = f"{urlparse(url).scheme}://{urlparse(url).hostname}/robots.txt"
                robots = await client.get(origin)
                body = robots.text if robots.status_code == 200 else "User-agent: *\nAllow: /"
                if not robots_allowed(body, url, self.user_agent):
                    continue
                await asyncio.sleep(self.delay_seconds)
                page = await client.get(url)
                if page.status_code >= 400:
                    continue
                text = " ".join(page.text.split())
                found.append(
                    RawItem(
                        source=self.name,
                        external_id=url,
                        text=text[:4000],
                        url=url,
                        author_handle=None,
                        published_at=None,
                        license_note="Página pública allowlisteada. Se respetó robots.txt.",
                    )
                )
                if len(found) >= query.limit:
                    break
        return found
