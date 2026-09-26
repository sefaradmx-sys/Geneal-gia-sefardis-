import json
from pathlib import Path

from app.services.ingest import match_target_relevance
from collector.manual import parse_json

CORPUS = Path(__file__).resolve().parents[3] / "data" / "anahuac_nl_morton.json"


def test_corpus_es_real_y_enlazable():
    payload = json.loads(CORPUS.read_text())
    items = parse_json(json.dumps(payload["mentions"]).encode("utf-8"))
    assert len(items) == 11
    assert all(item.url and item.url.startswith("http") for item in items)
    assert all(item.text and "Caso demo" not in item.text for item in items)
    assert {item.sentiment for item in items} <= {"positive", "negative", "neutral"}
    mayor_hits = 0
    for item in items:
        if match_target_relevance(item.text, "Juan Manuel Morton González", ["Juan Morton", "Morton González"]):
            mayor_hits += 1
    assert mayor_hits >= 8


def test_alias_corto_no_inventa_relevancia():
    assert match_target_relevance("llovió en Monterrey", "Juan Morton", ["Morton"]) is None
    assert match_target_relevance("Juan Morton limpió el canal", "Juan Morton", []) == 0.95
    assert match_target_relevance("el alcalde Morton limpió el canal", "Morton", []) == 0.72
