/**
 * T-079 probe — Killing Intent 80% Stun 1 + Fear 20 always; vs unused 30% Stun / Hell Viewing Fear.
 */

import { CardRole, CombatActor, CombatRange, EffectType, MarkFamily } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { applyFearOutgoing } from '../game/systems/MarkSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface KillingIntentProbe {
  authoring: boolean;
  stunSuccess: boolean;
  stunFail: boolean;
  fearAlways: boolean;
  metrics: {
    apCost: number;
    chance: number;
    stunDuration: number;
    failSelf: number;
    fearStacks: number;
    feared100: number;
    hellFearStacks: number;
    mindChance: number;
    leftoverStun03: boolean;
    successDamage: number;
    failDamage: number;
  };
}

function hasStun(
  buffs: { effect: { type: EffectType }; duration: number }[] | undefined,
  duration: number,
): boolean {
  return (buffs ?? []).some(
    (buff) => buff.effect.type === EffectType.STUN && buff.duration === duration,
  );
}

export function runKillingIntentProbe(): KillingIntentProbe {
  const skill = SKILLS.KILLING_INTENT;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 50,
  });
  const win = resolveSkill({ skill }, state(), { rng: () => 0 });
  const lose = resolveSkill({ skill }, state(), { rng: () => 0.99 });
  const fear = win.ok ? win.state.marks.find((m) => m.id === 'fear') : undefined;
  const loseFear = lose.ok ? lose.state.marks.find((m) => m.id === 'fear') : undefined;
  const feared = applyFearOutgoing(100, win.ok ? win.state.marks : []);
  const hellFear = SKILLS.HELL_VIEWING.markEffects?.find((m) => m.id === 'fear');
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 2 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 6 &&
      skill.baseDamage === 0 &&
      skill.controlStun?.chance === 0.8 &&
      skill.controlStun.enemyDuration === 1 &&
      skill.controlStun.failSelfDuration === undefined &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'fear' &&
          m.stacks === 20 &&
          m.duration === 1 &&
          m.family === MarkFamily.STAT &&
          m.targetActor === 'enemy',
      ) === true &&
      !skill.effects?.some((e) => e.type === EffectType.STUN),
    stunSuccess:
      win.ok === true &&
      win.damageDealt === 0 &&
      hasStun(win.state.enemyBuffs, 1) &&
      !hasStun(win.state.playerBuffs, 1),
    stunFail:
      lose.ok === true &&
      lose.damageDealt === 0 &&
      !hasStun(lose.state.enemyBuffs, 1) &&
      !hasStun(lose.state.playerBuffs, 1),
    fearAlways:
      fear?.target === CombatActor.ENEMY &&
      fear.stacks === 20 &&
      loseFear?.stacks === 20 &&
      feared.damage === 80,
    metrics: {
      apCost: skill.apCost ?? 0,
      chance: skill.controlStun?.chance ?? 0,
      stunDuration: skill.controlStun?.enemyDuration ?? 0,
      failSelf: skill.controlStun?.failSelfDuration ?? 0,
      fearStacks: fear?.stacks ?? 0,
      feared100: feared.damage,
      hellFearStacks: hellFear?.stacks ?? 0,
      mindChance: SKILLS.MIND_TRANSFER.controlStun?.chance ?? 0,
      leftoverStun03:
        skill.effects?.some((e) => e.type === EffectType.STUN && e.chance === 0.3) === true,
      successDamage: win.ok ? win.damageDealt : -1,
      failDamage: lose.ok ? lose.damageDealt : -1,
    },
  };
}

export function printKillingIntentProbe(probe: KillingIntentProbe): void {
  const m = probe.metrics;
  console.log('\n── T-079 Killing Intent probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  success Stun 1:         ${probe.stunSuccess}`);
  console.log(`  fail no stun:           ${probe.stunFail}`);
  console.log(`  Fear always −20%:       ${probe.fearAlways}`);
  console.log('  ── balance vs unused 30% Stun / Hell Viewing Fear / Mind Transfer ──');
  console.log(`  AP / chance / Stun:     ${m.apCost} / ${m.chance} / ${m.stunDuration}  (was 1 / 0.3 / unused)`);
  console.log(`  fail-self:              ${m.failSelf}  (Mind Transfer 1; catalog none)`);
  console.log(`  Fear stacks / 100→:     ${m.fearStacks} / ${m.feared100}  (Hell Viewing ${m.hellFearStacks})`);
  console.log(`  Mind Transfer chance:   ${m.mindChance}  (this 0.8, no backlash)`);
  console.log(`  leftover STUN 0.3:      ${m.leftoverStun03}`);
  console.log(`  success/fail dmg:       ${m.successDamage} / ${m.failDamage}`);
}
