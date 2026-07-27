import React, { useState } from 'react';
import './SceneBackdrop.css';

interface SceneBackdropProps {
  /**
   * Biome background image URL — e.g. /assets/location_mist_covered_bridge.png.
   * Falls back to the dark CSS gradient if absent or if the image fails to load.
   */
  background?: string;
  /**
   * Biome image opacity override (default 0.48 from CSS). Lower = darker scene.
   * Used by GameOver (0.20) to keep the death screen somber.
   */
  dim?: number;
  children: React.ReactNode;
}

/**
 * SceneBackdrop — shared atmospheric wrapper for economy/reward scenes.
 *
 * Mirrors the CinematicViewscreen layer stack (without enemy sprite):
 *   0  Biome background image  (object-cover, opacity 0 until ready → 0.48, slow drift)
 *   1  Dark gradient scrim     (top/bottom darkening)
 *   2  Vignette                (radial edge darkening)
 *   3  Scanlines               (subtle CRT visor chrome)
 *  10  Scene content           (children)
 *
 * Void/abyss CSS gradient always paints first — never bare parchment flash.
 * Parent App.tsx handles vertical scrolling for in-shell scenes.
 */
export const SceneBackdrop: React.FC<SceneBackdropProps> = ({ background, dim, children }) => {
  // Path-gated ready/error — avoids one-frame flash of a prior image's opacity
  // when the background URL changes (parity CinematicViewscreen).
  const [bgReadyPath, setBgReadyPath] = useState<string | null>(null);
  const [bgErrorPath, setBgErrorPath] = useState<string | null>(null);

  const bgReady = Boolean(background && bgReadyPath === background);
  const bgError = Boolean(background && bgErrorPath === background);
  const showBg = Boolean(background) && !bgError;

  return (
    <div className="scene-backdrop">
      {/* Layer 0: Biome background — opacity 0 until onLoad (void gradient under) */}
      {showBg && (
        <img
          key={`bg:${background}`}
          src={background}
          alt=""
          className={`scene-backdrop__bg${bgReady ? ' scene-backdrop__bg--ready' : ''}`}
          style={
            bgReady && dim !== undefined
              ? { opacity: dim }
              : undefined
          }
          aria-hidden="true"
          decoding="async"
          onLoad={() => setBgReadyPath(background!)}
          onError={() => setBgErrorPath(background!)}
        />
      )}

      {/* Layer 1: Gradient scrim */}
      <div className="scene-backdrop__gradient" aria-hidden="true" />

      {/* Layer 2: Vignette */}
      <div className="scene-backdrop__vignette" aria-hidden="true" />

      {/* Layer 3: Scanlines */}
      <div className="scene-backdrop__scanlines" aria-hidden="true" />

      {/* Layer 10: Scene content */}
      <div className="scene-backdrop__content">
        {children}
      </div>
    </div>
  );
};
