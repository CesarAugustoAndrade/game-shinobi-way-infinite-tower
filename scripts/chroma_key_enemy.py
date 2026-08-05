"""Green/magenta chroma key with interior hole-fill (all chroma pixels, not edge-only flood)."""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image
import numpy as np


def _chroma_mask(rgb: np.ndarray, key: str, tol: float) -> tuple[np.ndarray, np.ndarray]:
    """Return (hard_mask bool, soft_dist float) for key color."""
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    h, w = r.shape
    # bg estimate from corners (for dist)
    corners = np.stack(
        [
            rgb[4, 4],
            rgb[4, w - 5],
            rgb[h - 5, 4],
            rgb[h - 5, w - 5],
            rgb[4, w // 2],
            rgb[h - 5, w // 2],
            rgb[h // 2, 4],
            rgb[h // 2, w - 5],
        ]
    )
    if key == "magenta":
        scores = corners[:, 0] - corners[:, 1] + 0.3 * corners[:, 2]
        pure = np.array([255.0, 0.0, 255.0], dtype=np.float32)
        pure2 = np.array([248.0, 70.0, 155.0], dtype=np.float32)
        hard = (
            (r > 150)
            & (g < 150)
            & (b > 70)
            & (r > g + 40)
            & ((r + b) > (1.5 * g + 100))
        )
    else:
        scores = corners[:, 1] - np.maximum(corners[:, 0], corners[:, 2])
        pure = np.array([0.0, 255.0, 0.0], dtype=np.float32)
        pure2 = np.array([10.0, 180.0, 15.0], dtype=np.float32)
        # strict green screen + typical gen green (~0-20, 160-255, 0-30)
        hard = (g > 140) & (g > r + 40) & (g > b + 40) & (r < 100) & (b < 100)
        # also mid-green screens that are clearly key
        hard = hard | ((g > 160) & (g > r + 50) & (g > b + 50))

    order = np.argsort(-scores)[:4]
    bg_colors = corners[order]
    dist = np.full((h, w), 1e9, dtype=np.float32)
    for bg in bg_colors:
        d = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
        dist = np.minimum(dist, d)
    dist = np.minimum(dist, np.sqrt(((rgb - pure) ** 2).sum(axis=2)))
    dist = np.minimum(dist, np.sqrt(((rgb - pure2) ** 2).sum(axis=2)))
    hard = hard | (dist < tol)
    return hard, dist


def chroma_key(src: Path, dst: Path, key: str = "green", tol: float = 70.0) -> dict:
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im).astype(np.float32)
    rgb = arr[:, :, :3]
    hard, dist = _chroma_mask(rgb, key, tol)

    # ALL chroma pixels transparent (fills interior holes/islands)
    alpha = np.where(hard, 0.0, 255.0)

    # Soft fringe near chroma (not hard-masked)
    if key == "magenta":
        soft_cand = (
            (rgb[:, :, 0] > 120)
            & (rgb[:, :, 1] < 170)
            & (rgb[:, :, 2] > 60)
            & (rgb[:, :, 0] > rgb[:, :, 1] + 20)
        )
    else:
        r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
        soft_cand = (g > 100) & (g > r + 25) & (g > b + 25) & (r < 120) & (b < 120)
    fringe = (~hard) & soft_cand
    soft_a = np.clip((dist - 20.0) / 50.0, 0.0, 1.0) * 255.0
    alpha = np.where(fringe, np.minimum(alpha, soft_a), alpha)

    out = arr.copy()
    out[:, :, 3] = alpha

    # Despill edges
    edge = (alpha > 10) & (alpha < 240)
    r, g, b = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    if key == "green":
        excess = np.maximum(0, g - np.maximum(r, b))
        out[:, :, 1] = np.where(edge, np.clip(g - excess * 0.8, 0, 255), g)
    else:
        out[:, :, 0] = np.where(edge, np.clip(r - np.maximum(0, r - g) * 0.5, 0, 255), r)
        out[:, :, 2] = np.where(edge, np.clip(b - np.maximum(0, b - g) * 0.5, 0, 255), b)

    # Zero RGB on fully transparent for cleaner files
    fully = alpha < 5
    out[:, :, 0] = np.where(fully, 0, out[:, :, 0])
    out[:, :, 1] = np.where(fully, 0, out[:, :, 1])
    out[:, :, 2] = np.where(fully, 0, out[:, :, 2])

    Image.fromarray(out.astype(np.uint8), "RGBA").save(dst)

    transparent = int(np.sum(alpha < 10))
    opaque = int(np.sum(alpha > 200))
    total = int(alpha.size)
    # residual strict chroma opaque (pure key only — not skin/cloth browns)
    r2, g2, b2 = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    residual_green = (alpha > 200) & (g2 > 150) & (r2 < 80) & (b2 < 80)
    residual_magenta = (alpha > 200) & (r2 > 180) & (b2 > 120) & (g2 < 100) & (r2 > g2 + 60)
    residual = residual_green if key != "magenta" else residual_magenta
    return {
        "opaque": opaque,
        "transparent": transparent,
        "total": total,
        "trans_ratio": transparent / total,
        "residual_chroma_opaque": int(np.sum(residual)),
        "residual_green": int(np.sum(residual_green)),
        "residual_magenta": int(np.sum(residual_magenta)),
    }


if __name__ == "__main__":
    import sys

    print(json.dumps(chroma_key(Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3] if len(sys.argv) > 3 else "green")))
