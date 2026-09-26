"""Carga el censo público de Anáhuac, NL, sobre Juan Manuel Morton González."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from sqlalchemy import select

from app.core.db import SessionLocal
from app.models.entities import Alias, MonitoringTarget, Source, Study, User
from app.services.ingest import persist_raw_items
from app.services.scoring import ScoringConfig, config_to_dict
from app.services.summary import build_summary, snapshot_study
from collector.manual import parse_json

ROOT = Path(__file__).resolve().parent
if not (ROOT / "data" / "anahuac_nl_morton.json").exists():
    ROOT = ROOT.parent
PAYLOAD = ROOT / "data" / "anahuac_nl_morton.json"
SOURCE_STATUS = {
    "news": "active",
    "web_public": "active",
    "manual_upload": "active",
    "x": "not_configured",
    "youtube": "not_configured",
    "reddit": "not_configured",
    "facebook": "not_configured",
}


def main() -> None:
    payload = json.loads(PAYLOAD.read_text())
    spec = payload["study"]
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
            for kind, status in SOURCE_STATUS.items():
                session.add(
                    Source(
                        organization_id=admin.organization_id,
                        study_id=study.id,
                        kind=kind,
                        status=status,
                        config={},
                    )
                )
            session.commit()
            session.refresh(study)
        items = parse_json(json.dumps(payload["mentions"]).encode("utf-8"))
        result = persist_raw_items(session, study, items, admin.id)
        session.refresh(study)
        study.targets = list(session.scalars(select(MonitoringTarget).where(MonitoringTarget.study_id == study.id)).all())
        summary = build_summary(session, study)
        snapshot_study(session, study)
        session.commit()
        mayor = next((target for target in summary.targets if target.kind == "politician"), None)
        print(f"estudio={study.id}")
        print(f"carga={result}")
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
