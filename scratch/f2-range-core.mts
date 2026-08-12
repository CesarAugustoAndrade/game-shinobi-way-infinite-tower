import {
  defaultsForAttackMethod,
  skillAllowedAt,
  resolveInitialRange,
  shiftRange,
  applyForcedMove,
  preferredRangeForEnemy,
  planMoveForSkill,
  VOLUNTARY_MOVE_AP_COST,
} from "../src/game/systems/RangeSystem.ts";
import {
  AttackMethod,
  ApproachType,
  CombatRange,
  RangeMoveDirection,
  SkillTier,
  ActionType,
  DamageType,
  DamageProperty,
  PrimaryStat,
  ElementType,
} from "../src/game/types.ts";
import { createCombatState } from "../src/game/systems/CombatWorkflowSystem.ts";
import { voluntaryPlayerMove } from "../src/game/systems/PlayerTurnSystem.ts";
import fs from "fs";

const lines: string[] = [];
const melee = defaultsForAttackMethod(AttackMethod.MELEE);
const ranged = defaultsForAttackMethod(AttackMethod.RANGED);
const auto = defaultsForAttackMethod(AttackMethod.AUTO);
lines.push("melee_defaults=" + melee.join(","));
lines.push("ranged_defaults=" + ranged.join(","));
lines.push("auto_count=" + auto.length);

const mockSkill = {
  id: "m",
  name: "M",
  tier: SkillTier.BASIC,
  description: "",
  actionType: ActionType.ACTIVE,
  chakraCost: 0,
  hpCost: 0,
  cooldown: 0,
  currentCooldown: 0,
  baseDamage: 10,
  scalingPerPoint: 2,
  scalingStat: PrimaryStat.STRENGTH,
  damageType: DamageType.PHYSICAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.MELEE,
  element: ElementType.PHYSICAL,
} as any;

lines.push("melee_at_close=" + skillAllowedAt(mockSkill, CombatRange.CLOSE));
lines.push("melee_at_long=" + skillAllowedAt(mockSkill, CombatRange.LONG));

const tank = preferredRangeForEnemy({ archetype: "TANK" });
const caster = preferredRangeForEnemy({ archetype: "CASTER" });
lines.push("tank_pref=" + tank);
lines.push("caster_pref=" + caster);

const initF = resolveInitialRange({
  approach: ApproachType.FRONTAL_ASSAULT,
  success: true,
  enemy: { archetype: "TANK" },
});
const initFail = resolveInitialRange({
  approach: ApproachType.STEALTH_AMBUSH,
  success: false,
  enemy: { archetype: "CASTER" },
});
const initSilent = resolveInitialRange({
  approach: ApproachType.STEALTH_AMBUSH,
  success: true,
  enemy: { archetype: "BALANCED" },
});
lines.push("frontal_ok=" + initF);
lines.push("fail_to_pref=" + initFail);
lines.push("silent_ok=" + initSilent);

const s1 = shiftRange(CombatRange.MEDIUM, RangeMoveDirection.APPROACH);
const s2 = shiftRange(CombatRange.CLOSE, RangeMoveDirection.APPROACH);
lines.push("shift_med_close=" + s1.range + " moved=" + s1.moved);
lines.push("shift_close_clamp=" + s2.range + " moved=" + s2.moved);

const push = applyForcedMove(CombatRange.MEDIUM, "PUSH");
const pull = applyForcedMove(CombatRange.MEDIUM, "PULL");
lines.push("push=" + push.range + " moved=" + push.moved);
lines.push("pull=" + pull.range + " moved=" + pull.moved);

const plan = planMoveForSkill(CombatRange.LONG, mockSkill);
lines.push("plan_melee_from_long_needMove=" + plan.needMove + " after=" + plan.afterRange);

let cs = createCombatState();
cs.currentAp = 3;
cs.currentRange = CombatRange.MEDIUM;
const move = voluntaryPlayerMove(cs, RangeMoveDirection.APPROACH);
lines.push("voluntary_ok=" + move.success + " range=" + move.combatState.currentRange + " ap=" + move.combatState.currentAp + " used=" + move.combatState.playerMoveUsedThisTurn);
const move2 = voluntaryPlayerMove(move.combatState, RangeMoveDirection.RETREAT);
lines.push("second_move_blocked=" + move2.blocked);

lines.push("VOLUNTARY_MOVE_AP_COST=" + VOLUNTARY_MOVE_AP_COST);
lines.push("createCombatState_has_range=" + !!createCombatState().currentRange);

const path = process.argv[2] || "scratch/f2-range-core.log";
fs.writeFileSync(path, lines.join("\n") + "\n");
console.log(lines.join("\n"));
