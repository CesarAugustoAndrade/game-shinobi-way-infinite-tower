"""Structural test: regenerated enemy portraits use green/magenta chroma; cutouts have RGBA alpha.

Run: python scripts/verify_enemy_art_chroma.py
Exit 0 on pass.
"""
from __future__ import annotations
import sys
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ENEMIES = ROOT / "public" / "assets" / "enemies"
CUTOUTS = ROOT / "public" / "assets" / "cutouts"


def classify_bg(path: Path) -> str:
    a = np.asarray(Image.open(path).convert("RGB"))
    h, w = a.shape[:2]
    corners = np.stack([a[8, 8], a[8, w - 9], a[h - 9, 8], a[h - 9, w - 9]]).astype(float)
    # use best chroma corner (max green excess or magenta excess)
    gexc = corners[:, 1] - np.maximum(corners[:, 0], corners[:, 2])
    mexc = (corners[:, 0] + corners[:, 2]) / 2 - corners[:, 1]
    if gexc.max() > 40:
        return "green"
    if mexc.max() > 40 and corners[int(np.argmax(mexc)), 0] > 140:
        return "magenta"
    mean = corners.mean(axis=0)
    if mean.mean() < 40:
        return "black"
    return "other"


# Max opaque pure-chroma pixels allowed inside a cutout (interior islands).
# ~500 ≈ 0.05% of 1024²; mist_ninja pre-fix had ~16.7k green islands.
MAX_OPAQUE_CHROMA_PIXELS = 500


def count_opaque_chroma_spill(rgba: np.ndarray) -> tuple[int, int]:
    """Count opaque pure green-screen and pure magenta/hot-pink pixels (interior islands).

    Strict thresholds match ART-CANON keys (#00FF00 / #FF00FF), not skin/cloth browns.
    """
    r = rgba[:, :, 0].astype(np.int16)
    g = rgba[:, :, 1].astype(np.int16)
    b = rgba[:, :, 2].astype(np.int16)
    al = rgba[:, :, 3]
    opaque = al > 200
    # pure green screen: high G, low R/B
    green = opaque & (g > 150) & (r < 80) & (b < 80)
    # pure magenta / hot-pink key: high R+B, low G (not brown skin ~157,113,95)
    magenta = opaque & (r > 180) & (b > 120) & (g < 100) & (r > g + 60)
    return int(green.sum()), int(magenta.sum())


def cutout_ok(path: Path) -> tuple[bool, str]:
    im = Image.open(path)
    if im.mode != "RGBA":
        return False, f"mode={im.mode}"
    rgba = np.asarray(im)
    a = rgba[:, :, 3]
    trans = float((a < 10).mean())
    opaque = float((a > 200).mean())
    h, w = a.shape
    issues: list[str] = []
    for y, x in ((5, 5), (5, w - 6), (h - 6, 5), (h - 6, w - 6)):
        r, g, b, al = map(int, rgba[y, x])
        if al > 50 and g > int(r) + 45 and g > int(b) + 45 and g > 140 and r < 80 and b < 80:
            issues.append(f"green-spill-corner@{x},{y}")
    green_n, mag_n = count_opaque_chroma_spill(rgba)
    if green_n > MAX_OPAQUE_CHROMA_PIXELS:
        issues.append(f"interior-green-islands={green_n}")
    if mag_n > MAX_OPAQUE_CHROMA_PIXELS:
        issues.append(f"interior-magenta-islands={mag_n}")
    if trans < 0.15:
        return False, f"low-trans={trans:.3f}"
    if opaque < 0.12:
        return False, f"low-opaque={opaque:.3f}"
    if issues:
        return False, ",".join(issues)
    return True, f"trans={trans:.3f},opaque={opaque:.3f},g_isl={green_n},m_isl={mag_n}"


def main() -> int:
    flat = sorted(ENEMIES.glob("enemy_*.png"))
    cutouts = sorted(CUTOUTS.glob("enemy_cut_*.png"))
    errors: list[str] = []
    # Runtime ships flat portraits only (QA buenos/malos trees purged for dist size).
    if len(flat) != 44:
        errors.append(f"flat portraits expected 44 got {len(flat)}")
    if len(cutouts) != 44:
        errors.append(f"cutouts expected 44 got {len(cutouts)}")

    island_summary: list[str] = []
    for p in flat:
        kind = classify_bg(p)
        if kind not in ("green", "magenta"):
            errors.append(f"{p.name}: bg={kind} (want green|magenta)")
        cid = p.name.replace("enemy_", "enemy_cut_", 1)
        cut = CUTOUTS / cid
        if not cut.exists():
            errors.append(f"missing cutout {cid}")
            continue
        ok, msg = cutout_ok(cut)
        if not ok:
            errors.append(f"{cid}: {msg}")
        else:
            island_summary.append(f"{cid}: {msg}")

    # Canaries: known former-spill ids must report zero pure green islands
    for canary in ("enemy_cut_mist_ninja.png", "enemy_cut_forest_bandit.png"):
        cpath = CUTOUTS / canary
        if not cpath.exists():
            errors.append(f"missing canary cutout {canary}")
            continue
        rgba = np.asarray(Image.open(cpath).convert("RGBA"))
        g_n, m_n = count_opaque_chroma_spill(rgba)
        if g_n > 0:
            errors.append(f"{canary}: canary green islands={g_n} (must be 0)")
        if canary == "enemy_cut_forest_bandit.png" and m_n > MAX_OPAQUE_CHROMA_PIXELS:
            errors.append(f"{canary}: canary magenta islands={m_n}")

    if errors:
        print("FAIL verify_enemy_art_chroma")
        for e in errors:
            print(" -", e)
        return 1
    print(f"PASS verify_enemy_art_chroma: {len(flat)} portraits chroma-ok, {len(cutouts)} cutouts alpha-ok")
    print(f"interior island threshold={MAX_OPAQUE_CHROMA_PIXELS}; canaries mist_ninja/forest_bandit green_islands=0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
