"""Elige el primer puerto de host libre. No reutiliza uno que ya escucha."""

from __future__ import annotations

import sys

CANDIDATES = (8000, 8001, 8088, 8888)


def listening_ports(listing: str) -> set[int]:
    used: set[int] = set()
    for raw in listing.splitlines():
        parts = raw.split()
        if len(parts) < 4:
            continue
        local = parts[3]
        if local.startswith("*:"):
            port_text = local[2:]
        else:
            _host, sep, port_text = local.rpartition(":")
            if not sep:
                continue
        if port_text.isdigit():
            used.add(int(port_text))
    return used


def first_free(listing: str, candidates: tuple[int, ...] = CANDIDATES) -> int | None:
    used = listening_ports(listing)
    for port in candidates:
        if port not in used:
            return port
    return None


def main() -> None:
    listing = sys.stdin.read()
    port = first_free(listing)
    if port is None:
        print("none")
        return
    print(port)


if __name__ == "__main__":
    main()
