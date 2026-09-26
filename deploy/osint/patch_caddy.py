"""Insert an /osint reverse proxy into the GarGa Caddyfile.

Leaves /census, /crm and the rest of the site untouched. Idempotent.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path


def patch(text: str) -> tuple[str, str]:
    if "osint-framework:80" in text:
        return text, "caddy_unchanged"

    match = re.search(r"^([ \t]*)handle \{", text, re.M)
    if match is None:
        match = re.search(r"^([ \t]*)handle /census", text, re.M)
    if match is None:
        raise SystemExit("caddy_no_anchor")

    indent = match.group(1)
    inner = indent + "\t"
    anchor = match.group(0)
    block = (
        f"{indent}handle /osint {{\n"
        f"{inner}redir /osint/ 302\n"
        f"{indent}}}\n"
        f"{indent}handle_path /osint/* {{\n"
        f"{inner}reverse_proxy osint-framework:80\n"
        f"{indent}}}\n"
    )
    return text.replace(anchor, block + anchor, 1), "caddy_updated"


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/garga/caddy/Caddyfile")
    original = path.read_text()
    updated, status = patch(original)
    if status == "caddy_updated":
        backup = Path(str(path) + ".bak-osint")
        shutil.copy(path, backup)
        path.write_text(updated)
    print(status)


if __name__ == "__main__":
    main()
