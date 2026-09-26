import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))
sys.path.insert(0, str(ROOT / "apps" / "collector" / "src"))

from app.seed.__main__ import main  # noqa: E402

if __name__ == "__main__":
    main()
