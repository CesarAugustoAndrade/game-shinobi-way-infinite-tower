/**
 * T-088 probe — resolveSkill ATTACK matches calculateDamage + resolveSuccessfulHit.
 */

import { CardRole, CombatRange, ElementType } from '../game/types';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import {
  resolveSkill,
  type ResolveSkillCombatants,
  type ResolveSkillState,
} from '../game/systems/ResolveSkillSystem';
import { calculateDamage, calculateDerivedStats } from '../game/systems/StatSystem';
import { resolveSuccessfulHit } from '../game/systems/SkillResolutionSystem';
import { BASE_STATS, createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface HitCoreProbe {
  matchesCore: boolean;
  stubWouldDiverge: boolean;
  metrics: {
    coreInteger: number;
    resolveDealt: number;
    stubBase: number;
  };
}

const derived = calculateDerivedStats(BASE_STATS);
const combatants: ResolveSkillCombatants = {
  attackerPrimary: BASE_STATS,
  attackerDerived: derived,
  defenderPrimary: BASE_STATS,
  defenderDerived: derived,
  attackerElement: ElementType.PHYSICAL,
  defenderElement: ElementType.PHYSICAL,
};
const damageOptions = { forceHit: true, forceCrit: false } as const;
const attack = createMockSkill({
  id: 't088-strike',
  cardRole: CardRole.ATTACK,
  apCost: 2,
  chakraCost: 4,
  hpCost: 0,
  allowedRanges: [CombatRange.CLOSE],
});

export function runHitCoreProbe(): HitCoreProbe {
  const rolled = calculateDamage(
    combatants.attackerPrimary,
    combatants.attackerDerived,
    combatants.defenderPrimary,
    combatants.defenderDerived,
    attack,
    ElementType.PHYSICAL,
    ElementType.PHYSICAL,
    damageOptions,
  );
  const coreInteger = resolveSuccessfulHit({
    rawDamage: rolled.finalDamage,
    preMitigationMultipliers: [],
    defenderBuffs: [],
    defenderLabel: 'enemy',
  }).finalDamage;
  const state: ResolveSkillState = {
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [attack],
    playerBuffs: [],
    enemyHp: 200,
  };
  const resolved = resolveSkill({ skill: attack }, state, { combatants, damageOptions });
  const resolveDealt = resolved.ok ? resolved.damageDealt : -1;
  return {
    matchesCore: resolveDealt === coreInteger && coreInteger > 0,
    stubWouldDiverge: attack.baseDamage !== coreInteger,
    metrics: {
      coreInteger,
      resolveDealt,
      stubBase: attack.baseDamage,
    },
  };
}

export function printHitCoreProbe(probe: HitCoreProbe): void {
  const m = probe.metrics;
  console.log('\n── T-088 hit-core unify probe ──');
  console.log(`  matches core integer:   ${probe.matchesCore}  (resolve ${m.resolveDealt} / core ${m.coreInteger})`);
  console.log(`  stub would diverge:     ${probe.stubWouldDiverge}  (0.85 path used base ${m.stubBase})`);
  console.log('  ── balance vs dual physics ──');
  console.log(`  stub baseDamage:        ${m.stubBase}`);
  console.log(`  live/core integer:      ${m.coreInteger}  (scaling + defense)`);
  console.log(`  resolveSkill now:       ${m.resolveDealt}`);
}
