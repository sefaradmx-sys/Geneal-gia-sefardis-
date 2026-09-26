import hashlib
import re
import unicodedata

_URL = re.compile(r"https?://\S+")
_SPACE = re.compile(r"\s+")


def clean_text(text: str) -> str:
    without_urls = _URL.sub("", text or "")
    return _SPACE.sub(" ", without_urls).strip()


def normalized_hash(text: str) -> str:
    folded = clean_text(text).casefold()
    return hashlib.sha256(folded.encode("utf-8")).hexdigest()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-").lower()
    return slug[:80] or "estudio"
