/**
 * T-047 probe — Analyze authoring; Main-tag ATTACK offer; Studied 20% pen.
 */

import {
  ActionType,
  CardRole,
  CombatRange,
  EffectType,
  Posture,
  PrimaryStat,
  SkillTag,
} from '../game/types';
import { SKILLS } from '../game/constants/skills';
import { emptyModeBoard } from '../game/systems/CombatModeSystem';
import {
  commitDiscoverChoice,
  resolveSkill,
  type ResolveSkillState,
} from '../game/systems/ResolveSkillSystem';
import { createMockSkill } from '../game/systems/__tests__/testFixtures';

export interface AnalyzeProbe {
  authoring: boolean;
  filter: boolean;
  studied: boolean;
  metrics: {
    apCost: number;
    cooldown: number;
    candidateIds: string[];
    rawDamage: number;
    studiedDamage: number;
    otherDamage: number;
  };
}

export function runAnalyzeProbe(): AnalyzeProbe {
  const skill = SKILLS.ANALYZE;
  const state = (overrides: Partial<ResolveSkillState> = {}): ResolveSkillState => ({
    pools: { ap: 6, chakra: 20, hp: 40, maxHp: 40 },
    range: CombatRange.CLOSE,
    turnIndex: 3,
    marks: [],
    modes: emptyModeBoard(),
    skills: [],
    playerBuffs: [],
    enemyHp: 50,
    ...overrides,
  });
  const mock = (id: string, extra: Parameters<typeof createMockSkill>[0] = {}) =>
    createMockSkill({
      id,
      apCost: 1,
      chakraCost: 0,
      baseDamage: 10,
      currentCooldown: 0,
      allowedRanges: [CombatRange.CLOSE, CombatRange.MEDIUM, CombatRange.LONG],
      ...extra,
    });
  const main = mock('main_fire', { cardRole: CardRole.ATTACK, tags: [SkillTag.FIRE] });
  const fireAtk = mock('fire_atk', { cardRole: CardRole.ATTACK, tags: [SkillTag.FIRE] });
  const fireAtk2 = mock('fire_atk_2', { cardRole: CardRole.ATTACK, tags: [SkillTag.FIRE], baseDamage: 8 });
  const waterAtk = mock('water_atk', { cardRole: CardRole.ATTACK, tags: [SkillTag.WATER] });
  const sideFire = mock('side_fire', {
    cardRole: CardRole.SIDE_ATTACK,
    tags: [SkillTag.FIRE],
    actionType: ActionType.ACTIVE,
    baseDamage: 6,
  });
  const supportFire = mock('support_fire', {
    cardRole: CardRole.SUPPORT,
    tags: [SkillTag.FIRE],
    actionType: ActionType.ACTIVE,
    baseDamage: 0,
  });
  const pool = [skill, main, fireAtk, fireAtk2, waterAtk, sideFire, supportFire];
  const offered = resolveSkill(
    { skill, weightContext: { posture: Posture.BALANCED, mainAttackId: 'main_fire' } },
    state({ hand: [skill, main], playablePool: pool, skills: pool }),
    { rng: () => 0 },
  );
  const ids: string[] = offered.ok
    ? (offered.pendingDiscover?.candidates ?? []).map((c) => c.skill.id)
    : [];
  const committed = offered.ok ? commitDiscoverChoice(offered.state, 'fire_atk') : null;
  const hit = { rollHit: () => ({ hit: true as const, damage: 10 }) };
  const clean = resolveSkill(
    { skill: fireAtk },
    state({ skills: [fireAtk], enemyDefensePercent: 0.5 }),
    hit,
  );
  let studiedOk = false;
  let studiedDamage = 0;
  let otherDamage = 0;
  if (committed && !committed.refused) {
    const armed = resolveSkill(
      { skill: fireAtk },
      { ...committed.state, skills: [fireAtk], enemyDefensePercent: 0.5, enemyHp: 50 },
      hit,
    );
    const other = resolveSkill(
      { skill: waterAtk },
      { ...committed.state, skills: [waterAtk], enemyDefensePercent: 0.5, enemyHp: 50 },
      hit,
    );
    studiedDamage = armed.ok ? armed.damageDealt : 0;
    otherDamage = other.ok ? other.damageDealt : 0;
    studiedOk =
      committed.state.marks.some((m) => m.id === 'studied' && m.boundSkillId === 'fire_atk' && m.duration === 2) &&
      armed.ok &&
      clean.ok &&
      armed.damageDealt === 6 &&
      clean.damageDealt === 5 &&
      other.ok &&
      other.damageDealt === 5;
  }
  return {
    authoring:
      skill.cardRole === CardRole.SUPPORT &&
      skill.apCost === 1 &&
      skill.chakraCost === 0 &&
      skill.cooldown === 5 &&
      skill.baseDamage === 0 &&
      skill.discover?.count === 3 &&
      skill.discover.matchMainAttackTags === true &&
      !skill.effects?.some(
        (e) => e.type === EffectType.BUFF && e.targetStat === PrimaryStat.STRENGTH && e.value === 0.15,
      ),
    filter:
      offered.ok &&
      ids.length > 0 &&
      ids.every((id) => ['fire_atk', 'fire_atk_2'].includes(id)) &&
      !ids.some((id) => ['water_atk', 'side_fire', 'support_fire'].includes(id)),
    studied: studiedOk,
    metrics: {
      apCost: skill.apCost ?? 0,
      cooldown: skill.cooldown,
      candidateIds: ids,
      rawDamage: clean.ok ? clean.damageDealt : 0,
      studiedDamage,
      otherDamage,
    },
  };
}

export function printAnalyzeProbe(probe: AnalyzeProbe): void {
  const m = probe.metrics;
  console.log('\n── T-047 Analyze probe ──');
  console.log(`  authoring SUPPORT:  ${probe.authoring}`);
  console.log(`  Main-tag ATTACK:    ${probe.filter}`);
  console.log(`  Studied 20% pen:    ${probe.studied}`);
  console.log('  ── balance vs legacy STR +15%×3 ──');
  console.log(`  AP / CD:            ${m.apCost} / ${m.cooldown}  (unchanged 1 / 5)`);
  console.log(`  candidates:         ${m.candidateIds.join(',') || '(none)'}  (ATTACK∩FIRE only)`);
  console.log(`  10 vs 50% def:      ${m.rawDamage} → studied ${m.studiedDamage}  (wrong id ${m.otherDamage})`);
}
