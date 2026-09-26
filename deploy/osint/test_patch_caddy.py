"""Comprueba que /osint queda en el mismo sitio Caddy que /census."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import patch_caddy


def test_inserts_beside_census_not_later_catchall() -> None:
    original = (
        "localhost {\n"
        "\thandle {\n"
        "\t\troot * /other\n"
        "\t\tfile_server\n"
        "\t}\n"
        "}\n"
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
    updated, status = patch_caddy.patch(original)
    assert status == "caddy_updated"
    assert updated.index("handle /osint*") < updated.index("handle /census*")
    assert updated.index("reverse_proxy osint-framework:80") < updated.index("lmc-web:3000")
    assert "handle_path" not in updated
    assert "redir /osint/" not in updated
    again, status2 = patch_caddy.patch(updated)
    assert status2 == "caddy_unchanged"
    assert again == updated


def test_moves_block_that_was_on_the_wrong_handle() -> None:
    misplaced = (
        "localhost {\n"
        "\thandle /osint {\n"
        "\t\tredir /osint/ 302\n"
        "\t}\n"
        "\thandle_path /osint/* {\n"
        "\t\treverse_proxy osint-framework:80\n"
        "\t}\n"
        "\thandle {\n"
        "\t\troot * /other\n"
        "\t}\n"
        "}\n"
        ":80 {\n"
        "\thandle /census* {\n"
        "\t\treverse_proxy lmc-web:3000\n"
        "\t}\n"
        "}\n"
    )
    updated, status = patch_caddy.patch(misplaced)
    assert status == "caddy_updated"
    assert "handle_path" not in updated
    assert updated.index("handle /osint*") < updated.index("handle /census*")
    assert "localhost" in updated
    again, status2 = patch_caddy.patch(updated)
    assert status2 == "caddy_unchanged"


if __name__ == "__main__":
    test_inserts_beside_census_not_later_catchall()
    test_moves_block_that_was_on_the_wrong_handle()
    print("patch_ok")
