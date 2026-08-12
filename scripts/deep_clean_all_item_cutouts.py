"""Deep clean green fringe, spill, and background artifacts from ALL component and artifact cutouts."""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
COMP_SRC = ROOT / "public" / "assets" / "icons" / "components"
ART_SRC = ROOT / "public" / "assets" / "icons" / "artifacts"
COMP_CUT = COMP_SRC / "cutouts"
ART_CUT = ART_SRC / "cutouts"
CUTOUTS_GLOBAL = ROOT / "public" / "assets" / "cutouts"

def deep_clean_image(img_path: Path) -> tuple[np.ndarray, dict]:
    img = Image.open(img_path).convert("RGBA")
    arr = np.asarray(img).copy().astype(np.float32)
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]

    max_rb = np.maximum(r, b)
    g_excess = g - max_rb

    # 1. Pure & semi-pure green screen background -> alpha 0
    green_bg = (g > 90) & (g_excess > 12) & (r < 160) & (b < 160)
    green_bg = green_bg | ((g > 130) & (g > r + 20) & (g > b + 20))
    green_bg = green_bg | ((g > 70) & (g_excess > 20) & (r < 120) & (b < 120))
    a[green_bg] = 0.0

    # 2. Edge fringe cleaning (aggressive alpha erosion on green edges)
    edge_green = (a > 0) & (a < 255) & (g_excess > 3) & (r < 150) & (b < 150)
    a[edge_green] = np.clip(a[edge_green] - g_excess[edge_green] * 5.0, 0, 255)

    # 3. Total Green Despill: Mutate green channel so no visible pixel has g > max(r,b)
    visible = a > 5
    g_excess_vis = g - max_rb
    despill = visible & (g_excess_vis > 0)
    arr[:, :, 1] = np.where(despill, max_rb, g)

    # 4. Zero RGB for transparent background (< 5 alpha)
    fully_trans = a < 5
    arr[fully_trans, 0] = 0.0
    arr[fully_trans, 1] = 0.0
    arr[fully_trans, 2] = 0.0
    arr[fully_trans, 3] = 0.0

    out_arr = np.clip(arr, 0, 255).astype(np.uint8)
    
    spill_count = int(((out_arr[:, :, 3] > 10) & (out_arr[:, :, 1] > np.maximum(out_arr[:, :, 0], out_arr[:, :, 2]))).sum())
    trans_ratio = float((out_arr[:, :, 3] < 10).mean())
    opaque_ratio = float((out_arr[:, :, 3] > 200).mean())

    stats = {
        "spill_count": spill_count,
        "trans_ratio": trans_ratio,
        "opaque_ratio": opaque_ratio
    }
    return out_arr, stats

def run_deep_clean():
    CUTOUTS_GLOBAL.mkdir(parents=True, exist_ok=True)
    
    comp_files = sorted(COMP_CUT.glob("*.png"))
    art_files = sorted(ART_CUT.glob("*.png"))
    
    print(f"Cleaning {len(comp_files)} components and {len(art_files)} artifacts...")
    
    count = 0
    for file_path in comp_files + art_files:
        cleaned_arr, stats = deep_clean_image(file_path)
        img = Image.fromarray(cleaned_arr, "RGBA")
        
        # Save back to cutouts dir
        img.save(file_path)
        
        # Also copy to global assets cutouts
        is_comp = file_path.parent == COMP_CUT
        prefix = "component_cut_" if is_comp else "artifact_cut_"
        global_target = CUTOUTS_GLOBAL / f"{prefix}{file_path.name}"
        img.save(global_target)
        
        count += 1
        print(f"[{count}] {file_path.name}: spill={stats['spill_count']}, trans={stats['trans_ratio']*100:.1f}%, opaque={stats['opaque_ratio']*100:.1f}%")

    print("\n--- COMPONENT & ARTIFACT CUTOUT DEEP CLEAN COMPLETE ---")

if __name__ == "__main__":
    run_deep_clean()
