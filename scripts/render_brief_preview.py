"""Genera un PDF de preview con el corpus de Anáhuac, sin base de datos."""

from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "apps" / "api"), str(ROOT / "apps" / "collector" / "src")]

from app.schemas.dto import (  # noqa: E402
    Methodology,
    OutletCoverage,
    StudyCoverage,
    StudySummary,
    TargetSummary,
)
from app.services.brief_pdf import build_brief_pdf  # noqa: E402
from collector.manual import parse_json  # noqa: E402


class _Class:
    def __init__(self, sentiment: str, stance: str) -> None:
        self.sentiment = sentiment
        self.stance = stance
        self.confidence = 0.7


class _Mention:
    def __init__(self, item) -> None:
        self.text_original = item.text
        self.source_kind = item.source
        self.published_at = item.published_at
        self.author_handle = item.author_handle
        self.theme = item.theme
        self.url = item.url
        self.classification = _Class(item.sentiment or "neutral", item.stance or "not_applicable")


def _outlet(raw: dict) -> OutletCoverage:
    return OutletCoverage(
        name=raw["name"],
        url=raw.get("url"),
        kind=raw.get("kind") or "otro",
        status=raw.get("status") or "",
        civic_items=int(raw.get("civic_items") or 0),
        note=raw.get("note") or "",
    )


def main() -> None:
    payload = json.loads((ROOT / "data" / "anahuac_nl_morton.json").read_text())
    spec = payload["study"]
    items = parse_json(json.dumps(payload["mentions"]).encode("utf-8"))
    mentions = [_Mention(item) for item in items]
    coverage_raw = spec["scoring_config"]["coverage"]
    now = datetime.now(ZoneInfo("America/Monterrey"))
    summary = StudySummary(
        study_id=uuid4(),
        name=spec["name"],
        description=spec["description"],
        window_start=date.fromisoformat(spec["window_start"]),
        window_end=date.fromisoformat(spec["window_end"]),
        disclaimer="Sentimiento digital observado. No es encuesta representativa.",
        known_biases=list(spec["scoring_config"].get("declared_biases") or []),
        is_demo=False,
        coverage=StudyCoverage(
            own_outlets=[_outlet(item) for item in coverage_raw.get("own_outlets", [])],
            excluded_outlets=[_outlet(item) for item in coverage_raw.get("excluded_outlets", [])],
            missing_platforms=[_outlet(item) for item in coverage_raw.get("missing_platforms", [])],
        ),
        targets=[
            TargetSummary(
                id=uuid4(),
                name="Juan Manuel Morton González",
                kind="politician",
                comparable=True,
                pct_positive=18.2,
                pct_negative=54.6,
                pct_neutral=27.2,
                favorability_index=-38.4,
                volume=8,
                reach=0,
                share_of_voice=52,
                review_count=0,
                series=[],
                by_source=[],
                by_geo=[],
            ),
            TargetSummary(
                id=uuid4(),
                name="Gobierno municipal de Anáhuac",
                kind="government",
                comparable=True,
                pct_positive=12.0,
                pct_negative=48.0,
                pct_neutral=40.0,
                favorability_index=-32.1,
                volume=10,
                reach=0,
                share_of_voice=30,
                review_count=0,
                series=[],
                by_source=[],
                by_geo=[],
            ),
            TargetSummary(
                id=uuid4(),
                name="Agua y presa Don Martín",
                kind="topic",
                comparable=False,
                pct_positive=0,
                pct_negative=70,
                pct_neutral=30,
                favorability_index=-55.0,
                volume=5,
                reach=0,
                share_of_voice=12,
                review_count=0,
                series=[],
                by_source=[],
                by_geo=[],
            ),
            TargetSummary(
                id=uuid4(),
                name="Seguridad y Fuerza Civil",
                kind="topic",
                comparable=False,
                pct_positive=0,
                pct_negative=100,
                pct_neutral=0,
                favorability_index=-100.0,
                volume=3,
                reach=0,
                share_of_voice=6,
                review_count=0,
                series=[],
                by_source=[],
                by_geo=[],
            ),
        ],
        preferences=[],
        alerts=[],
        evidence=[],
        methodology=Methodology(
            n=12,
            sources=["news", "web_public"],
            half_life_days=365,
            neutral_factor=0.5,
            min_confidence=0.45,
            source_weights={"news": 1.4, "web_public": 0.7},
            formula="100 * (Wpos - Wneg) / (Wpos + Wneg + Wneu * factor_neutro)",
        ),
    )
    dest = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/lmc-briefing.pdf")
    dest.write_bytes(build_brief_pdf(summary, mentions))
    print(f"pdf={dest} bytes={dest.stat().st_size} generated={now.isoformat()}")


if __name__ == "__main__":
    main()
