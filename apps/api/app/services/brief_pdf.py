"""Informe PDF para entrega interna. No es encuesta."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from fpdf import FPDF

from app.schemas.dto import StudySummary
from app.services.scoring import DISCLAIMER

_FONTS = Path(__file__).resolve().parents[2] / "fonts"
_SENTIMENT = {"positive": "Positivo", "negative": "Negativo", "neutral": "Neutro"}
_STANCE = {
    "in_favor": "A favor del alcalde o de su gestión",
    "against": "En contra del alcalde o de su gestión",
    "mixed": "Mixto",
    "not_applicable": "No apunta al alcalde (otro actor)",
}
_SOURCE = {
    "news": "Medio de comunicación",
    "web_public": "Página pública",
    "youtube": "YouTube (metadato público)",
    "manual_upload": "Carga del analista",
}


def _lectura(sentiment: str, theme: str, stance: str) -> str:
    theme = theme or "general"
    if sentiment == "positive":
        return (
            f"La nota presenta una acción o logro de la administración (tema: {theme}). "
            "Suele ser boletín o cobertura institucional; no prueba que la calle esté contenta."
        )
    if sentiment == "negative":
        if stance == "not_applicable":
            return (
                f"La nota documenta un conflicto o queja ciudadana (tema: {theme}) "
                "sin atribuir la responsabilidad principal al alcalde."
            )
        return (
            f"La nota describe un riesgo, crisis o crítica (tema: {theme}) "
            "con el alcalde como vocero o como parte del entorno."
        )
    return f"La nota informa un hecho (tema: {theme}) sin un juicio claro de aprobación o rechazo."


class BriefPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="Letter")
        self.set_auto_page_break(auto=True, margin=18)
        regular = _FONTS / "DejaVuSans.ttf"
        bold = _FONTS / "DejaVuSans-Bold.ttf"
        if regular.exists() and bold.exists():
            self.add_font("Brief", "", str(regular))
            self.add_font("Brief", "B", str(bold))
            self.family = "Brief"
        else:
            self.family = "Helvetica"
        self.created = datetime.now().strftime("%d/%m/%Y %H:%M")

    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_fill_color(18, 22, 38)
        self.rect(0, 0, 216, 12, "F")
        self.set_text_color(230, 233, 242)
        self.set_font(self.family, "B", 8)
        self.set_xy(12, 3.5)
        self.cell(120, 5, "LA MV Census  ·  Informe de sentimiento digital  ·  uso interno")
        self.set_xy(12 + 120, 3.5)
        self.cell(70, 5, f"Página {self.page_no()}", align="R")
        self.set_text_color(20, 20, 20)
        self.set_xy(self.l_margin, 16)

    def footer(self) -> None:
        self.set_y(-14)
        self.set_font(self.family, "", 7)
        self.set_text_color(90, 90, 90)
        self.multi_cell(0, 3.5, DISCLAIMER + "  Generado " + self.created)

    def _full_width(self) -> None:
        self.set_x(self.l_margin)

    def h1(self, text: str) -> None:
        self._full_width()
        self.set_font(self.family, "B", 16)
        self.set_text_color(18, 22, 38)
        self.multi_cell(0, 8, text)
        self.ln(2)

    def h2(self, text: str) -> None:
        self._full_width()
        self.set_font(self.family, "B", 12)
        self.set_text_color(40, 36, 90)
        self.multi_cell(0, 6, text)
        self.ln(1)

    def body(self, text: str, size: int = 10) -> None:
        self._full_width()
        self.set_font(self.family, "", size)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5, text)
        self.ln(1.5)

    def callout(self, text: str) -> None:
        self.set_fill_color(255, 244, 214)
        self.set_draw_color(200, 160, 40)
        self.set_font(self.family, "", 9)
        self.multi_cell(0, 5, text, border=1, fill=True)
        self.ln(3)

    def kpi(self, label: str, value: str, x: float, y: float) -> None:
        self.set_xy(x, y)
        self.set_fill_color(245, 246, 250)
        self.cell(44, 18, "", fill=True)
        self.set_xy(x + 2, y + 2)
        self.set_font(self.family, "", 7)
        self.set_text_color(90, 90, 90)
        self.cell(40, 4, label)
        self.set_xy(x + 2, y + 7)
        self.set_font(self.family, "B", 13)
        self.set_text_color(18, 22, 38)
        self.cell(40, 7, value)


def build_brief_pdf(summary: StudySummary, mentions: list) -> bytes:
    pdf = BriefPDF()
    hero = next((item for item in summary.targets if item.kind == "politician"), None)
    if hero is None and summary.targets:
        hero = summary.targets[0]

    pdf.add_page()
    pdf.set_fill_color(18, 22, 38)
    pdf.rect(0, 0, 216, 42, "F")
    pdf.set_text_color(230, 233, 242)
    pdf.set_font(pdf.family, "B", 11)
    pdf.set_xy(14, 10)
    pdf.cell(0, 6, "LA MV CENSUS")
    pdf.set_font(pdf.family, "", 9)
    pdf.set_xy(14, 16)
    pdf.cell(0, 5, "Inteligencia de sentimiento cívico  ·  documento interno")
    pdf.set_text_color(18, 22, 38)
    pdf.set_y(50)
    pdf.h1(summary.name)
    pdf.body(summary.description or "")
    pdf.body(
        f"Ventana: {summary.window_start.isoformat()} a {summary.window_end.isoformat()}.  "
        f"Piezas públicas catalogadas: {len(mentions)}."
    )
    pdf.callout(
        DISCLAIMER
        + " Este documento resume cobertura pública verificable. "
        + "No sustituye un censo de vivienda, una encuesta probabilística ni un conteo de votos."
    )
    if hero and hero.favorability_index is not None:
        y = pdf.get_y()
        pdf.kpi("Índice del alcalde", f"{hero.favorability_index:+.0f}", 14, y)
        pdf.kpi("Positivo", f"{hero.pct_positive:.0f}%", 62, y)
        pdf.kpi("Negativo", f"{hero.pct_negative:.0f}%", 110, y)
        pdf.kpi("Piezas del alcalde", str(hero.volume), 158, y)
        pdf.set_xy(pdf.l_margin, y + 22)
        pdf.body(
            "El índice va de −100 a +100. Se pondera por recencia (vida media de un año), "
            "fuente y relevancia. Una nota reciente de un medio pesa más que una de 2024."
        )

    pdf.h2("Nueva Expresión Nuevo León — medio propio")
    own = summary.coverage.own_outlets
    if own:
        for outlet in own:
            pdf.body(f"{outlet.name} ({outlet.status}). {outlet.note}")
    else:
        pdf.body(
            "Nueva Expresión Nuevo León (nuevaexpresion.online) es la fuente propia de este censo. "
            "Se lee su WordPress público. Si no hay notas cívicas, el índice no las inventa."
        )
    pdf.h2("Qué se pudo recoger y qué no")
    pdf.body(
        "El índice usa solo notas independientes (El Mañana, El Porvenir, El Norte, MVS, "
        "Milenio, Vanguardia/Reforma, Factor, La Voz) y documentos oficiales (IEEPCNL, TEPJF). "
        "Cada pieza tiene URL. "
        "Facebook e Instagram no se vaciaron: Meta no ofrece API usable y no se evaden términos. "
        "YouTube no tiene llave; no hay conteo de comentarios de video."
    )
    if summary.coverage.excluded_outlets:
        discarded = ", ".join(item.name for item in summary.coverage.excluded_outlets)
        pdf.body(
            f"Se excluyó del índice la prensa municipal pagada: {discarded}. "
            "Esas notas existen; no se usan para inflar el número del alcalde."
        )
    pdf.body(
        "Las piezas negativas más fuertes del periodo son las protestas contra Fuerza Civil "
        "(corporación estatal) y la sequía / presa Don Martín."
    )

    pdf.add_page()
    pdf.h2("Lectura por objetivo")
    for target in summary.targets:
        index = "s.d." if target.favorability_index is None else f"{target.favorability_index:+.1f}"
        pdf._full_width()
        pdf.set_font(pdf.family, "B", 10)
        pdf.multi_cell(0, 5, f"{target.name}  ({target.kind})")
        pdf.body(
            f"Índice {index}.  Positivo {target.pct_positive:.1f}%  ·  "
            f"Negativo {target.pct_negative:.1f}%  ·  Neutro {target.pct_neutral:.1f}%  ·  "
            f"n={target.volume}."
        )

    pdf.h2("Temas que sostienen el número")
    by_theme: dict[str, list] = {}
    for mention in mentions:
        by_theme.setdefault(mention.theme or "general", []).append(mention)
    for theme, rows in sorted(by_theme.items(), key=lambda item: (-len(item[1]), item[0])):
        pos = sum(1 for row in rows if row.classification and row.classification.sentiment == "positive")
        neg = sum(1 for row in rows if row.classification and row.classification.sentiment == "negative")
        pdf.body(f"#{theme}: {len(rows)} piezas ({pos} positivas, {neg} negativas).")

    pdf.add_page()
    pdf.h2("Catálogo de piezas (todas, con fuente)")
    pdf.body("Abajo va cada nota usada. Si el alcalde pide el expediente, esto es lo que hay —no un resumen vacío.")
    for mention in mentions:
        classification = mention.classification
        sentiment = classification.sentiment if classification else "neutral"
        stance = classification.stance if classification else "not_applicable"
        when = mention.published_at.strftime("%d/%m/%Y") if mention.published_at else "s.f."
        pdf.set_fill_color(245, 246, 250)
        pdf.set_font(pdf.family, "B", 9)
        pdf.multi_cell(0, 5, f"{when}  ·  {_SENTIMENT.get(sentiment, sentiment)}  ·  {mention.author_handle or _SOURCE.get(mention.source_kind, mention.source_kind)}", fill=True)
        pdf.body(mention.text_original, size=9)
        pdf.set_font(pdf.family, "", 8)
        pdf.set_text_color(60, 60, 90)
        pdf.multi_cell(0, 4, _lectura(sentiment, mention.theme or "", stance))
        pdf.multi_cell(0, 4, f"Postura: {_STANCE.get(stance, stance)}")
        if mention.url:
            pdf.set_text_color(40, 70, 140)
            pdf.multi_cell(0, 4, mention.url)
        pdf.ln(3)

    pdf.add_page()
    pdf.h2("Método")
    pdf.body(summary.methodology.formula)
    pdf.body(
        f"Confianza mínima {summary.methodology.min_confidence:.2f}.  "
        f"Vida media {summary.methodology.half_life_days:.0f} días.  "
        f"Fuentes en el corte: {', '.join(summary.methodology.sources) or 'ninguna'}."
    )
    pdf.h2("Sesgos declarados")
    for bias in summary.known_biases:
        pdf.body(f"• {bias}")
    pdf.callout(DISCLAIMER)
    return bytes(pdf.output())
