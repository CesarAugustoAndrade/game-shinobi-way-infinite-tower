import {
  Skill,
  SkillTier,
  DamageType,
  DamageProperty,
  AttackMethod,
  ElementType,
  PrimaryStat,
  ActionType,
  EffectType,
  Posture,
  Clan,
  CardRole,
  SkillTag,
  CombatRange,
  MarkConsumeTiming,
  MarkFamily,
} from '../types';
import { SKILLS_COMBAT_V1_NEW } from './skillsCombatV1New';
import { MODE_FAMILY } from './modes';
import { defaultBaseWeight } from '../systems/CardContractSystem';

// ============================================================================
// SKILLS DATABASE (classic 116 + T-008 v1 twelve)
// ============================================================================
const SKILLS_CLASSIC: Record<string, Skill> = {
  // ==========================================
  // ACADEMY / BASIC UTILITY
  // ==========================================
  BASIC_ATTACK: {
    id: 'basic_atk',
    name: 'Taijutsu: Strike',
    tier: SkillTier.BASIC,
    description: 'A disciplined martial arts strike using raw physical power. Reliable and effective.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 12,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.15 },
  },

  HEAVY_KICK: {
    id: 'heavy_kick',
    name: 'Taijutsu: Heavy Kick',
    tier: SkillTier.BASIC,
    description: 'A committed rising kick. Hits harder when you lean Aggressive.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    baseDamage: 14,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.25 },
    stanceShift: Posture.AGGRESSIVE,
  },

  SHURIKEN: {
    id: 'shuriken',
    name: 'Ninja Tool: Shuriken',
    tier: SkillTier.BASIC,
    description: 'A swift throw of sharpened steel stars. Targets weak points for high critical chance.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    baseDamage: 11,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    critBonus: 25,
    stanceBonus: { posture: Posture.BALANCED, damageMultBonus: 0.1 },
  },

  MUD_WALL: {
    id: 'mud_wall',
    name: 'Mud Wall',
    tier: SkillTier.BASIC,
    description: 'Spits mud that hardens into a barricade. Creates a Shield.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    stanceShift: Posture.DEFENSIVE,
    stanceBonus: { posture: Posture.DEFENSIVE, apDiscount: 1 },
    chakraCost: 4,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.EARTH,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 1,
        [PrimaryStat.SPIRIT]: 1,
      },
    },
    effects: [{ type: EffectType.SHIELD, value: 40, duration: 3, chance: 1.0 }]
  },

  PHOENIX_FLOWER: {
    id: 'phoenix_flower',
    name: 'Phoenix Flower',
    tier: SkillTier.BASIC,
    description: 'Volleys of small fireballs. Chance to burn.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 14,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 1,
        [PrimaryStat.SPIRIT]: 1,
      },
    },
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.15 },
    effects: [{
      type: EffectType.BURN,
      value: 10,
      duration: 2,
      chance: 0.5,
      damageType: DamageType.ELEMENTAL,
      damageProperty: DamageProperty.NORMAL
    }]
  },

  KAWARIMI: {
    id: 'kawarimi',
    name: 'Body Replacement',
    tier: SkillTier.BASIC,
    description: 'Switch places with a log. The log absorbs damage while you reposition.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    stanceShift: Posture.DEFENSIVE,
    stanceBonus: { posture: Posture.DEFENSIVE, apDiscount: 1 },
    chakraCost: 3,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.SHIELD, value: 30, duration: 1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.3, duration: 2, chance: 1.0 }
    ]
  },

  BUNSHIN: {
    id: 'bunshin',
    name: 'Clone Technique',
    tier: SkillTier.BASIC,
    description: 'Creates illusory copies to distract the enemy. Slight Evasion boost.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 1,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.2, duration: 2, chance: 1.0 }]
  },

  HENGE: {
    id: 'henge',
    name: 'Transformation',
    tier: SkillTier.BASIC,
    description: 'Transform into an object or person for a surprise attack.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 1,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.25, duration: 2, chance: 1.0 }]
  },

  SHUNSHIN: {
    id: 'shunshin',
    name: 'Body Flicker',
    tier: SkillTier.BASIC,
    description: 'High-speed movement to close gaps. Greatly boosts Initiative.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 4,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.4, duration: 2, chance: 1.0 }]
  },

  KAI: {
    id: 'kai',
    name: 'Release',
    tier: SkillTier.BASIC,
    description: 'Disrupts chakra flow to break illusions. Boosts Genjutsu Resistance.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    stanceShift: Posture.BALANCED,  // releasing the technique re-centers your stance
    stanceBonus: { posture: Posture.BALANCED, apDiscount: 1 },
    chakraCost: 3,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.CALMNESS, value: 0.5, duration: 3, chance: 1.0 }]
  },

  // ==========================================
  // BASIC TIER - TAIJUTSU (NEW)
  // ==========================================
  LEAF_WHIRLWIND: {
    id: 'leaf_whirlwind',
    name: 'Leaf Whirlwind',
    tier: SkillTier.BASIC,
    description: 'A spinning kick that disrupts enemy accuracy.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 14,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.15, duration: 2, chance: 0.3 }]
  },

  DYNAMIC_ENTRY: {
    id: 'dynamic_entry',
    name: 'Dynamic Entry',
    tier: SkillTier.BASIC,
    description:
      'Flying kick legal at MEDIUM or CLOSE. After play, closes to CLOSE. Does not spend Gate charges.',
    actionType: ActionType.ACTIVE,
    cardRole: CardRole.SIDE_ATTACK,
    apCost: 2,
    stanceShift: Posture.AGGRESSIVE,  // committing rush drops you into an aggressive stance
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.2 },
    chakraCost: 0,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 14,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    critBonus: 20,
    allowedRanges: [CombatRange.MEDIUM, CombatRange.CLOSE],
    bandMove: { kind: 'SELF_APPROACH', steps: 1 },
  },

  RISING_WIND: {
    id: 'rising_wind',
    name: 'Leaf Rising Wind',
    tier: SkillTier.BASIC,
    description: 'An upward kick that sets up a follow-up attack.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 8,
    scalingPerPoint: 2,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.25, duration: 1, chance: 1.0 }]
  },

  STRONG_FIST: {
    id: 'strong_fist',
    name: 'Strong Fist Combo',
    tier: SkillTier.BASIC,
    description: 'A rapid two-hit combo at 75% damage each.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    baseDamage: 10,

    scalingPerPoint: 2,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL
  },

  SWEEPING_KICK: {
    id: 'sweeping_kick',
    name: 'Sweeping Kick',
    tier: SkillTier.BASIC,
    description: 'A low sweep with a chance to stun.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 7,
    scalingPerPoint: 2,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.4 }]
  },

  ELBOW_STRIKE: {
    id: 'elbow_strike',
    name: 'Elbow Strike',
    tier: SkillTier.BASIC,
    description: 'A close-range elbow strike that ignores flat defense.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    baseDamage: 8,
    scalingPerPoint: 2,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL
  },

  FEINT_STRIKE: {
    id: 'feint_strike',
    name: 'Feint Strike',
    tier: SkillTier.BASIC,
    description: 'A deceptive attack that cannot be evaded.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 7,
    scalingPerPoint: 1,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,  // Cannot be evaded
    element: ElementType.PHYSICAL
  },

  COUNTER_STANCE: {
    id: 'counter_stance',
    name: 'Counter Stance',
    tier: SkillTier.BASIC,
    description: 'Prepare to counter-attack if hit this turn.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    stanceShift: Posture.DEFENSIVE,
    chakraCost: 1,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 8,
    scalingPerPoint: 2,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.REFLECTION, value: 0.5, duration: 1, chance: 1.0 }]
  },

  DANCING_LEAF: {
    id: 'dancing_leaf',
    name: 'Shadow of Dancing Leaf',
    tier: SkillTier.BASIC,
    description: 'Position behind target for devastating follow-up.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 1,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.5, duration: 1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.3, duration: 1, chance: 1.0 }
    ]
  },

  FOCUSED_BREATHING: {
    id: 'focused_breathing',
    name: 'Focused Breathing',
    tier: SkillTier.BASIC,
    description: 'Regulate breathing to recover chakra.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    stanceShift: Posture.DEFENSIVE,  // centering your breathing eases you into a guard
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.CHAKRA_REGEN, value: 10, duration: 1, chance: 1.0 }]
  },

  // ==========================================
  // BASIC TIER - WEAPONS (NEW)
  // ==========================================
  KUNAI_SLASH: {
    id: 'kunai_slash',
    name: 'Kunai Slash',
    tier: SkillTier.BASIC,
    description: 'A quick slash with a kunai. Chance to cause bleeding.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    baseDamage: 8,
    scalingPerPoint: 2,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BLEED, value: 5, duration: 2, chance: 0.25, damageType: DamageType.PHYSICAL, damageProperty: DamageProperty.NORMAL }]
  },

  KUNAI_THROW: {
    id: 'kunai_throw',
    name: 'Kunai Throw',
    tier: SkillTier.BASIC,
    description: 'Throw a kunai at the enemy. Basic ranged attack.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    baseDamage: 7,
    scalingPerPoint: 2,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL
  },

  SHURIKEN_BARRAGE: {
    id: 'shuriken_barrage',
    name: 'Shuriken Barrage',
    tier: SkillTier.BASIC,
    description: 'Throw three shuriken at 40% damage each.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 1,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 6,

    scalingPerPoint: 1,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL
  },

  WINDMILL_SHURIKEN: {
    id: 'windmill_shuriken',
    name: 'Windmill Shuriken',
    tier: SkillTier.BASIC,
    description: 'A large shuriken that ignores shields with armor penetration.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 12,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    penetration: 0.2
  },

  SENBON: {
    id: 'senbon',
    name: 'Senbon Needle',
    tier: SkillTier.BASIC,
    description: 'A precise needle throw. High chance to silence.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    baseDamage: 7,
    scalingPerPoint: 1,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.SILENCE, duration: 1, chance: 0.5 }]
  },

  SENBON_RAIN: {
    id: 'senbon_rain',
    name: 'Senbon Rain',
    tier: SkillTier.BASIC,
    description: 'A barrage of poisoned needles. Five hits with poison chance.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 3,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 6,

    scalingPerPoint: 1,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.POISON, value: 5, duration: 3, chance: 0.2, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }]
  },

  EXPLOSIVE_TAG: {
    id: 'explosive_tag',
    name: 'Explosive Tag',
    tier: SkillTier.BASIC,
    description: 'Throw an explosive tag. Fire element damage.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 11,
    scalingPerPoint: 2,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE
  },

  EXPLOSIVE_BARRAGE: {
    id: 'explosive_barrage',
    name: 'Explosive Barrage',
    tier: SkillTier.BASIC,
    description: 'Multiple explosive tags that reduce enemy evasion.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 3,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 13,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE,
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.SPEED, value: 0.2, duration: 2, chance: 1.0 }]
  },

  SWORD_SLASH: {
    id: 'sword_slash',
    name: 'Sword Slash',
    tier: SkillTier.BASIC,
    description: 'A powerful sword strike with bleeding chance.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    baseDamage: 10,
    scalingPerPoint: 2,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BLEED, value: 7, duration: 2, chance: 0.3, damageType: DamageType.PHYSICAL, damageProperty: DamageProperty.NORMAL }]
  },

  IAIDO: {
    id: 'iaido',
    name: 'Iaido',
    tier: SkillTier.BASIC,
    description: 'A lightning-fast quick draw attack. +40% crit if first action.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.2 },
    chakraCost: 1,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 12,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    critBonus: 40
  },

  WIRE_SETUP: {
    id: 'wire_setup',
    name: 'Ninja Tool: Wire Trap',
    tier: SkillTier.BASIC,
    description: 'Set up wire traps. Next attack deals +20% damage and causes bleed.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    stanceShift: Posture.DEFENSIVE,
    chakraCost: 1,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.2, duration: 1, chance: 1.0 },
      { type: EffectType.BLEED, value: 8, duration: 2, chance: 0.4, damageType: DamageType.PHYSICAL, damageProperty: DamageProperty.NORMAL }
    ]
  },

  POISON_COAT: {
    id: 'poison_coat',
    name: 'Poison Coat',
    tier: SkillTier.BASIC,
    description: 'Coat weapon with poison. Next attack applies poison.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 1,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.POISON, value: 8, duration: 3, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }]
  },

  // ==========================================
  // BASIC TIER - ACADEMY UTILITY (NEW)
  // ==========================================
  SMOKE_BOMB: {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    tier: SkillTier.BASIC,
    description: 'Create a smoke screen for evasion boost and enemy accuracy reduction.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.35, duration: 2, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.2, duration: 2, chance: 1.0 }
    ]
  },

  FLASH_BOMB: {
    id: 'flash_bomb',
    name: 'Flash Bomb',
    tier: SkillTier.BASIC,
    description: 'Blind the enemy with a flash. Chance to reduce their accuracy.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.4, duration: 2, chance: 0.5 }]
  },

  ANALYZE: {
    id: 'analyze',
    name: 'Analyze Enemy',
    tier: SkillTier.BASIC,
    description: 'Study the enemy for weaknesses. Increases damage dealt.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    stanceShift: Posture.BALANCED,
    stanceBonus: { posture: Posture.BALANCED, apDiscount: 1 },
    chakraCost: 0,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.15, duration: 3, chance: 1.0 }]
  },

  BRACE: {
    id: 'brace',
    name: 'Brace',
    tier: SkillTier.BASIC,
    description: 'Prepare for impact. Gain +30% defense until next turn.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    stanceShift: Posture.DEFENSIVE,  // settling in to guard shifts you defensive
    stanceBonus: { posture: Posture.DEFENSIVE, apDiscount: 1 },
    chakraCost: 0,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.3, duration: 1, chance: 1.0 }]
  },

  CLOAK_INVIS: {
    id: 'cloak_invis',
    name: 'Cloak of Invisibility',
    tier: SkillTier.BASIC,
    description: 'Become nearly invisible. +60% evasion and next hit auto-crits.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 3,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.6, duration: 1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.5, duration: 1, chance: 1.0 }
    ]
  },

  BASIC_MEDICAL: {
    id: 'basic_medical',
    name: 'Basic Medical Jutsu',
    tier: SkillTier.BASIC,
    description: 'Heal wounds with medical chakra. Removes poison and bleeding.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    stanceShift: Posture.BALANCED,
    stanceBonus: { posture: Posture.BALANCED, apDiscount: 1 },
    chakraCost: 5,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.HEAL, value: 25, duration: 1, chance: 1.0 }]
  },

  // ==========================================
  // BASIC TIER - TOGGLE STANCES (NEW)
  // ==========================================
  FOCUSED_STANCE: {
    id: 'focused_stance',
    name: 'Focused Stance',
    tier: SkillTier.BASIC,
    description: 'A stance focused on precision. +20% ACC, +15% Crit.',
    actionType: ActionType.TOGGLE,
    apCost: 2,
    chakraCost: 3,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    isToggle: true,
    upkeepCost: 3,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.ACCURACY, value: 0.2, duration: -1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.15, duration: -1, chance: 1.0 }
    ]
  },

  DEFENSIVE_POSTURE: {
    id: 'defensive_posture',
    name: 'Defensive Posture',
    tier: SkillTier.BASIC,
    description: 'A defensive stance. +25% Defense, -15% Speed.',
    actionType: ActionType.TOGGLE,
    apCost: 2,
    chakraCost: 3,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    isToggle: true,
    upkeepCost: 3,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.25, duration: -1, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.SPEED, value: 0.15, duration: -1, chance: 1.0 }
    ]
  },

  AGGRESSIVE_STANCE: {
    id: 'aggressive_stance',
    name: 'Aggressive Stance',
    tier: SkillTier.BASIC,
    description: 'An offensive stance. +30% STR, -20% Defense.',
    actionType: ActionType.TOGGLE,
    apCost: 2,
    chakraCost: 3,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    isToggle: true,
    upkeepCost: 5,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.3, duration: -1, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.2, duration: -1, chance: 1.0 }
    ]
  },

  // ==========================================
  // BASIC TIER - PASSIVE ABILITIES (NEW)
  // ==========================================
  WEAPON_PROFICIENCY: {
    id: 'weapon_proficiency',
    name: 'Weapon Proficiency',
    tier: SkillTier.BASIC,
    description: '+10% weapon damage.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.DEXTERITY]: 1,
      },
    },
    passiveEffect: {
      damageBonus: 0.1
    }
  },

  TAIJUTSU_TRAINING: {
    id: 'taijutsu_training',
    name: 'Taijutsu Training',
    tier: SkillTier.BASIC,
    description: '+10% taijutsu damage.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.STRENGTH]: 1,
      },
    },
    passiveEffect: {
      damageBonus: 0.1
    }
  },

  QUICK_REFLEXES: {
    id: 'quick_reflexes',
    name: 'Quick Reflexes',
    tier: SkillTier.BASIC,
    description: '+5% Evasion.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.SPEED]: 1,
      },
    },
    passiveEffect: {
      statBonus: { speed: 1 }
    }
  },

  IRON_BODY: {
    id: 'iron_body',
    name: 'Iron Body',
    tier: SkillTier.BASIC,
    description: '+5% Defense (all types).',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.WILLPOWER]: 1,
        [PrimaryStat.STRENGTH]: 1,
      },
    },
    passiveEffect: {
      defenseBonus: 0.05
    }
  },

  CHAKRA_RESERVES: {
    id: 'chakra_reserves',
    name: 'Chakra Reserves',
    tier: SkillTier.BASIC,
    description: '+3 CP regen/turn.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.CHAKRA]: 1,
      },
    },
    passiveEffect: {
      regenBonus: { chakra: 3 }
    }
  },

  MENTAL_FORTITUDE: {
    id: 'mental_fortitude',
    name: 'Mental Fortitude',
    tier: SkillTier.BASIC,
    description: '+10% Genjutsu Resistance.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 1,
        [PrimaryStat.CALMNESS]: 1,
      },
    },
    passiveEffect: {
      statBonus: { calmness: 2 }
    }
  },

  PRECISION: {
    id: 'precision',
    name: 'Precision',
    tier: SkillTier.BASIC,
    description: '+5% Critical Chance.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.ACCURACY]: 1,
      },
    },
    passiveEffect: {
      statBonus: { accuracy: 1 }
    }
  },

  FIRE_AFFINITY: {
    id: 'fire_affinity',
    name: 'Fire Affinity',
    tier: SkillTier.BASIC,
    description: '+15% Fire damage.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.FIRE,
    requirements: { clan: Clan.UCHIHA },
    passiveEffect: {
      damageBonus: 0.15,
      damageBonusElement: ElementType.FIRE
    }
  },

  AIR_PALM: {
    id: 'air_palm',
    name: 'Air Palm',
    tier: SkillTier.ADVANCED,
    description:
      'Chip burst of Hyuga chakra. PUSH the foe 1 band after resolve. Each landed hit plants a Chakra Point (duration 2). Does not spend Byakugan charges.',
    actionType: ActionType.ACTIVE,
    cardRole: CardRole.SIDE_ATTACK,
    apCost: 2,
    chakraCost: 4,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 13,
    scalingPerPoint: 4,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WIND,
    markEffects: [
      {
        id: 'chakra_point',
        duration: 2,
        stacks: 1,
        consume: MarkConsumeTiming.IMPACT,
        perHit: true,
        family: MarkFamily.STAT,
      },
    ],
    bandMove: { kind: 'PUSH', steps: 1 },
    requirements: {
      stats: {
        [PrimaryStat.ACCURACY]: 2,
      },
      clan: Clan.HYUGA,
    },
  },

  // ==== RARE / ADVANCED ====
  RASENGAN: {
    id: 'rasengan',
    name: 'Rasengan',
    tier: SkillTier.ADVANCED,
    description:
      'A swirling sphere of pure wind chakra that grinds into the target. PIERCING. Base viable; with Shadow Clones ON: +50% damage and consume 1 charge at attempt.',
    actionType: ActionType.ACTIVE,
    cardRole: CardRole.ATTACK,
    modeInteraction: {
      modeId: 'shadow_clone',
      family: MODE_FAMILY.CLONES,
      consumeCharges: 1,
      damageMultBonus: 0.5,
    },
    apCost: 2,
    stanceShift: Posture.AGGRESSIVE,  // an all-in signature strike commits you to the offensive
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.2 },
    chakraCost: 7,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.PIERCING, // Ignores flat armor!
    attackMethod: AttackMethod.MELEE,
    element: ElementType.WIND,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [{
      type: EffectType.DEBUFF,
      targetStat: PrimaryStat.STRENGTH,
      value: 0.2,
      duration: 3,
      chance: 0.5
    }]
  },

  ADAMANTINE_CHAINS: {
    id: 'adamantine_chains',
    name: 'Adamantine Attacking Chains',
    tier: SkillTier.HIDDEN,
    description: 'Uzumaki sealing chains lash the target — physical damage plus a chance to bind and suppress chakra.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 20,
    scalingPerPoint: 7,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.CHAKRA]: 3,
        [PrimaryStat.INTELLIGENCE]: 3,
      },
    },
    stanceBonus: { posture: Posture.DEFENSIVE, damageMultBonus: 0.15 },
    effects: [
      { type: EffectType.STUN, duration: 1, chance: 0.35 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.CHAKRA, value: 0.2, duration: 2, chance: 0.6 },
    ],
  },

  FIREBALL: {
    id: 'fireball',
    name: 'Katon: Great Fireball',
    tier: SkillTier.ADVANCED,
    description: 'A massive, searing projectile of flame. Leaves the target burning.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    stanceShift: Posture.AGGRESSIVE,  // unleashing a fire nuke pushes you onto the attack
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.2 },
    chakraCost: 6,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [{
      type: EffectType.BURN,
      value: 15,
      duration: 3,
      chance: 0.8,
      damageType: DamageType.ELEMENTAL,
      damageProperty: DamageProperty.NORMAL
    }]
  },

  ROTATION: {
    id: 'kaiten',
    name: '8 Trigrams Rotation',
    tier: SkillTier.HIDDEN,
    description:
      'Requires Byakugan ON. Spend 1 charge to plant a self shield (50) and reflect (60%) for 1 duration. Does not deal damage.',
    actionType: ActionType.ACTIVE,
    cardRole: CardRole.SUPPORT,
    apCost: 1,
    stanceShift: Posture.DEFENSIVE,  // the spinning guard locks you into a defensive stance
    stanceBonus: { posture: Posture.DEFENSIVE, damageMultBonus: 0.15 },
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    modeInteraction: {
      modeId: 'byakugan',
      family: MODE_FAMILY.HYUGA,
      requireOn: true,
      consumeCharges: 1,
    },
    markEffects: [
      {
        id: 'rotation_shield',
        duration: 1,
        stacks: 50,
        family: MarkFamily.SHIELD,
        targetActor: 'self',
      },
      {
        id: 'rotation_reflect',
        duration: 1,
        stacks: 60,
        targetActor: 'self',
      },
    ],
    // Non-normative for pure resolve (SUPPORT does not apply effects[]).
    // Kept so getCardCategory still reads SHIELD/REFLECTION as defensive.
    effects: [
      { type: EffectType.REFLECTION, value: 0.6, duration: 1, chance: 1.0 },
      { type: EffectType.SHIELD, value: 50, duration: 1, chance: 1.0 },
    ],
    requirements: { clan: Clan.HYUGA },
  },

  BYAKUGAN: {
    id: 'byakugan',
    name: 'Byakugan',
    tier: SkillTier.HIDDEN,
    description:
      'Combat Mode: 4 charges. Activate 2 AP + 4 CP; upkeep 4 CP; CD 4. Hyuga identity — CP Marks and penetration routes. Range checked only on activate.',
    actionType: ActionType.TOGGLE,
    cardRole: CardRole.MODE,
    tags: [SkillTag.MODE, SkillTag.HYUGA],
    baseWeight: defaultBaseWeight(),
    apCost: 2,
    chakraCost: 4,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { clan: Clan.HYUGA },
    isToggle: true,
    upkeepCost: 4,
    modeInteraction: { modeId: 'byakugan', family: MODE_FAMILY.HYUGA },
    effects: [],
  },

  GENTLE_FIST: {
    id: 'gentle_fist',
    name: 'Gentle Fist',
    tier: SkillTier.ADVANCED,
    description: 'Precise strikes to chakra points. True damage + Chakra Drain.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 4,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 12,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.ACCURACY]: 2,
      },
    },
    effects: [{ type: EffectType.CHAKRA_DRAIN, value: 20, duration: 1, chance: 1.0 }]
  },

  SHARINGAN_2TOMOE: {
    id: 'sharingan_2',
    name: 'Sharingan (2-Tomoe)',
    tier: SkillTier.ADVANCED,
    description:
      'Combat Mode: 3 charges. Activate 2 AP + 4 CP; upkeep 4 CP; CD 4. Katon + lectura. Lateral to Sharingan 3-Tomoe transfers charges without refill.',
    actionType: ActionType.TOGGLE,
    cardRole: CardRole.MODE,
    tags: [SkillTag.MODE, SkillTag.NINJUTSU, SkillTag.UCHIHA, SkillTag.FIRE],
    baseWeight: defaultBaseWeight(),
    apCost: 2,
    chakraCost: 4,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.FIRE,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.CALMNESS]: 2,
      },
      clan: Clan.UCHIHA,
    },
    isToggle: true,
    upkeepCost: 4,
    modeInteraction: { modeId: 'sharingan_2', family: MODE_FAMILY.SHARINGAN },
    effects: [],
  },

  WATER_PRISON: {
    id: 'water_prison',
    name: 'Water Prison',
    tier: SkillTier.ADVANCED,
    description: 'Traps the enemy in a sphere of heavy water. High stun chance.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 9,

    scalingPerPoint: 2,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WATER,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 2, chance: 0.7 }]
  },

  WATER_WALL: {
    id: 'suijinheki',
    name: 'Water Wall',
    tier: SkillTier.ADVANCED,
    description: 'Expels water to form a defensive barrier. Creates a Shield.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    stanceShift: Posture.DEFENSIVE,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.WATER,
    effects: [
      { type: EffectType.SHIELD, value: 60, duration: 2, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPIRIT, value: 0.3, duration: 2, chance: 1.0 }
    ]
  },

  HELL_VIEWING: {
    id: 'hell_viewing',
    name: 'Hell Viewing Technique',
    tier: SkillTier.ADVANCED,
    description: 'A Genjutsu that reveals the target\'s worst fears. MENTAL damage bypasses physical defense, resisted by Calmness.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 18,

    scalingPerPoint: 4,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL, // Uses Mental Defense!
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO, // Genjutsu auto-hits
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.CALMNESS]: 2,
      },
    },
    effects: [{
      type: EffectType.DEBUFF,
      targetStat: PrimaryStat.STRENGTH,
      value: 0.3,
      duration: 3,
      chance: 1.0
    }]
  },

  MIND_DESTRUCTION: {
    id: 'mind_destruction',
    name: 'Mind Body Disturbance',
    tier: SkillTier.ADVANCED,
    description: 'Sends chakra into the opponent\'s nervous system to confuse their movement. MENTAL damage, causes confusion.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.PIERCING, // Pierces mental flat def
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.CALMNESS]: 2,
      },
    },
    effects: [{ type: EffectType.CONFUSION, duration: 3, chance: 1.0 }],
    image: '/assets/skills/skill_mind_body_disturbing.png'
  },

  // ==========================================
  // ADVANCED TIER - ELEMENTAL NINJUTSU (NEW)
  // ==========================================
  DRAGON_FLAME: {
    id: 'dragon_flame',
    name: 'Dragon Flame Bomb',
    tier: SkillTier.ADVANCED,
    description: 'A dragon-shaped fireball that causes severe burns.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 17,
    scalingPerPoint: 6,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.15 },
    effects: [{ type: EffectType.BURN, value: 10, duration: 3, chance: 0.7, damageType: DamageType.ELEMENTAL, damageProperty: DamageProperty.NORMAL }]
  },

  HIDDEN_MIST: {
    id: 'hidden_mist',
    name: 'Hidden Mist Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'Creates a dense mist for evasion and enemy accuracy reduction.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.WATER,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.5, duration: 3, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.3, duration: 3, chance: 1.0 }
    ]
  },

  WATER_CLONE: {
    id: 'water_clone',
    name: 'Water Clone Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'Creates a water clone for a strength buff.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 11,
    scalingPerPoint: 4,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.WATER,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.4, duration: 2, chance: 1.0 }]
  },

  LIGHTNING_BALL: {
    id: 'lightning_ball',
    name: 'Lightning Ball',
    tier: SkillTier.ADVANCED,
    description: 'A ball of lightning with stun chance.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 15,
    scalingPerPoint: 5,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.LIGHTNING,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.4 }]
  },

  EARTH_DECAPITATION: {
    id: 'earth_decapitation',
    name: 'Inner Decapitation',
    tier: SkillTier.ADVANCED,
    description: 'Pull enemy underground with high stun chance.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 13,
    scalingPerPoint: 4,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.EARTH,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.6 }]
  },

  GREAT_BREAKTHROUGH: {
    id: 'great_breakthrough',
    name: 'Great Breakthrough',
    tier: SkillTier.ADVANCED,
    description: 'A powerful gust of wind that reduces enemy accuracy.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 16,
    scalingPerPoint: 5,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WIND,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.25, duration: 2, chance: 1.0 }]
  },

  AIR_BULLET: {
    id: 'air_bullet',
    name: 'Air Bullet',
    tier: SkillTier.ADVANCED,
    description: 'Compressed air projectile that reduces enemy defense.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 13,
    scalingPerPoint: 4,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WIND,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.SPIRIT]: 2,
      },
    },
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.15, duration: 2, chance: 1.0 }]
  },

  // ==========================================
  // ADVANCED TIER - CLAN TECHNIQUES (NEW)
  // ==========================================
  FANG_OVER_FANG: {
    id: 'fang_over_fang',
    name: 'Fang Over Fang',
    tier: SkillTier.ADVANCED,
    description: 'Inuzuka dual rotation attack. Hits twice at 50% each.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 13,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.SPEED]: 2,
        [PrimaryStat.STRENGTH]: 2,
      },
    },
  },

  MIND_TRANSFER: {
    id: 'mind_transfer',
    name: 'Mind Transfer Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'Yamanaka mind control. 70% stun for 2 turns. Miss = self stun.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 7,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.CALMNESS]: 2,
      },
      clan: Clan.YAMANAKA,
    },
    effects: [{ type: EffectType.STUN, duration: 2, chance: 0.7 }]
  },

  SHADOW_POSSESSION: {
    id: 'shadow_possession',
    name: 'Shadow Possession',
    tier: SkillTier.ADVANCED,
    description: 'Nara shadow binding. High stun chance with reflect.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
        [PrimaryStat.CALMNESS]: 2,
      },
    },
    effects: [
      { type: EffectType.STUN, duration: 2, chance: 0.8 },
      { type: EffectType.REFLECTION, value: 0.3, duration: 2, chance: 1.0 }
    ]
  },

  BUG_SWARM: {
    id: 'bug_swarm',
    name: 'Parasitic Insects',
    tier: SkillTier.ADVANCED,
    description: 'Aburame insect attack. Drains chakra and poisons.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 8,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 2,
      },
    },
    effects: [
      { type: EffectType.CHAKRA_DRAIN, value: 25, duration: 1, chance: 1.0 },
      { type: EffectType.POISON, value: 8, duration: 3, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }
    ]
  },

  EXPANSION: {
    id: 'expansion',
    name: 'Expansion Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'Akimichi body expansion. Big damage with strength buff.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    stanceShift: Posture.AGGRESSIVE,
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.2 },
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 16,
    scalingPerPoint: 5,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.STRENGTH]: 2,
        [PrimaryStat.WILLPOWER]: 2,
      },
    },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.5, duration: 2, chance: 1.0 }]
  },

  // ==========================================
  // HIDDEN TIER - SIGNATURE TECHNIQUES (NEW)
  // ==========================================
  SIXTY_FOUR_PALMS: {
    id: '64_palms',
    name: '8 Trigrams 64 Palms',
    tier: SkillTier.HIDDEN,
    description: 'Hyuga ultimate technique. TRUE damage that drains chakra and debuffs all stats.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 7,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 25,
    scalingPerPoint: 8,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.ACCURACY]: 3,
      },
      clan: Clan.HYUGA,
    },
    effects: [
      { type: EffectType.CHAKRA_DRAIN, value: 40, duration: 1, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.STRENGTH, value: 0.3, duration: 3, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.SPEED, value: 0.3, duration: 3, chance: 1.0 }
    ]
  },

  SAND_BURIAL: {
    id: 'sand_burial',
    name: 'Sand Burial',
    tier: SkillTier.HIDDEN,
    description: 'Execute attack. +100% damage if target below 25% HP.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.EARTH,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.SPIRIT]: 3,
      },
    },
  },

  CURSE_MARK_1: {
    id: 'curse_mark_1',
    name: 'Curse Mark Stage 1',
    tier: SkillTier.HIDDEN,
    description:
      'Combat Mode: 3 charges. Activate 2 AP + 12 HP; upkeep 5 HP; CD 5. Curse stage I. Ends on payoff, manual off, zero charges, or failed upkeep.',
    actionType: ActionType.TOGGLE,
    cardRole: CardRole.MODE,
    tags: [SkillTag.MODE],
    baseWeight: defaultBaseWeight(),
    apCost: 2,
    chakraCost: 0,
    hpCost: 12,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.WILLPOWER]: 3,
        [PrimaryStat.STRENGTH]: 3,
      },
    },
    isToggle: true,
    upkeepCost: 5,
    modeInteraction: { modeId: 'curse_mark_1', family: MODE_FAMILY.CURSE },
    effects: [],
  },

  // ==========================================
  // HIDDEN TIER - ACTIVE (utility)
  // ==========================================
  SAND_SHIELD: {
    id: 'sand_shield',
    name: 'Sand Shield',
    tier: SkillTier.HIDDEN,
    description: 'Automatic sand defense. Creates 80 shield.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.EARTH,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.SPIRIT]: 3,
      },
    },
    effects: [{ type: EffectType.SHIELD, value: 80, duration: 2, chance: 1.0 }]
  },

  SHARINGAN_PREDICT: {
    id: 'sharingan_predict',
    name: 'Sharingan: Predict',
    tier: SkillTier.HIDDEN,
    description: 'See enemy\'s next move. +25% Evasion.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 3,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.CALMNESS]: 3,
      },
      clan: Clan.UCHIHA,
    },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.25, duration: 2, chance: 1.0 }]
  },

  BYAKUGAN_SCAN: {
    id: 'byakugan_scan',
    name: 'Tenketsu Scan',
    tier: SkillTier.HIDDEN,
    description: 'Scan chakra points. Next attack ignores 30% defense.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 3,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.ACCURACY]: 3,
      },
      clan: Clan.HYUGA,
    },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.ACCURACY, value: 0.3, duration: 1, chance: 1.0 }]
  },

  // ==========================================
  // HIDDEN TIER - SUMMONING (NEW)
  // ==========================================
  SUMMON_GAMABUNTA: {
    id: 'summon_gamabunta',
    name: 'Summoning: Gamabunta',
    tier: SkillTier.HIDDEN,
    description: 'Summon the great toad. Big water damage + shield.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 11,
    hpCost: 0,
    cooldown: 8,
    currentCooldown: 0,
    baseDamage: 25,
    scalingPerPoint: 8,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WATER,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.CHAKRA]: 3,
      },
    },
    effects: [{ type: EffectType.SHIELD, value: 80, duration: 3, chance: 1.0 }]
  },

  SUMMON_MANDA: {
    id: 'summon_manda',
    name: 'Summoning: Manda',
    tier: SkillTier.HIDDEN,
    description: 'Summon the great snake. High damage + TRUE poison.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 8,
    hpCost: 20,
    cooldown: 7,
    currentCooldown: 0,
    baseDamage: 25,
    scalingPerPoint: 8,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.SPIRIT]: 3,
      },
    },
    effects: [{ type: EffectType.POISON, value: 15, duration: 4, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }]
  },

  PUPPET_CROW: {
    id: 'puppet_crow',
    name: 'Puppet: Crow',
    tier: SkillTier.HIDDEN,
    description: 'Deploy puppet with poison and bleed.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 22,
    scalingPerPoint: 7,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.DEXTERITY]: 3,
      },
    },
    effects: [
      { type: EffectType.POISON, value: 10, duration: 3, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL },
      { type: EffectType.BLEED, value: 10, duration: 3, chance: 1.0, damageType: DamageType.PHYSICAL, damageProperty: DamageProperty.NORMAL }
    ]
  },

  // ==== HIDDEN ====
  SHADOW_CLONE: {
    id: 'shadow_clone',
    name: 'Shadow Clone Jutsu',
    tier: SkillTier.HIDDEN,
    description:
      'Combat Mode: 3 charges. Activate 2 AP + 12 CP; upkeep 2 CP; CD 5. Clone resource — Rasengan weight +4 while ON. Deals no direct damage.',
    actionType: ActionType.TOGGLE,
    cardRole: CardRole.MODE,
    tags: [SkillTag.MODE, SkillTag.NINJUTSU],
    baseWeight: defaultBaseWeight(),
    apCost: 2,
    chakraCost: 12,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.CHAKRA]: 3,
      },
    },
    isToggle: true,
    upkeepCost: 2,
    modeInteraction: { modeId: 'shadow_clone', family: MODE_FAMILY.CLONES },
    effects: [],
  },

  PRIMARY_LOTUS: {
    id: 'primary_lotus',
    name: 'Primary Lotus',
    tier: SkillTier.HIDDEN,
    description:
      'Requires a Gate Mode ON. 3×7; +15% per remaining charge. Consumes all charges and closes the Gate at attempt.',
    actionType: ActionType.ACTIVE,
    cardRole: CardRole.ATTACK,
    apCost: 5,
    chakraCost: 0,
    hpCost: 15,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 7,
    hitCount: 3,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    allowedRanges: [CombatRange.CLOSE],
    modeInteraction: {
      family: MODE_FAMILY.GATES,
      requireFamily: MODE_FAMILY.GATES,
      requireOn: true,
      consumeAllCharges: true,
      damagePerChargeBonus: 0.15,
    },
    requirements: {
      stats: {
        [PrimaryStat.STRENGTH]: 3,
        [PrimaryStat.SPEED]: 3,
      },
    },
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.2 },
    image: '/assets/skills/skill_primary_lotus.png',
  },

  CHIDORI: {
    id: 'chidori',
    name: 'Chidori',
    tier: SkillTier.HIDDEN,
    description:
      'A crackling assassination thrust. With Sharingan 3-Tomoe ON, spend 2 charges at attempt and may be used at MEDIUM. Without the Mode, CLOSE only and no charge spend.',
    actionType: ActionType.ACTIVE,
    cardRole: CardRole.ATTACK,
    apCost: 2,
    chakraCost: 7,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.LIGHTNING,
    modeInteraction: {
      modeId: 'sharingan_3',
      family: MODE_FAMILY.SHARINGAN,
      consumeCharges: 2,
      grantRanges: [CombatRange.MEDIUM],
    },
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.SPIRIT]: 3,
      },
    },
    critBonus: 15,
    penetration: 0.2, // Also ignores 20% of % defense
    image: '/assets/skills/skill_chidori.png'
  },

  CHIDORI_STREAM: {
    id: 'chidori_stream',
    name: 'Chidori Stream',
    tier: SkillTier.HIDDEN,
    description: 'Releases lightning chakra in all directions, paralyzing nearby foes.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 7,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 18,
    scalingPerPoint: 6,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO, // AoE effect
    element: ElementType.LIGHTNING,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.SPIRIT]: 3,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.8 }]
  },

  SAND_COFFIN: {
    id: 'sand_coffin',
    name: 'Sand Coffin',
    tier: SkillTier.HIDDEN,
    description: 'Encases the enemy in crushing waves of sand. ARMOR_BREAK ignores % defense.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 7,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.ARMOR_BREAK, // Ignores % def!
    attackMethod: AttackMethod.RANGED,
    element: ElementType.EARTH,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.SPIRIT]: 3,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.7 }]
  },

  WATER_DRAGON: {
    id: 'water_dragon',
    name: 'Water Dragon Jutsu',
    tier: SkillTier.HIDDEN,
    description: 'Manifests a majestic dragon of water to crash down upon the foe.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WATER,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.SPIRIT]: 3,
      },
    },
  },

  ICE_MIRRORS: {
    id: 'ice_mirrors',
    name: 'Demonic Ice Mirrors',
    tier: SkillTier.HIDDEN,
    description: 'Creates a dome of ice mirrors. Traps the target and deals multiple strikes.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 7,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.WATER,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.SPIRIT]: 3,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.5 }]
  },

  FALSE_SURROUNDINGS: {
    id: 'false_surroundings',
    name: 'False Surroundings',
    tier: SkillTier.HIDDEN,
    description: 'Alters the perception of the environment. MENTAL damage with high confusion chance.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 8,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.CALMNESS]: 3,
      },
    },
    effects: [{ type: EffectType.CONFUSION, duration: 3, chance: 0.8 }]
  },

  TEMPLE_NIRVANA: {
    id: 'temple_nirvana',
    name: 'Temple of Nirvana',
    tier: SkillTier.HIDDEN,
    description: 'Descending feathers induce a deep, magical slumber. Guaranteed MENTAL stun.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 8,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 3,
        [PrimaryStat.CALMNESS]: 3,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 2, chance: 1.0 }]
  },

  // ==========================================
  // FORBIDDEN TIER - ACTIVE
  // ==========================================
  HIDDEN_LOTUS: {
    id: 'hidden_lotus',
    name: 'Hidden Lotus',
    tier: SkillTier.FORBIDDEN,
    description:
      'Requires Gate of Limit ON. 5×6; +15% per remaining charge. Consumes all charges and closes the Gate. Self-Vulnerable 30% for 2 durations.',
    actionType: ActionType.ACTIVE,
    cardRole: CardRole.ATTACK,
    apCost: 6,
    chakraCost: 0,
    hpCost: 50,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 6,
    hitCount: 5,
    scalingPerPoint: 3,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    allowedRanges: [CombatRange.CLOSE],
    modeInteraction: {
      modeId: 'gate_of_limit',
      family: MODE_FAMILY.GATES,
      requireOn: true,
      consumeAllCharges: true,
      damagePerChargeBonus: 0.15,
    },
    markEffects: [
      {
        id: 'vulnerable',
        duration: 2,
        stacks: 30,
        family: MarkFamily.STAT,
        targetActor: 'self',
      },
    ],
    requirements: {
      stats: {
        [PrimaryStat.STRENGTH]: 5,
        [PrimaryStat.SPEED]: 5,
        [PrimaryStat.WILLPOWER]: 5,
      },
    },
    stanceBonus: { posture: Posture.AGGRESSIVE, damageMultBonus: 0.25 },
  },

  WATER_VORTEX: {
    id: 'water_vortex',
    name: 'Giant Water Vortex',
    tier: SkillTier.FORBIDDEN,
    description: 'Massive water attack that severely slows the enemy.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 8,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 20,
    scalingPerPoint: 16,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WATER,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 5,
        [PrimaryStat.SPIRIT]: 5,
      },
    },
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.SPEED, value: 0.4, duration: 3, chance: 1.0 }]
  },

  CLONE_EXPLOSION: {
    id: 'clone_explosion',
    name: 'Clone Great Explosion',
    tier: SkillTier.FORBIDDEN,
    description: 'Exploding clone. Cannot be evaded.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 7,
    hpCost: 10,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 20,
    scalingPerPoint: 16,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,  // Cannot be evaded
    element: ElementType.FIRE,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 5,
        [PrimaryStat.SPIRIT]: 5,
      },
    },
  },

  THOUSAND_YEARS: {
    id: '1000_years',
    name: '1000 Years of Death',
    tier: SkillTier.FORBIDDEN,
    description: 'The forbidden poke. 100% stun, 60% confusion.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 1,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 9,
    scalingPerPoint: 7,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.STUN, duration: 1, chance: 1.0 },
      { type: EffectType.CONFUSION, duration: 2, chance: 0.6 }
    ]
  },

  // ==========================================
  // FORBIDDEN TIER - TOGGLE ACTIONS (NEW)
  // ==========================================
  GATE_OF_LIFE: {
    id: 'gate_of_life',
    name: 'Gate of Life (3rd Gate)',
    tier: SkillTier.FORBIDDEN,
    description:
      'Combat Mode: 3 charges. Activate 3 AP + 15 HP; upkeep 8 HP; CD 6. Gate stage 3 — ascent to Gate of Limit. Payoff routes, not a percent toggle.',
    actionType: ActionType.TOGGLE,
    cardRole: CardRole.MODE,
    tags: [SkillTag.MODE, SkillTag.TAIJUTSU, SkillTag.LEE],
    baseWeight: defaultBaseWeight(),
    apCost: 3,
    chakraCost: 0,
    hpCost: 15,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.STRENGTH]: 5,
        [PrimaryStat.WILLPOWER]: 5,
      },
    },
    isToggle: true,
    upkeepCost: 8,
    modeInteraction: { modeId: 'gate_of_life', family: MODE_FAMILY.GATES },
    effects: [],
  },

  CURSE_MARK_2: {
    id: 'curse_mark_2',
    name: 'Curse Mark Stage 2',
    tier: SkillTier.FORBIDDEN,
    description:
      'Combat Mode: 4 charges. Activate 3 AP + 25 HP; upkeep 10 HP; CD 6. Curse stage II — ascent from Stage 1. Charge-spent attack routes, not a percent toggle.',
    actionType: ActionType.TOGGLE,
    cardRole: CardRole.MODE,
    tags: [SkillTag.MODE],
    baseWeight: defaultBaseWeight(),
    apCost: 3,
    chakraCost: 0,
    hpCost: 25,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.WILLPOWER]: 5,
        [PrimaryStat.STRENGTH]: 5,
      },
    },
    isToggle: true,
    upkeepCost: 10,
    modeInteraction: { modeId: 'curse_mark_2', family: MODE_FAMILY.CURSE },
    effects: [],
  },

  // ==========================================
  // FORBIDDEN TIER - ACTIVE (utility)
  // ==========================================
  CURSE_SURGE: {
    id: 'curse_surge',
    name: 'Curse Mark Surge',
    tier: SkillTier.FORBIDDEN,
    description: '+30% damage on next attack. HP cost.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    hpCost: 10,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.WILLPOWER]: 5,
        [PrimaryStat.STRENGTH]: 5,
      },
    },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.3, duration: 1, chance: 1.0 }]
  },

  GATE_PREP: {
    id: 'gate_prep',
    name: 'Gate Release Prep',
    tier: SkillTier.FORBIDDEN,
    description: 'Prepare for gate opening. Next gate activation: -50% HP cost.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    hpCost: 15,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.WILLPOWER]: 5,
        [PrimaryStat.STRENGTH]: 5,
      },
    },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.5, duration: 2, chance: 1.0 }]
  },

  KILLING_INTENT: {
    id: 'killing_intent',
    name: 'Killing Intent',
    tier: SkillTier.FORBIDDEN,
    description: 'Release murderous aura. 30% chance enemy skips turn.',
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 5,
        [PrimaryStat.CALMNESS]: 5,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.3 }]
  },

  // ==== LEGENDARY / AMBUSH ====
  DEMON_SLASH: {
    id: 'demon_slash',
    name: 'Demon Slash',
    tier: SkillTier.FORBIDDEN,
    description: 'A brutal, sweeping cleave with the Executioner Blade. Causes BLEED.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.STRENGTH]: 5,
        [PrimaryStat.DEXTERITY]: 5,
      },
    },
    effects: [{
      type: EffectType.BLEED,
      value: 15,
      duration: 3,
      chance: 1.0,
      damageType: DamageType.PHYSICAL,
      damageProperty: DamageProperty.PIERCING
    }]
  },

  BONE_DRILL: {
    id: 'bone_drill',
    name: 'Dance of Clematis',
    tier: SkillTier.FORBIDDEN,
    description: 'A macabre dance manipulating bone density into a piercing spear. TRUE damage.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 10,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.TRUE, // Bypasses ALL defense
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.STRENGTH]: 5,
        [PrimaryStat.WILLPOWER]: 5,
      },
    },
    critBonus: 30
  },

  POISON_FOG: {
    id: 'poison_fog',
    name: 'Ibuse Poison Fog',
    tier: SkillTier.FORBIDDEN,
    description: 'Exhales a cloud of toxic gas. POISON ignores 50% of defense.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    baseDamage: 9,
    scalingPerPoint: 7,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE, // Poison is Fire-adjacent
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 5,
        [PrimaryStat.SPIRIT]: 5,
      },
    },
    effects: [{
      type: EffectType.POISON,
      value: 18,
      duration: 4,
      chance: 1.0,
      damageType: DamageType.TRUE, // Poison deals TRUE damage!
      damageProperty: DamageProperty.NORMAL
    }]
  },

  TSUKUYOMI: {
    id: 'tsukuyomi',
    name: 'Tsukuyomi',
    tier: SkillTier.FORBIDDEN,
    description: 'Traps the target in an illusion of torture. Massive TRUE MENTAL damage.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 13,
    hpCost: 15,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.TRUE, // Bypasses mental defense too!
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 5,
        [PrimaryStat.CALMNESS]: 5,
      },
      clan: Clan.UCHIHA,
    },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 1.0 }]
  },

  // ==========================================
  // KINJUTSU TIER - ULTIMATE TECHNIQUES (NEW)
  // ==========================================
  REAPER_DEATH_SEAL: {
    id: 'reaper_death_seal',
    name: 'Reaper Death Seal',
    tier: SkillTier.KINJUTSU,
    description: 'Sacrifice your life to instantly kill the target. Both die.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 99,
    currentCooldown: 0,
    baseDamage: 0,

    scalingPerPoint: 0,

    mutualKo: true,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
        [PrimaryStat.WILLPOWER]: 7,
      },
    },
  },

  EDO_TENSEI: {
    id: 'edo_tensei',
    name: 'Edo Tensei',
    tier: SkillTier.KINJUTSU,
    description: 'Summon an ally at 50% stats for 5 turns.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 18,
    hpCost: 30,
    cooldown: 10,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
      },
    },
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.5, duration: 5, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.5, duration: 5, chance: 1.0 }
    ]
  },

  GATE_OF_LIMIT: {
    id: 'gate_of_limit',
    name: 'Gate of Limit (5th Gate)',
    tier: SkillTier.KINJUTSU,
    description:
      'Combat Mode: 4 charges. Activate 4 AP + 35 HP; upkeep 12 HP; CD 8. Gate stage 5 — Hidden Lotus / Morning Peacock payoff. Not a percent toggle.',
    actionType: ActionType.TOGGLE,
    cardRole: CardRole.MODE,
    tags: [SkillTag.MODE, SkillTag.TAIJUTSU, SkillTag.LEE],
    baseWeight: defaultBaseWeight(),
    apCost: 4,
    chakraCost: 0,
    hpCost: 35,
    cooldown: 8,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.STRENGTH]: 7,
        [PrimaryStat.SPEED]: 7,
        [PrimaryStat.WILLPOWER]: 7,
      },
    },
    isToggle: true,
    upkeepCost: 12,
    modeInteraction: { modeId: 'gate_of_limit', family: MODE_FAMILY.GATES },
    effects: [],
  },

  SHUKAKU_ARM: {
    id: 'shukaku_arm',
    name: 'Shukaku Arm',
    tier: SkillTier.KINJUTSU,
    description: 'Partial Bijuu transformation. ARMOR_BREAK + shield, double damage if <30% HP.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 8,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 27,
    scalingPerPoint: 21,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.ARMOR_BREAK,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.EARTH,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
        [PrimaryStat.SPIRIT]: 7,
      },
    },
    effects: [{ type: EffectType.SHIELD, value: 100, duration: 2, chance: 1.0 }]
  },

  COPY_JUTSU: {
    id: 'copy_jutsu',
    name: 'Sharingan: Copy',
    tier: SkillTier.KINJUTSU,
    description: 'Copy enemy\'s last skill at 80% power.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 6,
    hpCost: 0,
    cooldown: 8,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.PHYSICAL,  // Variable
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
      },
      clan: Clan.UCHIHA,
    },
  },

  // ==== FORBIDDEN ====
  C4_KARURA: {
    id: 'c4_karura',
    name: 'C4 Karura',
    tier: SkillTier.FORBIDDEN,
    description: 'Microscopic clay spiders that disintegrate the target on a cellular level. TRUE damage.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 18,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    baseDamage: 17,
    scalingPerPoint: 14,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.EARTH,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 5,
        [PrimaryStat.SPIRIT]: 5,
      },
    },
  },

  RASENSHURIKEN: {
    id: 'rasenshuriken',
    name: 'Rasenshuriken',
    tier: SkillTier.KINJUTSU,
    description: 'A microscopic wind blade vortex that severs chakra channels. PIERCING + TRUE damage hybrid.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 20,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WIND,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
        [PrimaryStat.SPIRIT]: 7,
      },
    },
  },

  AMATERASU: {
    id: 'amaterasu',
    name: 'Amaterasu',
    tier: SkillTier.KINJUTSU,
    description: 'Inextinguishable black flames. Deals initial PIERCING damage + massive TRUE DoT.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 13,
    hpCost: 20,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 13,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.FIRE,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
        [PrimaryStat.SPIRIT]: 7,
      },
      clan: Clan.UCHIHA,
    },
    effects: [{
      type: EffectType.BURN,
      value: 50,
      duration: 5,
      chance: 1.0,
      damageType: DamageType.TRUE, // Black flames deal TRUE damage
      damageProperty: DamageProperty.NORMAL
    }]
  },

  KIRIN: {
    id: 'kirin',
    name: 'Kirin',
    tier: SkillTier.KINJUTSU,
    description: 'Harnesses natural lightning from the heavens. Unavoidable ARMOR_BREAK strike.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 27,
    hpCost: 0,
    cooldown: 8,
    currentCooldown: 0,
    baseDamage: 15,

    scalingPerPoint: 3,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.ARMOR_BREAK, // Ignores % def
    attackMethod: AttackMethod.AUTO, // Cannot be dodged
    element: ElementType.LIGHTNING,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
        [PrimaryStat.SPIRIT]: 7,
      },
    },
  },

  SHINRA_TENSEI: {
    id: 'shinra_tensei',
    name: 'Shinra Tensei',
    tier: SkillTier.KINJUTSU,
    description: 'Almighty Push. Repels everything with crushing gravitational force. TRUE damage.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 13,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    baseDamage: 23,
    scalingPerPoint: 18,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.WIND,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
        [PrimaryStat.SPIRIT]: 7,
      },
    },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.5 }]
  },

  KAMUI_IMPACT: {
    id: 'kamui_impact',
    name: 'Kamui',
    tier: SkillTier.KINJUTSU,
    description: 'Space-Time Ninjutsu that warps reality. TRUE damage that cannot miss.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 11,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    baseDamage: 27,
    scalingPerPoint: 21,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
        [PrimaryStat.CALMNESS]: 7,
      },
    },
    effects: [{
      type: EffectType.DEBUFF,
      targetStat: PrimaryStat.SPEED,
      value: 0.5,
      duration: 2,
      chance: 1.0
    }]
  },

  TENGAI_SHINSEI: {
    id: 'tengai_shinsei',
    name: 'Tengai Shinsei',
    tier: SkillTier.KINJUTSU,
    description: 'Summons a massive meteorite from the atmosphere. Catastrophic TRUE damage.',
    actionType: ActionType.ACTIVE,
    apCost: 2,
    chakraCost: 27,
    hpCost: 0,
    cooldown: 8,
    currentCooldown: 0,
    baseDamage: 27,
    scalingPerPoint: 21,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.EARTH,
    requirements: {
      stats: {
        [PrimaryStat.INTELLIGENCE]: 7,
        [PrimaryStat.SPIRIT]: 7,
      },
    },
  }
};

export const SKILLS: Record<string, Skill> = {
  ...SKILLS_CLASSIC,
  ...SKILLS_COMBAT_V1_NEW,
};

export const SKILLS_CLASSIC_COUNT = Object.keys(SKILLS_CLASSIC).length;
