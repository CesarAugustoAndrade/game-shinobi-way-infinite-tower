/**
 * T-110 probe — Curse Mark Surge SUPPORT; CURSE ON restore 2; self Vulnerable 10×2.
 */

import { CardRole, CombatRange, EffectType, MarkFamily, ModeRuntimeState, PrimaryStat } from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface CurseSurgeProbe {
  authoring: boolean;
  restore: boolean;
  requireOn: boolean;
  metrics: {
    apCost: number;
    hpCost: number;
    chargesFrom1: number;
    chargesAtMax: number;
    chargesMark2: number;
    hpAfter: number;
    vulnStacks: number;
    predictRestore: number;
    lotusVuln: number;
  };
}

export function runCurseSurgeProbe(): CurseSurgeProbe {
  const surge = SKILLS.CURSE_SURGE;
  const predict = SKILLS.SHARINGAN_PREDICT;
  const lotus = SKILLS.HIDDEN_LOTUS;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [surge],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const curseOn = (id: 'curse_mark_1' | 'curse_mark_2', charges: number) => ({
    instances: [{ id, family: MODE_FAMILY.CURSE, charges, state: ModeRuntimeState.ON }],
  });
  const off = resolveSkill({ skill: surge }, state());
  const low = resolveSkill({ skill: surge }, state({ modes: curseOn('curse_mark_1', 1) }));
  const full = resolveSkill({ skill: surge }, state({ modes: curseOn('curse_mark_1', 3) }));
  const two = resolveSkill({ skill: surge }, state({ modes: curseOn('curse_mark_2', 1) }));
  const vuln = low.ok ? low.state.marks.find((m) => m.id === 'vulnerable') : undefined;
  return {
    authoring:
      surge.cardRole === CardRole.SUPPORT &&
      surge.apCost === 1 &&
      surge.hpCost === 10 &&
      surge.chakraCost === 0 &&
      surge.cooldown === 4 &&
      surge.baseDamage === 0 &&
      surge.modeInteraction?.requireOn === true &&
      surge.modeInteraction.requireFamily === MODE_FAMILY.CURSE &&
      surge.modeInteraction.restoreCharges === 2 &&
      surge.markEffects?.some(
        (m) =>
          m.id === 'vulnerable' &&
          m.stacks === 10 &&
          m.duration === 2 &&
          m.family === MarkFamily.STAT &&
          m.targetActor === 'self',
      ) === true &&
      surge.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH && e.value === 0.3,
      ) !== true,
    restore:
      low.ok === true &&
      low.state.modes.instances.find((m) => m.id === 'curse_mark_1')?.charges === 3 &&
      vuln?.stacks === 10 &&
      low.state.pools.hp === 30 &&
      full.ok === true &&
      full.state.modes.instances.find((m) => m.id === 'curse_mark_1')?.charges === 3 &&
      two.ok === true &&
      two.state.modes.instances.find((m) => m.id === 'curse_mark_2')?.charges === 3,
    requireOn: off.ok === false && off.reason === 'mode-required' && off.state.pools.hp === 40,
    metrics: {
      apCost: surge.apCost ?? 0,
      hpCost: surge.hpCost ?? 0,
      chargesFrom1: low.ok ? (low.state.modes.instances.find((m) => m.id === 'curse_mark_1')?.charges ?? 0) : 0,
      chargesAtMax: full.ok
        ? (full.state.modes.instances.find((m) => m.id === 'curse_mark_1')?.charges ?? 0)
        : 0,
      chargesMark2: two.ok
        ? (two.state.modes.instances.find((m) => m.id === 'curse_mark_2')?.charges ?? 0)
        : 0,
      hpAfter: low.ok ? low.state.pools.hp : 0,
      vulnStacks: vuln?.stacks ?? 0,
      predictRestore: predict.modeInteraction?.restoreCharges ?? 0,
      lotusVuln: lotus.markEffects?.find((m) => m.id === 'vulnerable')?.stacks ?? 0,
    },
  };
}

export function printCurseSurgeProbe(probe: CurseSurgeProbe): void {
  const m = probe.metrics;
  console.log('\n── T-110 Curse Mark Surge probe ──');
  console.log(`  authoring SUPPORT CURSE +2 + Vulnerable 10×2: ${probe.authoring}`);
  console.log(`  restore 1→3 / cap stay / mark2 1→3 + HP−10:  ${probe.restore}`);
  console.log(`  require CURSE ON else consume nothing:       ${probe.requireOn}`);
  console.log('  ── balance vs mute STR +30% and Predict restore 1 / Lotus Vulnerable 30 ──');
  console.log(`  AP / HP / CD:       ${m.apCost} / ${m.hpCost} / 4  (unchanged 1 / 10 / 4)`);
  console.log(`  charges 1→ / cap:   ${m.chargesFrom1} / ${m.chargesAtMax}  (restore 2 vs Predict ${m.predictRestore})`);
  console.log(`  mark2 1→:           ${m.chargesMark2}  (family bind)`);
  console.log(`  live vulnerable:    ${m.vulnStacks}×2  (was mute STR +30%; Lotus ${m.lotusVuln}×2)`);
  console.log(`  HP after legal:     ${m.hpAfter}  (40−10)`);
}
