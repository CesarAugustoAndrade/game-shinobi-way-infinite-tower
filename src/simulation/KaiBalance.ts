/**
 * T-046 probe — Kai authoring; cleanse+refund; empty pay-only.
 */

import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface KaiProbe {
  authoring: boolean;
  cleanseRefund: boolean;
  empty: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    chakraAfterCleanse: number;
    chakraAfterEmpty: number;
    refunded: boolean;
  };
}

export function runKaiProbe(): KaiProbe {
  const skill = SKILLS.KAI;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 10, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const confusion = {
    id: 'confusion-player',
    name: 'Confusion',
    duration: 2,
    effect: { type: EffectType.CONFUSION, duration: 2, chance: 1 },
    source: 'false_surroundings',
  };
  const silence = {
    id: 'silence-player',
    name: 'Silence',
    duration: 1,
    effect: { type: EffectType.SILENCE, duration: 1, chance: 1 },
    source: 'sealing_tag',
  };
  const bind = {
    id: 'mental_bind',
    sourceSkillId: 'fixture',
    owner: CombatActor.ENEMY,
    target: CombatActor.PLAYER,
    duration: 2,
    stacks: 1,
    family: MarkFamily.HARD_CONTROL,
  };
  const enemyCp = {
    id: 'chakra_point',
    sourceSkillId: 'air_palm',
    owner: CombatActor.PLAYER,
    target: CombatActor.ENEMY,
    duration: 2,
    stacks: 2,
  };
  const hit = resolveSkill(
    { skill },
    state({ playerBuffs: [confusion, silence], marks: [enemyCp, bind] }),
  );
  const empty = resolveSkill({ skill }, state({ marks: [enemyCp] }));
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 3 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 0 &&
      skill.supportCleanse?.confusion === true &&
      skill.supportCleanse.silence === true &&
      skill.supportCleanse.oneHostileMentalMark === true &&
      skill.supportCleanse.refundChakra === 3 &&
      !skill.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.CALMNESS && e.value === 0.5,
      ),
    cleanseRefund:
      hit.ok &&
      hit.damageDealt === 0 &&
      hit.state.pools.chakra === 10 &&
      !hit.state.playerBuffs.some((b) => b.effect.type === EffectType.CONFUSION) &&
      !hit.state.playerBuffs.some((b) => b.effect.type === EffectType.SILENCE) &&
      !hit.state.marks.some((m) => m.id === 'mental_bind') &&
      hit.state.marks.some((m) => m.id === 'chakra_point'),
    empty: empty.ok && empty.state.pools.chakra === 7 && empty.state.marks.some((m) => m.id === 'chakra_point'),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      chakraAfterCleanse: hit.ok ? hit.state.pools.chakra : -1,
      chakraAfterEmpty: empty.ok ? empty.state.pools.chakra : -1,
      refunded: hit.ok && hit.state.pools.chakra === 10,
    },
  };
}

export function printKaiProbe(probe: KaiProbe): void {
  const m = probe.metrics;
  console.log('\n── T-046 Kai probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  cleanse + refund:   ${probe.cleanseRefund}`);
  console.log(`  empty no refund:    ${probe.empty}`);
  console.log('  ── balance vs legacy CALMNESS +50%×3 ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 1 / 3)`);
  console.log(`  chakra cleanse/empty: ${m.chakraAfterCleanse} / ${m.chakraAfterEmpty}  (was 7 / 7, no refund)`);
  console.log(`  refunded on hit:    ${m.refunded}  (was CALMNESS %)`);
}
