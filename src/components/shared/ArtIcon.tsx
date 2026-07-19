/**
 * Shared art renderer for the central art registry (T-019).
 * Tries image src → onError → emoji cascade.
 */

import React, { useState } from 'react';
import { ArtEntry, getArt } from '../../game/constants/artRegistry';

const SIZE_CLASS = {
  xs: { img: 'w-4 h-4', text: 'text-sm' },
  sm: { img: 'w-5 h-5', text: 'text-base' },
  md: { img: 'w-8 h-8', text: 'text-2xl' },
  lg: { img: 'w-12 h-12', text: 'text-4xl' },
  xl: { img: 'w-16 h-16', text: 'text-5xl' },
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
  const sizeCfg = SIZE_CLASS[size];
  const label = title ?? art.label ?? art.emoji;
  const showImg = !emojiOnly && Boolean(art.src) && !imageError;

  if (showImg && art.src) {
    return (
      <img
        src={art.src}
        alt={label}
        title={label}
        className={`${sizeCfg.img} object-contain image-pixelated ${className}`.trim()}
        style={{ imageRendering: 'pixelated' }}
        onError={() => setImageError(true)}
        draggable={false}
      />
    );
  }

  return (
    <span
      className={`${sizeCfg.text} leading-none select-none ${className}`.trim()}
      title={label}
      role="img"
      aria-label={label}
    >
      {art.emoji || '?'}
    </span>
  );
};

export default ArtIcon;
