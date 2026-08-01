"""Generalized black-matte → true RGBA cutout pipeline (border flood-fill).

LEGACY RECOVERY for art painted on black matte.
For NEW generation: prompt green screen #00FF00 (or magenta/blue if
green-heavy) and chroma-key — see AGENTS.md / Claude.md.

Classes
-------
  enemy   Source: enemy_<id>.png (excl. enemy_cut_*) → enemy_cut_<id>.png
          Hole-fill ON (closes small interior gaps in silhouette).
  hero    In-place: hero_cut_*.png (border flood only; hole-fill ON).
  lamina  In-place: lamina_mid_*.png / lamina_fg_*.png
          Hole-fill OFF — center oval may be an intentional transparent stage.

Method (all classes)
--------------------
  1. Estimate matte level from border max-channel median.
  2. Flood-fill near-matte pixels from the border only (preserves dark clothing).
  3. Optional hole-fill inside the silhouette (enemy/hero only).
  4. Soft anti-aliased fringe via distance transform.

Usage
-----
  python scripts/flood_blackkey_cutouts.py                  # all classes
  python scripts/flood_blackkey_cutouts.py --class enemy
  python scripts/flood_blackkey_cutouts.py --class hero --dry-run
  python scripts/flood_blackkey_cutouts.py --class lamina --force
  python scripts/flood_blackkey_cutouts.py --audit           # metrics only
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
DIRS = [ROOT / "assets", ROOT / "public" / "assets"]

CHROMA_MAX = 24
SOFT_PX = 2.0
HARD_MIN = 10
HARD_MAX = 40
HARD_SLACK = 8

# Skip re-key when already good (unless --force)
# Good = corners mostly transparent OR exterior opaque leak ≈ 0 with real a0
SKIP_CORNER_A_MAX = 8.0  # mean corner alpha
SKIP_A0_MIN = 10.0  # % fully transparent


ENEMY_SRC = re.compile(r"^enemy_(?!cut_)(.+)\.png$", re.I)
HERO_CUT = re.compile(r"^hero_cut_.+\.png$", re.I)
LAMINA_MID = re.compile(r"^lamina_mid_.+\.png$", re.I)
LAMINA_FG = re.compile(r"^lamina_fg_.+\.png$", re.I)


def _border_hard(mx: np.ndarray) -> int:
    border_mx = np.concatenate([mx[0, :], mx[-1, :], mx[:, 0], mx[:, -1]])
    border_med = float(np.median(border_mx))
    return int(np.clip(border_med + HARD_SLACK, HARD_MIN, HARD_MAX))


def flood_cutout(
    src: Path,
    dst: Path,
    *,
    fill_holes: bool = True,
    dry_run: bool = False,
) -> dict:
    """Border-flood black matte → RGBA alpha. Returns stats dict."""
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im)
    h, w = arr.shape[:2]
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    a_in = arr[:, :, 3]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn

    hard = _border_hard(mx)
    is_bg = (mx <= hard) & (chroma <= CHROMA_MAX)
    # Already-transparent counts as background seed path for in-place re-key
    is_bg = is_bg | (a_in == 0)

    seeds = np.zeros((h, w), dtype=bool)
    seeds[0, :] = is_bg[0, :]
    seeds[-1, :] = is_bg[-1, :]
    seeds[:, 0] = is_bg[:, 0]
    seeds[:, -1] = is_bg[:, -1]

    bg = ndimage.binary_propagation(seeds, mask=is_bg)
    if fill_holes:
        silhouette = ndimage.binary_fill_holes(~bg)
    else:
        # Laminas: keep interior holes (stage cutouts); only exterior matte goes
        silhouette = ~bg

    dist_out = ndimage.distance_transform_edt(~silhouette)
    alpha = np.zeros((h, w), dtype=np.float32)
    alpha[silhouette] = 255.0

    fringe = (~silhouette) & (dist_out > 0) & (dist_out <= SOFT_PX)
    fringe &= (mx <= hard + 30) & (chroma <= CHROMA_MAX + 12)
    if fringe.any():
        t = 1.0 - (dist_out[fringe] / SOFT_PX)
        alpha[fringe] = np.clip(t, 0.0, 1.0) * 255.0

    # Preserve any existing partial transparency tighter than new key
    # (only where we decided exterior / fringe — never raise alpha on body)
    a_u8 = np.clip(np.round(alpha), 0, 255).astype(np.uint8)
    # If input already had real alpha, take min on non-silhouette so we don't
    # re-opaquify intentional holes (laminas).
    if (a_in < 255).any():
        a_u8 = np.minimum(a_u8, a_in)

    total = h * w
    stats = {
        "hard": hard,
        "a0": float((a_u8 == 0).sum()) / total * 100,
        "apart": float(((a_u8 > 0) & (a_u8 < 255)).sum()) / total * 100,
        "opaque": float((a_u8 == 255).sum()) / total * 100,
        "fill_holes": fill_holes,
        "src": str(src.relative_to(ROOT)),
        "dst": str(dst.relative_to(ROOT)),
    }

    if not dry_run:
        out = arr.copy()
        out[:, :, 3] = a_u8
        Image.fromarray(out).save(dst, "PNG", optimize=True)

    return stats


def audit_file(path: Path) -> dict:
    """Alpha quality metrics for one PNG."""
    arr = np.asarray(Image.open(path).convert("RGBA"))
    h, w = arr.shape[:2]
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    total = h * w
    corners = [
        float(a[0, 0]),
        float(a[0, w - 1]),
        float(a[h - 1, 0]),
        float(a[h - 1, w - 1]),
    ]
    residual_any = float(
        ((r <= 20) & (g <= 20) & (b <= 20) & (a > 250)).sum()
    ) / total * 100
    body = a > 128
    body_filled = ndimage.binary_fill_holes(body)
    exterior = ~body_filled
    leak = float((exterior & (a > 250)).sum()) / total * 100
    # Border-connected near-black opaque (often dark clothing at edge)
    residual = (r <= 20) & (g <= 20) & (b <= 20) & (a > 250)
    seeds = np.zeros((h, w), dtype=bool)
    seeds[0, :] = residual[0, :]
    seeds[-1, :] = residual[-1, :]
    seeds[:, 0] = residual[:, 0]
    seeds[:, -1] = residual[:, -1]
    border_res = float(ndimage.binary_propagation(seeds, mask=residual).sum()) / total * 100
    return {
        "mode": Image.open(path).mode,
        "a0": float((a == 0).sum()) / total * 100,
        "apart": float(((a > 0) & (a < 255)).sum()) / total * 100,
        "opaque": float((a == 255).sum()) / total * 100,
        "corner_mean": sum(corners) / 4,
        "corners": corners,
        "residual_any": residual_any,
        "border_residual": border_res,
        "exterior_leak": leak,
        "amin": int(a.min()),
        "amax": int(a.max()),
    }


def already_good(path: Path) -> bool:
    if not path.is_file():
        return False
    s = audit_file(path)
    # Real alpha range + exterior leak free + decent transparency
    return (
        s["amin"] < s["amax"]
        and s["exterior_leak"] < 0.01
        and s["a0"] >= SKIP_A0_MIN
        and s["mode"] in ("RGBA", "LA")
    )


def process_enemy(force: bool, dry_run: bool) -> list[dict]:
    results = []
    for d in DIRS:
        if not d.is_dir():
            continue
        sources = sorted(f for f in os.listdir(d) if ENEMY_SRC.match(f))
        print(f"=== enemy @ {d.relative_to(ROOT)} ({len(sources)} sources) ===")
        for f in sources:
            m = ENEMY_SRC.match(f)
            assert m
            slug = m.group(1)
            src = d / f
            dst = d / f"enemy_cut_{slug}.png"
            if not force and already_good(dst):
                print(f"  SKIP  {f} → enemy_cut_{slug}.png (already good)")
                results.append({"status": "skipped", "dst": str(dst)})
                continue
            st = flood_cutout(src, dst, fill_holes=True, dry_run=dry_run)
            tag = "DRY " if dry_run else "FIX "
            print(
                f"  {tag}  {f} → enemy_cut_{slug}.png  hard={st['hard']}  "
                f"a0={st['a0']:.1f}% apart={st['apart']:.1f}% opaque={st['opaque']:.1f}%"
            )
            results.append({"status": "converted", **st})
    return results


def process_inplace(
    label: str,
    pattern: re.Pattern[str],
    *,
    fill_holes: bool,
    force: bool,
    dry_run: bool,
) -> list[dict]:
    results = []
    for d in DIRS:
        if not d.is_dir():
            continue
        files = sorted(f for f in os.listdir(d) if pattern.match(f))
        print(
            f"=== {label} @ {d.relative_to(ROOT)} ({len(files)} files, "
            f"fill_holes={fill_holes}) ==="
        )
        for f in files:
            path = d / f
            if not force and already_good(path):
                print(f"  SKIP  {f} (already good)")
                results.append({"status": "skipped", "dst": str(path)})
                continue
            st = flood_cutout(path, path, fill_holes=fill_holes, dry_run=dry_run)
            tag = "DRY " if dry_run else "FIX "
            print(
                f"  {tag}  {f}  hard={st['hard']}  "
                f"a0={st['a0']:.1f}% apart={st['apart']:.1f}% opaque={st['opaque']:.1f}%"
            )
            results.append({"status": "converted", **st})
    return results


def run_audit(classes: list[str]) -> None:
    patterns: list[tuple[str, str]] = []
    if "enemy" in classes:
        patterns.append(("enemy_cut", "enemy_cut_*.png"))
    if "hero" in classes:
        patterns.append(("hero_cut", "hero_cut_*.png"))
    if "lamina" in classes:
        patterns.append(("lamina_mid", "lamina_mid_*.png"))
        patterns.append(("lamina_fg", "lamina_fg_*.png"))

    d = ROOT / "public" / "assets"
    for cls, pat in patterns:
        files = sorted(d.glob(pat))
        print("=" * 70)
        print(f"AUDIT {cls}  n={len(files)}  ({d.relative_to(ROOT)})")
        if not files:
            continue
        rows = [(f.name, audit_file(f)) for f in files]
        a0 = [s["a0"] for _, s in rows]
        res = [s["residual_any"] for _, s in rows]
        bres = [s["border_residual"] for _, s in rows]
        leak = [s["exterior_leak"] for _, s in rows]
        corner = [s["corner_mean"] for _, s in rows]
        modes = {}
        for _, s in rows:
            modes[s["mode"]] = modes.get(s["mode"], 0) + 1
        print(f"  modes={modes}")
        print(
            f"  pct_a0            min={min(a0):.1f} med={np.median(a0):.1f} max={max(a0):.1f}"
        )
        print(
            f"  residual_any%     min={min(res):.2f} med={np.median(res):.2f} "
            f"max={max(res):.2f}  (dark clothing counts)"
        )
        print(
            f"  border_residual%  min={min(bres):.3f} med={np.median(bres):.3f} "
            f"max={max(bres):.3f}"
        )
        print(
            f"  exterior_leak%    min={min(leak):.4f} med={np.median(leak):.4f} "
            f"max={max(leak):.4f}  (opaque outside silhouette — should be ~0)"
        )
        print(
            f"  corner_a_mean     min={min(corner):.1f} med={np.median(corner):.1f} "
            f"max={max(corner):.1f}"
        )
        print(f"  good (skip criteria): {sum(1 for f,_ in rows if already_good(d/f))}/{len(rows)}")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument(
        "--class",
        dest="cls",
        choices=["all", "enemy", "hero", "lamina"],
        default="all",
        help="Asset class to process (default: all)",
    )
    p.add_argument("--force", action="store_true", help="Re-key even if already good")
    p.add_argument("--dry-run", action="store_true", help="Compute only, do not write")
    p.add_argument("--audit", action="store_true", help="Print quality metrics and exit")
    args = p.parse_args(argv)

    classes = ["enemy", "hero", "lamina"] if args.cls == "all" else [args.cls]

    if args.audit:
        run_audit(classes)
        return 0

    all_results: list[dict] = []
    if "enemy" in classes:
        all_results.extend(process_enemy(args.force, args.dry_run))
    if "hero" in classes:
        all_results.extend(
            process_inplace(
                "hero_cut", HERO_CUT, fill_holes=True, force=args.force, dry_run=args.dry_run
            )
        )
    if "lamina" in classes:
        all_results.extend(
            process_inplace(
                "lamina_mid",
                LAMINA_MID,
                fill_holes=False,
                force=args.force,
                dry_run=args.dry_run,
            )
        )
        all_results.extend(
            process_inplace(
                "lamina_fg",
                LAMINA_FG,
                fill_holes=False,
                force=args.force,
                dry_run=args.dry_run,
            )
        )

    converted = sum(1 for r in all_results if r.get("status") == "converted")
    skipped = sum(1 for r in all_results if r.get("status") == "skipped")
    print("\n--- Summary ---")
    print(f"Converted/would: {converted}")
    print(f"Skipped (already good): {skipped}")
    print("DONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
