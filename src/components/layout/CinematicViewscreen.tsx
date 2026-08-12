import React, { useState } from 'react';
import { FeatureFlags } from '../../config/featureFlags';
import './CinematicViewscreen.css';

interface CinematicViewscreenProps {
  /** Enemy portrait image path (fallback when no cutout exists). */
  enemyImage?: string;
  /**
   * Transparent enemy cutout sprite path (e.g. /assets/cutouts/enemy_cut_<id>.png).
   * When provided, rendered WITHOUT the all-edges fade mask so the
   * pre-isolated ninja composites cleanly against the background.
   * Chakra aura drop-shadow is applied to cutout sprites only.
   *
   * Path convention (Combat.tsx): portrait `/assets/enemies/enemy_<id>.png`
   * → cutout `/assets/cutouts/enemy_cut_<id>.png` via string replace.
   * Generic for any NEW enemy_* A3 adds — no per-id hardcodes.
   * Skips paths already under enemy_cut_ (no double rewrite).
   * onError falls back to portrait; missing cut file = portrait mask.
   */
  enemyCutout?: string;
  /** Location biome background — Lámina 1 (lejana, opaca).
   *  Path: /assets/locations/location_<biomeSlug>.png
   *  On load error the component falls back to the CSS gradient + scanlines. */
  backgroundImage?: string;
  /**
   * Optional Lámina 2 — middleground layer.
   * Path convention: /assets/lamina/lamina_mid_<biomeSlug>.png  (1024×576, semi-transparent PNG)
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
   * Path convention: /assets/lamina/lamina_fg_<biomeSlug>.png  (1024×576, semi-transparent PNG)
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
   * RGBA color string for the chakra aura drop-shadow applied to the enemy cutout sprite.
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
  /** Brief hit-flash juice on the enemy sprite when damage lands. */
  hitFlash?: boolean;
  /**
   * Darkest Dungeon-style intent label near the cutout (in addition to panel telegraph).
   * Pass enemy.intendedSkillName — compact chip only; omit when empty.
   */
  intentLabel?: string;
  /**
   * Optional: cutout is RGB with a solid black plate (not true RGBA).
   * Adds `.cinematic__enemy-sprite--black-key` (mix-blend-mode: lighten) so the
   * plate drops into dark scene layers. Prefer true-alpha cutouts; default false.
   */
  blackKey?: boolean;
}

/**
 * Instantly hide a failed layer before React re-renders — prevents one-frame
 * broken-image icon flash on 404 / decode errors (esp. mid/fg láminas).
 */
function hideFailedLayer(el: HTMLImageElement | null) {
  if (!el) return;
  el.style.opacity = '0';
  el.style.visibility = 'hidden';
}

/**
 * CinematicViewscreen — T-013 (parallax + CRT) atop T-014 v3
 *
 * Stage layout (bottom → top by z-index):
 *   0  – Biome background image (Lámina 1: slow parallax drift, object-cover)
 *   1  – Middleground image (Lámina 2: optional, medium drift, pixelated)
 *   2  – Dark gradient overlay (depth + bottom darkening)
 *   3  – Vignette (radial edge darkening)
 *  10  – Enemy sprite only (center-right focal foe; no player hero on stage)
 *        · --cutout variant: pre-isolated transparent PNG + chakra aura drop-shadow
 *        · --portrait variant: radial fade mask, no aura
 *  11  – Foreground image (Lámina 3: optional, faster drift, occludes enemy bottom)
 *  25  – Scanlines FX (sit above character sprites)
 *  26  – CRT frame (optional, controlled by FeatureFlags.ENABLE_CRT_OVERLAY)
 *        Spherical curvature illusion via inset box-shadow.
 *  30  – Floating enemy info panel (left overlay, above CRT overlay)
 *
 * Parallax: all three lámina images use ambient CSS animation (translateX loop,
 * different durations, NO JS). Disabled via @media (prefers-reduced-motion).
 *
 * CSS fallback cascade:
 *   - No backgroundImage  → CSS gradient shows through (T-014 default).
 *   - backgroundImage errors → same CSS gradient (onError hides img).
 *   - No midgroundImage / no foregroundImage → layers simply absent (no 404).
 *   - midgroundImage / foregroundImage errors → silently hidden.
 *   - Layers stay opacity:0 + visibility:hidden until onLoad (no broken-image flash).
 *   - Ready/error are path-gated (not useEffect) so path changes never flash
 *     a prior layer's --ready opacity for one paint.
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
  hitFlash = false,
  intentLabel,
  blackKey = false,
}) => {
  // Path-gated ready/error: only the path that loaded/failed counts.
  // Avoids one-frame flash when props change before useEffect can reset flags.
  const [bgReadyPath, setBgReadyPath] = useState<string | null>(null);
  const [bgErrorPath, setBgErrorPath] = useState<string | null>(null);
  const [midReadyPath, setMidReadyPath] = useState<string | null>(null);
  const [midErrorPath, setMidErrorPath] = useState<string | null>(null);
  const [fgReadyPath, setFgReadyPath] = useState<string | null>(null);
  const [fgErrorPath, setFgErrorPath] = useState<string | null>(null);
  const [cutoutReadyPath, setCutoutReadyPath] = useState<string | null>(null);
  const [cutoutErrorPath, setCutoutErrorPath] = useState<string | null>(null);

  const bgReady = Boolean(backgroundImage && bgReadyPath === backgroundImage);
  const bgError = Boolean(backgroundImage && bgErrorPath === backgroundImage);
  const midReady = Boolean(midgroundImage && midReadyPath === midgroundImage);
  const midError = Boolean(midgroundImage && midErrorPath === midgroundImage);
  const fgReady = Boolean(foregroundImage && fgReadyPath === foregroundImage);
  const fgError = Boolean(foregroundImage && fgErrorPath === foregroundImage);
  const cutoutReady = Boolean(enemyCutout && cutoutReadyPath === enemyCutout);
  const cutoutError = Boolean(enemyCutout && cutoutErrorPath === enemyCutout);

  // Decide which enemy source to use
  const useCutout = Boolean(enemyCutout && !cutoutError);
  const usePortrait = !useCutout && Boolean(enemyImage);

  // Build chakra aura style for cutout only
  const cutoutStyle: React.CSSProperties = useCutout && chakraAuraColor
    ? ({ '--chakra-aura': chakraAuraColor } as React.CSSProperties)
    : {};

  const showIntent = Boolean(intentLabel && intentLabel.trim());

  return (
    <div className="cinematic">
      {/* Layer 0: Location biome background — Lámina 1 (slow ambient parallax) */}
      {backgroundImage && !bgError && (
        <img
          key={`bg:${backgroundImage}`}
          src={backgroundImage}
          alt=""
          className={`cinematic__bg-img${bgReady ? ' cinematic__bg-img--ready' : ''}`}
          aria-hidden="true"
          decoding="async"
          onLoad={() => setBgReadyPath(backgroundImage)}
          onError={(e) => {
            hideFailedLayer(e.currentTarget);
            setBgErrorPath(backgroundImage);
          }}
        />
      )}

      {/* Layer 1: Middleground — Lámina 2 (optional; medium parallax drift) */}
      {midgroundImage && !midError && (
        <img
          key={`mid:${midgroundImage}`}
          src={midgroundImage}
          alt=""
          className={`cinematic__mid-img${midReady ? ' cinematic__mid-img--ready' : ''}`}
          aria-hidden="true"
          decoding="async"
          onLoad={() => setMidReadyPath(midgroundImage)}
          onError={(e) => {
            hideFailedLayer(e.currentTarget);
            setMidErrorPath(midgroundImage);
          }}
        />
      )}

      {/* Layer 2: Dark gradient overlay */}
      <div className="cinematic__gradient" aria-hidden="true" />

      {/* Layer 3: Vignette */}
      <div className="cinematic__vignette" aria-hidden="true" />

      {/* Layer 4: Mist floor — grounds the sole vertical (enemy) in fog */}
      <div className="cinematic__mist-floor" aria-hidden="true" />

      {/* Layer 10: Enemy stage subject — cutout preferred, portrait fallback */}
      <div
        className={`cinematic__enemy-stage${hitFlash ? ' cinematic__enemy-stage--hit' : ''}`}
        aria-hidden={!useCutout && !usePortrait}
      >
        {/* Ground shadow under foe — contact with mist floor */}
        {(useCutout || usePortrait) && (
          <div className="cinematic__enemy-shadow" aria-hidden="true" />
        )}

        {/* DD-style intent chip near cutout (panel telegraph remains primary) */}
        {showIntent && (
          <div
            className="cinematic__intent"
            role="status"
            aria-live="polite"
            aria-label={`Next action: ${intentLabel}`}
          >
            <span className="cinematic__intent-icon" aria-hidden="true">⚔</span>
            <span className="cinematic__intent-text">{intentLabel}</span>
          </div>
        )}

        {useCutout && (
          <img
            key={`cut:${enemyCutout}`}
            src={enemyCutout}
            alt="Enemy"
            className={[
              'cinematic__enemy-sprite',
              'cinematic__enemy-sprite--cutout',
              cutoutReady ? 'cinematic__enemy-sprite--ready' : '',
              blackKey ? 'cinematic__enemy-sprite--black-key' : '',
              hitFlash ? 'cinematic__enemy-sprite--hit' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={cutoutStyle}
            decoding="async"
            onLoad={() => setCutoutReadyPath(enemyCutout ?? null)}
            onError={(e) => {
              hideFailedLayer(e.currentTarget);
              setCutoutErrorPath(enemyCutout ?? null);
            }}
          />
        )}

        {usePortrait && (
          <img
            key={`por:${enemyImage}`}
            src={enemyImage}
            alt="Enemy"
            className={[
              'cinematic__enemy-sprite',
              'cinematic__enemy-sprite--portrait',
              hitFlash ? 'cinematic__enemy-sprite--hit' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            decoding="async"
          />
        )}
      </div>

      {/* Layer 11: Foreground — Lámina 3 (optional; faster drift; occludes enemy) */}
      {foregroundImage && !fgError && (
        <img
          key={`fg:${foregroundImage}`}
          src={foregroundImage}
          alt=""
          className={`cinematic__fg-img${fgReady ? ' cinematic__fg-img--ready' : ''}`}
          aria-hidden="true"
          decoding="async"
          onLoad={() => setFgReadyPath(foregroundImage)}
          onError={(e) => {
            hideFailedLayer(e.currentTarget);
            setFgErrorPath(foregroundImage);
          }}
        />
      )}

      {/* Layer 25: Scanlines FX (sit above sprites per TASK-R10) */}
      <div className="cinematic__scanlines" aria-hidden="true" />

      {/* Layer 26: CRT frame — spherical screen curvature (feature-flagged per TASK-R10) */}
      {FeatureFlags.ENABLE_CRT_OVERLAY && (
        <div className="cinematic__crt-frame" aria-hidden="true" />
      )}

      {/* Layer 30: Floating info panel — left overlay */}
      {floatingPanel && (
        <div className="cinematic__panel-slot" aria-label="Enemy information">
          {floatingPanel}
        </div>
      )}
    </div>
  );
};
