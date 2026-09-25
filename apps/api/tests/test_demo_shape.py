from datetime import datetime, timezone

from app.seed.factory import build_demo_mentions, demo_story


def test_la_semilla_cuenta_la_historia():
    now = datetime(2026, 9, 25, 18, tzinfo=timezone.utc)
    story = demo_story(now)
    assert story["total"] == 2000
    assert story["gobierno_counts"] == {"positive": 238, "negative": 287, "neutral": 175}
    assert story["delta"] >= 15
    assert story["elena"] is not None and story["mateo"] is not None
    assert story["gobierno"] < 0
    assert story["elena"] > story["mateo"]
    assert "No es encuesta" in story["disclaimer"]
    texts = [row.text for row in build_demo_mentions(now)]
    assert len(texts) == len(set(texts))
