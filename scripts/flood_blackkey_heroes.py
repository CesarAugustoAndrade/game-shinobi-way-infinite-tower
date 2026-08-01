"""Conservative re-key for hero_cut_*.png residual black matte → true alpha.

LEGACY RECOVERY only. Dark ninja clothing (Uchiha etc.) is near-black and must
NOT be flood-filled like enemy plate matte.

For NEW generation: prompt green screen #00FF00 (or magenta/blue if green-heavy)
and chroma-key — see Agents.md / Claude.md.

Source/output (in place): assets/hero_cut_*.png and public/assets/hero_cut_*.png

Method:
  1. Measure residual opaque near-black (RGB<=18, A>240).
  2. Classify exterior residual = residual within EDGE_PX of existing A==0
     (true leftover matte fringe). Deep residual is treated as clothing.
  3. Only rewrite when exterior residual % of image >= MIN_EXTERIOR_PCT.
  4. Soft-clear that thin exterior band only; never flood interior silhouette.

Adapted from scripts/flood_blackkey_enemy_cutouts.py (border-only spirit).
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
DIRS = [ROOT / "assets", ROOT / "public" / "assets"]

EDGE_PX = 3.0
SOFT_PX = 2.0
HARD = 18
CHROMA_MAX = 24
# Skip if exterior residual is below this % of full image
MIN_EXTERIOR_PCT = 0.15
FORCE = False


def residual_mask(arr: np.ndarray) -> np.ndarray:
    a = arr[:, :, 3]
    return (
        (arr[:, :, 0] <= HARD)
        & (arr[:, :, 1] <= HARD)
        & (arr[:, :, 2] <= HARD)
        & (a > 240)
    )


def metrics(arr: np.ndarray) -> dict:
    h, w = arr.shape[:2]
    total = h * w
    a = arr[:, :, 3]
    res = residual_mask(arr)
    dist = ndimage.distance_transform_edt(a > 0)
    exterior = res & (dist <= EDGE_PX)
    deep = res & (dist > EDGE_PX)
    return {
        "a0": float((a == 0).sum()) / total * 100,
        "matte": float(res.sum()) / total * 100,
        "exterior": float(exterior.sum()) / total * 100,
        "deep": float(deep.sum()) / total * 100,
        "corners_a": (
            int(a[0, 0]),
            int(a[0, -1]),
            int(a[-1, 0]),
            int(a[-1, -1]),
        ),
    }


def rekey_edge_only(path: Path) -> tuple[dict, dict, bool]:
    """Soft-clear residual matte only in a thin band next to transparent bg."""
    im = Image.open(path).convert("RGBA")
    arr = np.asarray(im).copy()
    before = metrics(arr)

    if not FORCE and before["exterior"] < MIN_EXTERIOR_PCT:
        return before, before, False

    a = arr[:, :, 3].astype(np.float32)
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn

    dist = ndimage.distance_transform_edt(arr[:, :, 3] > 0)
    # Candidates: near-black, low chroma, within edge band of current hole
    band = (dist > 0) & (dist <= EDGE_PX)
    is_matte = (mx <= HARD + 6) & (chroma <= CHROMA_MAX) & (arr[:, :, 3] > 0)
    clear = band & is_matte

    if not clear.any():
        return before, before, False

    # Soft alpha: closer to exterior → more transparent
    t = np.clip(dist[clear] / SOFT_PX, 0.0, 1.0)
    # keep some of original soft fringe if already semi
    new_a = a.copy()
    new_a[clear] = np.minimum(new_a[clear], t * 255.0)

    out = arr.copy()
    a_u8 = np.clip(np.round(new_a), 0, 255).astype(np.uint8)
    out[:, :, 3] = a_u8
    out[a_u8 == 0, 0:3] = 0

    Image.fromarray(out).save(path, "PNG", optimize=True)
    after = metrics(out)
    return before, after, True


def main() -> None:
    for d in DIRS:
        if not d.is_dir():
            print(f"DIR missing: {d}")
            continue
        files = sorted(
            f
            for f in os.listdir(d)
            if f.lower().startswith("hero_cut_") and f.lower().endswith(".png")
        )
        print(f"=== {d.relative_to(ROOT)} ({len(files)} hero_cut) ===")
        for f in files:
            path = d / f
            arr = np.asarray(Image.open(path).convert("RGBA"))
            m = metrics(arr)
            print(
                f"  {f}  A0={m['a0']:.1f}%  matte={m['matte']:.2f}%  "
                f"ext<{EDGE_PX:.0f}px={m['exterior']:.2f}%  deep={m['deep']:.2f}%  "
                f"cornersA={m['corners_a']}"
            )
            if m["deep"] > m["exterior"] * 3 and m["exterior"] < MIN_EXTERIOR_PCT:
                print(
                    "    → residual is mostly interior clothing; "
                    "skip aggressive flood (would eat dark silhouette)"
                )
            before, after, changed = rekey_edge_only(path)
            if changed:
                print(
                    f"    REKEY edge  matte {before['matte']:.2f}%→{after['matte']:.2f}%  "
                    f"ext {before['exterior']:.2f}%→{after['exterior']:.2f}%"
                )
            else:
                print("    SKIP (exterior residual below threshold or no clearable band)")
    print("DONE")


if __name__ == "__main__":
    main()
