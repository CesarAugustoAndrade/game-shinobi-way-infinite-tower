"""PIL audit: hero_cut_* and lamina_mid_/lamina_fg_ alpha quality."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
DIRS = [ROOT / "assets", ROOT / "public" / "assets"]
EDGE_PX = 3.0


def audit_rgba(path: Path) -> dict:
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)
    h, w = a.shape[:2]
    total = h * w
    alpha = a[:, :, 3]
    corners = {
        "TL": tuple(int(x) for x in a[0, 0]),
        "TR": tuple(int(x) for x in a[0, -1]),
        "BL": tuple(int(x) for x in a[-1, 0]),
        "BR": tuple(int(x) for x in a[-1, -1]),
    }
    a0 = float((alpha == 0).sum()) / total * 100
    residual = (
        (a[:, :, 0] <= 18)
        & (a[:, :, 1] <= 18)
        & (a[:, :, 2] <= 18)
        & (alpha > 240)
    )
    res_pct = float(residual.sum()) / total * 100
    opaque = alpha > 240
    res_of_opaque = float(residual.sum()) / max(int(opaque.sum()), 1) * 100

    dist = ndimage.distance_transform_edt(alpha > 0)
    ext_res = residual & (dist <= EDGE_PX)
    deep_res = residual & (dist > EDGE_PX)
    ext_pct = float(ext_res.sum()) / total * 100
    deep_pct = float(deep_res.sum()) / total * 100

    border = np.zeros((h, w), dtype=bool)
    border[:8, :] = True
    border[-8:, :] = True
    border[:, :8] = True
    border[:, -8:] = True
    border_res_pct = float((residual & border).sum()) / max(int(border.sum()), 1) * 100
    border_black_opq = float(
        (
            (a[:, :, 0] <= 18)
            & (a[:, :, 1] <= 18)
            & (a[:, :, 2] <= 18)
            & (alpha > 200)
            & border
        ).sum()
    ) / max(int(border.sum()), 1) * 100

    cy0, cy1 = int(h * 0.2), int(h * 0.7)
    cx0, cx1 = int(w * 0.35), int(w * 0.65)
    center = alpha[cy0:cy1, cx0:cx1]
    center_open = float((center < 30).mean() * 100)

    return {
        "size": (w, h),
        "corners": corners,
        "a0": a0,
        "residual": res_pct,
        "residual_of_opaque": res_of_opaque,
        "exterior_matte": ext_pct,
        "deep_matte": deep_pct,
        "mean_a": float(alpha.mean()),
        "border_matte": border_res_pct,
        "border_black_opq": border_black_opq,
        "center_open": center_open,
    }


def main() -> None:
    print("=== HERO_CUT AUDIT ===")
    print("(matte = RGB<=18 & A>240; exterior = matte within 3px of A==0; deep ≈ clothing)")
    for d in DIRS:
        files = sorted(d.glob("hero_cut_*.png"))
        print(f"\n--- {d.relative_to(ROOT)} ({len(files)}) ---")
        for f in files:
            m = audit_rgba(f)
            ca = {k: m["corners"][k][3] for k in m["corners"]}
            print(
                f"{f.name}  {m['size'][0]}x{m['size'][1]}  "
                f"A0={m['a0']:.2f}%  matte={m['residual']:.2f}%  "
                f"ext={m['exterior_matte']:.2f}%  deep={m['deep_matte']:.2f}%  "
                f"matte/opq={m['residual_of_opaque']:.2f}%  meanA={m['mean_a']:.1f}"
            )
            print(f"  corners A: {ca}")
            print(f"  corners RGBA: {m['corners']}")

    print("\n=== LAMINA AUDIT (public/assets) ===")
    d = ROOT / "public" / "assets"
    for kind in ("lamina_mid_", "lamina_fg_"):
        files = sorted(d.glob(f"{kind}*.png"))
        print(f"\n--- {kind}* ({len(files)}) ---")
        for f in files:
            m = audit_rgba(f)
            ca = {k: m["corners"][k][3] for k in m["corners"]}
            print(
                f"{f.name}  {m['size'][0]}x{m['size'][1]}  "
                f"A0={m['a0']:.1f}%  matte={m['residual']:.2f}%  "
                f"borderMatte={m['border_matte']:.1f}%  "
                f"borderBlackOpq={m['border_black_opq']:.1f}%  "
                f"centerOpen={m['center_open']:.1f}%  meanA={m['mean_a']:.0f}"
            )
            print(f"  corners A: {ca}  TL RGB={m['corners']['TL'][:3]}")


if __name__ == "__main__":
    main()
