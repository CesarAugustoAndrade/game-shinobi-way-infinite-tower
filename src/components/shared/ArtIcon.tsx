/**
 * Shared art renderer for the central art registry (T-019 / A7a).
 * Tries image src → onError → emoji cascade.
 *
 * size="fill" — stretch into parent (item-tile__visual plate). Prefer for
 * loot / merchant / treasure cards so the asset IS the tile.
 *
 * Size classes are real BEM tokens in design-system (no Tailwind).
 */

import React, { useEffect, useState } from 'react';
import { ArtEntry, getArt } from '../../game/constants/artRegistry';

const SIZE_CLASS = {
  xs: 'art-icon art-icon--xs',
  sm: 'art-icon art-icon--sm',
  md: 'art-icon art-icon--md',
  lg: 'art-icon art-icon--lg',
  xl: 'art-icon art-icon--xl',
  /** Parent-sized — use inside .item-tile__visual */
  fill: 'art-icon art-icon--fill',
} as const;

export type ArtIconSize = keyof typeof SIZE_CLASS;

interface ArtIconProps {
  /** Registry key (`component:ninja_steel`) OR a pre-resolved ArtEntry. */
  artKey?: string;
  art?: ArtEntry;
  size?: ArtIconSize;
  className?: string;
  title?: string;
  /** Force emoji even if src exists (e.g. dense tooltips). */
  emojiOnly?: boolean;
}

const ArtIcon: React.FC<ArtIconProps> = ({
  artKey,
  art: artProp,
  size = 'md',
  className = '',
  title,
  emojiOnly = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const art = artProp ?? (artKey ? getArt(artKey) : { emoji: '❓' });
  const sizeClass = SIZE_CLASS[size];
  const label = title ?? art.label ?? art.emoji;
  const showImg = !emojiOnly && Boolean(art.src) && !imageError;
  const isFill = size === 'fill';
  // Reset sticky onError when the resolved asset changes (merchant preview / synth rows / toasts).
  const srcKey = art.src ?? '';
  const artIdentity = artKey ?? srcKey;

  useEffect(() => {
    setImageError(false);
  }, [artIdentity, srcKey]);

  const isCutout = Boolean(art.src?.endsWith('.png') || art.src?.includes('/cutouts/'));

  if (showImg && art.src) {
    return (
      <img
        key={artIdentity || srcKey}
        src={art.src}
        alt={label}
        title={label}
        className={`${sizeClass} ${isCutout ? 'art-icon--cutout' : ''} ${className}`.trim()}
        style={
          isFill
            ? { width: '100%', height: '100%', objectFit: isCutout ? 'contain' : 'cover' }
            : undefined
        }
        onError={() => setImageError(true)}
        draggable={false}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} art-icon--emoji ${className}`.trim()}
      title={label}
      role="img"
      aria-label={label}
    >
      {art.emoji || '?'}
    </span>
  );
};

export default ArtIcon;
