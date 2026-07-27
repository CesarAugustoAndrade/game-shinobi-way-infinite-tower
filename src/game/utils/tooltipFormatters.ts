import {
  EffectDefinition,
  EffectType,
  PrimaryStat,
  ElementType,
  Buff,
  PrimaryAttributes,
  DamageType,
  AttackMethod,
  DamageProperty,
} from '../types';

// ============================================================================
// STAT ABBREVIATIONS
// ============================================================================

export const formatScalingStat = (stat: PrimaryStat): string => {
  const names: Record<PrimaryStat, string> = {
    [PrimaryStat.WILLPOWER]: 'Willpower',
    [PrimaryStat.CHAKRA]: 'Chakra',
    [PrimaryStat.STRENGTH]: 'Strength',
    [PrimaryStat.SPIRIT]: 'Spirit',
    [PrimaryStat.INTELLIGENCE]: 'Intelligence',
    [PrimaryStat.CALMNESS]: 'Calmness',
    [PrimaryStat.SPEED]: 'Speed',
    [PrimaryStat.ACCURACY]: 'Accuracy',
    [PrimaryStat.DEXTERITY]: 'Dexterity',
  };
  return names[stat] || stat;
};

export const getStatColor = (stat: PrimaryStat): string => {
  const colors: Record<PrimaryStat, string> = {
    [PrimaryStat.WILLPOWER]: 'text-red-500',
    [PrimaryStat.CHAKRA]: 'text-blue-500',
    [PrimaryStat.STRENGTH]: 'text-orange-500',
    [PrimaryStat.SPIRIT]: 'text-purple-500',
    [PrimaryStat.INTELLIGENCE]: 'text-cyan-500',
    [PrimaryStat.CALMNESS]: 'text-indigo-500',
    [PrimaryStat.SPEED]: 'text-green-500',
    [PrimaryStat.ACCURACY]: 'text-yellow-500',
    [PrimaryStat.DEXTERITY]: 'text-pink-500',
  };
  return colors[stat] || 'text-zinc-400';
};

// ============================================================================
// ELEMENT COLORS
// ============================================================================

export const getElementColor = (element: ElementType): string => {
  const colors: Record<ElementType, string> = {
    [ElementType.FIRE]: 'text-red-500',
    [ElementType.WIND]: 'text-emerald-400',
    [ElementType.LIGHTNING]: 'text-yellow-400',
    [ElementType.EARTH]: 'text-amber-600',
    [ElementType.WATER]: 'text-blue-400',
    [ElementType.PHYSICAL]: 'text-orange-400',
    [ElementType.MENTAL]: 'text-purple-400',
  };
  return colors[element] || 'text-zinc-400';
};

// ============================================================================
// EFFECT COLORS & ICONS
// ============================================================================

export const getEffectColor = (type: EffectType): string => {
  const colors: Record<EffectType, string> = {
    [EffectType.STUN]: 'text-yellow-500',
    [EffectType.DOT]: 'text-red-400',
    [EffectType.BUFF]: 'text-green-400',
    [EffectType.DEBUFF]: 'text-red-500',
    [EffectType.HEAL]: 'text-green-500',
    [EffectType.DRAIN]: 'text-purple-500',
    [EffectType.CONFUSION]: 'text-pink-400',
    [EffectType.SILENCE]: 'text-gray-400',
    [EffectType.BLEED]: 'text-red-600',
    [EffectType.BURN]: 'text-orange-500',
    [EffectType.POISON]: 'text-green-600',
    [EffectType.CHAKRA_DRAIN]: 'text-blue-600',
    [EffectType.SHIELD]: 'text-cyan-400',
    [EffectType.INVULNERABILITY]: 'text-yellow-300',
    [EffectType.CURSE]: 'text-purple-600',
    [EffectType.REFLECTION]: 'text-cyan-300',
    [EffectType.REGEN]: 'text-green-300',
    [EffectType.CHAKRA_REGEN]: 'text-blue-300',
  };
  return colors[type] || 'text-zinc-400';
};

export const getEffectIcon = (type: EffectType): string => {
  const icons: Record<EffectType, string> = {
    [EffectType.STUN]: '⚡',
    [EffectType.DOT]: '🩸',
    [EffectType.BUFF]: '↑',
    [EffectType.DEBUFF]: '↓',
    [EffectType.HEAL]: '💚',
    [EffectType.DRAIN]: '🔮',
    [EffectType.CONFUSION]: '💫',
    [EffectType.SILENCE]: '🔇',
    [EffectType.BLEED]: '🩸',
    [EffectType.BURN]: '🔥',
    [EffectType.POISON]: '☠️',
    [EffectType.CHAKRA_DRAIN]: '💧',
    [EffectType.SHIELD]: '🛡️',
    [EffectType.INVULNERABILITY]: '✨',
    [EffectType.CURSE]: '💀',
    [EffectType.REFLECTION]: '🪞',
    [EffectType.REGEN]: '💗',
    [EffectType.CHAKRA_REGEN]: '🔋',
  };
  return icons[type] || '•';
};

// ============================================================================
// EFFECT DESCRIPTION FORMATTERS
// ============================================================================

export const formatEffectDescription = (effect: EffectDefinition): string => {
  const { type, value, duration, targetStat, chance } = effect;
  const chanceText = chance < 1 ? `${Math.round(chance * 100)}% ` : '';
  const durationText = duration > 0 ? ` for ${duration} turn${duration > 1 ? 's' : ''}` : '';

  switch (type) {
    case EffectType.STUN:
      return `${chanceText}Stun${durationText}`;
    case EffectType.DOT:
      return `${chanceText}${value} dmg/turn${durationText}`;
    case EffectType.BLEED:
      return `${chanceText}Bleed: ${value} dmg/turn${durationText}`;
    case EffectType.BURN:
      return `${chanceText}Burn: ${value} dmg/turn${durationText}`;
    case EffectType.POISON:
      return `${chanceText}Poison: ${value} dmg/turn${durationText}`;
    case EffectType.BUFF:
      return `${chanceText}+${Math.round((value || 0) * 100)}% ${formatScalingStat(targetStat!)}${durationText}`;
    case EffectType.DEBUFF:
      return `${chanceText}-${Math.round((value || 0) * 100)}% ${formatScalingStat(targetStat!)}${durationText}`;
    case EffectType.HEAL:
      return `${chanceText}Heal ${value} HP`;
    case EffectType.DRAIN:
      return `${chanceText}Drain ${value} HP`;
    case EffectType.CONFUSION:
      return `${chanceText}Confusion${durationText}`;
    case EffectType.SILENCE:
      return `${chanceText}Silence${durationText}`;
    case EffectType.CHAKRA_DRAIN:
      return `${chanceText}Drain ${value} Chakra/turn${durationText}`;
    case EffectType.SHIELD:
      return `${chanceText}Shield: absorbs ${value} damage${durationText}`;
    case EffectType.INVULNERABILITY:
      return `${chanceText}Invulnerable${durationText}`;
    case EffectType.CURSE:
      return `${chanceText}Curse: +${Math.round((value || 0) * 100)}% damage taken${durationText}`;
    case EffectType.REFLECTION:
      return `${chanceText}Reflect ${Math.round((value || 0) * 100)}% damage${durationText}`;
    case EffectType.REGEN:
      return `${chanceText}Regen ${value} HP/turn${durationText}`;
    default:
      return type;
  }
};

// Full buff description (for active buffs display)
export const getBuffDescription = (buff: Buff): string => {
  if (!buff?.effect) return buff?.name || 'An unknown mark lingers.';
  const { type, value, targetStat } = buff.effect;
  switch (type) {
    case EffectType.STUN:
      return 'Body locked — no actions this hold.';
    case EffectType.DOT:
    case EffectType.BLEED:
    case EffectType.BURN:
    case EffectType.POISON:
      return `${value} damage seeps in at the start of each turn.`;
    case EffectType.BUFF:
      return `${targetStat ? formatScalingStat(targetStat) : 'a stat'} raised by ${Math.round((value || 0) * 100)}%.`;
    case EffectType.DEBUFF:
      return `${targetStat ? formatScalingStat(targetStat) : 'a stat'} cut by ${Math.round((value || 0) * 100)}%.`;
    case EffectType.CONFUSION:
      return 'Mind frays — half the time you strike yourself.';
    case EffectType.SILENCE:
      return 'Chakra seals shut — only free techniques remain.';
    case EffectType.CHAKRA_DRAIN:
      return `${value} chakra bleeds away each turn.`;
    case EffectType.SHIELD:
      return `Next ${value} damage is swallowed by the barrier.`;
    case EffectType.INVULNERABILITY:
      return 'No steel or jutsu finds purchase.';
    case EffectType.REFLECTION:
      return `${Math.round((value || 0) * 100)}% of the blow returns to its sender.`;
    case EffectType.CURSE:
      return `Wounds deepen — +${Math.round((value || 0) * 100)}% damage taken.`;
    case EffectType.REGEN:
      return `${value} HP knits closed at the start of each turn.`;
    default:
      return buff.name;
  }
};

// ============================================================================
// ATTACK METHOD & DAMAGE PROPERTY FORMATTERS
// ============================================================================

export const formatAttackMethod = (method: AttackMethod): string => {
  return method;
};

export const getAttackMethodDescription = (method: AttackMethod): string => {
  switch (method) {
    case AttackMethod.MELEE:
      return 'Hit chance: Speed vs Speed';
    case AttackMethod.RANGED:
      return 'Hit chance: Accuracy vs Speed';
    case AttackMethod.AUTO:
      return 'Never misses';
    default:
      return '';
  }
};

export const formatDamageProperty = (property: DamageProperty): string => {
  return property;
};

export const getDamagePropertyDescription = (property: DamageProperty): string => {
  switch (property) {
    case DamageProperty.NORMAL:
      return 'Cut by flat and % defense';
    case DamageProperty.PIERCING:
      return 'Ignores flat defense';
    case DamageProperty.ARMOR_BREAK:
      return 'Ignores % defense';
    default:
      return '';
  }
};

export const getDamageTypeDescription = (type: DamageType): string => {
  switch (type) {
    case DamageType.PHYSICAL:
      return 'Held by physical defense (Strength)';
    case DamageType.ELEMENTAL:
      return 'Held by elemental defense (Spirit)';
    case DamageType.MENTAL:
      return 'Held by mental defense (Calmness)';
    case DamageType.TRUE:
      return 'Bypasses every defense';
    default:
      return '';
  }
};

// ============================================================================
// STAT RANK CALCULATIONS (from CharacterSelect)
// ============================================================================

export const getStatRank = (stats: PrimaryAttributes, keys: (keyof PrimaryAttributes)[]): string => {
  const average = keys.reduce((sum, key) => sum + stats[key], 0) / keys.length;
  if (average >= 22) return 'S';
  if (average >= 19) return 'A';
  if (average >= 16) return 'B';
  if (average >= 13) return 'C';
  return 'D';
};

export const getRankColor = (rank: string): string => {
  switch (rank) {
    case 'S': return 'text-red-500';
    case 'A': return 'text-orange-500';
    case 'B': return 'text-yellow-500';
    case 'C': return 'text-cyan-500';
    case 'D': return 'text-blue-500';
    default: return 'text-zinc-500';
  }
};

// Get all three category ranks for a character
export const getCategoryRanks = (stats: PrimaryAttributes) => {
  return {
    body: getStatRank(stats, ['strength', 'willpower', 'chakra']),
    mind: getStatRank(stats, ['spirit', 'intelligence', 'calmness']),
    technique: getStatRank(stats, ['speed', 'accuracy', 'dexterity']),
  };
};

// ============================================================================
// ITEM STAT FORMATTING
// ============================================================================

export const formatStatName = (key: string): string => {
  const names: Record<string, string> = {
    willpower: 'Willpower',
    chakra: 'Chakra',
    strength: 'Strength',
    spirit: 'Spirit',
    intelligence: 'Intelligence',
    calmness: 'Calmness',
    speed: 'Speed',
    accuracy: 'Accuracy',
    dexterity: 'Dexterity',
    flatHp: 'HP',
    flatChakra: 'Chakra',
    flatPhysicalDef: 'Physical Def',
    flatElementalDef: 'Elemental Def',
    flatMentalDef: 'Mental Def',
    percentPhysicalDef: 'Physical Def %',
    percentElementalDef: 'Elemental Def %',
    percentMentalDef: 'Mental Def %',
    critChance: 'Crit Chance',
    critDamage: 'Crit Damage',
  };
  return names[key] || key.toUpperCase();
};

// ============================================================================
// DETAILED EFFECT MECHANICS - For enhanced tooltips
// ============================================================================

export type EffectCategory = 'dot' | 'control' | 'defensive' | 'stat' | 'resource' | 'utility';

/**
 * Categorizes effects for UI grouping and styling
 */
export const getEffectCategory = (type: EffectType): EffectCategory => {
  switch (type) {
    case EffectType.DOT:
    case EffectType.BLEED:
    case EffectType.BURN:
    case EffectType.POISON:
      return 'dot';
    case EffectType.STUN:
    case EffectType.CONFUSION:
    case EffectType.SILENCE:
      return 'control';
    case EffectType.SHIELD:
    case EffectType.INVULNERABILITY:
    case EffectType.REFLECTION:
    case EffectType.REGEN:
      return 'defensive';
    case EffectType.BUFF:
    case EffectType.DEBUFF:
    case EffectType.CURSE:
      return 'stat';
    case EffectType.HEAL:
    case EffectType.DRAIN:
    case EffectType.CHAKRA_DRAIN:
    case EffectType.CHAKRA_REGEN:
      return 'resource';
    default:
      return 'utility';
  }
};

/**
 * Returns which defense stat mitigates a damage type
 */
export const getDamageTypeDefense = (damageType?: DamageType): string => {
  switch (damageType) {
    case DamageType.PHYSICAL:
      return 'Strength (Physical Defense)';
    case DamageType.ELEMENTAL:
      return 'Spirit (Elemental Defense)';
    case DamageType.MENTAL:
      return 'Calmness (Mental Defense)';
    case DamageType.TRUE:
      return 'None (True damage)';
    default:
      return 'Physical Defense';
  }
};

/**
 * Calculates total DoT damage over duration
 */
export const calculateDoTTotal = (value: number, duration: number): number => {
  return Math.floor(value * duration);
};

/**
 * Returns detailed mechanical breakdown for a buff/effect
 */
export const getDetailedEffectMechanics = (buff: Buff): string[] => {
  if (!buff?.effect) return ['Mark details unclear'];

  const { type, value, duration, targetStat, damageType, damageProperty } = buff.effect;
  const mechanics: string[] = [];

  switch (type) {
    case EffectType.DOT:
    case EffectType.BLEED:
    case EffectType.BURN:
    case EffectType.POISON:
      mechanics.push(`${value} damage each turn`);
      if (damageType) {
        mechanics.push(`${damageType} damage`);
        mechanics.push(`Held back by ${getDamageTypeDefense(damageType)}`);
      }
      if (duration > 0) {
        mechanics.push(`${calculateDoTTotal(value || 0, duration)} total over ${duration} turns`);
      }
      if (damageProperty === DamageProperty.PIERCING) {
        mechanics.push('Piercing — ignores flat defense');
      }
      break;

    case EffectType.STUN:
      mechanics.push('Skips the whole turn');
      mechanics.push('No skills, no early pass');
      break;

    case EffectType.CONFUSION:
      mechanics.push('50% chance to strike yourself');
      mechanics.push('Self-hit: half Strength');
      mechanics.push('Otherwise you act as normal');
      break;

    case EffectType.SILENCE:
      mechanics.push('No CP-cost skills');
      mechanics.push('Free techniques still open');
      mechanics.push('Basic strike remains');
      break;

    case EffectType.BUFF:
      mechanics.push(`+${Math.round((value || 0) * 100)}% ${targetStat ? formatScalingStat(targetStat) : 'stat'}`);
      mechanics.push('Stacks with gear and other marks');
      break;

    case EffectType.DEBUFF:
      mechanics.push(`-${Math.round((value || 0) * 100)}% ${targetStat ? formatScalingStat(targetStat) : 'stat'}`);
      mechanics.push('Effective stat floored at 1');
      break;

    case EffectType.SHIELD:
      mechanics.push(`Absorbs the next ${value} damage`);
      mechanics.push('Breaks before HP is touched');
      mechanics.push('Does not stack — replaces');
      break;

    case EffectType.INVULNERABILITY:
      mechanics.push('Blocks all incoming damage');
      mechanics.push('Even True damage fails');
      break;

    case EffectType.CURSE:
      mechanics.push(`+${Math.round((value || 0) * 100)}% damage taken`);
      mechanics.push('Amplifies every damage type');
      break;

    case EffectType.REFLECTION:
      mechanics.push(`Returns ${Math.round((value || 0) * 100)}% to the attacker`);
      mechanics.push('Resolved before shield absorbs');
      break;

    case EffectType.REGEN:
      mechanics.push(`+${value} HP per turn (start)`);
      if (duration > 0) {
        mechanics.push(`${calculateDoTTotal(value || 0, duration)} total over ${duration} turns`);
      }
      break;

    case EffectType.CHAKRA_DRAIN:
      mechanics.push(`-${value} CP per turn (start)`);
      mechanics.push('Cannot fall below 0');
      break;

    case EffectType.CHAKRA_REGEN:
      mechanics.push(`+${value} CP per turn (start)`);
      mechanics.push('Capped at max chakra');
      break;

    case EffectType.HEAL:
      mechanics.push(`Restores ${value} HP at once`);
      mechanics.push('Capped at max HP');
      break;

    case EffectType.DRAIN:
      mechanics.push(`Steals ${value} HP`);
      mechanics.push('Heals the attacker the same');
      break;

    default:
      mechanics.push('Effect unclear');
  }

  return mechanics;
};

/**
 * Returns strategic tips for countering or utilizing effects
 */
export const getEffectTip = (type: EffectType): string => {
  switch (type) {
    case EffectType.DOT:
    case EffectType.BLEED:
      return 'Steel defense softens the bleed.';
    case EffectType.BURN:
      return 'Spirit cools the flame.';
    case EffectType.POISON:
      return 'Poison slips past armor — deep HP buys time.';
    case EffectType.STUN:
      return 'Calmness steadies the body against seals.';
    case EffectType.CONFUSION:
      return 'Lower Strength means a gentler self-strike.';
    case EffectType.SILENCE:
      return 'Keep a free technique when seals close.';
    case EffectType.SHIELD:
      return 'The barrier also drinks DoT ticks.';
    case EffectType.INVULNERABILITY:
      return 'Ride it through the enemy’s burst.';
    case EffectType.CURSE:
      return 'Strip this first — every hit cuts deeper.';
    case EffectType.REFLECTION:
      return 'Foes pay for every swing they take.';
    case EffectType.REGEN:
      return 'High Willpower turns regen into a fortress.';
    case EffectType.BUFF:
    case EffectType.DEBUFF:
      return 'Some jutsu can stretch the mark’s life.';
    default:
      return '';
  }
};

/**
 * Returns the effect's severity level for UI styling
 */
export const getEffectSeverity = (buff: Buff): 'low' | 'medium' | 'high' | 'critical' => {
  if (!buff?.effect) return 'low';

  const { type, value, duration } = buff.effect;
  const category = getEffectCategory(type);

  // Control effects are always high severity
  if (category === 'control') {
    return type === EffectType.STUN ? 'critical' : 'high';
  }

  // DoTs scale by total damage
  if (category === 'dot') {
    const totalDmg = calculateDoTTotal(value || 0, duration);
    if (totalDmg >= 100) return 'critical';
    if (totalDmg >= 50) return 'high';
    if (totalDmg >= 25) return 'medium';
    return 'low';
  }

  // Curse is always high
  if (type === EffectType.CURSE) return 'high';

  // Defensive buffs
  if (category === 'defensive') {
    if (type === EffectType.INVULNERABILITY) return 'critical';
    return 'medium';
  }

  return 'low';
};

/**
 * Returns color class based on effect severity
 */
export const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (severity) {
    case 'critical': return 'text-red-400';
    case 'high': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-zinc-400';
  }
};

/**
 * Returns whether this effect is beneficial or harmful
 */
export const isPositiveEffect = (type: EffectType): boolean => {
  const positiveEffects = [
    EffectType.BUFF,
    EffectType.HEAL,
    EffectType.SHIELD,
    EffectType.INVULNERABILITY,
    EffectType.REFLECTION,
    EffectType.REGEN,
    EffectType.CHAKRA_REGEN,
  ];
  return positiveEffects.includes(type);
};
