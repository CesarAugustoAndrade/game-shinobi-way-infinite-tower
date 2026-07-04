import React, { useState } from 'react';
import { FeatureFlags } from '../../config/featureFlags';
import './CinematicViewscreen.css';

interface CinematicViewscreenProps {
  /** Enemy portrait image path (fallback when no cutout exists). */
  enemyImage?: string;
  /**
   * Transparent enemy cutout sprite path (e.g. /assets/enemy_cut_<id>.png).
   * When provided, rendered WITHOUT the all-edges fade mask so the
   * pre-isolated ninja composites cleanly against the background.
   * Chakra aura drop-shadow is applied to cutout sprites only.
   */
  enemyCutout?: string;
  /** Location biome background — Lámina 1 (lejana, opaca).
   *  Path: /assets/location_<biomeSlug>.png
   *  On load error the component falls back to the CSS gradient + scanlines. */
  backgroundImage?: string;
  /**
   * Optional Lámina 2 — middleground layer.
   * Path convention: /assets/lamina_mid_<biomeSlug>.png  (1024×576, semi-transparent PNG)
   * biomeSlug = getBiomeSlug(location.biome) from colorHelpers.
   * Rendered between background and gradient overlays with a medium parallax drift.
   * Silently hidden on load error; inert when prop is absent (no 404 emitted).
   *
   * ASSET PIPELINE: produce 1024×576 PNG with alpha, matching the background biome.
   * Example: lamina_mid_mist_covered_bridge.png — foreground trees, rocks with alpha.
   */
  midgroundImage?: string;
  /**
   * Optional Lámina 3 — foreground layer (occludes the enemy sprite, z 11).
   * Path convention: /assets/lamina_fg_<biomeSlug>.png  (1024×576, semi-transparent PNG)
   * biomeSlug = getBiomeSlug(location.biome) from colorHelpers.
   * Rendered in FRONT of the enemy for occlusion depth (rocks, foliage at bottom edges).
   * Silently hidden on load error; inert when prop is absent.
   *
   * ASSET PIPELINE: produce 1024×576 PNG with alpha; alpha-free edges cover the bottom
   * 20–30% of the frame and the side extremes. Central/upper area must remain transparent
   * so the enemy sprite is still visible.
   * Example: lamina_fg_mist_covered_bridge.png — bridge railings, mist wisps.
   */
  foregroundImage?: string;
  /**
   * RGBA color string for the chakra aura drop-shadow applied to the cutout sprite.
   * E.g. "rgba(239, 68, 68, 0.65)" for Fire affinity.
   * Derived in Combat.tsx from ELEMENT_COLORS[enemy.element].
   * Only applied when enemyCutout is active; ignored for portrait fallback.
   */
  chakraAuraColor?: string;
  /**
   * Floating info panel rendered overlaid on the LEFT of the stage.
   * Built in Combat.tsx with enemy name, stats, status effects, and HP bar.
   */
  floatingPanel?: React.ReactNode;
}

/**
 * CinematicViewscreen — T-013 (parallax + CRT) atop T-014 v3
 *
 * Stage layout (bottom → top by z-index):
 *   0  – Biome background image (Lámina 1: slow parallax drift, object-cover)
 *   1  – Middleground image (Lámina 2: optional, medium drift, pixelated)
 *   2  – Dark gradient overlay (depth + bottom darkening)
 *   3  – Vignette (radial edge darkening)
 *   4  – Scanlines FX (always visible)
 *   5  – CRT frame (optional, controlled by FeatureFlags.ENABLE_CRT_OVERLAY)
 *        Spherical curvature illusion via inset box-shadow.
 *  10  – Enemy sprite (right-anchored, bottom-anchored)
 *        · --cutout variant: pre-isolated transparent PNG + chakra aura drop-shadow
 *        · --portrait variant: radial fade mask, no aura
 *  11  – Foreground image (Lámina 3: optional, faster drift, occludes enemy bottom)
 *  20  – Floating enemy info panel (left overlay)
 *
 * Parallax: all three lámina images use ambient CSS animation (translateX loop,
 * different durations, NO JS). Disabled via @media (prefers-reduced-motion).
 *
 * CSS fallback cascade:
 *   - No backgroundImage  → CSS gradient shows through (T-014 default).
 *   - backgroundImage errors → same CSS gradient (onError hides img).
 *   - No midgroundImage / no foregroundImage → layers simply absent (no 404).
 *   - midgroundImage / foregroundImage errors → silently hidden.
 *   - enemyCutout errors → falls back to enemyImage portrait with mask.
 */
export const CinematicViewscreen: React.FC<CinematicViewscreenProps> = ({
  enemyImage,
  enemyCutout,
  backgroundImage,
  midgroundImage,
  foregroundImage,
  chakraAuraColor,
  floatingPanel,
}) => {
  const [bgError, setBgError] = useState(false);
  const [midError, setMidError] = useState(false);
  const [fgError, setFgError] = useState(false);
  const [cutoutError, setCutoutError] = useState(false);

  // Decide which enemy source to use
  const useCutout = enemyCutout && !cutoutError;
  const usePortrait = !useCutout && enemyImage;

  // Build chakra aura style for cutout only
  const cutoutStyle: React.CSSProperties = useCutout && chakraAuraColor
    ? ({ '--chakra-aura': chakraAuraColor } as React.CSSProperties)
    : {};

  return (
    <div className="cinematic">
      {/* Layer 0: Location biome background — Lámina 1 (slow ambient parallax) */}
      {backgroundImage && !bgError && (
        <img
          src={backgroundImage}
          alt=""
          className="cinematic__bg-img"
          aria-hidden="true"
          onError={() => setBgError(true)}
        />
      )}

      {/* Layer 1: Middleground — Lámina 2 (optional; medium parallax drift) */}
      {midgroundImage && !midError && (
        <img
          src={midgroundImage}
          alt=""
          className="cinematic__mid-img"
          aria-hidden="true"
          onError={() => setMidError(true)}
        />
      )}

      {/* Layer 2: Dark gradient overlay */}
      <div className="cinematic__gradient" aria-hidden="true" />

      {/* Layer 3: Vignette */}
      <div className="cinematic__vignette" aria-hidden="true" />

      {/* Layer 4: Scanlines FX */}
      <div className="cinematic__scanlines" aria-hidden="true" />

      {/* Layer 5: CRT frame — spherical screen curvature (feature-flagged) */}
      {FeatureFlags.ENABLE_CRT_OVERLAY && (
        <div className="cinematic__crt-frame" aria-hidden="true" />
      )}

      {/* Layer 10a: Transparent cutout sprite — no mask, right-anchored, bottom */}
      {useCutout && (
        <img
          src={enemyCutout}
          alt="Enemy"
          className="cinematic__enemy-sprite cinematic__enemy-sprite--cutout"
          style={cutoutStyle}
          onError={() => setCutoutError(true)}
        />
      )}

      {/* Layer 10b: Portrait with all-edges blend mask — right-anchored, bottom */}
      {usePortrait && (
        <img
          src={enemyImage}
          alt="Enemy"
          className="cinematic__enemy-sprite cinematic__enemy-sprite--portrait"
        />
      )}

      {/* Layer 11: Foreground — Lámina 3 (optional; faster drift; occludes enemy) */}
      {foregroundImage && !fgError && (
        <img
          src={foregroundImage}
          alt=""
          className="cinematic__fg-img"
          aria-hidden="true"
          onError={() => setFgError(true)}
        />
      )}

      {/* Layer 20: Floating info panel — left overlay */}
      {floatingPanel && (
        <div className="cinematic__panel-slot" aria-label="Enemy information">
          {floatingPanel}
        </div>
      )}
    </div>
  );
};
