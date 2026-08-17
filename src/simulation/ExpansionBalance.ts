/**
 * T-096 probe — Expansion ATTACK 16 CLOSE + self STR +2 duration 1.
 */

import { CardRole, CombatRange, EffectType, MarkFamily, PrimaryStat } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface ExpansionProbe {
  authoring: boolean;
  resolve: boolean;
  rangeGate: boolean;
  metrics: {
    baseDamage: number;
    apCost: number;
    chakraCost: number;
    strStacks: number;
    strDuration: number;
    whirlDmg: number;
    dmgPerAp: number;
  };
}

export function runExpansionProbe(): ExpansionProbe {
  const jutsu = SKILLS.EXPANSION;
  const whirl = SKILLS.LEAF_WHIRLWIND;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [jutsu],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const hit = { rollHit: () => ({ hit: true as const, damage: jutsu.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const landed = resolveSkill({ skill: jutsu }, state(), hit);
  const whiff = resolveSkill({ skill: jutsu }, state(), miss);
  const illegal = resolveSkill({ skill: jutsu }, state({ range: CombatRange.MEDIUM }), hit);
  const mark = landed.ok ? landed.state.marks.find((m) => m.id === 'expansion_str') : undefined;
  const missMark = whiff.ok ? whiff.state.marks.find((m) => m.id === 'expansion_str') : undefined;
  const ap = jutsu.apCost ?? 0;
  const dmg = landed.ok ? landed.damageDealt : 0;
  return {
    authoring:
      jutsu.id === 'expansion' &&
      jutsu.cardRole === CardRole.ATTACK &&
      jutsu.apCost === 3 &&
      jutsu.chakraCost === 6 &&
      jutsu.cooldown === 4 &&
      jutsu.baseDamage === 16 &&
      (jutsu.allowedRanges ?? []).includes(CombatRange.CLOSE) &&
      jutsu.markEffects?.some(
        (m) =>
          m.id === 'expansion_str' &&
          m.stacks === 2 &&
          m.duration === 1 &&
          m.family === MarkFamily.STAT,
      ) === true &&
      jutsu.effects?.some(
        (e) =>
          e.type === EffectType.BUFF &&
          e.targetStat === PrimaryStat.STRENGTH &&
          e.value === 0.5,
      ) !== true,
    resolve:
      landed.ok === true &&
      landed.damageDealt === 16 &&
      mark?.stacks === 2 &&
      mark.duration === 1 &&
      mark.family === MarkFamily.STAT &&
      missMark?.stacks === 2,
    rangeGate: illegal.ok === false,
    metrics: {
      baseDamage: dmg,
      apCost: ap,
      chakraCost: jutsu.chakraCost,
      strStacks: mark?.stacks ?? 0,
      strDuration: mark?.duration ?? 0,
      whirlDmg: whirl.baseDamage,
      dmgPerAp: ap > 0 ? dmg / ap : 0,
    },
  };
}

export function printExpansionProbe(probe: ExpansionProbe): void {
  const m = probe.metrics;
  console.log('\n── T-096 Expansion probe ──');
  console.log(`  authoring ATTACK 16 CLOSE + STR +2/1: ${probe.authoring}`);
  console.log(`  resolve 16 + self STAT 2/1 (miss too): ${probe.resolve}`);
  console.log(`  MEDIUM reject:                        ${probe.rangeGate}`);
  console.log('  ── balance vs legacy AP2 + STR +50%×2 and Leaf Whirlwind 14 ──');
  console.log(`  dmg / AP:           ${m.baseDamage} / ${m.apCost}  (dmg/AP ${m.dmgPerAp.toFixed(2)}; was 16 / 2)`);
  console.log(`  CP:                 ${m.chakraCost}  (unchanged 6)`);
  console.log(`  STR stacks / dur:   ${m.strStacks} / ${m.strDuration}  (was mute STR +50%×2)`);
  console.log(`  Whirlwind sibling:  ${m.whirlDmg} dmg CLOSE no self STR`);
}
