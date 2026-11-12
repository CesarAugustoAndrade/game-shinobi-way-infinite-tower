import React from 'react';

const TOKEN =
  /\b(stunned|stun|bleed|defense|defence|shield|absorb(?:s|ed)?|turns?|turnos?|turno|burn|poison|silence|heal|regen|drain|reflect(?:ion)?|curse|confusion|invulnerable|mode)\b/gi;

function classFor(word: string): string {
  const w = word.toLowerCase();
  if (w === 'stun' || w === 'stunned') return 'combat-tooltip__kw--stun';
  if (w === 'bleed') return 'combat-tooltip__kw--bleed';
  if (w.startsWith('turn')) return 'combat-tooltip__kw--turn';
  if (w === 'defense' || w === 'defence' || w === 'shield' || w.startsWith('absorb')) {
    return 'combat-tooltip__kw--def';
  }
  if (w === 'burn') return 'combat-tooltip__kw--burn';
  if (w === 'poison') return 'combat-tooltip__kw--poison';
  if (w === 'silence') return 'combat-tooltip__kw--silence';
  if (w === 'heal' || w === 'regen') return 'combat-tooltip__kw--heal';
  if (w === 'drain') return 'combat-tooltip__kw--drain';
  if (w.startsWith('reflect')) return 'combat-tooltip__kw--reflect';
  if (w === 'curse') return 'combat-tooltip__kw--curse';
  if (w === 'confusion') return 'combat-tooltip__kw--confuse';
  if (w === 'invulnerable') return 'combat-tooltip__kw--invuln';
  if (w === 'mode') return 'combat-tooltip__kw--mode';
  return 'combat-tooltip__kw';
}

/** First sentence(s), capped so the compact tooltip stays glanceable. */
export function compactSkillBlurb(text: string, max = 168): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const stop = slice.lastIndexOf('. ');
  if (stop >= 48) return slice.slice(0, stop + 1);
  return `${slice.trimEnd()}…`;
}

/** Wrap stun / bleed / turns / defense (and kin) in color spans. */
export function highlightSkillKeywords(text: string): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(TOKEN)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    const word = match[0];
    parts.push(
      <span key={i} className={classFor(word)}>
        {word}
      </span>,
    );
    i += 1;
    last = idx + word.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
