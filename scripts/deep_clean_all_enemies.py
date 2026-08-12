"""Deep clean green/magenta fringe, spill, and dots from ALL 44 enemy assets one by one."""
from pathlib import Path
from PIL import Image
import numpy as np
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
ENEMIES_SRC = ROOT / "public" / "assets" / "enemies"
CUTOUTS_DIR = ROOT / "public" / "assets" / "cutouts"
ENEMIES_DST_ROOT = ROOT / "enemies"
ENEMIES_DST_PUBLIC = ROOT / "public" / "enemies"

spec_clean = importlib.util.spec_from_file_location("clean", ROOT / "scripts" / "clean_enemy_cutout_green.py")
clean = importlib.util.module_from_spec(spec_clean)
spec_clean.loader.exec_module(clean)

def deep_clean_single(portrait_path: Path, key: str) -> tuple[np.ndarray, dict]:
    img = Image.open(portrait_path).convert("RGBA")
    arr = np.asarray(img).copy().astype(np.float32)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]

    if key == "green":
        max_rb = np.maximum(r, b)
        g_excess = g - max_rb

        # 1. Pure & semi-pure green screen background -> alpha 0
        green_bg = (g > 100) & (g_excess > 15) & (r < 150) & (b < 150)
        green_bg = green_bg | ((g > 140) & (g > r + 25) & (g > b + 25))
        green_bg = green_bg | ((g > 80) & (g_excess > 25) & (r < 110) & (b < 110))
        a[green_bg] = 0.0

        # 2. Edge fringe cleaning (aggressive alpha erosion on green edges)
        edge_green = (a > 0) & (a < 255) & (g_excess > 5) & (r < 140) & (b < 140)
        a[edge_green] = np.clip(a[edge_green] - g_excess[edge_green] * 5.0, 0, 255)

        # 3. Total Green Despill: Mutate green channel so no visible pixel has g > max(r,b)
        visible = a > 5
        g_excess_vis = g - max_rb
        despill = visible & (g_excess_vis > 0)
        arr[:, :, 1] = np.where(despill, max_rb, g)

        # Spill count calculation
        spill_count = int(((a > 10) & (arr[:, :, 1] > np.maximum(r, b))).sum())

    else:
        # Magenta / Hot Pink key processing
        dist_m = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
        dist_hot = np.sqrt((r - 248) ** 2 + (g - 70) ** 2 + (b - 155) ** 2)
        mag_bg = (
            ((r > 160) & (b > 90) & (g < 140) & (r > g + 40) & ((r + b) > (1.5 * g + 100)))
            | (dist_m < 100)
            | (dist_hot < 95)
        )
        a[mag_bg] = 0.0

        # Edge erosion for magenta fringe
        edge_mag = (a > 0) & (a < 255) & (r > 150) & (b > 90) & (g < 140) & (r > g + 25)
        a[edge_mag] = np.clip(a[edge_mag] - (r[edge_mag] - g[edge_mag]) * 4.0, 0, 255)

        # Magenta despill
        visible = a > 5
        mag_spill = visible & (r > 160) & (b > 90) & (g < 140) & (r > g + 25)
        excess_r = np.maximum(0.0, r - g)
        excess_b = np.maximum(0.0, b - g)
        arr[:, :, 0] = np.where(mag_spill, np.clip(r - excess_r * 0.5, 0, 255), r)
        arr[:, :, 2] = np.where(mag_spill, np.clip(b - excess_b * 0.5, 0, 255), b)

        spill_count = int(((a > 10) & (arr[:, :, 0] > 180) & (arr[:, :, 2] > 120) & (g < 100) & (arr[:, :, 0] > g + 60)).sum())

    # Zero RGB for transparent background
    fully_trans = a < 5
    arr[fully_trans, 0] = 0.0
    arr[fully_trans, 1] = 0.0
    arr[fully_trans, 2] = 0.0
    arr[fully_trans, 3] = 0.0

    out_arr = np.clip(arr, 0, 255).astype(np.uint8)
    
    trans_ratio = float((out_arr[:, :, 3] < 10).mean())
    opaque_ratio = float((out_arr[:, :, 3] > 200).mean())

    stats_info = {
        "key": key,
        "spill_count": spill_count,
        "trans_ratio": trans_ratio,
        "opaque_ratio": opaque_ratio
    }
    return out_arr, stats_info

def deep_clean_all():
    portraits = sorted(ENEMIES_SRC.glob("enemy_*.png"))
    print(f"Starting Deep Clean one-by-one for all {len(portraits)} enemies...")
    
    ENEMIES_DST_ROOT.mkdir(parents=True, exist_ok=True)
    ENEMIES_DST_PUBLIC.mkdir(parents=True, exist_ok=True)
    CUTOUTS_DIR.mkdir(parents=True, exist_ok=True)

    summary = []
    for idx, portrait in enumerate(portraits, 1):
        key = clean.detect_key(portrait)
        cleaned_arr, st = deep_clean_single(portrait, key)
        img = Image.fromarray(cleaned_arr, "RGBA")

        enemy_filename = portrait.name # enemy_name.png
        cutout_filename = portrait.name.replace("enemy_", "enemy_cut_", 1)

        # Save to all destination locations
        dests = [
            CUTOUTS_DIR / cutout_filename,
            ENEMIES_DST_ROOT / enemy_filename,
            ENEMIES_DST_ROOT / cutout_filename,
            ENEMIES_DST_PUBLIC / enemy_filename,
            ENEMIES_DST_PUBLIC / cutout_filename,
        ]

        for dst in dests:
            img.save(dst)

        res_msg = f"[{idx}/{len(portraits)}] {enemy_filename}: key={key}, spill={st['spill_count']}, trans={st['trans_ratio']*100:.1f}%, opaque={st['opaque_ratio']*100:.1f}%"
        print(res_msg)
        summary.append(res_msg)

    print("\n--- DEEP CLEAN COMPLETE FOR ALL ENEMIES ---")
    print(f"Total processed: {len(summary)} enemies.")

if __name__ == "__main__":
    deep_clean_all()
