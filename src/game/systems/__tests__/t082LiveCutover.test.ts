/**
 * T-082 AC: live useSkill is an adapter over resolveSkill.
 * AC1 — useSkill calls resolveSkill (does not reimplement hit).
 * AC2 — a card with bandMove PULL mutates range on the live path.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AttackMethod,
  CardRole,
  CombatRange,
  Posture,
  PrimaryStat,
} from '../../types';
import { SKILLS } from '../../constants/skills';
import { useSkill, type LiveCombatResult } from '../PlayerTurnSystem';
import { calculateDerivedStats } from '../StatSystem';
import type { CombatState } from '../combat-types';
import * as ResolveSkillSystem from '../ResolveSkillSystem';
import {
  BASE_STATS,
  createMockEnemy,
  createMockPlayer,
  createMockSkill,
} from './testFixtures';

const makeStats = (stats = BASE_STATS) => ({
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
  roomCombatEvasion: 0,
  fallDamageOnMiss: 0,
  roomConditionNames: [],
  enemyFirstHitMultiplier: 1,
  currentAp: 10,
  maxAp: 10,
  posture: Posture.BALANCED,
  hand: [],
  playablePool: [],
  currentRange: CombatRange.MEDIUM,
  playerMoveUsedThisTurn: false,
  enemyMoveUsedThisTurn: false,
  enemyCurrentAp: 5,
  enemyMaxAp: 5,
  turnIndex: 2,
  activeModes: [],
  marks: [],
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('T-082 AC1 useSkill delegates to resolveSkill', () => {
  it('calls resolveSkill and uses its hit commit, not StatSystem calculateDamage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);
    const spy = vi.spyOn(ResolveSkillSystem, 'resolveSkill');

    const skill = createMockSkill({
      id: 'live-cutover-hit',
      name: 'Cutover Strike',
      cardRole: CardRole.ATTACK,
      chakraCost: 4,
      apCost: 2,
      hpCost: 0,
      baseDamage: 12,
      scalingPerPoint: 4,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO,
      allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
    });
    const player = createMockPlayer({
      skills: [skill],
      currentChakra: 40,
      currentHp: 200,
    });
    const enemy = createMockEnemy({ currentHp: 80 });
    const combatState = baseCombatState({ currentRange: CombatRange.CLOSE });

    const result = useSkill(
      player,
      makeStats(),
      enemy,
      makeStats(),
      skill,
      combatState,
    );

    expect(spy).toHaveBeenCalledTimes(1);
    const [intent, state] = spy.mock.calls[0];
    expect(intent.skill.id).toBe(skill.id);
    expect(state.pools.ap).toBe(combatState.currentAp);
    expect(state.pools.chakra).toBe(player.currentChakra);
    expect(state.pools.hp).toBe(player.currentHp);
    expect(state.range).toBe(CombatRange.CLOSE);
    expect(state.enemyHp).toBe(enemy.currentHp);

    expect(result).not.toBeNull();
    const committed = spy.mock.results[0].value as ResolveSkillSystem.ResolveSkillResult;
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;
    // Adapter projects resolveSkill's hit — no parallel calculateDamage in useSkill.
    expect(result!.damageDealt).toBe(committed.damageDealt);
    expect(result!.newEnemyHp).toBe(committed.state.enemyHp);
    expect(result!.newPlayerChakra).toBe(committed.state.pools.chakra);
    expect(result!.apCost).toBe(2);
    expect(result!.enemyDefeated).toBe(committed.state.enemyHp <= 0);
    expect(spy.mock.calls[0][2]?.combatants).toBeDefined();
  });
});

describe('T-082 AC2 bandMove mutates range on live path', () => {
  it('PULL from MEDIUM lands on CLOSE through useSkill (not only resolveSkill)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);
    const spy = vi.spyOn(ResolveSkillSystem, 'resolveSkill');

    const reel = SKILLS.WIRE_KUNAI_REEL;
    expect(reel.bandMove).toEqual({ kind: 'PULL', steps: 1 });

    const player = createMockPlayer({
      skills: [reel],
      currentChakra: 30,
      currentHp: 200,
    });
    const enemy = createMockEnemy({ currentHp: 80 });
    const combatState = baseCombatState({
      currentRange: CombatRange.MEDIUM,
      currentAp: 6,
    });

    const result = useSkill(
      player,
      makeStats(),
      enemy,
      makeStats(),
      reel,
      combatState,
    ) as LiveCombatResult | null;

    expect(spy).toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result!.currentRange).toBe(CombatRange.CLOSE);
    expect(result!.playerMoveUsedThisTurn).toBe(false);
    expect(combatState.currentRange).toBe(CombatRange.MEDIUM);
  });
});
