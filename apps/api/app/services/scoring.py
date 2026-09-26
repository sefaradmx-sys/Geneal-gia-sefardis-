"""Fórmula de índice de sentimiento digital. Ver docs/SCORING.md."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime

DISCLAIMER = "Sentimiento digital observado. No es encuesta representativa."

KNOWN_BIASES = [
    "En política mexicana, X suele concentrar más negatividad que los medios nacionales o que una carga de censo. El índice no corrige ese sesgo: lo muestra por fuente.",
    "La prensa local del norte a menudo reproduce boletines municipales. Eso empuja el índice hacia lo positivo sin ser una encuesta de calle.",
    "No se leen Facebook, Instagram ni TikTok: esas plataformas no tienen API usable aquí. El número es sentimiento digital observado, no aprobación electoral.",
]

DEFAULT_SOURCE_WEIGHTS: dict[str, float] = {
    "news": 1.4,
    "manual_upload": 1.6,
    "x": 1.0,
    "facebook": 1.0,
    "reddit": 0.9,
    "youtube": 0.8,
    "web_public": 0.7,
}


@dataclass
class ScoringConfig:
    half_life_days: float = 7.0
    neutral_factor: float = 0.5
    min_confidence: float = 0.45
    min_relevance: float = 0.35
    source_weights: dict[str, float] = field(default_factory=lambda: dict(DEFAULT_SOURCE_WEIGHTS))


def config_from_dict(data: dict | None) -> ScoringConfig:
    if not data:
        return ScoringConfig()
    weights = dict(DEFAULT_SOURCE_WEIGHTS)
    custom = data.get("source_weights")
    if isinstance(custom, dict):
        for key, value in custom.items():
            weights[str(key)] = float(value)
    return ScoringConfig(
        half_life_days=float(data.get("half_life_days", 7.0)),
        neutral_factor=float(data.get("neutral_factor", 0.5)),
        min_confidence=float(data.get("min_confidence", 0.45)),
        min_relevance=float(data.get("min_relevance", 0.35)),
        source_weights=weights,
    )


def config_to_dict(config: ScoringConfig) -> dict:
    return {
        "half_life_days": config.half_life_days,
        "neutral_factor": config.neutral_factor,
        "min_confidence": config.min_confidence,
        "min_relevance": config.min_relevance,
        "source_weights": dict(config.source_weights),
    }


def engagement_score(likes: int, replies: int, shares: int, views: int) -> float:
    return 1 + max(0, likes) + max(0, replies) + max(0, shares) + max(0, views) / 100


def author_weight(followers: int, is_bot: bool) -> float:
    if is_bot:
        return 0.2
    if followers >= 100_000:
        return 1.2
    if followers >= 10_000:
        return 1.1
    return 1.0


def recency_weight(published_at: datetime, as_of: datetime, half_life_days: float) -> float:
    if half_life_days <= 0:
        return 1.0
    age_days = max(0.0, (as_of - published_at).total_seconds() / 86400)
    return 0.5 ** (age_days / half_life_days)


def mention_weight(
    *,
    likes: int,
    replies: int,
    shares: int,
    views: int,
    followers: int,
    is_bot: bool,
    source_kind: str,
    published_at: datetime,
    as_of: datetime,
    relevance: float,
    irony: float,
    config: ScoringConfig,
) -> float:
    irony_penalty = min(1.0, max(0.0, irony))
    relevance_clamped = min(1.0, max(0.0, relevance))
    source_weight = config.source_weights.get(source_kind, 1.0)
    return (
        math.log1p(engagement_score(likes, replies, shares, views))
        * source_weight
        * author_weight(followers, is_bot)
        * recency_weight(published_at, as_of, config.half_life_days)
        * relevance_clamped
        * (1 - irony_penalty)
    )


def gate_mention(
    *,
    confidence: float,
    relevance: float,
    likes: int,
    replies: int,
    shares: int,
    views: int,
    followers: int,
    is_bot: bool,
    source_kind: str,
    published_at: datetime,
    as_of: datetime,
    irony: float,
    config: ScoringConfig,
) -> tuple[bool, bool, float]:
    """Devuelve (entra_al_indice, revision_humana, peso)."""
    if confidence < config.min_confidence:
        return False, True, 0.0
    if relevance < config.min_relevance:
        return False, False, 0.0
    weight = mention_weight(
        likes=likes,
        replies=replies,
        shares=shares,
        views=views,
        followers=followers,
        is_bot=is_bot,
        source_kind=source_kind,
        published_at=published_at,
        as_of=as_of,
        relevance=relevance,
        irony=irony,
        config=config,
    )
    return True, False, weight


def favorability_index(w_pos: float, w_neg: float, w_neu: float, neutral_factor: float) -> float | None:
    denominator = w_pos + w_neg + (w_neu * neutral_factor)
    if denominator <= 0:
        return None
    return 100 * (w_pos - w_neg) / denominator


def rounded_percentages(w_pos: float, w_neg: float, w_neu: float) -> tuple[float, float, float]:
    total = w_pos + w_neg + w_neu
    if total <= 0:
        return 0.0, 0.0, 0.0
    raw = [100 * w_pos / total, 100 * w_neg / total, 100 * w_neu / total]
    floors = [math.floor(value * 10 + 1e-9) for value in raw]
    deficit = int(round(1000 - sum(floors)))
    fractions = sorted(range(3), key=lambda index: (raw[index] * 10 - floors[index]), reverse=True)
    step = 1 if deficit >= 0 else -1
    pending = abs(deficit)
    cursor = 0
    while pending > 0 and fractions:
        slot = fractions[cursor % 3]
        nxt = floors[slot] + step
        if nxt >= 0:
            floors[slot] = nxt
            pending -= 1
        cursor += 1
        if cursor > 30:
            break
    return floors[0] / 10, floors[1] / 10, floors[2] / 10


def stability_half_width(sample_size: int) -> float:
    if sample_size <= 0:
        return 0.0
    return 1.96 * 100 / math.sqrt(sample_size)


def reach_of(views: int, followers: int) -> float:
    if views > 0:
        return float(views)
    return float(max(0, followers))


@dataclass
class AggregateResult:
    w_pos: float
    w_neg: float
    w_neu: float
    pct_positive: float
    pct_negative: float
    pct_neutral: float
    favorability_index: float | None
    volume: int
    reach: float
    review_count: int


def aggregate(
    sentiments: list[tuple[str, float, float]],
    *,
    neutral_factor: float,
    review_count: int = 0,
) -> AggregateResult:
    """Cada elemento es (sentimiento, peso, alcance) de una mención que ya entró."""
    w_pos = w_neg = w_neu = 0.0
    reach = 0.0
    for sentiment, weight, item_reach in sentiments:
        reach += item_reach
        if sentiment == "positive":
            w_pos += weight
        elif sentiment == "negative":
            w_neg += weight
        else:
            w_neu += weight
    pct_pos, pct_neg, pct_neu = rounded_percentages(w_pos, w_neg, w_neu)
    return AggregateResult(
        w_pos=w_pos,
        w_neg=w_neg,
        w_neu=w_neu,
        pct_positive=pct_pos,
        pct_negative=pct_neg,
        pct_neutral=pct_neu,
        favorability_index=favorability_index(w_pos, w_neg, w_neu, neutral_factor),
        volume=len(sentiments),
        reach=reach,
        review_count=review_count,
    )
