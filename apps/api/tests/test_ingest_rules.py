import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects import postgresql

from app.api.routes.auth import _clear_failures, _failures, _identity_key, _limited, _register_failure
from app.api.routes.mentions import mentions_statement
from app.models.entities import Alias, MonitoringTarget
from app.services.harvest import phrases_for_targets
from app.services.ingest import label_from_upload, matched_targets
from app.services.scoring import ScoringConfig, gate_mention
from collector.manual import parse_csv


def _target(name: str, key: str, phrases: list[str]) -> MonitoringTarget:
    target = MonitoringTarget(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        study_id=uuid.uuid4(),
        name=name,
        key=key,
        kind="politician",
    )
    target.aliases = [
        Alias(id=uuid.uuid4(), target_id=target.id, phrase=phrase, kind="name") for phrase in phrases
    ]
    return target


def test_cargas_sin_id_no_chocan_por_fila():
    first = parse_csv("texto\nSin agua en Saltillo y Varela no responde\n".encode())
    second = parse_csv("texto\nObra nueva de Herrera en Torreón\n".encode())
    assert first[0].external_id.startswith("manual-")
    assert first[0].external_id != second[0].external_id
    again = parse_csv("texto\nSin agua en Saltillo y Varela no responde\n".encode())
    assert again[0].external_id == first[0].external_id


def test_carga_respeta_id_y_objetivo():
    items = parse_csv("texto,id,objetivo,sentimiento\nPlan de agua,nota-9,Elena Varela,negativo\n".encode())
    assert items[0].external_id == "nota-9"
    assert items[0].target_hint == "Elena Varela"
    assert items[0].sentiment == "negative"
    assert items[0].confidence is None


def test_etiqueta_sin_confianza_entra_al_indice():
    sentiment, confidence, review, model = label_from_upload("negative", None)
    assert sentiment == "negative"
    assert confidence == 1.0
    assert review is False
    assert model == "carga_manual"
    published = datetime(2026, 9, 20, tzinfo=timezone.utc)
    included, gated, weight = gate_mention(
        confidence=confidence,
        relevance=1.0,
        likes=3,
        replies=0,
        shares=0,
        views=0,
        followers=10,
        is_bot=False,
        source_kind="manual_upload",
        published_at=published,
        as_of=published,
        irony=0,
        config=ScoringConfig(),
    )
    assert included is True
    assert gated is False
    assert weight > 0


def test_sin_sentimiento_queda_en_revision():
    sentiment, confidence, review, model = label_from_upload(None, None)
    assert sentiment == "neutral"
    assert confidence == 0.0
    assert review is True
    assert model == "sin_modelo"


def test_alias_y_objetivo_crean_vinculo():
    elena = _target("Elena Varela", "elena", ["Varela"])
    herrera = _target("Lucía Herrera", "lucia", ["Herrera"])
    by_text = matched_targets("En Saltillo Varela cumplió", [elena, herrera], None)
    assert [item.name for item in by_text] == ["Elena Varela"]
    by_hint = matched_targets("Fila del censo sin nombre", [elena, herrera], "Lucía Herrera")
    assert [item.name for item in by_hint] == ["Lucía Herrera"]
    assert matched_targets("Nada que ver con el estudio", [elena, herrera], None) == []


def test_frases_de_recoleccion():
    elena = _target("Elena Varela", "elena", ["Varela", "Varela"])
    assert phrases_for_targets([elena]) == ["Elena Varela", "Varela"]


def test_filtros_de_mencion_unen_la_clasificacion_una_vez():
    stmt = mentions_statement(uuid.uuid4(), sentiment="negative", stance="against")
    sql = str(stmt.compile(dialect=postgresql.dialect())).lower()
    assert sql.count("join") == 1
    assert "sentiment" in sql
    assert "stance" in sql


def test_bloqueo_de_login_es_por_usuario():
    _failures.clear()
    ana = _identity_key("Ana")
    beto = _identity_key("beto")
    for _ in range(10):
        _register_failure(ana)
    assert _limited(ana) is True
    assert _limited(beto) is False
    _clear_failures(ana)
    assert _limited(ana) is False
    assert _limited(beto) is False
