.PHONY: test api

test:
	cd apps/api && PYTHONPATH=".:../collector/src" ../../.venv/bin/pytest

api:
	cd apps/api && ../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
