"""Insert an /osint reverse proxy into the same Caddy site as /census.

Nginx keeps the /osint prefix, so Caddy only forwards the original path.
A previous block parked on the first catch-all `handle` is moved next to /census.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

_OLD_BLOCKS = (
    re.compile(
        r"^[ \t]*handle /osint \{\n[ \t]*redir /osint/ 302\n[ \t]*\}\n",
        re.M,
    ),
    re.compile(
        r"^[ \t]*handle_path /osint/\* \{\n[ \t]*reverse_proxy osint-framework:80\n[ \t]*\}\n",
        re.M,
    ),
    re.compile(
        r"^[ \t]*handle /osint\* \{\n[ \t]*reverse_proxy osint-framework:80\n[ \t]*\}\n",
        re.M,
    ),
    re.compile(
        r"^[ \t]*@osint_api path /api/tool-stats\* /api/vote\* /api/report\*\n",
        re.M,
    ),
    re.compile(
        r"^[ \t]*handle @osint_api \{\n[ \t]*reverse_proxy osint-framework:80\n[ \t]*\}\n",
        re.M,
    ),
)


def _strip_old(text: str) -> str:
    for pattern in _OLD_BLOCKS:
        text = pattern.sub("", text)
    return text


def _block(indent: str) -> str:
    inner = indent + "\t"
    return (
        f"{indent}handle /osint* {{\n"
        f"{inner}reverse_proxy osint-framework:80\n"
        f"{indent}}}\n"
        f"{indent}@osint_api path /api/tool-stats* /api/vote* /api/report*\n"
        f"{indent}handle @osint_api {{\n"
        f"{inner}reverse_proxy osint-framework:80\n"
        f"{indent}}}\n"
    )


def patch(text: str) -> tuple[str, str]:
    stripped = _strip_old(text)
    match = re.search(r"^([ \t]*)handle /census", stripped, re.M)
    if match is None:
        match = re.search(r"^([ \t]*)handle \{", stripped, re.M)
    if match is None:
        raise SystemExit("caddy_no_anchor")
    anchor = match.group(0)
    updated = stripped.replace(anchor, _block(match.group(1)) + anchor, 1)
    if updated == text:
        return text, "caddy_unchanged"
    return updated, "caddy_updated"


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/garga/caddy/Caddyfile")
    original = path.read_text()
    updated, status = patch(original)
    if status == "caddy_updated":
        backup = Path(str(path) + ".bak-osint")
        if not backup.exists():
            shutil.copy(path, backup)
        path.write_text(updated)
    print(status)


if __name__ == "__main__":
    main()
