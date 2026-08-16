/**
 * T-086 AC1: forget of Main realigns skillConfig.mainAttackId via ensureMainAttack.
 * Activity / treasure handlers choke through applyForgetSkill / applyLearnSkill.
 */

import { describe, it, expect } from 'vitest';
import { CardRole, GameState } from '../../types';
import { createMockPlayer, createMockSkill } from './testFixtures';
import { applyForgetSkill, applyLearnSkill } from '../SkillConfigLive';

const attack = (id: string) => createMockSkill({ id, name: id, cardRole: CardRole.ATTACK });

describe('T-086 skill config choke', () => {
  it('forgetting the Main skill realigns mainAttackId to another owned ATTACK', () => {
    const player = createMockPlayer({
      skills: [attack('rasengan'), attack('chidori')],
      skillConfig: { mainAttackId: 'rasengan', modeUpkeepPriority: [] },
    });

    const forgotten = applyForgetSkill(
      player,
      'rasengan',
      GameState.SCROLL_DISCOVERY,
      () => 0,
    );

    expect(forgotten.refused).toBe(false);
    expect(forgotten.player.skills.some((s) => s.id === 'rasengan')).toBe(false);
    expect(forgotten.player.skillConfig?.mainAttackId).toBe('chidori');
    expect(forgotten.player.skills.map((s) => s.id)).toContain(
      forgotten.player.skillConfig?.mainAttackId,
    );
  });

  it('replacing Main (forget + learn) does not leave an orphan mainAttackId', () => {
    const player = createMockPlayer({
      skills: [attack('rasengan'), attack('chidori')],
      skillConfig: { mainAttackId: 'rasengan', modeUpkeepPriority: [] },
    });

    const forgotten = applyForgetSkill(
      player,
      'rasengan',
      GameState.SCROLL_DISCOVERY,
      () => 0,
    );
    const learned = applyLearnSkill(
      forgotten.player,
      attack('twin_lion_fists'),
      GameState.TREASURE,
    );

    expect(learned.refused).toBe(false);
    expect(learned.player.skillConfig?.mainAttackId).not.toBe('rasengan');
    expect(learned.player.skills.map((s) => s.id)).toContain(
      learned.player.skillConfig?.mainAttackId,
    );
    expect(learned.player.skills.map((s) => s.id)).toContain('twin_lion_fists');
  });
});
