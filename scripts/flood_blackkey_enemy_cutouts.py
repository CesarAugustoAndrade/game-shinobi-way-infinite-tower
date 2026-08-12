"""Cut enemy sprites from black matte → transparent cutouts (RGBA).

Thin wrapper around scripts/flood_blackkey_cutouts.py (--class enemy --force).

LEGACY RECOVERY for art already painted on black matte.
For NEW generation: prompt green screen #00FF00 (or magenta/blue if
green-heavy) and chroma-key — see Claude.md + combat-art asset-prompts.

Prefer the generalized tool for multi-class work:
  python scripts/flood_blackkey_cutouts.py --class enemy
  python scripts/flood_blackkey_cutouts.py --audit
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure scripts/ is importable when run as a file
sys.path.insert(0, str(Path(__file__).resolve().parent))
from flood_blackkey_cutouts import main as _main  # noqa: E402


def main() -> None:
    # Preserve historical behaviour: always re-key all enemies from sources
    raise SystemExit(_main(["--class", "enemy", "--force"]))


if __name__ == "__main__":
    main()
