import React, { useState } from 'react';
import './CinematicViewscreen.css';

interface CinematicViewscreenProps {
  /** Enemy portrait image path (fallback when no cutout exists). */
  enemyImage?: string;
  /**
   * Transparent enemy cutout sprite path (e.g. /assets/enemy_cut_<id>.png).
   * When provided, rendered WITHOUT the all-edges fade mask so the
   * pre-isolated ninja composites cleanly against the background.
   */
  enemyCutout?: string;
  /** Location biome background path (e.g. /assets/location_misty_covered_bridge.png).
   *  On load error the component falls back to the CSS gradient + scanlines. */
  backgroundImage?: string;
  /**
   * Floating info panel rendered overlaid on the LEFT of the stage.
   * Built in Combat.tsx with enemy name, stats, status effects, and HP bar.
   */
  floatingPanel?: React.ReactNode;
}

/**
 * CinematicViewscreen — T-014 v3
 *
 * Stage layout (bottom → top by z-index):
 *   0 – Biome background image (object-cover, opacity 0.42, no blur)
 *   1 – Dark gradient overlay (depth + bottom darkening)
 *   2 – Vignette (radial edge darkening)
 *   3 – Scanlines FX (always visible; doubles as fallback texture)
 *   4 – Enemy portrait — RIGHT-anchored, bottom-anchored, NO card frame.
 *       If enemyCutout is provided: rendered without mask (pre-isolated sprite).
 *       Otherwise: enemyImage with all-edges radial mask for scene blend.
 *   5 – Floating enemy info panel — LEFT-anchored overlay.
 *
 * CSS fallback: when backgroundImage is absent or errors, .cinematic's
 * own `background: linear-gradient(#0c0e1a, #05070c)` shows through.
 */
export const CinematicViewscreen: React.FC<CinematicViewscreenProps> = ({
  enemyImage,
  enemyCutout,
  backgroundImage,
  floatingPanel,
}) => {
  const [bgError, setBgError] = useState(false);
  const [cutoutError, setCutoutError] = useState(false);

  // Decide which enemy source to use
  const useCutout = enemyCutout && !cutoutError;
  const usePortrait = !useCutout && enemyImage;

  return (
    <div className="cinematic">
      {/* Layer 0: Location biome background */}
      {backgroundImage && !bgError && (
        <img
          src={backgroundImage}
          alt=""
          className="cinematic__bg-img"
          aria-hidden="true"
          onError={() => setBgError(true)}
        />
      )}

      {/* Layer 1: Dark gradient overlay */}
      <div className="cinematic__gradient" aria-hidden="true" />

      {/* Layer 2: Vignette */}
      <div className="cinematic__vignette" aria-hidden="true" />

      {/* Layer 3: Scanlines FX */}
      <div className="cinematic__scanlines" aria-hidden="true" />

      {/* Layer 4a: Transparent cutout sprite — no mask, right-anchored, bottom */}
      {useCutout && (
        <img
          src={enemyCutout}
          alt="Enemy"
          className="cinematic__enemy-sprite cinematic__enemy-sprite--cutout"
          onError={() => setCutoutError(true)}
        />
      )}

      {/* Layer 4b: Portrait with all-edges blend mask — right-anchored, bottom */}
      {usePortrait && (
        <img
          src={enemyImage}
          alt="Enemy"
          className="cinematic__enemy-sprite cinematic__enemy-sprite--portrait"
        />
      )}

      {/* Layer 5: Floating info panel — left overlay */}
      {floatingPanel && (
        <div className="cinematic__panel-slot" aria-label="Enemy information">
          {floatingPanel}
        </div>
      )}
    </div>
  );
};
