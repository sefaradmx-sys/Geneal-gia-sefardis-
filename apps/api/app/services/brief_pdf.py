"""Briefing PDF de inteligencia. Oscuro, tipográfico, para entrega interna."""

from __future__ import annotations

import math
from datetime import datetime
from pathlib import Path

from fpdf import FPDF

from app.schemas.dto import StudySummary, TargetSummary
from app.services.scoring import DISCLAIMER

_FONTS = Path(__file__).resolve().parents[2] / "fonts"

BG = (7, 10, 18)
SURFACE = (17, 24, 41)
ELEVATED = (24, 32, 52)
LINE = (48, 58, 86)
VIOLET = (124, 92, 255)
CYAN = (34, 211, 238)
POS = (52, 211, 153)
NEG = (251, 113, 133)
WARN = (251, 191, 36)
FG = (236, 239, 247)
MUTED = (148, 163, 184)
INK = (18, 22, 38)

_SENTIMENT = {"positive": "POSITIVO", "negative": "NEGATIVO", "neutral": "NEUTRO"}
_SENTIMENT_COLOR = {"positive": POS, "negative": NEG, "neutral": MUTED}
_STANCE = {
    "in_favor": "A favor del alcalde o de su gestión",
    "against": "En contra del alcalde o de su gestión",
    "mixed": "Mixto",
    "not_applicable": "No apunta al alcalde (otro actor)",
}
_SOURCE = {
    "news": "Medio de comunicación",
    "web_public": "Documento o página pública",
    "youtube": "YouTube (metadato público)",
    "manual_upload": "Carga del analista",
}


def _lectura(sentiment: str, theme: str, stance: str) -> str:
    theme = theme or "general"
    if sentiment == "positive":
        return (
            f"La nota presenta una acción o logro (tema: {theme}). "
            "No prueba que la calle esté contenta."
        )
    if sentiment == "negative":
        if stance == "not_applicable":
            return (
                f"Documenta un conflicto o queja (tema: {theme}) "
                "sin atribuir la responsabilidad principal al alcalde."
            )
        return (
            f"Describe un riesgo, crisis o crítica (tema: {theme}) "
            "con el alcalde como vocero o como parte del entorno."
        )
    return f"Informa un hecho (tema: {theme}) sin juicio claro de aprobación o rechazo."


def _index_color(value: float | None) -> tuple[int, int, int]:
    if value is None:
        return MUTED
    if value >= 15:
        return POS
    if value <= -15:
        return NEG
    return WARN


class BriefPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="Letter")
        self.set_auto_page_break(auto=True, margin=20)
        self.set_left_margin(16)
        self.set_right_margin(16)
        inter = _FONTS / "Inter-Regular.ttf"
        inter_sb = _FONTS / "Inter-SemiBold.ttf"
        inter_b = _FONTS / "Inter-Bold.ttf"
        mono = _FONTS / "JetBrainsMono-Regular.ttf"
        mono_b = _FONTS / "JetBrainsMono-Bold.ttf"
        fallback_r = _FONTS / "DejaVuSans.ttf"
        fallback_b = _FONTS / "DejaVuSans-Bold.ttf"
        if inter.exists() and inter_b.exists():
            self.add_font("Inter", "", str(inter))
            self.add_font("Inter", "B", str(inter_b))
            self.family = "Inter"
        elif fallback_r.exists() and fallback_b.exists():
            self.add_font("Inter", "", str(fallback_r))
            self.add_font("Inter", "B", str(fallback_b))
            self.family = "Inter"
        else:
            self.family = "Helvetica"
        if inter_sb.exists():
            self.add_font("InterS", "", str(inter_sb))
            self.display = "InterS"
        else:
            self.display = self.family
        if mono.exists() and mono_b.exists():
            self.add_font("Mono", "", str(mono))
            self.add_font("Mono", "B", str(mono_b))
            self.mono = "Mono"
        else:
            self.mono = self.family
        self.created = datetime.now().strftime("%d.%m.%Y  %H:%M")
        self.section = "BRIEFING"
        self.set_page_background(BG)

    def header(self) -> None:
        self.set_fill_color(*VIOLET)
        self.rect(0, 0, 5.2, 280, "F")
        if self.page_no() == 1:
            return
        self.set_fill_color(*SURFACE)
        self.rect(0, 0, 216, 14, "F")
        self.set_fill_color(*VIOLET)
        self.rect(0, 0, 5.2, 14, "F")
        self.set_fill_color(*CYAN)
        self.rect(5.2, 13.2, 210.8, 0.8, "F")
        self.set_text_color(*FG)
        self.set_font(self.family, "B", 8)
        self.set_xy(10, 4)
        self.cell(70, 6, "LA MV CENSUS")
        self.set_font(self.mono, "", 7)
        self.set_text_color(*MUTED)
        self.cell(80, 6, self.section)
        self.cell(0, 6, f"{self.page_no():02d}", align="R")
        self.set_xy(self.l_margin, 20)

    def footer(self) -> None:
        self.set_fill_color(*BG)
        self.rect(0, 268, 216, 12, "F")
        self.set_draw_color(*LINE)
        self.line(10, 269, 206, 269)
        self.set_xy(10, 271)
        self.set_font(self.mono, "", 6)
        self.set_text_color(*MUTED)
        self.cell(130, 4, DISCLAIMER)
        self.cell(0, 4, self.created, align="R")

    def _full_width(self) -> None:
        self.set_x(self.l_margin)

    def ink(self, rgb: tuple[int, int, int] = FG) -> None:
        self.set_text_color(*rgb)

    def h1(self, text: str) -> None:
        self._full_width()
        self.set_font(self.display, "", 18)
        self.ink(FG)
        self.multi_cell(0, 8, text)
        self.ln(2)

    def h2(self, text: str) -> None:
        self.ensure(14)
        self._full_width()
        self.set_fill_color(*VIOLET)
        x = self.l_margin
        y = self.get_y()
        self.rect(x, y + 1.5, 1.6, 5, "F")
        self.set_xy(x + 5, y)
        self.set_font(self.family, "B", 11)
        self.ink(CYAN)
        self.cell(0, 8, text.upper())
        self.ln(10)

    def body(self, text: str, size: int = 9) -> None:
        self._full_width()
        self.set_font(self.family, "", size)
        self.ink(MUTED)
        self.multi_cell(0, 4.6, text)
        self.ln(1.4)

    def callout(self, text: str) -> None:
        self.ensure(18)
        self._full_width()
        self.set_fill_color(*ELEVATED)
        self.set_draw_color(*WARN)
        self.set_font(self.family, "", 8)
        self.ink(FG)
        self.multi_cell(0, 4.5, text, border=1, fill=True)
        self.ln(3)

    def kpi(self, label: str, value: str, x: float, y: float) -> None:
        self.tile(x, y, 44, 22, label, value)

    def tile(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        label: str,
        value: str,
        accent: tuple[int, int, int] = VIOLET,
    ) -> None:
        self.set_fill_color(*SURFACE)
        self.panel(x, y, w, h)
        self.set_fill_color(*accent)
        self.rect(x, y, 1.5, h, "F")
        self.set_xy(x + 5, y + 3)
        self.set_font(self.mono, "", 6)
        self.ink(MUTED)
        self.cell(w - 8, 4, label.upper())
        self.set_xy(x + 5, y + 9)
        size = 13 if len(value) <= 8 else 7
        self.set_font(self.mono, "B", size)
        self.ink(FG)
        self.cell(w - 8, 9, value)

    def panel(self, x: float, y: float, w: float, h: float, radius: float = 2.2) -> None:
        self.rect(x, y, w, h, style="F", round_corners=True, corner_radius=radius)

    def ensure(self, height: float) -> None:
        if self.get_y() + height > 262:
            self.add_page()

    def start_section(self, code: str, title: str) -> None:
        self.section = title
        self.add_page()
        self.kicker(code, title)

    def kicker(self, code: str, title: str) -> None:
        self.set_font(self.mono, "B", 8)
        self.ink(VIOLET)
        self._full_width()
        self.cell(0, 5, code)
        self.ln(5)
        self.set_font(self.display, "", 16)
        self.ink(FG)
        self._full_width()
        self.cell(0, 8, title)
        self.ln(10)


def _needles(pdf: BriefPDF, cx: float, cy: float, radius: float, value: float | None) -> None:
    pdf.set_draw_color(90, 104, 148)
    pdf.set_line_width(0.45)
    for scale in (1.0, 0.68, 0.38):
        r = radius * scale
        pdf.ellipse(cx - r, cy - r, r * 2, r * 2, style="D")
    pdf.set_fill_color(*ELEVATED)
    pdf.ellipse(cx - 3, cy - 3, 6, 6, style="F")
    if value is None:
        return
    clamped = max(-100.0, min(100.0, value))
    angle = math.radians(180 - ((clamped + 100) / 200) * 180)
    x2 = cx + radius * 0.86 * math.cos(angle)
    y2 = cy - radius * 0.86 * math.sin(angle)
    pdf.set_draw_color(*_index_color(value))
    pdf.set_line_width(1.1)
    pdf.line(cx, cy, x2, y2)
    pdf.set_line_width(0.2)


def _cover(pdf: BriefPDF, summary: StudySummary, hero: TargetSummary | None, catalog: int) -> None:
    pdf.section = "PORTADA"
    pdf.add_page()
    pdf.set_fill_color(*VIOLET)
    pdf.rect(142, 0, 74, 92, "F")
    pdf.set_fill_color(*CYAN)
    pdf.rect(176, 0, 40, 48, "F")
    pdf.set_fill_color(18, 22, 38)
    pdf.rect(198, 0, 18, 22, "F")
    pdf.set_fill_color(*VIOLET)
    pdf.rect(16, 16, 18, 18, "F")
    pdf.set_xy(16, 19)
    pdf.set_font(pdf.mono, "B", 8)
    pdf.ink(FG)
    pdf.cell(18, 12, "LMC", align="C")

    pdf.set_xy(38, 18)
    pdf.set_font(pdf.mono, "B", 7)
    pdf.ink(CYAN)
    pdf.cell(100, 6, "BRIEFING CONFIDENCIAL")
    pdf.set_xy(140, 18)
    pdf.set_font(pdf.mono, "", 7)
    pdf.ink(MUTED)
    pdf.cell(60, 6, "USO INTERNO", align="R")

    pdf.set_xy(16, 40)
    pdf.set_font(pdf.family, "B", 10)
    pdf.ink(VIOLET)
    pdf.cell(0, 6, "LA MV CENSUS")
    pdf.set_xy(16, 46)
    pdf.set_font(pdf.display, "", 26)
    pdf.ink(FG)
    pdf.cell(0, 11, "INTELIGENCIA")
    pdf.set_xy(16, 57)
    pdf.set_font(pdf.display, "", 26)
    pdf.ink(CYAN)
    pdf.cell(0, 11, "CÍVICA")

    pdf.set_xy(16, 70)
    pdf.set_font(pdf.family, "", 10)
    pdf.ink(MUTED)
    pdf.multi_cell(120, 5, summary.name)

    index = hero.favorability_index if hero else None
    pdf.set_fill_color(*SURFACE)
    pdf.panel(16, 92, 184, 78, 3)
    _needles(pdf, 168, 131, 28, index)
    pdf.set_xy(24, 100)
    pdf.set_font(pdf.mono, "", 7)
    pdf.ink(MUTED)
    pdf.cell(90, 5, "ÍNDICE DIGITAL DEL ALCALDE")
    pdf.set_xy(24, 108)
    pdf.set_font(pdf.mono, "B", 42)
    pdf.ink(_index_color(index))
    pdf.cell(90, 20, "s.d." if index is None else f"{index:+.0f}")
    pdf.set_xy(24, 132)
    pdf.set_font(pdf.family, "", 8)
    pdf.ink(MUTED)
    subject = hero.name if hero else "Objetivo principal"
    pdf.cell(110, 5, subject)
    pdf.set_xy(24, 138)
    pdf.set_font(pdf.family, "", 8)
    pdf.ink(FG)
    if hero:
        pdf.cell(
            110,
            5,
            f"Pos {hero.pct_positive:.0f}%   Neg {hero.pct_negative:.0f}%   "
            f"Neu {hero.pct_neutral:.0f}%   n={hero.volume}",
        )
    pdf.set_xy(24, 154)
    pdf.set_font(pdf.mono, "", 6)
    pdf.ink(CYAN)
    pdf.cell(0, 4, "ESCALA  −100  ←  HOSTIL    0  NEUTRO    FAVORABLE  →  +100")

    y = 180
    tiles = [
        ("VENTANA", f"{summary.window_start.year}–{str(summary.window_end.year)[2:]}"),
        ("EXPEDIENTE", str(catalog)),
        ("MEDIO PROPIO", "NX NL"),
        ("PRENSA PAGADA", "OFF"),
    ]
    for i, (label, value) in enumerate(tiles):
        pdf.tile(16 + i * 47, y, 45, 22, label, value, accent=CYAN if i == 2 else VIOLET)

    pdf.set_xy(16, 212)
    pdf.set_font(pdf.family, "", 9)
    pdf.ink(MUTED)
    pdf.multi_cell(184, 5, summary.description or "")

    pdf.set_fill_color(*ELEVATED)
    pdf.panel(16, 242, 184, 18, 2)
    pdf.set_xy(20, 246)
    pdf.set_font(pdf.mono, "B", 7)
    pdf.ink(WARN)
    pdf.cell(0, 4, "CLASIFICACIÓN")
    pdf.set_xy(20, 251)
    pdf.set_font(pdf.family, "", 8)
    pdf.ink(FG)
    pdf.cell(0, 5, DISCLAIMER + "  No es aprobación electoral ni censo de vivienda.")


def _dashboard(pdf: BriefPDF, summary: StudySummary, hero: TargetSummary | None, mentions: list) -> None:
    pdf.start_section("01  /  TELEMETRÍA", "Tablero de mando")
    if hero:
        y = pdf.get_y()
        pdf.tile(16, y, 46, 26, "Índice", "s.d." if hero.favorability_index is None else f"{hero.favorability_index:+.0f}", _index_color(hero.favorability_index))
        pdf.tile(64, y, 46, 26, "Positivo", f"{hero.pct_positive:.0f}%", POS)
        pdf.tile(112, y, 46, 26, "Negativo", f"{hero.pct_negative:.0f}%", NEG)
        pdf.tile(160, y, 40, 26, "Volumen", str(hero.volume), CYAN)
        pdf.set_y(y + 32)
        bar_x, bar_y, bar_w, bar_h = 16, pdf.get_y(), 184, 8
        pdf.set_fill_color(*ELEVATED)
        pdf.panel(bar_x, bar_y, bar_w, bar_h, 1.2)
        pos_w = bar_w * hero.pct_positive / 100
        neu_w = bar_w * hero.pct_neutral / 100
        neg_w = bar_w - pos_w - neu_w
        pdf.set_fill_color(*POS)
        pdf.rect(bar_x, bar_y, pos_w, bar_h, "F")
        pdf.set_fill_color(*LINE)
        pdf.rect(bar_x + pos_w, bar_y, neu_w, bar_h, "F")
        pdf.set_fill_color(*NEG)
        pdf.rect(bar_x + pos_w + neu_w, bar_y, max(0, neg_w), bar_h, "F")
        pdf.set_y(bar_y + 12)
        pdf.body(
            "El índice va de −100 a +100. Pesa recencia (vida media de un año), fuente y relevancia. "
            "Una nota reciente de un medio independiente pesa más que un boletín de 2024. "
            "La prensa municipal pagada no entra."
        )

    pdf.h2("Lectura por objetivo")
    for target in summary.targets:
        pdf.ensure(28)
        y = pdf.get_y()
        pdf.set_fill_color(*SURFACE)
        pdf.panel(16, y, 184, 24, 2)
        color = _index_color(target.favorability_index)
        pdf.set_fill_color(*color)
        pdf.rect(16, y, 2, 24, "F")
        pdf.set_xy(22, y + 3)
        pdf.set_font(pdf.family, "B", 10)
        pdf.ink(FG)
        pdf.cell(120, 6, target.name)
        pdf.set_font(pdf.mono, "B", 14)
        pdf.ink(color)
        pdf.cell(56, 8, "s.d." if target.favorability_index is None else f"{target.favorability_index:+.1f}", align="R")
        pdf.set_xy(22, y + 12)
        pdf.set_font(pdf.mono, "", 7)
        pdf.ink(MUTED)
        pdf.cell(
            0,
            6,
            f"{target.kind.upper()}    POS {target.pct_positive:.0f}%    "
            f"NEG {target.pct_negative:.0f}%    NEU {target.pct_neutral:.0f}%    n={target.volume}",
        )
        pdf.set_y(y + 28)

    pdf.ensure(42)
    pdf.h2("Temas que sostienen el número")
    by_theme: dict[str, list] = {}
    for mention in mentions:
        by_theme.setdefault(mention.theme or "general", []).append(mention)
    if not by_theme:
        pdf.body("Sin piezas en el expediente de este corte.")
        return
    for theme, rows in sorted(by_theme.items(), key=lambda item: (-len(item[1]), item[0])):
        pos = sum(1 for row in rows if row.classification and row.classification.sentiment == "positive")
        neg = sum(1 for row in rows if row.classification and row.classification.sentiment == "negative")
        pdf.ensure(10)
        pdf._full_width()
        pdf.set_font(pdf.mono, "B", 8)
        pdf.ink(CYAN)
        pdf.cell(36, 6, f"#{theme}")
        pdf.set_font(pdf.family, "", 8)
        pdf.ink(FG)
        pdf.cell(0, 6, f"{len(rows)} piezas    {pos} positivas    {neg} negativas")
        pdf.ln(7)


def _source_card(pdf: BriefPDF, x: float, y: float, w: float, h: float, title: str, status: str, note: str, accent: tuple[int, int, int]) -> None:
    pdf.set_fill_color(*SURFACE)
    pdf.panel(x, y, w, h, 2)
    pdf.set_fill_color(*accent)
    pdf.rect(x, y, w, 1.4, "F")
    pdf.set_xy(x + 5, y + 6)
    pdf.set_font(pdf.family, "B", 9)
    pdf.ink(FG)
    pdf.cell(w - 10, 5, title)
    pdf.set_xy(x + 5, y + 12)
    pdf.set_font(pdf.mono, "B", 7)
    pdf.ink(accent)
    pdf.cell(w - 10, 4, status.upper())
    pdf.set_xy(x + 5, y + 18)
    pdf.set_font(pdf.family, "", 7)
    pdf.ink(MUTED)
    pdf.multi_cell(w - 10, 3.6, note)


def _sources(pdf: BriefPDF, summary: StudySummary) -> None:
    pdf.start_section("02  /  SENSORES", "Mapa de fuentes")
    pdf.body(
        "Nueva Expresión Nuevo León es el medio propio: se consulta primero. "
        "El índice no usa páginas que el alcalde paga. Facebook, Instagram y YouTube "
        "no se vacían: no hay API usable y no se evaden términos."
    )
    y = pdf.get_y()
    own = summary.coverage.own_outlets
    if own:
        width = 90
        for i, outlet in enumerate(own[:2]):
            _source_card(
                pdf,
                16 + i * (width + 4),
                y,
                width,
                42,
                outlet.name,
                outlet.status,
                outlet.note or "Conectada.",
                POS,
            )
        pdf.set_y(y + 48)
    else:
        _source_card(
            pdf,
            16,
            y,
            184,
            36,
            "Nueva Expresión Nuevo León",
            "conectada",
            "nuevaexpresion.online se lee por WordPress. Si no hay notas cívicas, el índice no las inventa.",
            POS,
        )
        pdf.set_y(y + 42)

    pdf.h2("Prensa municipal excluida del índice")
    excluded = summary.coverage.excluded_outlets
    if excluded:
        y = pdf.get_y()
        width = 60
        for i, outlet in enumerate(excluded[:3]):
            _source_card(pdf, 16 + i * (width + 2), y, width, 38, outlet.name, outlet.status, outlet.note or "Fuera del índice.", WARN)
        pdf.set_y(y + 44)
    else:
        pdf.body("Líder Web, 6w News y El Rincón de Maquiavelo no entran al número.")

    pdf.h2("Huecos declarados")
    missing = summary.coverage.missing_platforms
    if missing:
        y = pdf.get_y()
        width = 90
        for i, outlet in enumerate(missing[:2]):
            _source_card(pdf, 16 + i * (width + 4), y, width, 38, outlet.name, outlet.status, outlet.note or "", NEG)
        pdf.set_y(y + 44)
    pdf.body(
        "El expediente independiente incluye El Mañana, El Porvenir, El Norte, MVS, "
        "Milenio, Vanguardia/Reforma, Factor, La Voz, IEEPCNL y TEPJF. Cada pieza tiene URL."
    )


def _catalog(pdf: BriefPDF, mentions: list) -> None:
    pdf.start_section("03  /  EXPEDIENTE", "Catálogo de piezas")
    pdf.body("Cada nota usada. Si el alcalde pide el expediente, esto es lo que hay —no un resumen vacío.")
    if not mentions:
        pdf.callout("No hay piezas en este corte.")
        return
    for index, mention in enumerate(mentions, start=1):
        classification = mention.classification
        sentiment = classification.sentiment if classification else "neutral"
        stance = classification.stance if classification else "not_applicable"
        when = mention.published_at.strftime("%d.%m.%Y") if mention.published_at else "s.f."
        text = mention.text_original or ""
        needed = 28 + min(28, 4.4 * max(3, len(text) / 95))
        pdf.ensure(needed)
        y = pdf.get_y()
        pdf.set_fill_color(*SURFACE)
        pdf.panel(16, y, 184, 8, 1.2)
        pdf.set_fill_color(*_SENTIMENT_COLOR.get(sentiment, MUTED))
        pdf.rect(16, y, 2.2, 8, "F")
        pdf.set_xy(21, y + 1.5)
        pdf.set_font(pdf.mono, "B", 7)
        pdf.ink(FG)
        pdf.cell(18, 5, f"{index:02d}")
        pdf.ink(_SENTIMENT_COLOR.get(sentiment, MUTED))
        pdf.cell(28, 5, _SENTIMENT.get(sentiment, sentiment))
        pdf.ink(MUTED)
        pdf.cell(28, 5, when)
        pdf.ink(CYAN)
        pdf.cell(0, 5, (mention.author_handle or _SOURCE.get(mention.source_kind, mention.source_kind))[:42])
        pdf.set_y(y + 10)
        pdf.body(text, size=8)
        pdf._full_width()
        pdf.set_font(pdf.family, "", 7)
        pdf.ink(MUTED)
        pdf.multi_cell(0, 3.6, _lectura(sentiment, mention.theme or "", stance) + "  ·  " + _STANCE.get(stance, stance))
        if mention.url:
            pdf._full_width()
            pdf.set_font(pdf.mono, "", 6.5)
            pdf.ink(CYAN)
            pdf.multi_cell(0, 3.4, mention.url)
        pdf.ln(4)


def _method(pdf: BriefPDF, summary: StudySummary) -> None:
    pdf.start_section("04  /  PROTOCOLO", "Método y sesgos")
    pdf.set_fill_color(*SURFACE)
    y = pdf.get_y()
    pdf.panel(16, y, 184, 22, 2)
    pdf.set_xy(20, y + 5)
    pdf.set_font(pdf.mono, "B", 9)
    pdf.ink(CYAN)
    pdf.cell(0, 6, summary.methodology.formula)
    pdf.set_xy(20, y + 12)
    pdf.set_font(pdf.mono, "", 7)
    pdf.ink(MUTED)
    pdf.cell(
        0,
        5,
        f"confianza ≥ {summary.methodology.min_confidence:.2f}    "
        f"vida media {summary.methodology.half_life_days:.0f} d    "
        f"fuentes: {', '.join(summary.methodology.sources) or 'ninguna'}",
    )
    pdf.set_y(y + 28)
    pdf.h2("Sesgos declarados")
    for bias in summary.known_biases:
        pdf.ensure(16)
        start = pdf.get_y()
        pdf.set_fill_color(*SURFACE)
        pdf.set_x(16)
        pdf.set_font(pdf.family, "", 8)
        pdf.ink(FG)
        pdf.multi_cell(184, 4.4, "    " + bias, fill=True)
        pdf.set_fill_color(*VIOLET)
        pdf.rect(16, start, 2.2, max(8, pdf.get_y() - start), "F")
        pdf.ln(2.4)
    pdf.ln(2)
    pdf.callout(DISCLAIMER)


def build_brief_pdf(summary: StudySummary, mentions: list) -> bytes:
    pdf = BriefPDF()
    hero = next((item for item in summary.targets if item.kind == "politician"), None)
    if hero is None and summary.targets:
        hero = summary.targets[0]
    _cover(pdf, summary, hero, len(mentions))
    _dashboard(pdf, summary, hero, mentions)
    _sources(pdf, summary)
    _catalog(pdf, mentions)
    _method(pdf, summary)
    return bytes(pdf.output())
