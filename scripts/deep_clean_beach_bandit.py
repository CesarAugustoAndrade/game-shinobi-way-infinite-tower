"""Deep clean green fringe, green spill, and green dots from enemy_beach_bandit.png."""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC_FLAT = ROOT / "public" / "assets" / "enemies" / "enemy_beach_bandit.png"

def deep_clean_green(rgba_arr: np.ndarray) -> np.ndarray:
    arr = rgba_arr.copy().astype(np.float32)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]

    max_rb = np.maximum(r, b)
    g_excess = g - max_rb

    # 1. Pure & semi-pure green screen background pixels -> alpha 0
    green_bg = (g > 100) & (g_excess > 15) & (r < 150) & (b < 150)
    green_bg = green_bg | ((g > 140) & (g > r + 25) & (g > b + 25))
    green_bg = green_bg | ((g > 80) & (g_excess > 25) & (r < 110) & (b < 110))
    a[green_bg] = 0.0

    # 2. Edge fringe cleaning (aggressive alpha erosion on green edges)
    edge_green = (a > 0) & (a < 255) & (g_excess > 5) & (r < 140) & (b < 140)
    a[edge_green] = np.clip(a[edge_green] - g_excess[edge_green] * 5.0, 0, 255)

    # 3. Total Green Despill: Mutate green channel directly so NO visible pixel has g > max(r,b)
    visible = a > 5
    g_excess_vis = g - max_rb
    despill = visible & (g_excess_vis > 0)
    
    # Cap green channel to max(r, b) for any pixel with excess green
    arr[:, :, 1] = np.where(despill, max_rb, g)

    # 4. Zero RGB for transparent background
    fully_trans = a < 5
    arr[fully_trans, 0] = 0.0
    arr[fully_trans, 1] = 0.0
    arr[fully_trans, 2] = 0.0
    arr[fully_trans, 3] = 0.0

    return np.clip(arr, 0, 255).astype(np.uint8)

def main():
    img_flat = Image.open(SRC_FLAT).convert("RGBA")
    flat_arr = np.asarray(img_flat)
    cleaned_arr = deep_clean_green(flat_arr)
    
    out_img = Image.fromarray(cleaned_arr, "RGBA")
    
    destinations = [
        ROOT / "public" / "assets" / "cutouts" / "enemy_cut_beach_bandit.png",
        ROOT / "enemies" / "enemy_beach_bandit.png",
        ROOT / "enemies" / "enemy_cut_beach_bandit.png",
        ROOT / "public" / "enemies" / "enemy_beach_bandit.png",
        ROOT / "public" / "enemies" / "enemy_cut_beach_bandit.png",
        Path(r"C:\Users\PC\.gemini\antigravity-cli\brain\e79dff71-c1e6-49eb-8225-2b6a5388ce90\enemy_cut_beach_bandit.png")
    ]
    
    for dest in destinations:
        dest.parent.mkdir(parents=True, exist_ok=True)
        out_img.save(dest)
        print("Saved cleaned asset to:", dest)

    arr = np.asarray(out_img)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    spill = (a > 10) & (g > np.maximum(r, b))
    print("Remaining green spill pixels count:", spill.sum())

if __name__ == "__main__":
    main()
