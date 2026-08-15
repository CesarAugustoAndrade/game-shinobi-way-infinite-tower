/**
 * T-068 probe — Basic Medical heal 25 + one Poison/Bleed; vs mute HEAL 25 effects[].
 */

import {
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  MarkFamily,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface BasicMedicalProbe {
  authoring: boolean;
  healCleanse: boolean;
  healOnly: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    healAmount: number;
    hpAfterCleanse: number;
    hpAfterOnly: number;
    leftoverHealEffect: number;
    dotsRemoved: number;
    dotsRemaining: number;
    apAfter: number;
    cpAfter: number;
  };
}

export function runBasicMedicalProbe(): BasicMedicalProbe {
  const skill = SKILLS.BASIC_MEDICAL;
  const poison = {
    id: 'poison',
    sourceSkillId: 'fixture',
    owner: CombatActor.ENEMY,
    target: CombatActor.PLAYER,
    duration: 3,
    stacks: 5,
    family: MarkFamily.DOT,
  };
  const bleed = {
    id: 'bleed',
    sourceSkillId: 'fixture',
    owner: CombatActor.ENEMY,
    target: CombatActor.PLAYER,
    duration: 2,
    stacks: 3,
    family: MarkFamily.DOT,
  };
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 50, maxHp: 100 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
    ...overrides,
  });
  const withDots = resolveSkill({ skill }, state({ marks: [poison, bleed] }));
  const noDots = resolveSkill({ skill }, state());
  const leftoverHeal =
    skill.effects?.find((e) => e.type === EffectType.HEAL)?.value ?? 0;
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 2 &&
      skill.chakraCost === 5 &&
      skill.cooldown === 5 &&
      skill.baseDamage === 0 &&
      skill.supportHeal?.amount === 25 &&
      leftoverHeal === 0,
    healCleanse:
      withDots.ok === true &&
      withDots.damageDealt === 0 &&
      withDots.state.pools.hp === 75 &&
      withDots.state.marks.some((m) => m.id === 'poison') === false &&
      withDots.state.marks.some((m) => m.id === 'bleed') === true,
    healOnly:
      noDots.ok === true &&
      noDots.state.pools.hp === 75 &&
      noDots.state.marks.length === 0,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      healAmount: skill.supportHeal?.amount ?? 0,
      hpAfterCleanse: withDots.ok ? withDots.state.pools.hp : -1,
      hpAfterOnly: noDots.ok ? noDots.state.pools.hp : -1,
      leftoverHealEffect: leftoverHeal,
      dotsRemoved: withDots.ok
        ? 2 - withDots.state.marks.filter((m) => m.id === 'poison' || m.id === 'bleed').length
        : -1,
      dotsRemaining: withDots.ok
        ? withDots.state.marks.filter((m) => m.id === 'poison' || m.id === 'bleed').length
        : -1,
      apAfter: withDots.ok ? withDots.state.pools.ap : -1,
      cpAfter: withDots.ok ? withDots.state.pools.chakra : -1,
    },
  };
}

export function printBasicMedicalProbe(probe: BasicMedicalProbe): void {
  const m = probe.metrics;
  console.log('\n── T-068 Basic Medical probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  heal + one DoT:         ${probe.healCleanse}`);
  console.log(`  heal without DoT:       ${probe.healOnly}`);
  console.log('  ── balance vs mute HEAL 25 effects[] ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 2 / 5)`);
  console.log(`  heal amount:            ${m.healAmount}  (was unused HEAL 25)`);
  console.log(`  hp 50→ (dots / none):   ${m.hpAfterCleanse} / ${m.hpAfterOnly}`);
  console.log(`  leftover HEAL effect:   ${m.leftoverHealEffect}  (was 25)`);
  console.log(`  DoT removed / remain:   ${m.dotsRemoved} / ${m.dotsRemaining}  (was 0 / 2)`);
  console.log(`  pools after:            AP ${m.apAfter} / CP ${m.cpAfter}`);
  console.log('  ── equilibrium ──');
  console.log('  new: guaranteed 25 HP + exactly one Poison/Bleed instance.');
  console.log('  old: mute HEAL 25 (no pool change, no cleanse) — dead packaging.');
  console.log('  verdict: cheap sustain SUPPORT now actually heals; one-instance cleanse is honest.');
}
