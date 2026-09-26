"""Carga el censo público de Anáhuac. Sustituye menciones viejas (prensa pagada)."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from sqlalchemy import delete, select

from app.core.db import SessionLocal
from app.models.entities import Alert, Alias, Insight, Mention, MonitoringTarget, Source, Study, User
from app.services.ingest import persist_raw_items
from app.services.scoring import ScoringConfig, config_to_dict
from app.services.summary import build_summary, snapshot_study
from collector.manual import parse_json
from collector.wordpress import civic_count, parse_wp_comments, parse_wp_posts

ROOT = Path(__file__).resolve().parent
if not (ROOT / "data" / "anahuac_nl_morton.json").exists():
    ROOT = ROOT.parent
PAYLOAD = ROOT / "data" / "anahuac_nl_morton.json"
NX_SITE = "https://nuevaexpresion.online"
SOURCE_STATUS = {
    "news": "active",
    "web_public": "active",
    "manual_upload": "active",
    "x": "not_configured",
    "youtube": "not_configured",
    "reddit": "not_configured",
    "facebook": "not_configured",
}


def _probe_nueva_expresion() -> dict:
    try:
        import httpx

        headers = {"User-Agent": "LA-MV-Census/0.1"}
        with httpx.Client(timeout=20, headers=headers) as client:
            posts = client.get(f"{NX_SITE}/wp-json/wp/v2/posts", params={"per_page": 50})
            comments = client.get(f"{NX_SITE}/wp-json/wp/v2/comments", params={"per_page": 50})
            posts.raise_for_status()
            comments.raise_for_status()
        post_items = parse_wp_posts(posts.json(), author="Nueva Expresión Nuevo León")
        comment_items = parse_wp_comments(comments.json())
        civic = civic_count(post_items) + civic_count(comment_items)
        return {
            "posts": len(post_items),
            "comments": len(comment_items),
            "civic": civic,
            "ok": True,
        }
    except Exception as exc:  # noqa: BLE001 — el censo sigue si el sitio no responde
        return {"posts": 0, "comments": 0, "civic": 0, "ok": False, "error": str(exc)}


def _apply_coverage(spec: dict, probe: dict) -> None:
    scoring = spec.setdefault("scoring_config", {})
    coverage = scoring.setdefault("coverage", {})
    own = coverage.setdefault("own_outlets", [])
    for outlet in own:
        if outlet.get("name") != "Nueva Expresión Nuevo León":
            continue
        outlet["civic_items"] = probe["civic"]
        if probe["ok"]:
            outlet["status"] = "conectada"
            outlet["note"] = (
                f"Medio propio. API de WordPress leída. Al corte: {probe['posts']} posts públicos, "
                f"{probe['comments']} comentarios, {probe['civic']} piezas cívicas sobre Anáhuac o Morton."
            )
        else:
            outlet["status"] = "error"
            outlet["note"] = f"No se pudo leer nuevaexpresion.online: {probe.get('error')}"


def _replace_mentions(session, study: Study) -> None:
    session.execute(delete(Alert).where(Alert.study_id == study.id))
    session.execute(delete(Insight).where(Insight.study_id == study.id))
    session.execute(delete(Mention).where(Mention.study_id == study.id))
    session.flush()


def _ensure_sources(session, study: Study, admin: User, probe: dict) -> None:
    existing = {
        source.kind: source
        for source in session.scalars(select(Source).where(Source.study_id == study.id)).all()
    }
    for kind, status in SOURCE_STATUS.items():
        if kind in existing:
            continue
        session.add(
            Source(
                organization_id=admin.organization_id,
                study_id=study.id,
                kind=kind,
                status=status,
                config={},
            )
        )
    session.flush()
    news = session.scalar(select(Source).where(Source.study_id == study.id, Source.kind == "news"))
    nx_config = {
        "outlet": "Nueva Expresión Nuevo León",
        "site": NX_SITE,
        "wp_posts": f"{NX_SITE}/wp-json/wp/v2/posts",
        "wp_comments": f"{NX_SITE}/wp-json/wp/v2/comments",
        "feed": f"{NX_SITE}/feed/",
        "role": "own",
        "civic_items": probe["civic"],
        "excluded": ["Líder Web", "6w News", "El Rincón de Maquiavelo"],
    }
    if news is None:
        session.add(
            Source(
                organization_id=admin.organization_id,
                study_id=study.id,
                kind="news",
                status="active",
                config=nx_config,
            )
        )
    else:
        news.status = "active"
        news.config = {**(news.config or {}), **nx_config}


def main() -> None:
    payload = json.loads(PAYLOAD.read_text())
    spec = payload["study"]
    probe = _probe_nueva_expresion()
    _apply_coverage(spec, probe)
    session = SessionLocal()
    try:
        admin = session.scalar(select(User).where(User.username == "admin"))
        if admin is None:
            raise SystemExit("No hay usuario admin")
        study = session.scalar(select(Study).where(Study.slug == spec["slug"]))
        if study is None:
            study = Study(
                organization_id=admin.organization_id,
                name=spec["name"],
                slug=spec["slug"],
                description=spec["description"],
                window_start=date.fromisoformat(spec["window_start"]),
                window_end=date.fromisoformat(spec["window_end"]),
                scoring_config=spec.get("scoring_config") or config_to_dict(ScoringConfig()),
                is_demo=False,
                created_by=admin.id,
            )
            session.add(study)
            session.flush()
            for target_spec in payload["targets"]:
                target = MonitoringTarget(
                    organization_id=admin.organization_id,
                    study_id=study.id,
                    name=target_spec["name"],
                    kind=target_spec["kind"],
                    comparable=target_spec["comparable"],
                    description=target_spec["description"],
                )
                session.add(target)
                session.flush()
                for phrase, kind in target_spec["aliases"]:
                    session.add(Alias(target_id=target.id, phrase=phrase, kind=kind))
        else:
            study.name = spec["name"]
            study.description = spec["description"]
            study.window_start = date.fromisoformat(spec["window_start"])
            study.window_end = date.fromisoformat(spec["window_end"])
            study.scoring_config = spec.get("scoring_config") or study.scoring_config
            study.is_demo = False
            _replace_mentions(session, study)
        _ensure_sources(session, study, admin, probe)
        session.commit()
        session.refresh(study)
        items = parse_json(json.dumps(payload["mentions"]).encode("utf-8"))
        result = persist_raw_items(session, study, items, admin.id)
        session.refresh(study)
        study.targets = list(
            session.scalars(select(MonitoringTarget).where(MonitoringTarget.study_id == study.id)).all()
        )
        summary = build_summary(session, study)
        snapshot_study(session, study)
        session.commit()
        mayor = next((target for target in summary.targets if target.kind == "politician"), None)
        print(f"estudio={study.id}")
        print(f"carga={result}")
        print(f"nueva_expresion={probe}")
        if mayor:
            print(
                f"alcalde={mayor.name} indice={mayor.favorability_index} "
                f"pos={mayor.pct_positive} neg={mayor.pct_negative} n={mayor.volume}"
            )
        print(f"disclaimer={summary.disclaimer}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
