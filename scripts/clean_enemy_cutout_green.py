"""Detect chroma from portrait corners; re-key all cutouts correctly; zero green residual."""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image
import numpy as np
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
CUT = ROOT / "public" / "assets" / "cutouts"
FLAT = ROOT / "public" / "assets" / "enemies"

spec = importlib.util.spec_from_file_location("ck", ROOT / "scripts" / "chroma_key_enemy.py")
ck = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ck)


def detect_key(portrait: Path) -> str:
    a = np.asarray(Image.open(portrait).convert("RGB")).astype(float)
    h, w = a.shape[:2]
    corners = np.stack([a[8, 8], a[8, w - 9], a[h - 9, 8], a[h - 9, w - 9]])
    mean = corners.mean(axis=0)
    gexc = mean[1] - max(mean[0], mean[2])
    mexc = (mean[0] + mean[2]) / 2 - mean[1]
    # also max-corner based
    gexc_c = corners[:, 1] - np.maximum(corners[:, 0], corners[:, 2])
    mexc_c = (corners[:, 0] + corners[:, 2]) / 2 - corners[:, 1]
    if gexc_c.max() > 40:
        return "green"
    if mexc_c.max() > 40 and corners[int(np.argmax(mexc_c)), 0] > 140:
        return "magenta"
    if gexc > 30:
        return "green"
    if mexc > 30 and mean[0] > 140:
        return "magenta"
    return "green"


def light_despill(arr: np.ndarray, key: str) -> np.ndarray:
    a = arr.astype(np.float32)
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    if key == "green":
        green = (g > 150) & (r < 80) & (b < 80) & (g > r + 40) & (g > b + 40)
        al = np.where(green, 0.0, al)
        excess = g - np.maximum(r, b)
        edge = (al > 10) & (al < 250) & (excess > 20) & (r < 100) & (b < 100)
        g = np.where(edge, np.clip(g - excess * 0.75, 0, 255), g)
    else:
        # pure magenta + hot pink screens
        dist_m = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
        dist_hot = np.sqrt((r - 248) ** 2 + (g - 70) ** 2 + (b - 155) ** 2)
        mag = (
            ((r > 160) & (b > 90) & (g < 140) & (r > g + 40) & ((r + b) > (1.5 * g + 100)))
            | (dist_m < 100)
            | (dist_hot < 95)
        )
        al = np.where(mag, 0.0, al)
        edge = (al > 10) & (al < 250) & (r > 160) & (b > 90) & (g < 140) & (r > g + 30)
        excess_r = np.maximum(0, r - g)
        excess_b = np.maximum(0, b - g)
        r = np.where(edge, np.clip(r - excess_r * 0.4, 0, 255), r)
        b = np.where(edge, np.clip(b - excess_b * 0.4, 0, 255), b)

    fully = al < 5
    r = np.where(fully, 0, r)
    g = np.where(fully, 0, g)
    b = np.where(fully, 0, b)
    al = np.where(fully, 0, al)
    return np.stack([r, g, b, al], axis=2).astype(np.uint8)


def stats(path: Path, key: str) -> dict:
    a = np.asarray(Image.open(path).convert("RGBA"))
    r, g, b, al = a[:, :, 0].astype(np.int16), a[:, :, 1].astype(np.int16), a[:, :, 2].astype(np.int16), a[:, :, 3]
    res_g = int(((al > 40) & (g > 150) & (r < 80) & (b < 80)).sum())
    res_m = int(((al > 40) & (r > 180) & (b > 120) & (g < 100) & (r > g + 60)).sum())
    return {
        "res_g": res_g,
        "res_m": res_m,
        "opaque": float((al > 200).mean()),
        "key": key,
    }


def main():
    cmap = {}
    bads = []
    for cut in sorted(CUT.glob("enemy_cut_*.png")):
        portrait_id = "enemy_" + cut.name[len("enemy_cut_") : -4]
        portrait = FLAT / f"{portrait_id}.png"
        if not portrait.exists():
            print("MISSING", portrait_id)
            continue
        key = detect_key(portrait)
        cmap[portrait_id] = key
        ck.chroma_key(portrait, cut, key)
        arr = np.asarray(Image.open(cut).convert("RGBA"))
        cleaned = light_despill(arr, key)
        Image.fromarray(cleaned, "RGBA").save(cut)
        st = stats(cut, key)
        if key == "green":
            ok = st["res_g"] == 0 and st["opaque"] >= 0.15
        else:
            ok = st["res_m"] < 500 and st["res_g"] == 0 and st["opaque"] >= 0.15
        if not ok:
            bads.append(cut.name)
        print(
            f"{cut.name}: key={key} res_g={st['res_g']} res_m={st['res_m']} "
            f"opaque={st['opaque']:.3f} {'OK' if ok else 'BAD'}"
        )

    # write chroma map
    out = Path(r"C:\Users\PC\AppData\Local\Temp\grok-goal-8568f9f73d5d\implementer\chroma-map.json")
    if out.parent.exists():
        out.write_text(json.dumps(cmap, indent=2), encoding="utf-8")
    (ROOT / "public" / "assets" / "enemies" / "chroma-map.json").write_text(
        json.dumps(cmap, indent=2), encoding="utf-8"
    )
    print("---")
    print("BADS", bads)
    print("magenta keys", [k for k, v in cmap.items() if v == "magenta"])


if __name__ == "__main__":
    main()
