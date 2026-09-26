import asyncio
import logging

from app.core.db import SessionLocal
from app.services.harvest import harvest_studies

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("collector")


async def run_once() -> None:
    session = SessionLocal()
    try:
        result = await harvest_studies(session)
        log.info("recolección %s", result)
    finally:
        session.close()


async def main() -> None:
    while True:
        try:
            await run_once()
        except Exception:
            log.exception("la recolección falló")
        await asyncio.sleep(900)


if __name__ == "__main__":
    asyncio.run(main())
