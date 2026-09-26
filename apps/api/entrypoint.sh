#!/bin/sh
set -e
python - << 'PY'
import os, time
import psycopg
url = os.environ.get("DATABASE_URL", "").replace("postgresql+psycopg", "postgresql")
if not url:
    raise SystemExit("DATABASE_URL vacío")
last = None
for _ in range(30):
    try:
        psycopg.connect(url).close()
        break
    except Exception as exc:
        last = exc
        time.sleep(1)
else:
    raise SystemExit(f"Postgres no respondió: {last}")
PY
alembic upgrade head
python -m app.seed
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
