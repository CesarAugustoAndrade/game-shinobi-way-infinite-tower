/**
 * Battle Simulator - Core automated battle engine
 * Runs battles without React dependencies for pure simulation
 */

import {
  Player,
  Enemy,
  Skill,
  Buff,
  PrimaryAttributes,
  DerivedStats,
  ElementType,
  EffectType,
  Clan,
  EquipmentSlot,
  ApproachType,
  TreasureQuality,
  DEFAULT_MERCHANT_SLOTS,
  CharacterStats,
  TerrainType,
  TerrainDefinition,
  Posture,
  CombatModifierType,
} from '../game/types';
import {
  calculateDerivedStats,
  calculateDamage,
  checkGuts,
  resistStatus,
  calculateDotDamage,
  getPlayerFullStats,
  getEnemyFullStats,
  resolvePassiveDamageBonus,
} from '../game/systems/StatSystem';
import { SKILLS } from '../game/constants';
import { getApCost } from '../game/constants/combatCards';
import { buildDeck, drawNewTurnHand } from '../game/systems/DeckSystem';
import {
  postureDamageMod,
  postureDefenseMod,
  stanceShiftFromSkill,
} from '../game/systems/PostureSystem';
import {
  BattleResult,
  SimulationConfig,
  PlayerBuildConfig,
  SimCombatant,
  TurnLog,
  DEFAULT_CONFIG
} from './types';
import { EnemyArchetype, generateSimEnemy } from './EnemyArchetypes';
import { createBuildFromConfig } from './BuildGenerator';
import { selectBestCard } from './SkillSelectionAI';
import {
  generateId,
  applyMitigation as applyMitigationCalc,
  tickBuffDurations,
  getTerrainElementAmplification,
  applyTerrainHazard,
  determineTurnOrder,
} from '../game/systems/CombatCalculationSystem';
import {
  processPassivesOnCombatStart,
  processPassivesOnHit,
  processPassivesOnTurnStart,
  shouldCounterAttack,
  checkExecuteThreshold,
  checkGutsPassive,
} from '../game/systems/EquipmentPassiveSystem';
import { selectEnemySkill } from '../game/systems/EnemyAISystem';
import { applyRoomCombatModifiers } from '../game/systems/RoomCombatModifierSystem';
import type { CombatModifiers } from '../game/systems/ApproachSystem';
import {
  APPROACH_DEFINITIONS,
  calculateApproachSuccessChance,
} from '../game/constants/approaches';
import { LaunchProperties } from '../config/featureFlags';
import { BIOME_TERRAINS, TERRAIN_DEFINITIONS } from '../game/constants/terrain';
import { getStoryArcForFloor } from '../game/entities/Enemy';

/**
 * Approach success roll using the **live** `calculateApproachSuccessChance`
 * (same formulas as ApproachSystem / APPROACH_DEFINITIONS).
 */
function rollApproachSuccess(
  approach: ApproachType,
  playerStats: { primary: PrimaryAttributes; derived: DerivedStats },
  terrainStealthBonus: number = 0
): boolean {
  if (approach === ApproachType.FRONTAL_ASSAULT) {
    return true;
  }

  const stats: Record<string, number> = {
    speed: playerStats.primary.speed,
    dexterity: playerStats.primary.dexterity,
    intelligence: playerStats.primary.intelligence,
    calmness: playerStats.primary.calmness,
    accuracy: playerStats.primary.accuracy,
    willpower: playerStats.primary.willpower,
    strength: playerStats.primary.strength,
    spirit: playerStats.primary.spirit,
    chakra: playerStats.primary.chakra,
  };

  const successChance = calculateApproachSuccessChance(
    approach,
    stats,
    terrainStealthBonus
  );
  return Math.random() * 100 < successChance;
}

// ============================================================================
// COMBAT HELPERS
// ============================================================================

// generateId imported from CombatCalculationSystem

/**
 * Create a simulation-ready player from build config
 */
export function createSimPlayer(config: PlayerBuildConfig): Player {
  const { stats, skills, element } = createBuildFromConfig(config);
  const derived = calculateDerivedStats(stats, {});

  return {
    clan: config.clan,
    level: config.level,
    exp: 0,
    maxExp: 100,
    primaryStats: stats,
    currentHp: derived.maxHp,
    currentChakra: derived.maxChakra,
    element,
    ryo: 0,
    equipment: {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null
    },
    skills: skills.map(s => ({ ...s, currentCooldown: 0 })),
    activeBuffs: [],
    bag: Array(12).fill(null), // 12 fixed slots
    treasureQuality: TreasureQuality.BROKEN,
    merchantSlots: DEFAULT_MERCHANT_SLOTS,
    locationsCleared: 0,
    eventFlags: {},
  };
}

/**
 * Convert Player/Enemy to SimCombatant
 */
function toSimCombatant(entity: Player | Enemy, derived: DerivedStats): SimCombatant {
  return {
    name: 'name' in entity ? entity.name : (entity as Player).clan,
    primaryStats: entity.primaryStats,
    currentHp: entity.currentHp,
    maxHp: derived.maxHp,
    currentChakra: entity.currentChakra,
    maxChakra: derived.maxChakra,
    element: entity.element,
    skills: entity.skills,
    activeBuffs: entity.activeBuffs
  };
}

/**
 * Apply mitigation (shields, invuln, curses, reflection)
 * Wrapper around shared CombatCalculationSystem.applyMitigation
 */
function applyMitigation(
  buffs: Buff[],
  damage: number,
  targetName: string = 'target'
): { finalDamage: number; reflectedDamage: number; updatedBuffs: Buff[] } {
  const result = applyMitigationCalc(buffs, damage, targetName);
  // Drop messages for simulation (not needed for metrics)
  return {
    finalDamage: result.finalDamage,
    reflectedDamage: result.reflectedDamage,
    updatedBuffs: result.updatedBuffs
  };
}

/**
 * Process buff durations and effects
 */
function processBuffs(
  buffs: Buff[],
  currentHp: number,
  maxHp: number,
  derived: DerivedStats
): { newHp: number; newBuffs: Buff[]; dotDamage: number } {
  let hp = currentHp;
  let dotDamage = 0;

  // Process effects
  for (const buff of buffs) {
    if (!buff?.effect) continue;

    // DoT effects
    if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type)) {
      if (buff.effect.value) {
        const dmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, derived);
        hp -= dmg;
        dotDamage += dmg;
      }
    }

    // Regen
    if (buff.effect.type === EffectType.REGEN && buff.effect.value) {
      hp = Math.min(maxHp, hp + buff.effect.value);
    }
  }

  // Decrement durations using shared function
  const newBuffs = tickBuffDurations(buffs);

  return { newHp: hp, newBuffs, dotDamage };
}

// ============================================================================
// BATTLE SIMULATION
// ============================================================================

export interface BattleContext {
  player: Player;
  enemy: Enemy;
  playerDerived: DerivedStats;
  enemyDerived: DerivedStats;
  playerStats: CharacterStats;
  enemyStats: CharacterStats;
  terrain: TerrainDefinition | null;
  turn: number;
  isFirstTurn: boolean;
  firstHitMultiplier: number;
  /** T-109: room AMBUSH enemy first-hit mult */
  enemyFirstHitMultiplier: number;
  /** T-109: room combat FOREST cover evasion */
  roomCombatEvasion: number;
  /** T-110: CLIFF fall fraction of max HP on player miss */
  fallDamageOnMiss: number;
  approachSucceeded: boolean;  // Track actual approach success
  // T-004 AP economy (player only): the deckbuilder state mirrored from the real
  // game (DeckSystem/PostureSystem). The enemy keeps its 1-action-per-turn AI.
  posture: Posture;            // Active player posture (BALANCED = neutral default)
  deck: Skill[];               // Draw pile (non-PASSIVE cards not in hand/discard)
  hand: Skill[];               // Cards available to play this turn
  discard: Skill[];            // Spent/recycled cards, reshuffled when the deck runs low
  currentAp: number;           // Action Points remaining this turn
  maxAp: number;               // Action Points granted each turn (speed-derived)
  logs: TurnLog[];
  metrics: {
    totalDamageDealt: number;
    totalDamageReceived: number;
    totalAttacks: number;
    crits: number;
    misses: number;
    evasions: number;
    gutsTriggered: number;
    chakraUsed: number;
    apUsed: number;            // Total AP spent across the battle (player)
    cardsPlayed: number;       // Total cards played across the battle (player)
    skillsUsed: Record<string, number>;
  };
  artifactGutsUsed: boolean;
}

/**
 * Resolve a drawn card to its live skill state in `ctx.player.skills`.
 *
 * The deck/hand/discard piles are snapshots taken when the deck was built, so a
 * card's cooldown can be stale. Cooldown/usability is authoritative on
 * `ctx.player.skills` (ticked down each round), so we always score and play the
 * live object, matched by id. Falls back to the snapshot if not found.
 */
function liveSkill(ctx: BattleContext, card: Skill): Skill {
  return ctx.player.skills.find(s => s.id === card.id) ?? card;
}

/**
 * Execute a single player turn under the AP/card/posture economy (T-004).
 *
 * Mirrors the real game's PlayerTurnSystem flow:
 *   1. Upkeep: restore the AP budget and deal a fresh, posture-weighted hand
 *      (`drawNewTurnHand`); the previous hand recycles into the discard.
 *   2. Action: play cards from the hand until AP is exhausted or no card in
 *      hand is playable — replacing the legacy fixed 1 MAIN + 2 SIDE economy.
 *   3. A played card may shift the player's stance for free (on play).
 */
function executePlayerTurn(ctx: BattleContext): boolean {
  const { player, enemy, playerDerived, enemyDerived } = ctx;

  // ── Toggle upkeep (T-006 fidelity) ──
  // Mirrors PlayerTurnSystem.processUpkeep: every active toggle pays its per-turn
  // chakra upkeep at the start of the player's turn, or auto-deactivates (and drops
  // its buffs) when chakra runs short. Without this, a toggle build looks more
  // sustainable in the sim than it is in the real game.
  ctx.player.skills = ctx.player.skills.map(skill => {
    if (!skill.isToggle || !skill.isActive) return skill;
    const upkeepCost = skill.upkeepCost ?? 0;
    if (upkeepCost <= 0) return skill;
    if (ctx.player.currentChakra >= upkeepCost) {
      ctx.player.currentChakra -= upkeepCost;
      return skill;
    }
    // Cannot afford upkeep → deactivate and remove this toggle's buffs.
    ctx.player.activeBuffs = ctx.player.activeBuffs.filter(b => b.source !== skill.name);
    return { ...skill, isActive: false };
  });

  // ── Upkeep: refresh AP and draw a new posture-weighted hand ──
  ctx.currentAp = ctx.maxAp;
  const draw = drawNewTurnHand(
    ctx.deck,
    ctx.discard,
    ctx.hand,
    ctx.posture,
    LaunchProperties.HAND_SIZE
  );
  ctx.hand = draw.hand;
  ctx.deck = draw.deck;
  ctx.discard = draw.discard;

  // Stun check (after the draw, matching the upkeep → action order).
  if (player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN)) {
    ctx.logs.push({
      turn: ctx.turn,
      actor: 'player',
      action: 'Stunned!',
      damage: 0,
      isCrit: false,
      isMiss: false,
      isEvaded: false,
      playerHp: player.currentHp,
      enemyHp: enemy.currentHp
    });
    return false;
  }

  let actedAtLeastOnce = false;

  // ── Action: spend AP playing cards from the hand ──
  while (ctx.currentAp > 0 && ctx.hand.length > 0) {
    // Score against live skill state (cooldown/chakra current), then pick the
    // best card affordable with the remaining AP.
    const liveHand = ctx.hand.map(card => liveSkill(ctx, card));
    const simPlayer = toSimCombatant(ctx.player, playerDerived);
    const simEnemy = toSimCombatant(ctx.enemy, enemyDerived);

    const card = selectBestCard(
      liveHand,
      ctx.currentAp,
      simPlayer,
      playerDerived,
      simEnemy,
      enemyDerived,
      ctx.isFirstTurn,
      ctx.firstHitMultiplier
    );

    // Nothing in hand is both affordable and usable → end the turn.
    if (!card) break;

    // Spend AP and move the card from hand to discard before resolving it.
    const apCost = getApCost(card);
    ctx.currentAp -= apCost;
    ctx.metrics.apUsed += apCost;
    ctx.metrics.cardsPlayed += 1;

    const handIndex = ctx.hand.findIndex(c => c.id === card.id);
    if (handIndex >= 0) {
      ctx.hand = [...ctx.hand.slice(0, handIndex), ...ctx.hand.slice(handIndex + 1)];
    }
    ctx.discard = [...ctx.discard, card];

    executeSkill(ctx, card, true);
    actedAtLeastOnce = true;

    // The opening ambush bonus applies to the first card only (mirrors useCombat).
    ctx.isFirstTurn = false;

    // A played card may shift the player's stance for free (on play).
    const shift = stanceShiftFromSkill(card);
    if (shift) {
      ctx.posture = shift;
    }

    // Stop early if the fight ended (enemy dead, or reflection/self-cost killed us).
    if (ctx.enemy.currentHp <= 0 || ctx.player.currentHp <= 0) break;
  }

  if (!actedAtLeastOnce) {
    // No playable card this turn (e.g. empty hand or all on cooldown/no chakra).
    ctx.logs.push({
      turn: ctx.turn,
      actor: 'player',
      action: 'No playable cards',
      damage: 0,
      isCrit: false,
      isMiss: false,
      isEvaded: false,
      playerHp: ctx.player.currentHp,
      enemyHp: ctx.enemy.currentHp
    });
  }

  return actedAtLeastOnce;
}

/**
 * Execute a skill
 */
function executeSkill(ctx: BattleContext, skill: Skill, isPlayer: boolean): boolean {
  const attacker = isPlayer ? ctx.player : ctx.enemy;
  const defender = isPlayer ? ctx.enemy : ctx.player;
  const attackerStats = isPlayer ? ctx.playerStats : ctx.enemyStats;
  const defenderStats = isPlayer ? ctx.enemyStats : ctx.playerStats;

  // Deduct costs
  if (isPlayer) {
    ctx.player.currentHp -= skill.hpCost;
    ctx.player.currentChakra -= skill.chakraCost;
    ctx.metrics.chakraUsed += skill.chakraCost;
  }

  // Track skill usage
  ctx.metrics.skillsUsed[skill.id] = (ctx.metrics.skillsUsed[skill.id] || 0) + 1;
  ctx.metrics.totalAttacks++;

  // T-110: stack terrain + room combat FOREST cover into defender evasion
  // (parity with EnemyTurnSystem / CombatSimulationService)
  let defPrimary = isPlayer ? defender.primaryStats : defenderStats.effectivePrimary;
  let defDerived = isPlayer
    ? defenderStats.derived
    : defenderStats.derived;
  const terrainEvasion = ctx.terrain?.effects.evasionModifier ?? 0;
  if (isPlayer) {
    // Enemy dodging player — only terrain definition evasion
    if (terrainEvasion !== 0) {
      defDerived = {
        ...defenderStats.derived,
        evasion: Math.min(0.75, defenderStats.derived.evasion + terrainEvasion),
      };
    }
  } else {
    // Player dodging enemy — terrain + room combat cover
    const totalEvasion = terrainEvasion + (ctx.roomCombatEvasion ?? 0);
    if (totalEvasion !== 0) {
      defDerived = {
        ...defenderStats.derived,
        evasion: Math.min(0.75, defenderStats.derived.evasion + totalEvasion),
      };
    }
  }

  // Calculate damage (player gets passive skill damageBonus / FIRE_AFFINITY etc.)
  const result = calculateDamage(
    isPlayer ? attackerStats.effectivePrimary : attacker.primaryStats,
    attackerStats.derived,
    defPrimary,
    defDerived,
    skill,
    attacker.element,
    defender.element,
    isPlayer
      ? { damageBonus: resolvePassiveDamageBonus(attackerStats.passiveBonuses, skill.element) }
      : undefined
  );

  let damage = result.finalDamage;

  // Track miss/evade
  if (result.isMiss) {
    ctx.metrics.misses++;
    // T-110: CLIFF fall on player miss (parity with PlayerTurnSystem)
    let fallNote = '';
    if (
      isPlayer
      && ctx.fallDamageOnMiss > 0
      && ctx.playerStats.derived.maxHp > 0
    ) {
      const fallDmg = Math.max(
        1,
        Math.floor(ctx.playerStats.derived.maxHp * ctx.fallDamageOnMiss),
      );
      ctx.player.currentHp = Math.max(1, ctx.player.currentHp - fallDmg);
      ctx.metrics.totalDamageReceived += fallDmg;
      fallNote = ` (cliff fall ${fallDmg})`;
    }
    ctx.logs.push({
      turn: ctx.turn,
      actor: isPlayer ? 'player' : 'enemy',
      action: `${skill.name} MISSED${fallNote}`,
      damage: 0,
      isCrit: false,
      isMiss: true,
      isEvaded: false,
      playerHp: ctx.player.currentHp,
      enemyHp: ctx.enemy.currentHp
    });
    return false;
  }

  if (result.isEvaded) {
    ctx.metrics.evasions++;
    ctx.logs.push({
      turn: ctx.turn,
      actor: isPlayer ? 'player' : 'enemy',
      action: `${skill.name} EVADED`,
      damage: 0,
      isCrit: false,
      isMiss: false,
      isEvaded: true,
      playerHp: ctx.player.currentHp,
      enemyHp: ctx.enemy.currentHp
    });
    return false;
  }

  // Track crits
  if (result.isCrit) {
    ctx.metrics.crits++;
  }

  // Apply terrain element amplification for player
  if (isPlayer && ctx.terrain) {
    const terrainAmp = getTerrainElementAmplification(ctx.terrain, ctx.player.element);
    if (terrainAmp > 1.0) {
      damage = Math.floor(damage * terrainAmp);
    }
  }

  // Apply LaunchProperties Multipliers
  if (isPlayer) {
    damage = Math.floor(damage * LaunchProperties.PLAYER_DAMAGE_MULTIPLIER);
  } else {
    damage = Math.floor(damage * LaunchProperties.ENEMY_DAMAGE_MULTIPLIER);
  }

  // Apply first hit multiplier
  if (ctx.isFirstTurn && isPlayer && ctx.firstHitMultiplier > 1.0) {
    damage = Math.floor(damage * ctx.firstHitMultiplier);
  }
  // T-109: room AMBUSH enemy first-strike
  if (ctx.isFirstTurn && !isPlayer && ctx.enemyFirstHitMultiplier > 1.0) {
    damage = Math.floor(damage * ctx.enemyFirstHitMultiplier);
  }

  // T-004: light posture modifier on the player's OUTGOING damage. Mirrors
  // PlayerTurnSystem.useSkill (applied before mitigation/execute). Base math
  // (calculateDamage) stays frozen — this is an external posture multiplier.
  if (isPlayer) {
    damage = Math.floor(damage * postureDamageMod(ctx.posture));
  }

  // Apply mitigation
  const defenderName = 'name' in defender ? defender.name : defender.clan;
  const mitigation = applyMitigation(defender.activeBuffs, damage, defenderName);
  damage = mitigation.finalDamage;

  // T-006 (fidelity): apply the execute threshold AFTER mitigation, mirroring
  // PlayerTurnSystem.useSkill. The execute overrides the post-mitigation damage
  // (`= enemy.currentHp`), so an enemy shield can no longer block the execute —
  // previously the sim ran execute BEFORE mitigation and a shield wrongly absorbed
  // the kill. Player only.
  if (isPlayer) {
    const enemyMaxHp = ctx.enemyStats.derived.maxHp;
    if (checkExecuteThreshold(ctx.player, ctx.enemy, enemyMaxHp)) {
      damage = ctx.enemy.currentHp;
    }
  }

  // T-004: posture scales the post-mitigation damage the PLAYER actually takes
  // from the enemy's direct attack (mirrors EnemyTurnSystem). Applied after the
  // frozen base mitigation as an external posture multiplier. DoT and terrain
  // hazards stay ×1 in both the sim and the real game (F2 scope), so DEFENSIVE
  // is a symmetric trade-off (deal ×0.85 / take ×0.85) rather than strictly worse.
  if (!isPlayer) {
    damage = Math.floor(damage * postureDefenseMod(ctx.posture));
  }

  if (isPlayer) {
    ctx.enemy.activeBuffs = mitigation.updatedBuffs;
    ctx.enemy.currentHp -= damage;
    ctx.metrics.totalDamageDealt += damage;

    // Process passives on hit
    const onHitResult = processPassivesOnHit(ctx.player, ctx.enemy, damage, result.isCrit);
    
    // Apply lifesteal
    if (onHitResult.healToPlayer > 0) {
      ctx.player.currentHp = Math.min(ctx.playerStats.derived.maxHp, ctx.player.currentHp + onHitResult.healToPlayer);
    }
    // Apply chakra restore
    if (onHitResult.chakraRestored > 0) {
      ctx.player.currentChakra = Math.min(ctx.playerStats.derived.maxChakra, ctx.player.currentChakra + onHitResult.chakraRestored);
    }
    // Apply passive debuffs to enemy
    const newPassiveDebuffs = onHitResult.enemy.activeBuffs.filter(
      b => !ctx.enemy.activeBuffs.some(existing => existing.id === b.id)
    );
    ctx.enemy.activeBuffs = [...ctx.enemy.activeBuffs, ...newPassiveDebuffs];

    // Handle reflection
    if (mitigation.reflectedDamage > 0) {
      ctx.player.currentHp -= mitigation.reflectedDamage;
      ctx.metrics.totalDamageReceived += mitigation.reflectedDamage;
    }
  } else {
    ctx.player.activeBuffs = mitigation.updatedBuffs;

    // Check guts
    const hpBeforeDamage = ctx.player.currentHp;
    const hpAfterDamage = hpBeforeDamage - damage;
    if (hpAfterDamage <= 0) {
      const statGutsResult = checkGuts(hpBeforeDamage, damage, ctx.playerStats.derived.gutsChance);
      if (statGutsResult.survived) {
        ctx.player.currentHp = 1;
        ctx.metrics.gutsTriggered++;
      } else {
        const artifactGuts = checkGutsPassive(ctx.player);
        if (artifactGuts.hasGuts && !ctx.artifactGutsUsed) {
          const healAmount = Math.floor(ctx.playerStats.derived.maxHp * (artifactGuts.healPercent / 100));
          ctx.player.currentHp = Math.max(1, healAmount);
          ctx.artifactGutsUsed = true;
          ctx.metrics.gutsTriggered++;
        } else {
          ctx.player.currentHp = 0;
        }
      }
    } else {
      ctx.player.currentHp = hpAfterDamage;
    }
    ctx.metrics.totalDamageReceived += damage;

    // Counter: shouldCounterAttack already rolls once — do not re-roll (A-017)
    if (ctx.player.currentHp > 0) {
      const counterCheck = shouldCounterAttack(ctx.player);
      if (counterCheck.shouldCounter) {
        const counterDamage = Math.floor(ctx.playerStats.effectivePrimary.strength * 0.3);
        ctx.enemy.currentHp -= counterDamage;
        ctx.metrics.totalDamageDealt += counterDamage;
      }
    }

    // Handle reflection
    if (mitigation.reflectedDamage > 0) {
      ctx.enemy.currentHp -= mitigation.reflectedDamage;
      ctx.metrics.totalDamageDealt += mitigation.reflectedDamage;
    }
  }

  // Apply skill effects
  if (skill.effects) {
    for (const effect of skill.effects) {
      // Instant HEAL: restore HP immediately (not a lingering buff). Parity with PlayerTurnSystem / A-004.
      if (effect.type === EffectType.HEAL) {
        const healAmount = Math.floor(effect.value || 0);
        if (healAmount > 0) {
          if (isPlayer) {
            ctx.player.currentHp = Math.min(
              ctx.playerDerived.maxHp,
              ctx.player.currentHp + healAmount
            );
          } else {
            ctx.enemy.currentHp = Math.min(
              ctx.enemyDerived.maxHp,
              ctx.enemy.currentHp + healAmount
            );
          }
        }
        const desc = (skill.description || '').toLowerCase();
        if (desc.includes('poison') || desc.includes('bleed')) {
          if (isPlayer) {
            ctx.player.activeBuffs = ctx.player.activeBuffs.filter(
              b => b?.effect?.type !== EffectType.BLEED && b?.effect?.type !== EffectType.POISON
            );
          } else {
            ctx.enemy.activeBuffs = ctx.enemy.activeBuffs.filter(
              b => b?.effect?.type !== EffectType.BLEED && b?.effect?.type !== EffectType.POISON
            );
          }
        }
        continue;
      }

      const isSelfBuff = [
        EffectType.BUFF, EffectType.SHIELD, EffectType.REFLECTION,
        EffectType.REGEN, EffectType.INVULNERABILITY,
      ].includes(effect.type);

      if (isSelfBuff) {
        // Apply to attacker
        const buff: Buff = {
          id: generateId(),
          name: effect.type,
          duration: effect.duration,
          effect,
          source: skill.name
        };
        if (isPlayer) {
          ctx.player.activeBuffs.push(buff);
        } else {
          ctx.enemy.activeBuffs.push(buff);
        }
      } else {
        // Apply to defender with resistance check
        const targetResist = isPlayer
          ? ctx.enemyStats.derived.statusResistance
          : ctx.playerStats.derived.statusResistance;

        if (resistStatus(effect.chance, targetResist)) {
          const buff: Buff = {
            id: generateId(),
            name: effect.type,
            duration: effect.duration,
            effect,
            source: skill.name
          };
          if (isPlayer) {
            ctx.enemy.activeBuffs.push(buff);
          } else {
            ctx.player.activeBuffs.push(buff);
          }
        }
      }
    }
  }

  ctx.logs.push({
    turn: ctx.turn,
    actor: isPlayer ? 'player' : 'enemy',
    action: skill.name,
    damage,
    isCrit: result.isCrit,
    isMiss: false,
    isEvaded: false,
    playerHp: ctx.player.currentHp,
    enemyHp: ctx.enemy.currentHp
  });

  // Update cooldowns
  if (isPlayer) {
    ctx.player.skills = ctx.player.skills.map(s =>
      s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s
    );
  }

  return true;
}

/**
 * Execute enemy turn using live EnemyAISystem.selectEnemySkill (same as EnemyTurnSystem).
 */
function executeEnemyTurn(ctx: BattleContext): void {
  const { enemy } = ctx;

  // Check stun
  if (enemy.activeBuffs.some(b => b?.effect?.type === EffectType.STUN)) {
    ctx.logs.push({
      turn: ctx.turn,
      actor: 'enemy',
      action: 'Stunned!',
      damage: 0,
      isCrit: false,
      isMiss: false,
      isEvaded: false,
      playerHp: ctx.player.currentHp,
      enemyHp: ctx.enemy.currentHp
    });
    return;
  }

  // Check confusion
  if (enemy.activeBuffs.some(b => b?.effect?.type === EffectType.CONFUSION)) {
    if (Math.random() < 0.5) {
      const selfDmg = Math.floor(enemy.primaryStats.strength * 0.5);
      ctx.enemy.currentHp -= selfDmg;
      ctx.logs.push({
        turn: ctx.turn,
        actor: 'enemy',
        action: 'Hurt itself in confusion',
        damage: selfDmg,
        isCrit: false,
        isMiss: false,
        isEvaded: false,
        playerHp: ctx.player.currentHp,
        enemyHp: ctx.enemy.currentHp
      });
      return;
    }
  }

  // Live AI (EnemyTurnSystem parity) — scores skills by HP/effects/cooldowns
  let skill = selectEnemySkill({
    enemy: ctx.enemy,
    enemyStats: ctx.enemyStats,
    player: ctx.player,
    playerStats: ctx.playerStats,
  });

  // Fallback if no skill found
  if (!skill && enemy.skills.length > 0) {
    skill = enemy.skills[0];
  }

  if (skill) {
    executeSkill(ctx, skill, false);

    // Update cooldowns (Only set the used skill's cooldown - main round loop decrements it)
    ctx.enemy.skills = ctx.enemy.skills.map(s =>
      s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s
    );
  }
}

/**
 * Helper to get a random terrain type appropriate for a given floor.
 */
export function getRandomTerrainForFloor(floor: number): TerrainType {
  const arc = getStoryArcForFloor(floor);
  const terrains = BIOME_TERRAINS[arc.name] || BIOME_TERRAINS.ACADEMY_ARC;
  return terrains[Math.floor(Math.random() * terrains.length)];
}

/**
 * Result of resolving one battle with carry-over awareness.
 *
 * `result` is the standard 1v1 `BattleResult` (whose `playerFinalHp` already
 * carries the surviving HP). `playerFinalChakra` is exposed separately so an
 * attrition driver (the LocationSimulator) can carry the player's chakra pool
 * into the next encounter — `BattleResult` only tracked HP.
 */
export interface BattleResolution {
  result: BattleResult;
  playerFinalChakra: number;
}

/**
 * Resolve a single battle between an ALREADY-BUILT player and enemy.
 *
 * Unlike `simulateBattle` (which mints a fresh, full-HP player every call), this
 * takes the combatants as-is, so the player can enter with its CURRENT HP/chakra
 * (and any cooldown/buff state the caller set up). This is the seam the
 * LocationSimulator uses to chain rooms with state carry-over. The base combat
 * math is untouched — this is the exact body the old `simulateBattle` ran, just
 * parameterised on the entities instead of building them inline.
 *
 * Mutation contract: combat runs on shallow copies (`ctx.player`/`ctx.enemy`), so
 * most input fields are NOT mutated — read surviving pools from the resolution.
 * Exceptions before the copy: combat-start passives **replace** `player`/`enemy`
 * `activeBuffs` and may set `player.currentHp` (e.g. Uzumaki heal). Callers that
 * reuse a combatant should pass throwaway buff arrays (LocationSimulator already
 * does via `prepareForCombat` → `activeBuffs: []`) and re-sync HP if needed.
 */
export function resolveBattle(
  player: Player,
  enemy: Enemy,
  config: SimulationConfig = DEFAULT_CONFIG,
  battleId: number = 0,
  approach: ApproachType | null = null,
  terrain?: TerrainType,
  /** T-109: room combat activity modifiers (combat ?? elite) */
  roomCombatModifiers?: CombatModifierType[] | null,
): BattleResolution {
  // Calculate derived stats
  const playerStats = getPlayerFullStats(player);
  const enemyStats = getEnemyFullStats(enemy);

  // Get/Determine terrain
  const selectedTerrain = terrain || (config.floorNumber ? getRandomTerrainForFloor(config.floorNumber) : undefined);
  const terrainDef = selectedTerrain ? TERRAIN_DEFINITIONS[selectedTerrain] : null;

  // Calculate approach success (only if approach is used) — shared formulas
  const approachSucceeded = approach
    ? rollApproachSuccess(
        approach,
        { primary: playerStats.primary, derived: playerStats.derived },
        terrainDef?.effects.stealthModifier ?? 0
      )
    : false;

  // Process passives on combat start (SHIELD_ON_START uses max chakra — A-017).
  // Replace activeBuffs with passive result (no double-append — result already includes prior buffs).
  // Apply currentHp from result (e.g. Uzumaki combat-start heal).
  const combatStartResult = processPassivesOnCombatStart(player, enemy, {
    maxHp: playerStats.derived.maxHp,
    maxChakra: playerStats.derived.maxChakra,
  });
  player.activeBuffs = combatStartResult.player.activeBuffs;
  player.currentHp = combatStartResult.player.currentHp;
  enemy.activeBuffs = combatStartResult.enemy.activeBuffs;

  // T-004: build the player's draw pile (non-PASSIVE cards) and open in the
  // neutral BALANCED posture, mirroring the real game's combat opening.
  const deck = buildDeck(player.skills);

  // Resolve approach effects from shared APPROACH_DEFINITIONS (parity with live game)
  const approachDef = approach ? APPROACH_DEFINITIONS[approach] : null;
  const approachEffects = approachDef
    ? (approachSucceeded ? approachDef.successEffects : (approachDef.failureEffects ?? approachDef.successEffects))
    : null;

  // First-hit mult from data (stealth = 2.0), not a hard-coded 2.5
  let firstHitMult =
    approachSucceeded && approachEffects
      ? (approachEffects.firstHitMultiplier ?? 1.0)
      : 1.0;

  // T-109: room combat modifiers (parity with simulateGameCombat / startCombat)
  const approachMods: CombatModifiers = {
    playerGoesFirst: approachSucceeded && (approachEffects?.guaranteedFirst ?? false),
    playerInitiativeBonus: approachEffects?.initiativeBonus ?? 0,
    firstHitMultiplier: firstHitMult,
    playerBuffs: [],
    enemyDebuffs: [],
    xpMultiplier: 1,
  };
  const roomApplied = applyRoomCombatModifiers(
    roomCombatModifiers,
    approachMods,
    player,
    playerStats.derived.maxHp,
  );
  player = roomApplied.player;
  firstHitMult = roomApplied.modifiers.firstHitMultiplier;
  const enemyFirstHitMult = roomApplied.enemyFirstHitMultiplier;
  const roomCombatEvasion = roomApplied.playerEvasionBonus;
  const fallDamageOnMiss = roomApplied.environment.fallDamageOnMiss;
  if (roomApplied.modifiers.playerBuffs.length > 0) {
    player = {
      ...player,
      activeBuffs: [...player.activeBuffs, ...roomApplied.modifiers.playerBuffs],
    };
  }

  // Light synergy: successful stealth opens Aggressive (mirrors useCombat.startCombat)
  const openingPosture =
    approachSucceeded && approach === ApproachType.STEALTH_AMBUSH
      ? Posture.AGGRESSIVE
      : Posture.BALANCED;

  // Initialize battle context
  const ctx: BattleContext = {
    player: { ...player },
    enemy: { ...enemy },
    playerDerived: playerStats.derived,
    enemyDerived: enemyStats.derived,
    playerStats,
    enemyStats,
    terrain: terrainDef,
    turn: 0,
    isFirstTurn: true,
    firstHitMultiplier: firstHitMult,
    enemyFirstHitMultiplier: enemyFirstHitMult,
    roomCombatEvasion,
    fallDamageOnMiss,
    approachSucceeded,
    // AP/card/posture economy (player). Hand is dealt on the first player turn.
    posture: openingPosture,
    deck,
    hand: [],
    discard: [],
    currentAp: 0,
    maxAp: playerStats.derived.actionPointsPerTurn,
    logs: [],
    metrics: {
      totalDamageDealt: 0,
      totalDamageReceived: 0,
      totalAttacks: 0,
      crits: 0,
      misses: 0,
      evasions: 0,
      gutsTriggered: 0,
      chakraUsed: 0,
      apUsed: 0,
      cardsPlayed: 0,
      skillsUsed: {}
    },
    artifactGutsUsed: false
  };

  // Turn order via shared determineTurnOrder (initiativeBonus may be negative on failure)
  const whoFirst = determineTurnOrder(playerStats, enemyStats, {
    isFirstTurn: true,
    playerGoesFirst: roomApplied.modifiers.playerGoesFirst,
    playerInitiativeBonus: roomApplied.modifiers.playerInitiativeBonus,
    terrain: terrainDef,
  });
  const playerGoesFirst = whoFirst === 'player';

  // Apply approach buffs/debuffs (success advantages OR failure penalties) + HP cut on success
  if (approachEffects) {
    const sourceName = approachDef?.name ?? 'Approach';
    for (const eff of approachEffects.enemyDebuffs ?? []) {
      if (Math.random() > (eff.chance ?? 1)) continue;
      ctx.enemy.activeBuffs.push({
        id: generateId(),
        name: eff.type,
        duration: eff.duration,
        effect: {
          type: eff.type,
          value: eff.value,
          duration: eff.duration,
          targetStat: eff.targetStat,
          chance: eff.chance,
        },
        source: sourceName,
      });
    }
    for (const eff of approachEffects.playerBuffs ?? []) {
      if (Math.random() > (eff.chance ?? 1)) continue;
      ctx.player.activeBuffs.push({
        id: generateId(),
        name: eff.type,
        duration: eff.duration,
        effect: {
          type: eff.type,
          value: eff.value,
          duration: eff.duration,
          targetStat: eff.targetStat,
          chance: eff.chance,
        },
        source: sourceName,
      });
    }
    if (approachSucceeded) {
      const hpReduction = approachEffects.enemyHpReduction ?? 0;
      if (hpReduction > 0) {
        ctx.enemy.currentHp = Math.floor(ctx.enemy.currentHp * (1 - hpReduction));
      }
    }
    // Failure HP cost (trap backfire, etc.)
    if (!approachSucceeded && (approachEffects.hpCost ?? 0) > 0) {
      ctx.player.currentHp = Math.max(1, ctx.player.currentHp - (approachEffects.hpCost ?? 0));
    }
  }

  // Battle loop
  while (ctx.turn < config.maxTurnsPerBattle) {
    ctx.turn++;

    // Process passives on turn start (player only) — REGEN % of maxHp (A-017)
    const turnStartResult = processPassivesOnTurnStart(
      ctx.player,
      ctx.enemy,
      ctx.playerStats.derived.maxHp
    );
    if (turnStartResult.healToPlayer > 0) {
      ctx.player.currentHp = Math.min(ctx.playerStats.derived.maxHp, ctx.player.currentHp + turnStartResult.healToPlayer);
    }
    if (turnStartResult.chakraRestored > 0) {
      ctx.player.currentChakra = Math.min(ctx.playerStats.derived.maxChakra, ctx.player.currentChakra + turnStartResult.chakraRestored);
    }

    // Execute turns
    if (playerGoesFirst) {
      executePlayerTurn(ctx);
      if (ctx.enemy.currentHp <= 0) break;
      executeEnemyTurn(ctx);
      if (ctx.player.currentHp <= 0) break;
    } else {
      executeEnemyTurn(ctx);
      if (ctx.player.currentHp <= 0) break;
      executePlayerTurn(ctx);
      if (ctx.enemy.currentHp <= 0) break;
    }

    // Process DoTs and buffs (T-006 fidelity) — AFTER both combatants have acted.
    // In the real game DoT/Regen ticks resolve inside the enemy turn (EnemyTurnSystem
    // phases 1-3), i.e. AFTER the player has already taken their action this round.
    // Running it here (instead of at the top of the round) mirrors that: a player
    // with lethal DoT still gets to act this round before the DoT can kill them.
    const enemyBuffResult = processBuffs(
      ctx.enemy.activeBuffs,
      ctx.enemy.currentHp,
      enemyStats.derived.maxHp,
      ctx.enemyDerived
    );
    ctx.enemy.currentHp = enemyBuffResult.newHp;
    ctx.enemy.activeBuffs = enemyBuffResult.newBuffs;

    if (ctx.enemy.currentHp <= 0) {
      break; // Enemy died from DoT
    }

    const playerBuffResult = processBuffs(
      ctx.player.activeBuffs,
      ctx.player.currentHp,
      playerStats.derived.maxHp,
      ctx.playerDerived
    );
    ctx.player.currentHp = playerBuffResult.newHp;
    ctx.player.activeBuffs = playerBuffResult.newBuffs;
    ctx.metrics.totalDamageReceived += playerBuffResult.dotDamage;

    // Check player guts from DoT
    if (ctx.player.currentHp <= 0) {
      const statGutsResult = checkGuts(ctx.player.currentHp, 0, ctx.playerDerived.gutsChance);
      if (statGutsResult.survived) {
        ctx.player.currentHp = 1;
        ctx.metrics.gutsTriggered++;
      } else {
        const artifactGuts = checkGutsPassive(ctx.player);
        if (artifactGuts.hasGuts && !ctx.artifactGutsUsed) {
          const healAmount = Math.floor(ctx.playerStats.derived.maxHp * (artifactGuts.healPercent / 100));
          ctx.player.currentHp = Math.max(1, healAmount);
          ctx.artifactGutsUsed = true;
          ctx.metrics.gutsTriggered++;
        } else {
          break;
        }
      }
    }

    // Regenerate resources
    ctx.player.currentChakra = Math.min(
      playerStats.derived.maxChakra,
      ctx.player.currentChakra + playerStats.derived.chakraRegen
    );

    // Reduce cooldowns
    ctx.player.skills = ctx.player.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1)
    }));
    ctx.enemy.skills = ctx.enemy.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1)
    }));

    // Apply terrain hazard at end of round
    if (ctx.terrain?.effects.hazard) {
      const hazard = ctx.terrain.effects.hazard;
      
      // Player hazard
      if (hazard.affectsPlayer) {
        const hazardRes = applyTerrainHazard(ctx.player, ctx.terrain, 'player');
        if (hazardRes.log) {
          ctx.metrics.totalDamageReceived += Math.max(0, ctx.player.currentHp - hazardRes.newHp);
          ctx.player.currentHp = hazardRes.newHp;
          ctx.logs.push({
            turn: ctx.turn,
            actor: 'environment',
            action: `Hazard: ${hazard.type}`,
            damage: hazard.value,
            isCrit: false,
            isMiss: false,
            isEvaded: false,
            playerHp: ctx.player.currentHp,
            enemyHp: ctx.enemy.currentHp
          });
          if (ctx.player.currentHp <= 0) break;
        }
      }

      // Enemy hazard
      if (hazard.affectsEnemy && ctx.enemy.currentHp > 0) {
        const hazardRes = applyTerrainHazard(ctx.enemy, ctx.terrain, ctx.enemy.name);
        if (hazardRes.log) {
          ctx.enemy.currentHp = hazardRes.newHp;
          ctx.logs.push({
            turn: ctx.turn,
            actor: 'environment',
            action: `Hazard: ${hazard.type}`,
            damage: hazard.value,
            isCrit: false,
            isMiss: false,
            isEvaded: false,
            playerHp: ctx.player.currentHp,
            enemyHp: ctx.enemy.currentHp
          });
          if (ctx.enemy.currentHp <= 0) break;
        }
      }
    }

    // Note: ctx.isFirstTurn is cleared after the player's first card is played
    // (in executePlayerTurn), mirroring useCombat — so the opening ambush bonus
    // lands on the first card only, even with multiple cards per turn.
  }

  // Determine winner
  const won = ctx.enemy.currentHp <= 0;

  const result: BattleResult = {
    battleId,
    won,
    turns: ctx.turn,
    totalDamageDealt: ctx.metrics.totalDamageDealt,
    totalDamageReceived: ctx.metrics.totalDamageReceived,
    totalAttacks: ctx.metrics.totalAttacks,
    critCount: ctx.metrics.crits,
    missCount: ctx.metrics.misses,
    evasionCount: ctx.metrics.evasions,
    gutsTriggersPlayer: ctx.metrics.gutsTriggered,
    playerFinalHp: ctx.player.currentHp,
    enemyFinalHp: ctx.enemy.currentHp,
    totalChakraUsed: ctx.metrics.chakraUsed,
    totalApUsed: ctx.metrics.apUsed,
    totalCardsPlayed: ctx.metrics.cardsPlayed,
    skillsUsed: ctx.metrics.skillsUsed,
    approachUsed: approach,
    approachSucceeded: ctx.approachSucceeded
  };

  return { result, playerFinalChakra: ctx.player.currentChakra };
}

/**
 * Run a single 1v1 battle simulation.
 *
 * Builds a fresh, full-HP player from the build config and a freshly-scaled
 * archetype enemy, then delegates to `resolveBattle`. Keeping this a thin
 * wrapper means the 1v1 sim and the carry-over LocationSimulator share one
 * battle engine, and the RNG order is byte-identical to the pre-refactor flow
 * (create player → create enemy → resolve).
 */
export function simulateBattle(
  playerConfig: PlayerBuildConfig,
  enemyArchetype: EnemyArchetype,
  config: SimulationConfig = DEFAULT_CONFIG,
  battleId: number = 0,
  approach: ApproachType | null = null,
  terrain?: TerrainType
): BattleResult {
  const player = createSimPlayer(playerConfig);
  const enemy = generateSimEnemy(enemyArchetype, config.floorNumber, config.difficulty);
  return resolveBattle(player, enemy, config, battleId, approach, terrain).result;
}

/**
 * Run multiple battles and return all results
 */
export function runBattles(
  playerConfig: PlayerBuildConfig,
  enemyArchetype: EnemyArchetype,
  config: SimulationConfig = DEFAULT_CONFIG,
  approach: ApproachType | null = null
): BattleResult[] {
  const results: BattleResult[] = [];

  for (let i = 0; i < config.battlesPerConfig; i++) {
    const result = simulateBattle(playerConfig, enemyArchetype, config, i, approach);
    results.push(result);
  }

  return results;
}
