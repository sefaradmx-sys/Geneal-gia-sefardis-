FROM python:3.12-slim

WORKDIR /opt/la-mv-census
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*
COPY apps/api/requirements.txt /opt/la-mv-census/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api /opt/la-mv-census
COPY apps/collector/src/collector /opt/la-mv-census/collector
COPY data /opt/la-mv-census/data
COPY scripts/load_anahuac_study.py /opt/la-mv-census/load_anahuac_study.py
COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV PYTHONPATH=/opt/la-mv-census
EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
