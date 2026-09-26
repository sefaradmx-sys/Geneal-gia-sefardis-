"""El selector no devuelve un puerto que ya aparece en ss."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pick_port

LISTING = """State  Recv-Q Send-Q Local Address:Port Peer Address:Port
LISTEN 0      128        0.0.0.0:80        0.0.0.0:*
LISTEN 0      128        127.0.0.1:8000    0.0.0.0:*
LISTEN 0      128           [::]:22        [::]:*
LISTEN 0      128              *:8088      *:*
"""


def test_skips_occupied_candidates() -> None:
    used = pick_port.listening_ports(LISTING)
    assert 80 in used
    assert 8000 in used
    assert 22 in used
    assert 8088 in used
    assert pick_port.first_free(LISTING) == 8001


def test_none_when_every_candidate_is_taken() -> None:
    listing = "\n".join(
        f"LISTEN 0 128 0.0.0.0:{port} 0.0.0.0:*" for port in pick_port.CANDIDATES
    )
    assert pick_port.first_free(listing) is None


def test_first_candidate_when_nothing_listens() -> None:
    assert pick_port.first_free("State Recv-Q Send-Q Local Address:Port\n") == 8000


if __name__ == "__main__":
    test_skips_occupied_candidates()
    test_none_when_every_candidate_is_taken()
    test_first_candidate_when_nothing_listens()
    print("pick_port_ok")
