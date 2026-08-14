/**
 * T-043 probe — Shunshin authoring; one-band no-manual-move; next Offensive +1 DEX.
 */

import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkConsumeTiming,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface ShunshinProbe {
  authoring: boolean;
  moveMark: boolean;
  dexPayoff: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    approachedRange: string;
    edgeRange: string;
    baseDamage: number;
    dexDamage: number;
    dexDelta: number;
    manualMoveSpent: boolean;
  };
}

export function runShunshinProbe(): ShunshinProbe {
  const skill = SKILLS.SHUNSHIN;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    ...overrides,
  });
  const dexSide = createMockSkill({
    id: 'dex_slash',
    cardRole: CardRole.SIDE_ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    scalingPerPoint: 4,
    scalingStat: PrimaryStat.DEXTERITY,
    currentCooldown: 0,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: dexSide.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const approach = resolveSkill({ skill, movement: { kind: 'PULL' } }, state());
  const edge = resolveSkill({ skill, movement: { kind: 'PUSH' } }, state({ range: CombatRange.LONG }));
  const planted = resolveSkill({ skill }, state());
  const boosted =
    planted.ok &&
    resolveSkill({ skill: dexSide }, { ...planted.state, skills: [dexSide] }, hit);
  const clean = resolveSkill({ skill: dexSide }, state({ skills: [dexSide] }), hit);
  const missed =
    planted.ok &&
    resolveSkill({ skill: dexSide }, { ...planted.state, skills: [dexSide] }, miss);
  const supportAgain = planted.ok && resolveSkill({ skill }, planted.state);
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 4 &&
      skill.cooldown === 3 &&
      skill.baseDamage === 0 &&
      skill.bandMove?.kind === 'SELF_APPROACH' &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'shunshin_dex' &&
          m.consume === MarkConsumeTiming.ATTEMPT &&
          m.targetActor === 'self',
      ) === true &&
      !skill.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.SPEED && e.value === 0.4,
      ),
    moveMark:
      approach.ok &&
      approach.damageDealt === 0 &&
      approach.state.range === CombatRange.CLOSE &&
      approach.state.playerMoveUsedThisTurn === false &&
      approach.state.marks.some(
        (m) => m.id === 'shunshin_dex' && m.target === CombatActor.PLAYER && m.duration === 1,
      ) &&
      edge.ok === true &&
      edge.state.range === CombatRange.LONG &&
      edge.state.marks.some((m) => m.id === 'shunshin_dex'),
    dexPayoff:
      typeof boosted === 'object' &&
      boosted.ok &&
      boosted.damageDealt === dexSide.baseDamage + dexSide.scalingPerPoint &&
      !boosted.state.marks.some((m) => m.id === 'shunshin_dex') &&
      clean.ok === true &&
      clean.damageDealt === dexSide.baseDamage &&
      typeof supportAgain === 'object' &&
      supportAgain.ok &&
      supportAgain.state.marks.some((m) => m.id === 'shunshin_dex') &&
      typeof missed === 'object' &&
      missed.ok &&
      missed.damageDealt === 0 &&
      !missed.state.marks.some((m) => m.id === 'shunshin_dex'),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      approachedRange: approach.ok ? approach.state.range : 'fail',
      edgeRange: edge.ok ? edge.state.range : 'fail',
      baseDamage: clean.ok ? clean.damageDealt : 0,
      dexDamage: typeof boosted === 'object' && boosted.ok ? boosted.damageDealt : 0,
      dexDelta:
        typeof boosted === 'object' && boosted.ok && clean.ok
          ? boosted.damageDealt - clean.damageDealt
          : 0,
      manualMoveSpent: approach.ok ? approach.state.playerMoveUsedThisTurn === true : true,
    },
  };
}

export function printShunshinProbe(probe: ShunshinProbe): void {
  const m = probe.metrics;
  console.log('\n── T-043 Shunshin probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  band + mark:        ${probe.moveMark}`);
  console.log(`  DEX payoff consume: ${probe.dexPayoff}`);
  console.log('  ── balance vs legacy SPEED +40%×2 (no move) ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 1 / 4)`);
  console.log(`  MEDIUM approach:    ${m.approachedRange}  (was stay / SPEED %)`);
  console.log(`  LONG retreat edge:  ${m.edgeRange}  (stay LONG, still plant)`);
  console.log(`  next DEX 10+4:      ${m.dexDamage}  (was ${m.baseDamage} / no mark)`);
  console.log(`  DEX Δ:              ${m.dexDelta}  (catalog +1 DEX via scalingPerPoint)`);
  console.log(`  manual move spent:  ${m.manualMoveSpent}  (must be false)`);
}
