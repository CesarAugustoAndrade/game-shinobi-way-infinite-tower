/**
 * T-013 AC: live Skill Config — Main, learn/forget, draw feed, combat lock.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, CombatRange, GameState, Posture } from '../../types';
import { createMockPlayer, createMockSkill, BASE_STATS } from './testFixtures';
import {
  applyForgetSkill,
  applyLearnSkill,
  bootstrapPlayerSkillConfig,
  rewriteSkillConfig,
} from '../SkillConfigLive';
import { buildUpkeepWeightContext, processUpkeep } from '../PlayerTurnSystem';
import { calculateDerivedStats } from '../StatSystem';
import type { CombatState } from '../combat-types';

const attack = (id: string) => createMockSkill({ id, name: id, cardRole: CardRole.ATTACK });

const stats = () => ({
  primary: { ...BASE_STATS },
  effectivePrimary: { ...BASE_STATS },
  derived: calculateDerivedStats(BASE_STATS, {}),
});

const combat = (overrides: Partial<CombatState> = {}): CombatState => ({
  isFirstTurn: false,
  firstHitMultiplier: 1,
  playerGoesFirst: true,
  playerInitiativeBonus: 0,
  xpMultiplier: 1,
  terrain: null,
  approachApplied: true,
  skipFirstSkillCost: false,
  artifactGutsUsed: false,
  locationTerrainMods: null,
  roomCombatEvasion: 0,
  fallDamageOnMiss: 0,
  roomConditionNames: [],
  enemyFirstHitMultiplier: 1,
  currentAp: 0,
  maxAp: 10,
  posture: Posture.BALANCED,
  hand: [],
  playablePool: [],
  currentRange: CombatRange.CLOSE,
  playerMoveUsedThisTurn: false,
  enemyMoveUsedThisTurn: false,
  enemyCurrentAp: 5,
  enemyMaxAp: 5,
  turnIndex: 1,
  activeModes: [],
  marks: [],
  ...overrides,
});

describe('T-013 ensure main', () => {
  it('bootstraps an empty Main to a loadout ATTACK and notifies', () => {
    const player = createMockPlayer({
      skills: [attack('rasengan'), createMockSkill({ id: 'shuriken', cardRole: CardRole.SIDE_ATTACK })],
      skillConfig: { mainAttackId: null, modeUpkeepPriority: [] },
    });
    const result = bootstrapPlayerSkillConfig(player, () => 0);
    expect(result.notified).toBe(true);
    expect(result.player.skillConfig?.mainAttackId).toBe('rasengan');
    expect(['rasengan']).toContain(result.player.skillConfig?.mainAttackId);
  });
});

describe('T-013 learn and forget', () => {
  it('preserves Main on learn and reassigns when Main is forgotten', () => {
    const player = createMockPlayer({
      skills: [attack('rasengan'), attack('chidori')],
      skillConfig: { mainAttackId: 'rasengan', modeUpkeepPriority: [] },
    });
    const learned = applyLearnSkill(player, attack('twin_lion_fists'), GameState.EXPLORE);
    expect(learned.refused).toBe(false);
    expect(learned.player.skillConfig?.mainAttackId).toBe('rasengan');
    expect(learned.player.skills.map((s) => s.id)).toContain('twin_lion_fists');

    const forgotten = applyForgetSkill(learned.player, 'rasengan', GameState.EXPLORE, () => 0);
    expect(forgotten.player.skillConfig?.mainAttackId).not.toBe('rasengan');
    expect(['chidori', 'twin_lion_fists']).toContain(forgotten.player.skillConfig?.mainAttackId);
    expect(forgotten.player.skills.some((s) => s.id === 'rasengan')).toBe(false);
  });
});

describe('T-013 draw feed and combat lock', () => {
  it('feeds mainAttackId into upkeep weight context and refuses combat rewrites', () => {
    const player = createMockPlayer({
      skills: [attack('rasengan'), attack('chidori')],
      skillConfig: { mainAttackId: 'chidori', modeUpkeepPriority: ['byakugan'] },
    });
    const ctx = buildUpkeepWeightContext(player, combat());
    expect(ctx.mainAttackId).toBe('chidori');

    processUpkeep(player, stats(), combat({ playablePool: player.skills }));
    expect(buildUpkeepWeightContext(player, combat()).mainAttackId).toBe(player.skillConfig?.mainAttackId);

    const locked = rewriteSkillConfig(
      player,
      { mainAttackId: 'rasengan', modeUpkeepPriority: [] },
      GameState.COMBAT,
    );
    expect(locked.refused).toBe(true);
    expect(locked.player.skillConfig?.mainAttackId).toBe('chidori');

    const learnLocked = applyLearnSkill(player, attack('water_dragon'), GameState.COMBAT);
    expect(learnLocked.refused).toBe(true);
    expect(learnLocked.player.skills.map((s) => s.id)).not.toContain('water_dragon');
  });
});
