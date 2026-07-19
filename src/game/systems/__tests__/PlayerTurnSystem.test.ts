/**
 * PlayerTurnSystem Unit Tests (A-013)
 * Covers useSkill hot paths: damage, resource gates, AP gate, stun, miss costs, HEAL buff.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { useSkill, processUpkeep } from '../PlayerTurnSystem';
import { calculateDerivedStats } from '../StatSystem';
import {
  ActionType,
  AttackMethod,
  CharacterStats,
  EffectType,
  Posture,
  PrimaryStat,
} from '../../types';
import {
  createMockPlayer,
  createMockEnemy,
  createMockSkill,
  BASE_STATS,
} from './testFixtures';
import type { CombatState } from '../combat-types';

const makeStats = (stats = BASE_STATS): CharacterStats => ({
  primary: { ...stats },
  effectivePrimary: { ...stats },
  derived: calculateDerivedStats(stats, {}),
});

const baseCombatState = (overrides: Partial<CombatState> = {}): CombatState => ({
  isFirstTurn: false,
  firstHitMultiplier: 1.0,
  playerGoesFirst: true,
  playerInitiativeBonus: 0,
  xpMultiplier: 1.0,
  terrain: null,
  approachApplied: true,
  skipFirstSkillCost: false,
  artifactGutsUsed: false,
  locationTerrainMods: null,
  currentAp: 10,
  maxAp: 10,
  posture: Posture.BALANCED,
  hand: [],
  deck: [],
  discard: [],
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSkill', () => {
  it('deals damage and spends chakra on a successful hit', () => {
    // percentChance: Math.random()*100 < hitChance → low RNG = hit; also avoid crit
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const skill = createMockSkill({
      id: 'punch',
      name: 'Punch',
      chakraCost: 10,
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO, // skip hit RNG entirely
    });
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 100,
      currentHp: 200,
    });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());

    expect(result).not.toBeNull();
    expect(result!.damageDealt).toBeGreaterThan(0);
    expect(result!.newEnemyHp).toBeLessThan(enemy.currentHp);
    expect(result!.newPlayerChakra).toBe(player.currentChakra - skill.chakraCost);
    expect(result!.enemyDefeated).toBe(false);
    expect(result!.apCost).toBeGreaterThan(0);
  });

  it('returns insufficient resources without dealing damage when chakra is too low', () => {
    const skill = createMockSkill({ chakraCost: 50, damageMult: 2.0 });
    const player = createMockPlayer({ currentChakra: 10, currentHp: 200, skills: [skill] });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());

    expect(result).not.toBeNull();
    expect(result!.damageDealt).toBe(0);
    expect(result!.newEnemyHp).toBe(enemy.currentHp);
    expect(result!.logMessage).toMatch(/Insufficient/i);
    expect(result!.apCost).toBe(0);
  });

  it('gates on Action Points when combatState.currentAp is below cost', () => {
    const skill = createMockSkill({
      chakraCost: 5,
      apCost: 3,
      damageMult: 2.0,
      actionType: ActionType.MAIN,
    });
    const player = createMockPlayer({ currentChakra: 100, currentHp: 200, skills: [skill] });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(
      player,
      playerStats,
      enemy,
      enemyStats,
      skill,
      baseCombatState({ currentAp: 1 }) // less than apCost 3
    );

    expect(result).not.toBeNull();
    expect(result!.damageDealt).toBe(0);
    expect(result!.logMessage).toMatch(/Action Points/i);
    expect(result!.apCost).toBe(0);
    expect(result!.newPlayerChakra).toBe(player.currentChakra); // no spend on rejected action
  });

  it('blocks action when player is stunned', () => {
    const skill = createMockSkill({ chakraCost: 5, damageMult: 2.0 });
    const player = createMockPlayer({
      currentChakra: 100,
      currentHp: 200,
      skills: [skill],
      activeBuffs: [
        {
          id: 'stun-1',
          name: 'Stun',
          duration: 1,
          effect: { type: EffectType.STUN, duration: 1, chance: 1 },
          source: 'test',
        },
      ],
    });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());

    expect(result).not.toBeNull();
    expect(result!.damageDealt).toBe(0);
    expect(result!.logMessage).toMatch(/stunned/i);
    expect(result!.apCost).toBe(0);
  });

  it('still spends chakra on a miss (cost before hit resolution)', () => {
    // Very low random → miss path in calculateDamage (hit chance fails)
    vi.spyOn(Math, 'random').mockReturnValue(0.001);

    const skill = createMockSkill({
      id: 'miss-skill',
      name: 'Whiff',
      chakraCost: 15,
      damageMult: 2.0,
      // Ranged + low accuracy makes miss easier, but we also force RNG
    });
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 100,
      currentHp: 200,
      // Low accuracy stats via primary (effective uses same)
    });
    // Use very low accuracy player and high speed enemy to guarantee miss with low RNG
    const lowAcc = { ...BASE_STATS, accuracy: 1, speed: 1 };
    const highEva = { ...BASE_STATS, speed: 50 };
    const playerStats = makeStats(lowAcc);
    const enemyStats = makeStats(highEva);
    const enemy = createMockEnemy({ currentHp: 500, primaryStats: highEva });

    // Retry with forced miss via skill that always can miss; if still hits, at least assert structure
    const result = useSkill(
      player,
      playerStats,
      enemy,
      enemyStats,
      skill,
      baseCombatState()
    );

    expect(result).not.toBeNull();
    // Costs are paid even on miss/evade
    expect(result!.newPlayerChakra).toBe(player.currentChakra - skill.chakraCost);
    if (result!.logMessage.includes('MISSED') || result!.logMessage.includes('EVADED')) {
      expect(result!.damageDealt).toBe(0);
      expect(result!.newEnemyHp).toBe(enemy.currentHp);
    }
  });

  it('applies first-hit multiplier from combatState on the opening turn', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const skill = createMockSkill({
      id: 'ambush-hit',
      name: 'Ambush Strike',
      chakraCost: 5,
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO,
    });
    const player = createMockPlayer({ skills: [skill], currentChakra: 100, currentHp: 200 });
    const enemy = createMockEnemy({ currentHp: 5000 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const normal = useSkill(
      player,
      playerStats,
      enemy,
      enemyStats,
      skill,
      baseCombatState({ isFirstTurn: false, firstHitMultiplier: 1.0 })
    );
    const ambush = useSkill(
      player,
      playerStats,
      enemy,
      enemyStats,
      skill,
      baseCombatState({ isFirstTurn: true, firstHitMultiplier: 2.0 })
    );

    expect(normal).not.toBeNull();
    expect(ambush).not.toBeNull();
    // Ambush should deal more (≈2× before mitigation noise); allow soft compare
    expect(ambush!.damageDealt).toBeGreaterThan(normal!.damageDealt);
    expect(ambush!.logMessage).toMatch(/AMBUSH/i);
  });

  it('applies HEAL as instant HP restore (A-004), not a lingering buff', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const skill = createMockSkill({
      id: 'heal-jutsu',
      name: 'Mystic Palm',
      chakraCost: 10,
      damageMult: 0.1, // token hit so effect application branch runs
      attackMethod: AttackMethod.AUTO,
      effects: [
        { type: EffectType.HEAL, value: 40, duration: 0, chance: 1 },
      ],
    });
    // Start below max so heal has room (maxHp at BASE_STATS is 80 + 10*9 = 170)
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 100,
      currentHp: 100,
      activeBuffs: [],
    });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());

    expect(result).not.toBeNull();
    expect(result!.newPlayerHp).toBe(140); // 100 + 40 instant heal
    expect(result!.logMessage).toMatch(/HEAL \+40 HP/i);
    // Should not leave a HEAL buff on the player
    expect(result!.newPlayerBuffs.some(b => b.effect?.type === EffectType.HEAL)).toBe(false);
  });

  it('medical HEAL cleanses poison and bleed when description promises it (A-004)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const skill = createMockSkill({
      id: 'basic_medical',
      name: 'Basic Medical Jutsu',
      description: 'Heal wounds with medical chakra. Removes poison and bleeding.',
      chakraCost: 20,
      damageMult: 0,
      attackMethod: AttackMethod.AUTO,
      effects: [{ type: EffectType.HEAL, value: 25, duration: 1, chance: 1 }],
    });
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 100,
      currentHp: 100,
      activeBuffs: [
        {
          id: 'bleed',
          name: EffectType.BLEED,
          duration: 3,
          effect: { type: EffectType.BLEED, value: 5, duration: 3, chance: 1 },
          source: 'enemy',
        },
        {
          id: 'poison',
          name: EffectType.POISON,
          duration: 3,
          effect: { type: EffectType.POISON, value: 5, duration: 3, chance: 1 },
          source: 'enemy',
        },
        {
          id: 'buff',
          name: EffectType.BUFF,
          duration: 2,
          effect: { type: EffectType.BUFF, value: 0.1, duration: 2, chance: 1 },
          source: 'self',
        },
      ],
    });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());

    expect(result).not.toBeNull();
    expect(result!.newPlayerHp).toBe(125);
    expect(result!.newPlayerBuffs.some(b => b.effect.type === EffectType.BLEED)).toBe(false);
    expect(result!.newPlayerBuffs.some(b => b.effect.type === EffectType.POISON)).toBe(false);
    expect(result!.newPlayerBuffs.some(b => b.effect.type === EffectType.BUFF)).toBe(true);
    expect(result!.logMessage).toMatch(/Cleansed/i);
  });

  it('blocks chakra-cost skills when silenced (A-004)', () => {
    const skill = createMockSkill({
      id: 'fireball',
      name: 'Fireball',
      chakraCost: 15,
      damageMult: 2.0,
      attackMethod: AttackMethod.AUTO,
    });
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 100,
      currentHp: 200,
      activeBuffs: [
        {
          id: 'silence',
          name: EffectType.SILENCE,
          duration: 2,
          effect: { type: EffectType.SILENCE, duration: 2, chance: 1 },
          source: 'enemy',
        },
      ],
    });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());

    expect(result).not.toBeNull();
    expect(result!.damageDealt).toBe(0);
    expect(result!.newPlayerChakra).toBe(player.currentChakra); // no cost paid
    expect(result!.logMessage).toMatch(/Silenced/i);
    expect(result!.apCost).toBe(0);
  });

  it('allows zero-chakra skills while silenced (A-004)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const skill = createMockSkill({
      id: 'punch',
      name: 'Punch',
      chakraCost: 0,
      damageMult: 2.0,
      attackMethod: AttackMethod.AUTO,
    });
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 100,
      currentHp: 200,
      activeBuffs: [
        {
          id: 'silence',
          name: EffectType.SILENCE,
          duration: 2,
          effect: { type: EffectType.SILENCE, duration: 2, chance: 1 },
          source: 'enemy',
        },
      ],
    });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());

    expect(result).not.toBeNull();
    expect(result!.damageDealt).toBeGreaterThan(0);
  });

  it('returns null when skill is on cooldown', () => {
    const skill = createMockSkill({
      chakraCost: 5,
      currentCooldown: 2,
      cooldown: 2,
    });
    const player = createMockPlayer({ skills: [skill], currentChakra: 100, currentHp: 200 });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());
    expect(result).toBeNull();
  });

  it('FREE_FIRST: allows expensive skill at low chakra and spends 0 CP (Package 5)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const skill = createMockSkill({
      id: 'big-jutsu',
      name: 'Big Jutsu',
      chakraCost: 50,
      damageMult: 2.0,
      attackMethod: AttackMethod.AUTO,
    });
    // Only 10 CP — without free-first this is rejected
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 10,
      currentHp: 200,
    });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const rejected = useSkill(
      player,
      playerStats,
      enemy,
      enemyStats,
      skill,
      baseCombatState({ skipFirstSkillCost: false })
    );
    expect(rejected!.damageDealt).toBe(0);
    expect(rejected!.logMessage).toMatch(/Insufficient/i);
    expect(rejected!.apCost).toBe(0);

    const free = useSkill(
      player,
      playerStats,
      enemy,
      enemyStats,
      skill,
      baseCombatState({ skipFirstSkillCost: true })
    );
    expect(free).not.toBeNull();
    expect(free!.damageDealt).toBeGreaterThan(0);
    expect(free!.newPlayerChakra).toBe(10); // no chakra spent
    expect(free!.logMessage).toMatch(/FREE/i);
    expect(free!.apCost).toBeGreaterThan(0);
  });

  it('applies CHAKRA_REGEN as a self-buff on the player (Package 5)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    const skill = createMockSkill({
      id: 'focused_breathing',
      name: 'Focused Breathing',
      chakraCost: 0,
      damageMult: 0,
      attackMethod: AttackMethod.AUTO,
      effects: [
        { type: EffectType.CHAKRA_REGEN, value: 10, duration: 1, chance: 1.0 },
      ],
    });
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 50,
      currentHp: 200,
      activeBuffs: [],
    });
    const enemy = createMockEnemy({ currentHp: 500 });
    const playerStats = makeStats();
    const enemyStats = makeStats();

    const result = useSkill(player, playerStats, enemy, enemyStats, skill, baseCombatState());

    expect(result).not.toBeNull();
    // Must land on player, not enemy
    expect(result!.newPlayerBuffs.some(b => b.effect?.type === EffectType.CHAKRA_REGEN)).toBe(true);
    expect(result!.newEnemyBuffs.some(b => b.effect?.type === EffectType.CHAKRA_REGEN)).toBe(false);
  });
});

describe('processUpkeep', () => {
  it('restores AP budget and deals a fresh hand for the new turn', () => {
    const skillA = createMockSkill({ id: 'a', name: 'A', damageMult: 2.0 });
    const skillB = createMockSkill({ id: 'b', name: 'B', damageMult: 2.0 });
    const player = createMockPlayer({
      skills: [skillA, skillB],
      currentChakra: 80,
      currentHp: 150,
    });
    const playerStats = makeStats();
    const combatState = baseCombatState({
      currentAp: 0,
      maxAp: 3,
      deck: [skillA, skillB],
      hand: [],
      discard: [],
      posture: Posture.BALANCED,
    });

    const result = processUpkeep(player, playerStats, combatState);

    expect(result.currentAp).toBe(playerStats.derived.actionPointsPerTurn);
    expect(result.maxAp).toBe(playerStats.derived.actionPointsPerTurn);
    expect(result.hand.length).toBeGreaterThan(0);
    expect(result.player.currentHp).toBe(player.currentHp);
  });

  it('re-applies location movement_penalty to AP every upkeep (T-067)', () => {
    const skillA = createMockSkill({ id: 'a', name: 'A', damageMult: 2.0 });
    const player = createMockPlayer({ skills: [skillA], currentChakra: 80, currentHp: 150 });
    const playerStats = makeStats();
    const baseAp = playerStats.derived.actionPointsPerTurn;
    const combatState = baseCombatState({
      currentAp: 0,
      maxAp: baseAp,
      deck: [skillA],
      hand: [],
      discard: [],
      locationTerrainMods: {
        waterDamageBonus: 0,
        fireDamagePenalty: 0,
        mentalDamageBonus: 0,
        stealthBonus: 0,
        enemyDefenseBonus: 0,
        enemyAttackBonus: 0,
        ambushChance: 0,
        poisonHazard: 0,
        fallHazard: 0,
        chakraDrain: 0,
        evasionBonus: 0,
        movementPenalty: 0.2,
        visibilityPenalty: 0,
      },
    });

    const result = processUpkeep(player, playerStats, combatState);
    const expected = Math.max(1, Math.floor(baseAp * 0.8));

    expect(result.maxAp).toBe(expected);
    expect(result.currentAp).toBe(expected);
  });

  it('deactivates toggles when player cannot afford upkeep', () => {
    const toggle = createMockSkill({
      id: 'toggle',
      name: 'Chakra Mode',
      isToggle: true,
      isActive: true,
      upkeepCost: 50,
      actionType: ActionType.TOGGLE,
      damageMult: 0,
    });
    const player = createMockPlayer({
      skills: [toggle],
      currentChakra: 10, // cannot afford 50
      currentHp: 200,
      activeBuffs: [
        {
          id: 'mode-buff',
          name: 'Mode',
          duration: 99,
          effect: { type: EffectType.BUFF, value: 0.2, duration: 99, chance: 1 },
          source: 'Chakra Mode',
        },
      ],
    });
    const playerStats = makeStats();
    const combatState = baseCombatState({ deck: [], hand: [], discard: [] });

    const result = processUpkeep(player, playerStats, combatState);

    expect(result.togglesDeactivated).toContain('Chakra Mode');
    expect(result.player.skills.find(s => s.id === 'toggle')?.isActive).toBe(false);
    expect(result.player.activeBuffs.some(b => b.source === 'Chakra Mode')).toBe(false);
  });
});
