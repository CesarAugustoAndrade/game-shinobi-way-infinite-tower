/**
 * T-067 probe — Focused Breathing +8 CP; next CP upkeep −2 once; vs legacy CHAKRA_REGEN 10.
 */

import { CardRole, CombatRange, EffectType } from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { MODE_DEFINITIONS } from '../game/constants/modes';
import { activateMode, applyModeUpkeep, emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';

export interface FocusedBreathingProbe {
  authoring: boolean;
  grant: boolean;
  discount: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    grantFrom: number;
    grantTo: number;
    leftoverRegen: number;
    firstUpkeepPaid: number;
    secondUpkeepPaid: number;
    apAfter: number;
    readyOnTurn: number;
  };
}

export function runFocusedBreathingProbe(): FocusedBreathingProbe {
  const skill = SKILLS.FOCUSED_BREATHING;
  const startChakra = 5;
  const planted = resolveSkill(
    { skill },
    {
      pools: { ap: 6, chakra: startChakra, hp: 40, maxHp: 40 },
      range: CombatRange.MEDIUM,
      turnIndex: 2,
      marks: [],
      modes: emptyModeBoard(),
      skills: [skill],
      playerBuffs: [],
      enemyHp: 80,
    } satisfies ResolveSkillState,
  );
  const used = planted.ok
    ? planted.state.skills.find((s) => s.id === skill.id)
    : undefined;
  const leftoverRegen =
    skill.effects?.find((e) => e.type === EffectType.CHAKRA_REGEN)?.value ?? 0;

  const on = activateMode(emptyModeBoard(), MODE_DEFINITIONS.byakugan, {
    ap: 10,
    chakra: 20,
    hp: 40,
  }, 1);
  const first = on.ok
    ? applyModeUpkeep(on.board, ['byakugan'], { ap: 10, chakra: 20, hp: 40 }, 2, {
        cpUpkeepDiscount: 2,
      })
    : undefined;
  const second = first
    ? applyModeUpkeep(first.board, ['byakugan'], { ap: 10, chakra: 20, hp: 40 }, 3)
    : undefined;

  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 2 &&
      skill.baseDamage === 0 &&
      leftoverRegen === 0,
    grant:
      planted.ok === true &&
      planted.damageDealt === 0 &&
      planted.state.pools.chakra === 13 &&
      planted.state.pendingCpUpkeepDiscount === 2,
    discount:
      first?.ok === true &&
      first.pools.chakra === 18 &&
      first.cpUpkeepDiscount === 0 &&
      second?.pools.chakra === 16,
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      grantFrom: startChakra,
      grantTo: planted.ok ? planted.state.pools.chakra : -1,
      leftoverRegen,
      firstUpkeepPaid: first ? 20 - first.pools.chakra : -1,
      secondUpkeepPaid: second ? 20 - second.pools.chakra : -1,
      apAfter: planted.ok ? planted.state.pools.ap : -1,
      readyOnTurn: used?.readyOnTurn ?? -1,
    },
  };
}

export function printFocusedBreathingProbe(probe: FocusedBreathingProbe): void {
  const m = probe.metrics;
  console.log('\n── T-067 Focused Breathing probe ──');
  console.log(`  authoring SUPPORT:      ${probe.authoring}`);
  console.log(`  grant +8 pending 2:     ${probe.grant}`);
  console.log(`  upkeep 4→2 then 4:      ${probe.discount}`);
  console.log('  ── balance vs legacy CHAKRA_REGEN 10×1 ──');
  console.log(`  AP / CP play:           ${m.apCost} / ${m.chakraCost}  (was 1 / 0)`);
  console.log(`  instant grant:          ${m.grantFrom} → ${m.grantTo}  (was 0 instant / regen 10 tick)`);
  console.log(`  leftover regen tick:    ${m.leftoverRegen}  (was 10)`);
  console.log(`  first / second upkeep:  ${m.firstUpkeepPaid} / ${m.secondUpkeepPaid}  (was 4 / 4)`);
  console.log(`  pools after play:       AP ${m.apAfter}  readyOn ${m.readyOnTurn}  (T=2 CD=2 → 5)`);
  console.log('  ── equilibrium ──');
  console.log('  new: +8 now (not same-turn upkeep finance) + −2 on the next CP upkeep once.');
  console.log('  old EV: CHAKRA_REGEN 10 next tick (wrong magnitude, no upkeep soften).');
  console.log('  net vs one 4-CP Mode cycle: +8 −2 = +10 CP vs +10 regen, but honest and timed.');
}
