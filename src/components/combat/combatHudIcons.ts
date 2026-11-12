import { EffectType } from '../../game/types';

const ROOT = '/assets/icons/combat';

const MARK_FILES = new Set([
  'bleed',
  'poison',
  'burn',
  'mud_wall_shield',
  'sand_shield',
  'counter_reflect',
  'rotation_reflect',
  'bound',
  'decoy',
  'mist',
  'substitution',
  'reanimation',
  'c4',
  'generic',
]);

const MARK_BLURB: Readonly<Record<string, string>> = {
  bleed: 'Physical DoT each turn.',
  poison: 'Poison DoT each turn.',
  burn: 'Fire DoT each turn.',
  mud_wall_shield: 'Absorbs incoming hits.',
  sand_shield: 'Absorbs incoming hits.',
  counter_reflect: 'Reflects the first melee hit.',
  rotation_reflect: 'Reflects the first offensive hit.',
  bound: 'Cannot voluntarily move.',
  decoy: 'Cuts the next incoming hit.',
  mist: 'Hidden in mist — incoming is cut.',
  substitution: 'Negates the first hit, then retreats.',
  reanimation: 'First lethal hit leaves 1 HP.',
  c4: 'Detonates at the next enemy turn.',
  stun: 'Skips the next action.',
};

const MARK_EMOJI: Readonly<Record<string, string>> = {
  bleed: '🩸',
  poison: '☠️',
  burn: '🔥',
  mud_wall_shield: '🧱',
  sand_shield: '🏜️',
  counter_reflect: '↩️',
  rotation_reflect: '🌀',
  bound: '🕸️',
  decoy: '👤',
  mist: '🌫️',
  substitution: '🪵',
  reanimation: '⚰️',
  c4: '💣',
  stun: '⚡',
  generic: '✴️',
};

const MODE_EMOJI: Readonly<Record<string, string>> = {
  byakugan: '👁️',
  sharingan_2: '🔴',
  sharingan_3: '🟥',
  curse_mark_1: '💜',
  curse_mark_2: '🖤',
  gate_of_life: '🟢',
  gate_of_limit: '💚',
  shadow_clone: '👥',
};

const STATUS_FILE: Readonly<Record<string, string>> = {
  [EffectType.STUN]: 'stun',
  [EffectType.SILENCE]: 'silence',
  [EffectType.CONFUSION]: 'confusion',
  [EffectType.SHIELD]: 'shield',
  [EffectType.REGEN]: 'regen',
  [EffectType.CURSE]: 'curse',
  [EffectType.DRAIN]: 'drain',
  [EffectType.INVULNERABILITY]: 'invuln',
  [EffectType.BUFF]: 'buff',
  [EffectType.DEBUFF]: 'debuff',
  [EffectType.HEAL]: 'heal',
  [EffectType.CHAKRA_DRAIN]: 'chakra_drain',
  [EffectType.CHAKRA_REGEN]: 'chakra_regen',
  [EffectType.DOT]: 'dot',
  [EffectType.REFLECTION]: 'reflect',
  [EffectType.BLEED]: 'bleed',
  [EffectType.BURN]: 'burn',
  [EffectType.POISON]: 'poison',
};

const STATUS_EMOJI: Readonly<Record<string, string>> = {
  [EffectType.STUN]: '⚡',
  [EffectType.SILENCE]: '🔇',
  [EffectType.CONFUSION]: '💫',
  [EffectType.SHIELD]: '🛡️',
  [EffectType.REGEN]: '💗',
  [EffectType.CURSE]: '💀',
  [EffectType.DRAIN]: '🔮',
  [EffectType.INVULNERABILITY]: '✨',
  [EffectType.BUFF]: '↑',
  [EffectType.DEBUFF]: '↓',
  [EffectType.HEAL]: '💚',
  [EffectType.CHAKRA_DRAIN]: '💧',
  [EffectType.CHAKRA_REGEN]: '🔋',
  [EffectType.DOT]: '🩸',
  [EffectType.REFLECTION]: '🪞',
  [EffectType.BLEED]: '🩸',
  [EffectType.BURN]: '🔥',
  [EffectType.POISON]: '☠️',
};

export function combatModeIconSrc(id: string): string {
  return `${ROOT}/modes/${id}.png`;
}

export function combatModeEmoji(id: string): string {
  return MODE_EMOJI[id] ?? '🌀';
}

export function combatMarkIconSrc(id: string): string {
  const key = MARK_FILES.has(id) ? id : 'generic';
  return `${ROOT}/marks/${key}.png`;
}

export function combatMarkEmoji(id: string): string {
  return MARK_EMOJI[id] ?? MARK_EMOJI.generic;
}

export function compactMarkBlurb(id: string): string {
  return MARK_BLURB[id] ?? 'Active mark.';
}

export function combatStatusIconSrc(type: EffectType | string): string {
  const key = String(type);
  if (key === EffectType.BLEED) return combatMarkIconSrc('bleed');
  if (key === EffectType.BURN) return combatMarkIconSrc('burn');
  if (key === EffectType.POISON) return combatMarkIconSrc('poison');
  const file = STATUS_FILE[key] ?? 'dot';
  return `${ROOT}/status/${file}.png`;
}

export function combatStatusEmoji(type: EffectType | string): string {
  return STATUS_EMOJI[String(type)] ?? '•';
}
