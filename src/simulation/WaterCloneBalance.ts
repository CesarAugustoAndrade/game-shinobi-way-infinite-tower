/**
 * T-092 probe — Water Clone SIDE 11; hit Shield 15; miss no plant; no clone charges.
 */

import { CardRole, CombatRange, MarkFamily, ModeRuntimeState } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface WaterCloneProbe {
  authoring: boolean;
  hitShield: boolean;
  miss: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    shieldAbsorb: number;
    sandShieldAbsorb: number;
    cloneChargesAfter: number;
    dmgPerAp: number;
  };
}

export function runWaterCloneProbe(): WaterCloneProbe {
  const clone = SKILLS.WATER_CLONE;
  const sand = SKILLS.SAND_SHIELD;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [clone],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const clonesOn = {
    instances: [
      {
        id: 'shadow_clone',
        family: MODE_FAMILY.CLONES,
        charges: 3,
        state: ModeRuntimeState.ON,
      },
    ],
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: clone.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill: clone }, state({ modes: clonesOn }), hit);
  const whiff = resolveSkill({ skill: clone }, state(), miss);
  const shield = landed.ok
    ? landed.state.marks.find((m) => m.id === 'water_clone_shield')
    : undefined;
  const charges = landed.ok
    ? (landed.state.modes.instances.find((m) => m.id === 'shadow_clone')?.charges ?? -1)
    : -1;
  const sandAbsorb = sand.markEffects?.find((m) => m.family === MarkFamily.SHIELD)?.stacks ?? 0;
  const ap = clone.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  return {
    authoring:
      clone.cardRole === CardRole.SIDE_ATTACK &&
      clone.apCost === 2 &&
      clone.chakraCost === 6 &&
      clone.cooldown === 4 &&
      clone.baseDamage === 11 &&
      (clone.allowedRanges ?? []).includes(CombatRange.CLOSE) &&
      (clone.allowedRanges ?? []).includes(CombatRange.MEDIUM) &&
      clone.modeInteraction === undefined &&
      clone.markEffects?.some(
        (m) =>
          m.id === 'water_clone_shield' &&
          m.stacks === 15 &&
          m.family === MarkFamily.SHIELD &&
          m.targetActor === 'self' &&
          m.requireHit === true,
      ) === true,
    hitShield:
      landed.ok === true &&
      landed.damageDealt === 11 &&
      shield?.stacks === 15 &&
      shield.family === MarkFamily.SHIELD &&
      charges === 3,
    miss:
      whiff.ok === true &&
      whiff.damageDealt === 0 &&
      !whiff.state.marks.some((m) => m.id === 'water_clone_shield'),
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: clone.chakraCost,
      shieldAbsorb: shield?.stacks ?? 0,
      sandShieldAbsorb: sandAbsorb,
      cloneChargesAfter: charges,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printWaterCloneProbe(probe: WaterCloneProbe): void {
  const m = probe.metrics;
  console.log('\n── T-092 Water Clone probe ──');
  console.log(`  authoring SIDE 11 + Shield 15: ${probe.authoring}`);
  console.log(`  hit shield + clones stay 3:    ${probe.hitShield}`);
  console.log(`  miss no plant:                 ${probe.miss}`);
  console.log('  ── balance vs legacy mute STR +40%×2 and Sand Shield 45 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 11 / 2)`);
  console.log(`  CP:                 ${m.chakraCost}  (unchanged 6)`);
  console.log(`  live shield:        ${m.shieldAbsorb}  (was mute STR +40%; Sand ${m.sandShieldAbsorb})`);
  console.log(`  clone charges:      ${m.cloneChargesAfter}  (must stay 3)`);
}
