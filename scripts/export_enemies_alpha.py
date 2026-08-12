"""Create 'enemies' folder and process all 44 enemy portraits into true RGBA alpha transparent assets."""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image
import numpy as np
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
ENEMIES_SRC = ROOT / "public" / "assets" / "enemies"
ENEMIES_DST_ROOT = ROOT / "enemies"
ENEMIES_DST_PUBLIC = ROOT / "public" / "enemies"

spec = importlib.util.spec_from_file_location("ck", ROOT / "scripts" / "chroma_key_enemy.py")
ck = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ck)

spec_clean = importlib.util.spec_from_file_location("clean", ROOT / "scripts" / "clean_enemy_cutout_green.py")
clean = importlib.util.module_from_spec(spec_clean)
spec_clean.loader.exec_module(clean)


def process_all():
    ENEMIES_DST_ROOT.mkdir(parents=True, exist_ok=True)
    ENEMIES_DST_PUBLIC.mkdir(parents=True, exist_ok=True)

    portraits = sorted(ENEMIES_SRC.glob("enemy_*.png"))
    print(f"Found {len(portraits)} enemy portraits to process into alpha real assets.")

    results = []
    for portrait in portraits:
        key = clean.detect_key(portrait)
        dst_name = portrait.name  # enemy_name.png
        cutout_name = portrait.name.replace("enemy_", "enemy_cut_", 1)
        
        dst_root_file = ENEMIES_DST_ROOT / dst_name
        dst_public_file = ENEMIES_DST_PUBLIC / dst_name

        # Process chroma key into RGBA
        ck.chroma_key(portrait, dst_root_file, key)
        arr = np.asarray(Image.open(dst_root_file).convert("RGBA"))
        cleaned = clean.light_despill(arr, key)
        
        img = Image.fromarray(cleaned, "RGBA")
        img.save(dst_root_file)
        img.save(dst_public_file)

        # Also save cutout_name variant in both folders for compatibility
        cut_root_file = ENEMIES_DST_ROOT / cutout_name
        cut_public_file = ENEMIES_DST_PUBLIC / cutout_name
        img.save(cut_root_file)
        img.save(cut_public_file)

        # Verify RGBA alpha quality
        st = clean.stats(dst_root_file, key)
        rgba = np.asarray(img)
        trans_ratio = float((rgba[:, :, 3] < 10).mean())
        opaque_ratio = float((rgba[:, :, 3] > 200).mean())
        
        is_alpha_real = trans_ratio > 0.10 and opaque_ratio > 0.10
        status = "OK (Alpha Real)" if is_alpha_real else "WARN (Low Trans/Opaque)"
        
        results.append({
            "file": dst_name,
            "key": key,
            "transparency": f"{trans_ratio * 100:.1f}%",
            "opacity": f"{opaque_ratio * 100:.1f}%",
            "status": status
        })
        print(f"[{status}] {dst_name}: key={key}, trans={trans_ratio*100:.1f}%, opaque={opaque_ratio*100:.1f}%")

    print("\nSummary:")
    print(f"Successfully processed {len(results)} enemy assets with real RGBA alpha transparency into:")
    print(f" - {ENEMIES_DST_ROOT}")
    print(f" - {ENEMIES_DST_PUBLIC}")

if __name__ == "__main__":
    process_all()
