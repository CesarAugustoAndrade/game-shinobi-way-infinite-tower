import React, { useState } from 'react';
import './SceneBackdrop.css';

interface SceneBackdropProps {
  /**
   * Biome background image URL — e.g. /assets/location_mist_covered_bridge.png.
   * Falls back to the dark CSS gradient if absent or if the image fails to load.
   */
  background?: string;
  children: React.ReactNode;
}

/**
 * SceneBackdrop — shared atmospheric wrapper for economy/reward scenes.
 *
 * Mirrors the CinematicViewscreen layer stack (without enemy sprite):
 *   0  Biome background image  (object-cover, opacity 0.38)
 *   1  Dark gradient scrim     (top/bottom darkening)
 *   2  Vignette                (radial edge darkening)
 *   3  Scanlines               (subtle CRT texture)
 *  10  Scene content           (children)
 *
 * The root element fills the width of its flex parent (width: 100%) so the
 * biome image covers the full center-panel area, hiding the parchment panel
 * behind it.  The parent App.tsx container handles vertical scrolling.
 */
export const SceneBackdrop: React.FC<SceneBackdropProps> = ({ background, children }) => {
  const [bgError, setBgError] = useState(false);
  const showBg = Boolean(background) && !bgError;

  return (
    <div className="scene-backdrop">
      {/* Layer 0: Biome background */}
      {showBg && (
        <img
          src={background}
          alt=""
          className="scene-backdrop__bg"
          aria-hidden="true"
          onError={() => setBgError(true)}
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
