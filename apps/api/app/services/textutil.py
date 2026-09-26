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


def fold_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", (value or "").casefold())
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def contains_phrase(text: str, phrase: str) -> bool:
    folded_phrase = fold_text(phrase).strip()
    if not folded_phrase:
        return False
    folded_text = fold_text(text)
    if folded_phrase[0] in {"#", "@"}:
        return folded_phrase in folded_text
    return re.search(rf"(?<!\w){re.escape(folded_phrase)}(?!\w)", folded_text) is not None
