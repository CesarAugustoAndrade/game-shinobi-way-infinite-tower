import React, { useEffect, memo } from 'react';
import { DamageType, ElementType } from '../../game/types';
import './FloatingText.css';

export type FloatingTextType = 'damage' | 'crit' | 'heal' | 'miss' | 'block' | 'status' | 'chakra';

export interface FloatingTextItem {
  id: string;
  text: string;
  type: FloatingTextType;
  position: { x: number; y: number };
  /** Optional: color float by damage channel (Physical/Elemental/Mental/True). */
  damageType?: DamageType | string;
  /** Optional: element glow for elemental / themed hits. */
  element?: ElementType | string;
}

interface FloatingTextProps {
  id: string;
  value: string;
  type: FloatingTextType;
  position: { x: number; y: number };
  onComplete: (id: string) => void;
  damageType?: DamageType | string;
  element?: ElementType | string;
}

function damageTypeClass(damageType?: DamageType | string): string {
  if (!damageType) return '';
  const key = String(damageType).toLowerCase();
  switch (key) {
    case 'physical':
      return 'floating-text--dtype-physical';
    case 'elemental':
      return 'floating-text--dtype-elemental';
    case 'mental':
      return 'floating-text--dtype-mental';
    case 'true':
      return 'floating-text--dtype-true';
    default:
      return '';
  }
}

function elementClass(element?: ElementType | string): string {
  if (!element) return '';
  const key = String(element).toLowerCase();
  switch (key) {
    case 'fire':
      return 'floating-text--el-fire';
    case 'water':
      return 'floating-text--el-water';
    case 'lightning':
      return 'floating-text--el-lightning';
    case 'earth':
      return 'floating-text--el-earth';
    case 'wind':
      return 'floating-text--el-wind';
    case 'mental':
      return 'floating-text--el-mental';
    case 'physical':
      return 'floating-text--el-physical';
    default:
      return '';
  }
}

/** Stable tiny horizontal drift so multi-floats on the same target do not stack as one blob. */
function driftFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 37) - 18; // −18..+18 px
}

const FloatingText: React.FC<FloatingTextProps> = memo(
  ({ id, value, type, position, onComplete, damageType, element }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onComplete(id);
      }, 1200);

      return () => clearTimeout(timer);
    }, [id, onComplete]);

    const getPrefix = (): string => {
      switch (type) {
        case 'heal':
          return '+';
        case 'chakra':
          return '−';
        case 'block':
          return 'BLK ';
        case 'miss':
          return '';
        default:
          return '';
      }
    };

    // Damage channel recolor only on damage/crit — status/heal/miss keep their type tint.
    const applyDtype = type === 'damage' || type === 'crit';
    const isEvade = type === 'miss' && /evade/i.test(value);
    const classes = [
      'floating-text',
      `floating-text--${type}`,
      type === 'crit' ? 'floating-text--seal' : '',
      type === 'miss' ? 'floating-text--seal' : '',
      isEvade ? 'floating-text--evade' : '',
      applyDtype ? damageTypeClass(damageType) : '',
      applyDtype ? elementClass(element) : '',
    ]
      .filter(Boolean)
      .join(' ');

    const driftX = driftFromId(id);

    // Hit seals: CRIT / MISS / EVADE read as ink stamps (kanji + latin)
    let sealKanji: string | null = null;
    let sealWord: string | null = null;
    if (type === 'crit') {
      sealKanji = '必';
      sealWord = 'CRIT';
    } else if (type === 'miss') {
      if (isEvade) {
        sealKanji = '見';
        sealWord = 'EVADE';
      } else {
        sealKanji = '空';
        sealWord = 'MISS';
      }
    }

    return (
      <div
        className={classes}
        style={{
          left: position.x + driftX,
          top: position.y,
        }}
        aria-hidden="true"
      >
        {sealKanji && sealWord ? (
          <span className="floating-text__seal">
            {type === 'crit' && (
              <span className="floating-text__main">
                {getPrefix()}
                {value}
              </span>
            )}
            <span className="floating-text__stamp">
              <span className="floating-text__kanji">{sealKanji}</span>
              <span className="floating-text__word">{sealWord}</span>
            </span>
          </span>
        ) : (
          <>
            {getPrefix()}
            {value}
          </>
        )}
      </div>
    );
  },
);

FloatingText.displayName = 'FloatingText';

export default FloatingText;
