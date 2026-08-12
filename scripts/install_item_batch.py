"""Install generated item plates: copy plate → chroma cutout PNG → composite JPG for registry."""
from __future__ import annotations
import json
import shutil
import sys
from pathlib import Path

from PIL import Image
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from chroma_key_enemy import chroma_key  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]

# Override via env or edit BATCH / SESSION_IMG per fire.
SESSION_IMG = Path(
    r"C:\Users\PC\.grok\sessions\C%3A%5CUsers%5CPC%5C.grok%5Cworktrees%5Cworkspace-shinobi-way-the-inifinite-tower%5Cimagine\019fd50a-4f94-7732-9ba8-fd0879d637f6\images"
)

# session file → (item_id, folder, key)
# folder: components | artifacts
# key: green | magenta
BATCH = {
    "1.jpg": ("infinite_chakra_core", "artifacts", "green"),
    "2.jpg": ("uzumaki_vitality", "artifacts", "green"),
    "3.jpg": ("sharingan_implant", "artifacts", "green"),
    "4.jpg": ("byakugan_awakening", "artifacts", "green"),
    "5.jpg": ("shadow_mastery", "artifacts", "green"),
    "6.jpg": ("adamantine_chains", "artifacts", "green"),
}


def composite_on_bg(cut_png: Path, jpg_out: Path, bg=(12, 12, 16)) -> None:
    im = Image.open(cut_png).convert("RGBA")
    base = Image.new("RGBA", im.size, (*bg, 255))
    composed = Image.alpha_composite(base, im).convert("RGB")
    composed.save(jpg_out, quality=92, optimize=True)


def residual_strict(cut_png: Path, key: str) -> int:
    arr = np.asarray(Image.open(cut_png).convert("RGBA")).astype(np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    if key == "magenta":
        residual = (a > 200) & (r > 180) & (b > 120) & (g < 100) & (r > g + 60)
    else:
        residual = (a > 200) & (g > 150) & (r < 80) & (b < 80)
    return int(np.sum(residual))


def main() -> None:
    plate_dir = ROOT / "todos" / "item-plates"
    plate_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for src_name, (item_id, folder, key) in BATCH.items():
        src = SESSION_IMG / src_name
        if not src.exists():
            results.append({"id": item_id, "error": f"missing {src}"})
            continue
        install_dir = ROOT / "public" / "assets" / "icons" / folder
        cut_dir = install_dir / "cutouts"
        install_dir.mkdir(parents=True, exist_ok=True)
        cut_dir.mkdir(parents=True, exist_ok=True)

        plate = plate_dir / f"{item_id}_plate.png"
        Image.open(src).convert("RGB").save(plate)
        cut = cut_dir / f"{item_id}.png"
        # Slightly tighter tol for maps with intentional green ink (tactical_scroll)
        tol = 55.0 if item_id == "tactical_scroll" else 70.0
        stats = chroma_key(plate, cut, key, tol=tol)
        residual = residual_strict(cut, key)
        jpg = install_dir / f"{item_id}.jpg"
        composite_on_bg(cut, jpg)
        cut_public = install_dir / f"{item_id}.png"
        shutil.copy2(cut, cut_public)
        results.append(
            {
                "id": item_id,
                "folder": folder,
                "key": key,
                "plate": str(plate.relative_to(ROOT)).replace("\\", "/"),
                "cutout": str(cut_public.relative_to(ROOT)).replace("\\", "/"),
                "jpg": str(jpg.relative_to(ROOT)).replace("\\", "/"),
                "residual_key": residual,
                **stats,
            }
        )
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
