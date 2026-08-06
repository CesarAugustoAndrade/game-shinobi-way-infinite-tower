"""Verification script for component and artifact cutouts transparency and zero green spill."""
import numpy as np
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMP_CUT = ROOT / "public" / "assets" / "icons" / "components" / "cutouts"
ART_CUT = ROOT / "public" / "assets" / "icons" / "artifacts" / "cutouts"

def verify_cutouts():
    comp_files = sorted(COMP_CUT.glob("*.png"))
    art_files = sorted(ART_CUT.glob("*.png"))
    
    total = len(comp_files) + len(art_files)
    print(f"Auditing transparency & green spill for {total} item cutouts...")
    
    failures = []
    for p in comp_files + art_files:
        img = Image.open(p).convert("RGBA")
        arr = np.array(img)
        
        r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
        
        # Check green spill on visible pixels
        green_spill = (g > r) & (g > b) & (g > 100) & (a > 10)
        spill_count = int(np.count_nonzero(green_spill))
        
        # Check background pixels have zero RGB
        trans = (a < 5)
        bad_bg = (r[trans] > 0) | (g[trans] > 0) | (b[trans] > 0)
        bad_bg_count = int(np.count_nonzero(bad_bg))
        
        if spill_count > 0 or bad_bg_count > 0:
            failures.append((p.name, spill_count, bad_bg_count))
            
    if failures:
        print(f"FAILED: {len(failures)} assets have spill or unclean background!")
        for name, sp, bg in failures:
            print(f" - {name}: spill={sp}, bad_bg={bg}")
        exit(1)
    else:
        print(f"SUCCESS: All {total} item cutouts passed with 0 spill pixels and 100% clean RGBA background!")
        exit(0)

if __name__ == "__main__":
    verify_cutouts()
