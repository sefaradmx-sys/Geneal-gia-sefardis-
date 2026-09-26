from datetime import datetime, timezone
from io import BytesIO

from openpyxl import load_workbook

from app.api.routes.reports import mentions_workbook, study_pdf


class _Classification:
    sentiment = "negative"
    stance = "against"
    confidence = 0.9


class _Mention:
    text_original = "El agua en Saltillo sigue fallando"
    source_kind = "x"
    published_at = datetime(2026, 9, 20, tzinfo=timezone.utc)
    author_handle = "ana"
    theme = "agua"
    geo_state = "Coahuila"
    geo_municipality = "Saltillo"
    is_synthetic = True
    url = None
    classification = _Classification()


def test_workbook_es_xlsx():
    blob = mentions_workbook([_Mention()])
    assert blob[:2] == b"PK"
    sheet = load_workbook(BytesIO(blob)).active
    assert sheet["A2"].value == "El agua en Saltillo sigue fallando"
    assert sheet["H2"].value == "Saltillo"


def test_pdf_dos_paginas():
    blob = study_pdf(
        "LA MV Census",
        ["Sentimiento digital observado. No es encuesta representativa.", "Indice -24"],
        ["Mencion de apoyo al corte de agua."],
    )
    assert blob.startswith(b"%PDF")
    assert b"/Count 2" in blob
