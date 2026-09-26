import logging
import time

import redis
from sqlalchemy import select

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models.entities import Study
from app.services.summary import snapshot_study

log = logging.getLogger("worker")


def recompute() -> None:
    session = SessionLocal()
    try:
        studies = list(session.scalars(select(Study)).all())
        for study in studies:
            snapshot_study(session, study)
        session.commit()
        log.info("snapshots actualizados: %s estudios", len(studies))
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def heartbeat() -> None:
    settings = get_settings()
    try:
        client = redis.Redis.from_url(settings.redis_url, socket_connect_timeout=2)
        client.set("lmc:worker:heartbeat", str(time.time()), ex=7200)
    except Exception:
        log.info("redis no disponible; el snapshot sigue en postgres")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    while True:
        try:
            heartbeat()
            recompute()
        except Exception:
            log.exception("el worker no pudo recalcular")
        time.sleep(3600)


if __name__ == "__main__":
    main()
