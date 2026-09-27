#!/usr/bin/env python3
"""Extrae expedientes de un catálogo del Archivo Municipal de Saltillo."""

import json
import re
import sys
import zlib
from pathlib import Path

STRING_RE = re.compile(rb"\((?:\\.|[^\\)])*\)")
TOKEN_RE = re.compile(
    rb"[-0-9.]+\s+[-0-9.]+\s+[-0-9.]+\s+[-0-9.]+\s+[-0-9.]+\s+[-0-9.]+\s+Tm"
    rb"|[-0-9.]+\s+[-0-9.]+\s+T[Dd]"
    rb"|[-0-9.]+\s+TL"
    rb"|T\*"
    rb"|/F\d+\s+[-0-9.]+\s+Tf"
    rb"|\((?:\\.|[^\\)])*\)\s*Tj"
    rb"|\[(?:[^\[\]]|\((?:\\.|[^\\)])*\])*\]\s*TJ"
)


def pdf_unescape(raw: bytes) -> str:
    out = []
    i = 0
    while i < len(raw):
        c = raw[i]
        if c == 0x5C and i + 1 < len(raw):
            n = raw[i + 1]
            if n in b"nrtbf":
                out.append({"n": "\n", "r": "\r", "t": "\t", "b": "\b", "f": "\f"}[chr(n)])
                i += 2
                continue
            if 48 <= n <= 55:
                octal = bytes([n])
                j = i + 2
                while j < len(raw) and j < i + 4 and 48 <= raw[j] <= 55:
                    octal += bytes([raw[j]])
                    j += 1
                out.append(chr(int(octal, 8)))
                i = j
                continue
            out.append(chr(n))
            i += 2
            continue
        out.append(chr(c))
        i += 1
    return "".join(out)


def strings_in(blob: bytes) -> str:
    return "".join(pdf_unescape(m.group(0)[1:-1]) for m in STRING_RE.finditer(blob))


def page_lines(stream: bytes) -> list[str]:
    x = y = 0.0
    scale = 1.0
    tf = 1.0
    leading = 1.0
    placed = []
    for match in TOKEN_RE.finditer(stream):
        piece = match.group(0)
        if piece.endswith(b"Tm"):
            parts = piece.split()
            scale = float(parts[0]) or 1.0
            x = float(parts[4])
            y = float(parts[5])
            continue
        if piece.endswith(b"Tf"):
            tf = float(piece.split()[1]) or 1.0
            leading = tf
            continue
        if piece.endswith(b"TL"):
            leading = float(piece.split()[0])
            continue
        if piece.endswith(b"Td") or piece.endswith(b"TD"):
            tx, ty = piece.split()[:2]
            x += float(tx) * scale * tf
            y += float(ty) * scale * tf
            continue
        if piece == b"T*":
            y -= leading * scale * tf
            continue
        if piece.endswith(b"Tj"):
            raw = STRING_RE.search(piece).group(0)[1:-1]
            text = pdf_unescape(raw)
        else:
            text = strings_in(piece[: piece.rfind(b"]")])
        if text:
            placed.append((round(y, 1), x, text))
    placed.sort(key=lambda item: (-item[0], item[1]))
    lines = []
    current_y = None
    buffer = ""
    for line_y, _x, text in placed:
        if current_y is None or abs(line_y - current_y) > 1.2:
            if buffer.strip():
                lines.append(buffer.strip())
            buffer = text
            current_y = line_y
        else:
            buffer += text
    if buffer.strip():
        lines.append(buffer.strip())
    return lines


def extract_text(path: Path) -> str:
    data = path.read_bytes()
    pages = []
    for match in re.finditer(br"stream\r\n", data):
        raw = data[match.end() : data.find(b"endstream", match.end())]
        if raw.endswith(b"\r\n"):
            raw = raw[:-2]
        try:
            stream = zlib.decompress(raw)
        except zlib.error:
            continue
        if b"BT" not in stream or (b"Tj" not in stream and b"TJ" not in stream):
            continue
        pages.append("\n".join(page_lines(stream)))
    return "\n".join(pages)


def limpiar(valor: str, fojas: int) -> str:
    valor = (valor or "").strip(" .,")
    if fojas:
        valor = re.sub(r"\s+" + str(fojas) + r"$", "", valor).strip(" .,")
    return valor


def parse_ref(segment: str):
    match = re.search(r"AMS\s*[.,][^\n]{0,160}", segment, re.I)
    if not match:
        return None
    line = re.sub(r"\s+", " ", match.group(0)).strip(" .")
    line = re.sub(r"\bl\s*f\b", "1 f", line, flags=re.I)
    norm = re.sub(r",+", ",", re.sub(r"\.(?=\s|$)", ",", line))
    fojas_m = re.search(r"(\d+)\s*f\b", norm, re.I)
    fojas = int(fojas_m.group(1)) if fojas_m else 0
    fondo_m = re.search(r"AMS\s*,\s*([A-Za-z]+)", norm, re.I)
    caja_m = re.search(r"\bc\s+([^,]+)", norm, re.I)
    exp_m = re.search(r"\be\s+([^,]+)", norm, re.I)
    doc_m = re.search(r"\bd\s+([^,]+)", norm, re.I)
    libro_m = re.search(r"\bL\s+(\d+[A-Za-z0-9/]*)", norm)
    if not (fondo_m and (caja_m or exp_m)):
        return None
    caja = limpiar(caja_m.group(1) if caja_m else "", fojas)
    expediente = limpiar(exp_m.group(1) if exp_m else "", fojas)
    documento = limpiar(doc_m.group(1) if doc_m else "", fojas)
    if len(caja) > 20 or len(expediente) > 20 or len(documento) > 20:
        return None
    fondo = fondo_m.group(1).upper()
    libro = libro_m.group(1) if libro_m else ""
    referencia = f"AMS, {fondo}"
    if caja:
        referencia += f", c {caja}"
    if libro:
        referencia += f", L {libro}"
    if expediente:
        referencia += f", e {expediente}"
    if documento:
        referencia += f", d {documento}"
    referencia += f", {fojas} f." if fojas else "."
    return {
        "fondo": fondo,
        "caja": caja,
        "libro": libro,
        "expediente": expediente,
        "documento": documento,
        "fojas": fojas,
        "referencia": referencia,
        "corte": match.start(),
    }


def parse_catalogo(text: str, volumen: int) -> list[dict]:
    records = []
    for chunk in re.split(r"(?m)^(?=\d+\.\s)", text):
        chunk = chunk.strip()
        number = re.match(r"(\d+)\.\s*(.*)", chunk, re.S)
        if not number:
            continue
        body = number.group(2).strip()
        ref = parse_ref(body)
        antes = body[: ref["corte"]].strip() if ref else body
        antes = re.sub(r" *\n *", "\n", re.sub(r"[ \t]+", " ", antes)).strip()
        lineas = [ln.strip() for ln in antes.split("\n") if ln.strip()]
        encabezado = lineas[0] if lineas else ""
        resto = " ".join(lineas[1:]) if len(lineas) > 1 else ""
        tipo, descripcion = "", resto
        punto = resto.find(". ")
        if 0 < punto < 48:
            tipo = resto[:punto].strip(" .")
            descripcion = resto[punto + 2 :].strip()
        rec = {
            "volumen": volumen,
            "numero": int(number.group(1)),
            "lugar_fecha": encabezado,
            "tipo": tipo,
            "descripcion": descripcion,
            "referencia": ref["referencia"] if ref else "",
            "archivo": "Archivo Municipal de Saltillo",
        }
        if ref:
            rec.update({k: ref[k] for k in ("fondo", "caja", "libro", "expediente", "documento", "fojas")})
        if rec["descripcion"] or rec["tipo"] or rec["referencia"]:
            records.append(rec)
    return records


def main() -> None:
    if len(sys.argv) < 3:
        print("uso: extraer-saltillo.py VOLUMEN ARCHIVO.pdf", file=sys.stderr)
        sys.exit(1)
    volumen = int(sys.argv[1])
    records = parse_catalogo(extract_text(Path(sys.argv[2])), volumen)
    json.dump(records, sys.stdout, ensure_ascii=False, separators=(",", ":"))
    print(
        f"\n# {len(records)} sin_ref {sum(1 for r in records if not r['referencia'])}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
