/**
 * T-035 probe — 64 Palms authoring; base/1-CP; enhance S=3; miss keeps CP.
 */

import { CardRole, CombatActor, CombatRange, MarkConsumeTiming, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface SixtyFourPalmsProbe {
  authoring: boolean;
  baseNoEnhance: boolean;
  enhanceConsume: boolean;
  missKeep: boolean;
  /** Live resolve numbers (legacy authoring was 25 TRUE / AP2). */
  metrics: {
    baseline: number;
    enhancedS3: number;
    apCost: number;
    chakraCost: number;
    dmgPerApBase: number;
    dmgPerApEnhanced: number;
  };
}

export function runSixtyFourPalmsProbe(): SixtyFourPalmsProbe {
  const palms = SKILLS.SIXTY_FOUR_PALMS;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 8, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [palms],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const byakugan = {
    instances: [
      { id: 'byakugan', family: MODE_FAMILY.HYUGA, charges: 4, state: ModeRuntimeState.ON },
    ],
  };
  const cp = (stacks: number) => ({
    id: 'chakra_point',
    sourceSkillId: 'air_palm',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks,
    consume: MarkConsumeTiming.IMPACT,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: palms.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const off = resolveSkill({ skill: palms }, state(), hit);
  const one = resolveSkill({ skill: palms }, state({ modes: byakugan, marks: [cp(1)] }), hit);
  const on = resolveSkill({ skill: palms }, state({ modes: byakugan, marks: [cp(3)] }), hit);
  const missed = resolveSkill({ skill: palms }, state({ modes: byakugan, marks: [cp(3)] }), miss);
  const ap = palms.apCost ?? 0;
  const baseDmg = off.ok ? off.damageDealt : 0;
  const enhDmg = on.ok ? on.damageDealt : 0;
  return {
    authoring:
      palms.cardRole === CardRole.ATTACK &&
      palms.hitCount === 8 &&
      palms.baseDamage === 3 &&
      palms.apCost === 4 &&
      palms.chakraCost === 7 &&
      palms.cooldown === 5 &&
      palms.penetration === 0.3 &&
      palms.modeInteraction?.modeId === 'byakugan' &&
      palms.modeInteraction.minMarkStacks === 2 &&
      palms.modeInteraction.damagePerMarkStackBonus === 0.1 &&
      palms.modeInteraction.damageMarkStackCap === 0.4 &&
      palms.modeInteraction.consumeCharges === 1,
    baseNoEnhance:
      off.ok &&
      off.damageDealt === 24 &&
      one.ok &&
      one.damageDealt === 24 &&
      one.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 4,
    enhanceConsume:
      on.ok &&
      on.damageDealt === Math.floor(24 * 1.3) &&
      on.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 3 &&
      !on.state.marks.some((m) => m.id === 'chakra_point'),
    missKeep:
      missed.ok &&
      missed.damageDealt === 0 &&
      missed.state.marks.some((m) => m.id === 'chakra_point') &&
      missed.state.modes.instances.find((m) => m.id === 'byakugan')?.charges === 3,
    metrics: {
      baseline: baseDmg,
      enhancedS3: enhDmg,
      apCost: ap,
      chakraCost: palms.chakraCost,
      dmgPerApBase: ap > 0 ? baseDmg / ap : 0,
      dmgPerApEnhanced: ap > 0 ? enhDmg / ap : 0,
    },
  };
}

export function printSixtyFourPalmsProbe(probe: SixtyFourPalmsProbe): void {
  const m = probe.metrics;
  console.log('\n── T-035 64 Palms probe ──');
  console.log(`  authoring 8×3 + CP: ${probe.authoring}`);
  console.log(`  base / 1 CP:        ${probe.baseNoEnhance}`);
  console.log(`  S=3 +30% consume:   ${probe.enhanceConsume}`);
  console.log(`  miss keep + spend:  ${probe.missKeep}`);
  console.log('  ── balance vs legacy 25 TRUE/AP2 ──');
  console.log(`  base dmg:           ${m.baseline}  (was 25 TRUE)`);
  console.log(`  S=3 enhanced dmg:   ${m.enhancedS3}  (was none / 25)`);
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (was 2 / 7)`);
  console.log(`  dmg/AP base:        ${m.dmgPerApBase.toFixed(2)}  (was 12.50)`);
  console.log(`  dmg/AP enhanced:    ${m.dmgPerApEnhanced.toFixed(2)}  (was n/a)`);
}
