/**
 * T-086 probe — forget Main realigns skillConfig; loot-style replace leaves no orphan.
 */

import { CardRole, GameState } from '../game/types';
import { createMockPlayer, createMockSkill } from '../game/systems/__tests__/testFixtures';
import { applyForgetSkill, applyLearnSkill } from '../game/systems/SkillConfigLive';

export interface SkillConfigChokeProbe {
  forgetRealigns: boolean;
  replaceNoOrphan: boolean;
  metrics: {
    beforeMain: string;
    afterForgetMain: string | null;
    afterReplaceMain: string | null;
    ownedAfterReplace: number;
    orphanAfterRawReplace: boolean;
  };
}

const attack = (id: string) => createMockSkill({ id, name: id, cardRole: CardRole.ATTACK });

export function runSkillConfigChokeProbe(): SkillConfigChokeProbe {
  const beforeMain = 'rasengan';
  const player = createMockPlayer({
    skills: [attack('rasengan'), attack('chidori')],
    skillConfig: { mainAttackId: beforeMain, modeUpkeepPriority: [] },
  });
  const forgotten = applyForgetSkill(player, 'rasengan', GameState.SCROLL_DISCOVERY, () => 0);
  const learned = applyLearnSkill(
    forgotten.player,
    attack('twin_lion_fists'),
    GameState.TREASURE,
  );
  const afterForgetMain = forgotten.player.skillConfig?.mainAttackId ?? null;
  const afterReplaceMain = learned.player.skillConfig?.mainAttackId ?? null;
  const owned = learned.player.skills.map((s) => s.id);
  const rawReplaceMain = 'rasengan';
  const orphanAfterRawReplace = !owned.includes(rawReplaceMain);
  return {
    forgetRealigns:
      forgotten.refused === false &&
      afterForgetMain === 'chidori' &&
      forgotten.player.skills.some((s) => s.id === afterForgetMain),
    replaceNoOrphan:
      learned.refused === false &&
      afterReplaceMain !== 'rasengan' &&
      owned.includes(afterReplaceMain ?? '') &&
      owned.includes('twin_lion_fists'),
    metrics: {
      beforeMain,
      afterForgetMain,
      afterReplaceMain,
      ownedAfterReplace: owned.length,
      orphanAfterRawReplace,
    },
  };
}

export function printSkillConfigChokeProbe(probe: SkillConfigChokeProbe): void {
  const m = probe.metrics;
  console.log('\n── T-086 Skill Config choke probe ──');
  console.log(`  forget realigns Main:   ${probe.forgetRealigns}  (${m.beforeMain} → ${m.afterForgetMain})`);
  console.log(`  replace no orphan:      ${probe.replaceNoOrphan}  (Main ${m.afterReplaceMain}, owned ${m.ownedAfterReplace})`);
  console.log('  ── balance vs raw skills[] ──');
  console.log(`  raw replace orphan:     ${m.orphanAfterRawReplace}  (Main stayed ${m.beforeMain} while card gone)`);
  console.log(`  choke Main after forget:${m.afterForgetMain}  (draw still has a designated ATTACK)`);
}
