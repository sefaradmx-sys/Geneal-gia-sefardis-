"""Comprueba que el parche de Caddy inserta /osint y se puede repetir."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import patch_caddy


def test_inserts_before_catch_all() -> None:
    patch = patch_caddy.patch
    original = (
        ":80 {\n"
        "\thandle /census* {\n"
        "\t\treverse_proxy lmc-web:3000\n"
        "\t}\n"
        "\thandle / {\n"
        "\t\tredir /census/login 302\n"
        "\t}\n"
        "\thandle {\n"
        "\t\troot * /srv\n"
        "\t\tfile_server\n"
        "\t}\n"
        "}\n"
    )
    updated, status = patch(original)
    assert status == "caddy_updated"
    assert "reverse_proxy osint-framework:80" in updated
    assert "redir /osint/ 302" in updated
    assert updated.index("handle_path /osint/*") < updated.index("handle {")
    assert "reverse_proxy lmc-web:3000" in updated
    again, status2 = patch(updated)
    assert status2 == "caddy_unchanged"
    assert again == updated


def test_anchor_on_census_when_no_catchall() -> None:
    patch = patch_caddy.patch
    original = "\thandle /census* {\n\t\treverse_proxy lmc-web:3000\n\t}\n"
    updated, status = patch(original)
    assert status == "caddy_updated"
    assert updated.index("handle /osint") < updated.index("handle /census*")


if __name__ == "__main__":
    test_inserts_before_catch_all()
    test_anchor_on_census_when_no_catchall()
    print("patch_ok")
