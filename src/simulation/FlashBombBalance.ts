/**
 * T-066 probe — Flash Bomb plant enemy Blinded 2/1; AP1 CP0; vs legacy ACC −40%@50%.
 */

import {
  CardRole,
  CombatRange,
  EffectType,
  MarkFamily,
  PrimaryStat,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface FlashBombProbe {
  authoring: boolean;
  plant: boolean;
  costs: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    plantDamage: number;
    blindedStacks: number;
    blindedDuration: number;
    accDebuffPct: number;
    accChance: number;
    apAfter: number;
    cpAfter: number;
    readyOnTurn: number;
  };
}

export function runFlashBombProbe(): FlashBombProbe {
  const skill = SKILLS.FLASH_BOMB;
  const state = (): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyHp: 80,
  });
  const planted = resolveSkill({ skill }, state());
  const mark = planted.ok
    ? planted.state.marks.find((m) => m.id === 'blinded')
    : undefined;
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  const legacyAcc = skill.effects?.find(
    (e) => e.type === EffectType.DEBUFF && e.targetStat === PrimaryStat.ACCURACY,
  );
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 4 &&
      skill.baseDamage === 0 &&
      skill.markEffects?.some(
        (m) =>
          m.id === 'blinded' &&
          m.stacks === 2 &&
          m.duration === 1 &&
          m.family === MarkFamily.STAT &&
          m.targetActor === 'enemy',
      ) === true &&
      !skill.effects?.some(
        (e) =>
          e.type === EffectType.DEBUFF &&
          e.targetStat === PrimaryStat.ACCURACY,
      ),
    plant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      mark?.stacks === 2 &&
      mark.duration === 1,
    costs:
      planted.ok === true &&
      planted.state.pools.ap === 5 &&
      planted.state.pools.chakra === 20 &&
      used?.readyOnTurn === 7,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      plantDamage: planted.ok ? planted.damageDealt : -1,
      blindedStacks: mark?.stacks ?? 0,
      blindedDuration: mark?.duration ?? 0,
      accDebuffPct: legacyAcc?.value ?? 0,
      accChance: legacyAcc?.chance ?? 0,
      apAfter: planted.ok ? planted.state.pools.ap : -1,
      cpAfter: planted.ok ? planted.state.pools.chakra : -1,
      readyOnTurn: used?.readyOnTurn ?? -1,
    },
  };
}

export function printFlashBombProbe(probe: FlashBombProbe): void {
  const m = probe.metrics;
  console.log('\n── T-066 Flash Bomb probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  plant Blinded 2/1:      ${probe.plant}`);
  console.log(`  AP−1 CP0 readyOn 7:     ${probe.costs}`);
  console.log('  ── balance vs legacy ACC −40%×2 @50% ──');
  console.log(`  AP / CP:                ${m.apCost} / ${m.chakraCost}  (was 1 / 0)`);
  console.log(`  plant dmg / blinded:    ${m.plantDamage} / ${m.blindedStacks}×${m.blindedDuration}  (was 0 / unused ACC %)`);
  console.log(`  leftover ACC % / chance:${m.accDebuffPct} / ${m.accChance}  (was 0.4 / 0.5)`);
  console.log(`  pools after:            AP ${m.apAfter} / CP ${m.cpAfter}`);
  console.log(`  readyOnTurn:            ${m.readyOnTurn}  (T=2 CD=4 → 7)`);
  console.log('  ── equilibrium ──');
  console.log('  guaranteed −2 ACC vs EV −0.4 ACC @50% over 2 turns.');
  console.log('  new: 1-turn −2 ACC integer (honest, no roll).');
  console.log('  old EV: 0.5 × 0.4 × 2-turn ≈ 0.4 ACC-turns of secret %.');
  console.log('  verdict: control SUPPORT is guaranteed and shorter; no damage.');
}
