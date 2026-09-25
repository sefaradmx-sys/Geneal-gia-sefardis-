import math
from datetime import datetime, timedelta, timezone

from app.services.scoring import (
    ScoringConfig,
    author_weight,
    favorability_index,
    gate_mention,
    mention_weight,
    recency_weight,
    rounded_percentages,
    stability_half_width,
)


def test_indice_con_neutros_ajustados():
    index = favorability_index(34, 41, 25, neutral_factor=0.5)
    assert index == -8


def test_porcentajes_suman_100():
    positive, negative, neutral = rounded_percentages(1, 1, 1)
    assert (positive, negative, neutral) == (33.4, 33.3, 33.3)
    assert round(positive + negative + neutral, 1) == 100


def test_confianza_baja_no_entra_y_va_a_revision():
    included, review, weight = gate_mention(
        confidence=0.4,
        relevance=0.9,
        likes=10,
        replies=1,
        shares=1,
        views=0,
        followers=100,
        is_bot=False,
        source_kind="news",
        published_at=datetime(2026, 9, 20, tzinfo=timezone.utc),
        as_of=datetime(2026, 9, 25, tzinfo=timezone.utc),
        irony=0.0,
        config=ScoringConfig(),
    )
    assert included is False
    assert review is True
    assert weight == 0


def test_relevancia_baja_queda_fuera_sin_revision():
    included, review, weight = gate_mention(
        confidence=0.9,
        relevance=0.2,
        likes=10,
        replies=0,
        shares=0,
        views=0,
        followers=100,
        is_bot=False,
        source_kind="x",
        published_at=datetime(2026, 9, 25, tzinfo=timezone.utc),
        as_of=datetime(2026, 9, 25, tzinfo=timezone.utc),
        irony=0.0,
        config=ScoringConfig(),
    )
    assert included is False
    assert review is False
    assert weight == 0


def test_vida_media_de_siete_dias():
    as_of = datetime(2026, 9, 25, tzinfo=timezone.utc)
    published = as_of - timedelta(days=7)
    assert recency_weight(published, as_of, 7) == 0.5


def test_bot_y_medio_nacional_en_el_peso():
    as_of = datetime(2026, 9, 25, tzinfo=timezone.utc)
    config = ScoringConfig()
    weight = mention_weight(
        likes=0,
        replies=0,
        shares=0,
        views=0,
        followers=10,
        is_bot=False,
        source_kind="news",
        published_at=as_of,
        as_of=as_of,
        relevance=1,
        irony=0,
        config=config,
    )
    expected = math.log1p(1) * 1.4 * 1.0 * 1.0 * 1.0 * 1.0
    assert weight == expected
    assert author_weight(10, is_bot=True) == 0.2


def test_intervalo_de_estabilidad_no_es_una_encuesta():
    assert stability_half_width(0) == 0
    assert stability_half_width(100) == 1.96 * 10
