"""Menciones sintéticas deterministas. No representan personas reales."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timedelta

from app.services.scoring import (
    DISCLAIMER,
    ScoringConfig,
    aggregate,
    gate_mention,
    reach_of,
)

LICENSE_NOTE = "Mención sintética de demostración. No proviene de una persona real."

MUNICIPALITIES = [
    "Saltillo",
    "Torreón",
    "Monclova",
    "Piedras Negras",
    "Acuña",
    "Ramos Arizpe",
    "Sabinas",
]

ACTORS = {
    "elena": "Elena Varela",
    "mateo": "Mateo Ríos",
    "lucia": "Lucía Herrera",
    "gobierno": "el gobierno de Coahuila",
    "agua": "el corte de agua",
}

TARGET_SPECS = [
    {
        "key": "elena",
        "name": "Elena Varela",
        "kind": "politician",
        "comparable": True,
        "description": "Perfil ficticio para comparar.",
        "aliases": [("Elena Varela", "name"), ("Varela", "nickname"), ("@varela_coah", "account")],
    },
    {
        "key": "mateo",
        "name": "Mateo Ríos",
        "kind": "politician",
        "comparable": True,
        "description": "Perfil ficticio para comparar.",
        "aliases": [("Mateo Ríos", "name"), ("Ríos", "nickname"), ("@rios_coah", "account")],
    },
    {
        "key": "lucia",
        "name": "Lucía Herrera",
        "kind": "politician",
        "comparable": True,
        "description": "Perfil ficticio para comparar.",
        "aliases": [("Lucía Herrera", "name"), ("Herrera", "nickname")],
    },
    {
        "key": "gobierno",
        "name": "Gobierno de Coahuila",
        "kind": "government",
        "comparable": False,
        "description": "Gobierno estatal, objetivo institucional.",
        "aliases": [
            ("Gobierno de Coahuila", "name"),
            ("gobierno estatal", "nickname"),
            ("palacio de Saltillo", "nickname"),
        ],
    },
    {
        "key": "agua",
        "name": "Agua en Coahuila",
        "kind": "topic",
        "comparable": False,
        "description": "Tema de abasto y pipas.",
        "aliases": [("agua", "name"), ("pipas", "nickname"), ("#AguaCoahuila", "hashtag")],
    },
]

POSITIVE = [
    "En {muni} se nota que {actor} sí le entró al tema de {theme}.",
    "Por fin en {muni} {actor} explicó el plan de {theme} sin rodeos.",
    "Hay que reconocerlo: {actor} dejó obra de {theme} a la vista en {muni}.",
    "En la colonia de {muni} la gente repite que {actor} cumplió con {theme}.",
    "Me cayó bien la visita. {actor} habló de {theme} con datos, no con spot.",
    "Si comparas colonias, {muni} salió mejor parada con {actor} en {theme}.",
]
NEGATIVE = [
    "Llevo semanas con el tema de {theme} en {muni} y {actor} no da la cara.",
    "Otro día igual en {muni}: {actor} anuncia {theme} y en la calle no se ve.",
    "Ya basta. {actor} usa {theme} de {muni} solo para la foto.",
    "En {muni} el problema de {theme} sigue igual. {actor} sale en la tele y ya.",
    "Pregunté en la oficina y nada. {actor} tiene abandonado {theme} en {muni}.",
    "La fila en {muni} no miente: {theme} está peor y {actor} no aparece.",
]
NEUTRAL = [
    "Hoy {actor} presentó un informe en {muni} sobre {theme}.",
    "Quedó agendada una mesa en {muni}. {actor} va a hablar de {theme}.",
    "El boletín de {actor} repite cifras de {theme} para {muni}, sin más contexto.",
    "En {muni} circula el comunicado de {actor} acerca de {theme}.",
]
SARCASM = "Está pesado el estilo de {actor}, pero en {muni} el tema de {theme} sí se movió."

SOURCES = ["news", "x", "youtube", "reddit", "web_public", "manual_upload"]


@dataclass
class DemoMention:
    external_id: str
    target_key: str
    text: str
    published_at: datetime
    source_kind: str
    sentiment: str
    stance: str
    emotion: str
    toxicity: float
    irony: float
    confidence: float
    relevance: float
    theme: str
    likes: int
    replies: int
    shares: int
    views: int
    followers: int
    geo_state: str
    geo_municipality: str
    author_handle: str
    is_bot: bool = False


def _repeat(label: str, count: int) -> list[str]:
    return [label] * count


def _theme(target_key: str, sentiment: str, index: int) -> str:
    if target_key == "elena":
        if sentiment == "positive":
            return "empleo" if index % 3 else "agua"
        return "servicios"
    if target_key == "mateo":
        return "seguridad" if sentiment == "negative" else "empleo"
    if target_key == "gobierno":
        return "agua" if sentiment == "negative" else "servicios"
    if target_key == "agua":
        return "agua"
    return "transporte"


def _compose(index: int, sentiment: str, target_key: str, when: datetime, theme: str, sarcasm: bool) -> str:
    pool = POSITIVE if sentiment == "positive" else NEGATIVE if sentiment == "negative" else NEUTRAL
    template = SARCASM if sarcasm else pool[index % len(pool)]
    text = template.format(muni=MUNICIPALITIES[index % len(MUNICIPALITIES)], actor=ACTORS[target_key], theme=theme)
    return _SENTENCE_START.sub(lambda match: match.group(1) + match.group(2).upper(), text)


_SENTENCE_START = re.compile(r"(^|[.!?¡¿]\s+)([a-záéíóúñ])")


def _stance(sentiment: str, sarcasm: bool) -> str:
    if sarcasm:
        return "in_favor"
    if sentiment == "positive":
        return "in_favor"
    if sentiment == "negative":
        return "against"
    return "not_applicable"


def _emotion(sentiment: str, index: int) -> str:
    if sentiment == "positive":
        return "apoyo"
    if sentiment == "negative":
        return "preocupación" if index % 4 == 0 else "enojo"
    return "neutro"


def _place(index: int, sentiment: str, when: datetime, target_key: str, *, spike: bool, series: str) -> DemoMention:
    theme = _theme(target_key, sentiment, index)
    sarcasm = sentiment == "negative" and target_key == "elena" and index % 80 == 0 and not spike
    confidence = 0.9 if spike or index % 25 else 0.32
    relevance = 0.92 if spike or index % 40 else 0.2
    if sarcasm:
        confidence = 0.84
        relevance = 0.9
    source = "x" if spike else SOURCES[index % len(SOURCES)]
    text = _compose(index, sentiment, target_key, when, theme, sarcasm)
    return DemoMention(
        external_id=f"demo-{target_key}-{series}-{index}",
        target_key=target_key,
        text=text,
        published_at=when,
        source_kind=source,
        sentiment=sentiment,
        stance=_stance(sentiment, sarcasm),
        emotion=_emotion(sentiment, index),
        toxicity=0.55 if sentiment == "negative" and index % 9 == 0 else 0.08,
        irony=0.8 if sarcasm else 0.05,
        confidence=confidence,
        relevance=relevance,
        theme=theme,
        likes=4 + (index % 7) + (6 if sentiment == "negative" else 0),
        replies=index % 3,
        shares=index % 2,
        views=100 * (index % 5),
        followers=400 + (index % 50) * 10,
        geo_state="Coahuila",
        geo_municipality=MUNICIPALITIES[index % len(MUNICIPALITIES)],
        author_handle=f"@vecino_{MUNICIPALITIES[index % len(MUNICIPALITIES)].split()[0].lower()}_{index % 40}",
        is_bot=index % 90 == 0 and not spike,
    )


def _stripe(labels: list[str]) -> list[str]:
    """Reparte tonos en el tiempo sin amontonar un sentimiento al inicio."""
    counts: dict[str, int] = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1
    total = len(labels)
    placed = {key: 0 for key in counts}
    mixed: list[str] = []
    for step in range(1, total + 1):
        choice = max(
            counts,
            key=lambda key: ((counts[key] / total) - (placed[key] / step), counts[key] - placed[key]),
        )
        if placed[choice] >= counts[choice]:
            choice = max(counts, key=lambda key: counts[key] - placed[key])
        placed[choice] += 1
        mixed.append(choice)
    return mixed


def _spread(sentiments: list[str], start_hours: float, end_hours: float, now: datetime) -> list[datetime]:
    count = len(sentiments)
    if count == 0:
        return []
    span = end_hours - start_hours
    return [now - timedelta(hours=start_hours + (index + 0.5) * span / count) for index in range(count)]


def _block(
    target_key: str, sentiments: list[str], times: list[datetime], spike: bool, series: str
) -> list[DemoMention]:
    rows = []
    for index, (sentiment, when) in enumerate(zip(sentiments, times, strict=True)):
        rows.append(_place(index, sentiment, when, target_key, spike=spike, series=series))
    return rows


def build_demo_mentions(now: datetime | None = None) -> list[DemoMention]:
    now = now or datetime.now().astimezone()
    if now.tzinfo is None:
        raise ValueError("now debe traer zona horaria")

    gobierno_spike = _repeat("negative", 48) + _repeat("positive", 8) + _repeat("neutral", 4)
    gobierno_prev = _repeat("negative", 9) + _repeat("positive", 9) + _repeat("neutral", 6)
    gobierno_old = _repeat("positive", 221) + _repeat("negative", 230) + _repeat("neutral", 165)

    elena = _stripe(_repeat("positive", 224) + _repeat("negative", 72) + _repeat("neutral", 104))
    mateo = _stripe(_repeat("positive", 80) + _repeat("negative", 220) + _repeat("neutral", 100))
    lucia = _stripe(_repeat("positive", 100) + _repeat("negative", 75) + _repeat("neutral", 75))
    agua = _stripe(_repeat("positive", 82) + _repeat("negative", 105) + _repeat("neutral", 63))
    gobierno_old = _stripe(gobierno_old)

    groups = {
        "gobierno": (
            _block("gobierno", gobierno_spike, _spread(gobierno_spike, 0, 23, now), True, "spike")
            + _block("gobierno", gobierno_prev, _spread(gobierno_prev, 25, 47, now), False, "prev")
            + _block("gobierno", gobierno_old, _spread(gobierno_old, 49, 29 * 24, now), False, "old")
        ),
        "elena": _block("elena", elena, _spread(elena, 1, 29 * 24, now), False, "all"),
        "mateo": _block("mateo", mateo, _spread(mateo, 1, 29 * 24, now), False, "all"),
        "lucia": _block("lucia", lucia, _spread(lucia, 1, 29 * 24, now), False, "all"),
        "agua": _block("agua", agua, _spread(agua, 1, 29 * 24, now), False, "all"),
    }

    rows: list[DemoMention] = []
    seen: set[str] = set()
    collisions = 0
    for bucket in groups.values():
        for row in bucket:
            text = row.text
            while text in seen:
                text = f"{row.text} {_closing(collisions)}"
                collisions += 1
            if text != row.text:
                row = DemoMention(**{**row.__dict__, "text": text})
            seen.add(text)
            rows.append(row)
    return rows


_CLOSINGS = ("Lo escribo a las {hm}.", "Comentario de las {hm}.", "Lo vi hoy a las {hm}.", "Actualizo a las {hm}.")


def _closing(position: int) -> str:
    template = _CLOSINGS[position % len(_CLOSINGS)]
    minute_of_day = 6 * 60 + (position // len(_CLOSINGS)) * 7 % (17 * 60)
    return template.format(hm=f"{minute_of_day // 60}:{minute_of_day % 60:02d}")


def score_rows(rows: list[DemoMention], as_of: datetime, config: ScoringConfig | None = None):
    config = config or ScoringConfig()
    scored = []
    for row in rows:
        included, review, weight = gate_mention(
            confidence=row.confidence,
            relevance=row.relevance,
            likes=row.likes,
            replies=row.replies,
            shares=row.shares,
            views=row.views,
            followers=row.followers,
            is_bot=row.is_bot,
            source_kind=row.source_kind,
            published_at=row.published_at,
            as_of=as_of,
            irony=row.irony,
            config=config,
        )
        scored.append((row, included, review, weight, reach_of(row.views, row.followers)))
    return scored


def window_negative_pct(rows: list[DemoMention], as_of: datetime, start: datetime, end: datetime) -> float:
    subset = [row for row in rows if start < row.published_at <= end and row.target_key == "gobierno"]
    scored = score_rows(subset, as_of)
    included = [(row.sentiment, weight, reach) for row, included, _review, weight, reach in scored if included]
    return aggregate(included, neutral_factor=0.5).pct_negative


def demo_story(now: datetime) -> dict:
    rows = build_demo_mentions(now)
    gobierno = [row for row in rows if row.target_key == "gobierno"]
    counts = {label: sum(1 for row in gobierno if row.sentiment == label) for label in ("positive", "negative", "neutral")}
    last = window_negative_pct(rows, now, now - timedelta(hours=24), now)
    prev = window_negative_pct(rows, now, now - timedelta(hours=48), now - timedelta(hours=24))
    config = ScoringConfig()

    def index_of(key: str) -> float | None:
        subset = [row for row in rows if row.target_key == key]
        scored = score_rows(subset, now, config)
        included = [(row.sentiment, weight, reach) for row, included, _r, weight, reach in scored if included]
        return aggregate(included, neutral_factor=config.neutral_factor).favorability_index

    return {
        "total": len(rows),
        "gobierno_counts": counts,
        "negatividad_24h": last,
        "negatividad_prev": prev,
        "delta": last - prev,
        "elena": index_of("elena"),
        "mateo": index_of("mateo"),
        "gobierno": index_of("gobierno"),
        "disclaimer": DISCLAIMER,
    }
