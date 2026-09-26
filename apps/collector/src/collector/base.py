from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol


class ConnectorNotConfigured(Exception):
    def __init__(self, name: str):
        super().__init__(name)
        self.connector = name


class ConnectorDisabled(Exception):
    def __init__(self, name: str):
        super().__init__(name)
        self.connector = name


@dataclass
class HarvestQuery:
    phrases: list[str]
    since: datetime
    until: datetime
    allowlist: list[str] | None = None
    limit: int = 100


@dataclass
class RawItem:
    source: str
    external_id: str
    text: str
    url: str | None
    author_handle: str | None
    published_at: datetime | None
    likes: int = 0
    replies: int = 0
    shares: int = 0
    views: int = 0
    author_followers: int = 0
    geo_state: str | None = None
    geo_municipality: str | None = None
    sentiment: str | None = None
    stance: str | None = None
    theme: str | None = None
    confidence: float | None = None
    relevance: float | None = None
    target_hint: str | None = None
    license_note: str = "Contenido público o carga del analista."
    raw: dict = field(default_factory=dict)


class Connector(Protocol):
    name: str

    async def harvest(self, query: HarvestQuery) -> list[RawItem]: ...
