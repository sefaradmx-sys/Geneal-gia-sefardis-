from datetime import date, datetime, timezone
from io import BytesIO
from uuid import uuid4

from openpyxl import load_workbook

from app.api.routes.reports import mentions_workbook, study_pdf
from app.schemas.dto import Methodology, OutletCoverage, StudyCoverage, StudySummary, TargetSummary
from app.services.brief_pdf import BriefPDF, build_brief_pdf


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


def test_pdf_nombra_nueva_expresion_y_excluye_prensa_pagada():
    summary = StudySummary(
        study_id=uuid4(),
        name="Anáhuac, NL — Juan Manuel Morton González",
        description="Primera fuente: Nueva Expresión Nuevo León.",
        window_start=date(2024, 4, 1),
        window_end=date(2026, 9, 26),
        disclaimer="Sentimiento digital observado. No es encuesta representativa.",
        known_biases=["Se excluyó del índice la prensa municipal pagada."],
        is_demo=False,
        coverage=StudyCoverage(
            own_outlets=[
                OutletCoverage(
                    name="Nueva Expresión Nuevo León",
                    url="https://nuevaexpresion.online",
                    kind="wordpress",
                    status="conectada",
                    civic_items=0,
                    note="Cero piezas cívicas sobre Anáhuac o Morton.",
                )
            ],
            excluded_outlets=[
                OutletCoverage(
                    name="Líder Web",
                    url="https://liderweb.mx",
                    kind="prensa_municipal",
                    status="excluida",
                    note="Prensa municipal pagada.",
                )
            ],
        ),
        targets=[
            TargetSummary(
                id=uuid4(),
                name="Juan Manuel Morton González",
                kind="politician",
                comparable=True,
                pct_positive=10,
                pct_negative=60,
                pct_neutral=30,
                favorability_index=-40,
                volume=8,
                reach=0,
                share_of_voice=100,
                review_count=0,
                series=[],
                by_source=[],
                by_geo=[],
            )
        ],
        preferences=[],
        alerts=[],
        evidence=[],
        methodology=Methodology(
            n=8,
            sources=["news"],
            half_life_days=365,
            neutral_factor=0.5,
            min_confidence=0.45,
            source_weights={"news": 1.4},
            formula="100 * (Wpos - Wneg) / (Wpos + Wneg + Wneu * factor_neutro)",
        ),
    )
    blob = build_brief_pdf(summary, [])
    assert blob.startswith(b"%PDF")
    assert b"/Count 5" in blob


def test_pdf_informe_tiene_portada_y_catalogo():
    pdf = BriefPDF()
    pdf.add_page()
    pdf.h1("Anáhuac, NL")
    pdf.callout("Sentimiento digital observado. No es encuesta representativa.")
    pdf.add_page()
    pdf.h2("Catálogo")
    pdf.body("Pieza de prensa con URL.")
    pdf.add_page()
    pdf.h2("Método")
    blob = bytes(pdf.output())
    assert blob.startswith(b"%PDF")
    assert b"/Count 3" in blob
