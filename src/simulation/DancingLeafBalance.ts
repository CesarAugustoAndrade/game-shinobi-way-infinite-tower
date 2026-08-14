/**
 * T-044 probe — Dancing Leaf authoring; CLOSE snap; Lotus Opening ×1.25; LOTUS +2.
 */

import {
  ActionType,
  CardRole,
  CombatActor,
  CombatRange,
  EffectType,
  ModeRuntimeState,
  PrimaryStat,
} from '../game/types';
import { MODE_FAMILY } from '../game/constants/modes';
import { SKILLS } from '../game/constants/skills';
import { consumeSupportWeightBonuses } from '../game/systems/SupportWeightSystem';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import { resolveSkill, type ResolveSkillState } from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface DancingLeafProbe {
  authoring: boolean;
  setup: boolean;
  finisher: boolean;
  metrics: {
    apCost: number;
    chakraCost: number;
    fromLong: string;
    fromMedium: string;
    baseLotus: number;
    openedLotus: number;
    lotusDelta: number;
    primaryWeight: number;
    hiddenWeight: number;
    manualMoveSpent: boolean;
  };
}

export function runDancingLeafProbe(): DancingLeafProbe {
  const skill = SKILLS.DANCING_LEAF;
  const lotus = SKILLS.PRIMARY_LOTUS;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 10, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.MEDIUM,
    turnIndex: 2,
    marks: [],
    modes: emptyModeBoard(),
    skills: [skill],
    playerBuffs: [],
    enemyBuffs: [],
    enemyHp: 80,
    playerMoveUsedThisTurn: false,
    pendingSupportWeights: [],
    ...overrides,
  });
  const gates = {
    instances: [
      { id: 'gate_of_life', family: MODE_FAMILY.GATES, charges: 1, state: ModeRuntimeState.ON },
    ],
  };
  const hit = { rollHit: () => ({ hit: true as const, damage: lotus.baseDamage }) };
  const miss = { rollHit: () => ({ hit: false as const, damage: 0 }) };
  const fromMedium = resolveSkill({ skill }, state());
  const fromLong = resolveSkill({ skill }, state({ range: CombatRange.LONG }));
  const planted = resolveSkill({ skill }, state({ modes: gates }));
  const boosted =
    planted.ok &&
    resolveSkill({ skill: lotus }, { ...planted.state, skills: [lotus], range: CombatRange.CLOSE }, hit);
  const clean = resolveSkill(
    { skill: lotus },
    state({ modes: gates, skills: [lotus], range: CombatRange.CLOSE }),
    hit,
  );
  const missed =
    planted.ok &&
    resolveSkill({ skill: lotus }, { ...planted.state, skills: [lotus], range: CombatRange.CLOSE }, miss);
  const other = createMockSkill({
    id: 'basic_atk',
    cardRole: CardRole.ATTACK,
    actionType: ActionType.ACTIVE,
    apCost: 1,
    chakraCost: 0,
    baseDamage: 10,
    currentCooldown: 0,
    allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
  });
  const leftover =
    planted.ok &&
    resolveSkill(
      { skill: other },
      { ...planted.state, skills: [other] },
      { rollHit: () => ({ hit: true as const, damage: 10 }) },
    );
  const bag = consumeSupportWeightBonuses(fromMedium.ok ? fromMedium.state.pendingSupportWeights ?? [] : []);
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 1 &&
      skill.cooldown === 3 &&
      skill.baseDamage === 0 &&
      skill.bandMove?.kind === 'SELF_APPROACH' &&
      skill.bandMove.steps === 2 &&
      skill.markEffects?.some((m) => m.id === 'lotus_opening' && m.duration === 2) === true &&
      skill.nextDrawSkillBonuses?.some((e) => e.skillId === 'primary_lotus' && e.delta === 2) === true &&
      skill.nextDrawSkillBonuses?.some((e) => e.skillId === 'hidden_lotus' && e.delta === 2) === true &&
      !skill.nextDrawSkillBonuses?.some((e) => e.skillId === 'morning_peacock') &&
      !skill.effects?.some((e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH && e.value === 0.5),
    setup:
      fromMedium.ok &&
      fromMedium.damageDealt === 0 &&
      fromMedium.state.range === CombatRange.CLOSE &&
      fromMedium.state.playerMoveUsedThisTurn === false &&
      fromMedium.state.marks.some((m) => m.id === 'lotus_opening' && m.target === CombatActor.PLAYER && m.duration === 2) &&
      fromLong.ok === true &&
      fromLong.state.range === CombatRange.CLOSE &&
      bag.bonuses.primary_lotus === 2 &&
      bag.bonuses.hidden_lotus === 2,
    finisher:
      typeof boosted === 'object' &&
      boosted.ok &&
      clean.ok === true &&
      boosted.damageDealt === Math.floor(clean.damageDealt * 1.25) &&
      !boosted.state.marks.some((m) => m.id === 'lotus_opening') &&
      typeof missed === 'object' &&
      missed.ok &&
      missed.damageDealt === 0 &&
      !missed.state.marks.some((m) => m.id === 'lotus_opening') &&
      typeof leftover === 'object' &&
      leftover.ok &&
      leftover.state.marks.some((m) => m.id === 'lotus_opening'),
    metrics: {
      apCost: skill.apCost ?? 0,
      chakraCost: skill.chakraCost,
      fromLong: fromLong.ok ? fromLong.state.range : 'fail',
      fromMedium: fromMedium.ok ? fromMedium.state.range : 'fail',
      baseLotus: clean.ok ? clean.damageDealt : 0,
      openedLotus: typeof boosted === 'object' && boosted.ok ? boosted.damageDealt : 0,
      lotusDelta:
        typeof boosted === 'object' && boosted.ok && clean.ok
          ? boosted.damageDealt - clean.damageDealt
          : 0,
      primaryWeight: bag.bonuses.primary_lotus ?? 0,
      hiddenWeight: bag.bonuses.hidden_lotus ?? 0,
      manualMoveSpent: fromMedium.ok ? fromMedium.state.playerMoveUsedThisTurn === true : true,
    },
  };
}

export function printDancingLeafProbe(probe: DancingLeafProbe): void {
  const m = probe.metrics;
  console.log('\n── T-044 Dancing Leaf probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  CLOSE + mark + bag: ${probe.setup}`);
  console.log(`  finisher ×1.25:     ${probe.finisher}`);
  console.log('  ── balance vs legacy STR +50% / DEX +30%×1 ──');
  console.log(`  AP / CP:            ${m.apCost} / ${m.chakraCost}  (unchanged 1 / 1)`);
  console.log(`  LONG / MEDIUM →:    ${m.fromLong} / ${m.fromMedium}  (was stay / STR-DEX %)`);
  console.log(`  Lotus C=1:          ${m.baseLotus} → ${m.openedLotus}  (Δ ${m.lotusDelta})`);
  console.log(`  LOTUS weight:       primary ${m.primaryWeight} / hidden ${m.hiddenWeight}  (was 0)`);
  console.log(`  manual move spent:  ${m.manualMoveSpent}  (must be false)`);
}
