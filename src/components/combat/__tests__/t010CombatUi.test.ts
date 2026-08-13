/**
 * T-010 AC: role badges, Modes/Setup panels, preview honesty.
 */

import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import {
  ActionType,
  CardRole,
  CombatActor,
  MarkConsumeTiming,
  ModeRuntimeState,
} from '../../../game/types';
import { createMockSkill } from '../../../game/systems/__tests__/testFixtures';
import {
  buildHonestyPreview,
  chargeConsumeWarning,
  formatSkillBlockReason,
  roleBadgeLabel,
} from '../../../game/systems/combatSkillViewModel';
import { SkillCard } from '../SkillCard';
import { CombatModesPanel } from '../CombatModesPanel';
import { TacticalSetupPanel } from '../TacticalSetupPanel';
import { SkillHonestyPreview } from '../SkillHonestyPreview';
import { SkillConfigInspector } from '../SkillConfigInspector';

function card(
  skill: ReturnType<typeof createMockSkill>,
  extra: Record<string, unknown> = {},
): string {
  return renderToStaticMarkup(
    createElement(SkillCard, {
      skill,
      predictedDamage: skill.baseDamage,
      isEffective: false,
      canUse: true,
      onClick: () => undefined,
      apCost: skill.apCost ?? 1,
      ...extra,
    }),
  );
}

describe('T-010 badges', () => {
  it('renders SUPPORT MODE SIDE ATTACK badges and a Main ribbon', () => {
    expect(roleBadgeLabel({ cardRole: CardRole.SUPPORT, actionType: ActionType.ACTIVE })).toBe('SUPPORT');
    expect(roleBadgeLabel({ cardRole: CardRole.MODE, actionType: ActionType.TOGGLE })).toBe('MODE');
    expect(roleBadgeLabel({ cardRole: CardRole.SIDE_ATTACK, actionType: ActionType.ACTIVE })).toBe('SIDE');
    expect(roleBadgeLabel({ cardRole: CardRole.ATTACK, actionType: ActionType.ACTIVE })).toBe('ATTACK');

    const html = [
      card(createMockSkill({ cardRole: CardRole.SUPPORT })),
      card(createMockSkill({ cardRole: CardRole.MODE, actionType: ActionType.TOGGLE })),
      card(createMockSkill({ cardRole: CardRole.SIDE_ATTACK })),
      card(createMockSkill({ id: 'rasengan', cardRole: CardRole.ATTACK }), { mainAttackId: 'rasengan' }),
    ].join('\n');

    expect(html).toContain('SUPPORT');
    expect(html).toContain('MODE');
    expect(html).toContain('SIDE');
    expect(html).toContain('ATTACK');
    expect(html).toContain('main-attack-ribbon');
    expect(html).toContain('Main');
    expect(html).not.toContain('TOGGLE');
    expect(html).not.toMatch(/>ACTIVE</);
  });
});

describe('T-010 panels', () => {
  it('renders Mode charges/max and mark stacks/duration', () => {
    const modes = renderToStaticMarkup(
      createElement(CombatModesPanel, {
        modes: [
          {
            id: 'byakugan',
            family: 'HYUGA',
            charges: 3,
            maxCharges: 4,
            state: ModeRuntimeState.ON,
            stage: 1,
            upkeepLabel: '4 CP',
          },
        ],
        upkeepPriority: ['byakugan'],
      }),
    );
    expect(modes).toContain('Combat Modes');
    expect(modes).toContain('3/4');
    expect(modes).toContain('byakugan');

    const setup = renderToStaticMarkup(
      createElement(TacticalSetupPanel, {
        marks: [
          {
            id: 'aim',
            sourceSkillId: 'cloak',
            owner: CombatActor.PLAYER,
            target: CombatActor.ENEMY,
            duration: 2,
            stacks: 1,
            consume: MarkConsumeTiming.ATTEMPT,
          },
          {
            id: 'brand',
            sourceSkillId: 'wire',
            owner: CombatActor.ENEMY,
            target: CombatActor.PLAYER,
            duration: 1,
            stacks: 2,
            consume: MarkConsumeTiming.IMPACT,
          },
        ],
      }),
    );
    expect(setup).toContain('Tactical Setup');
    expect(setup).toContain('×1');
    expect(setup).toContain('2t');
    expect(setup).toContain('×2');
    expect(setup).toContain('own');
    expect(setup).toContain('enemy');
  });
});

describe('T-010 preview', () => {
  it('shows enhanced only with named sources; red consume; one block reason', () => {
    const none = buildHonestyPreview(12, []);
    expect(none.enhanced).toBeNull();
    const boosted = buildHonestyPreview(12, [{ name: 'Byakugan', bonus: 6 }]);
    expect(boosted.enhanced).toBe(18);
    expect(boosted.sources.map((s) => s.name)).toEqual(['Byakugan']);

    const previewHtml = renderToStaticMarkup(createElement(SkillHonestyPreview, { preview: boosted }));
    expect(previewHtml).toContain('base 12');
    expect(previewHtml).toContain('enhanced 18');
    expect(previewHtml).toContain('Byakugan');
    expect(renderToStaticMarkup(createElement(SkillHonestyPreview, { preview: none }))).not.toContain('enhanced');

    const consume = createMockSkill({
      cardRole: CardRole.ATTACK,
      modeInteraction: { modeId: 'shadow_clone', consumeCharges: 1 },
    });
    expect(chargeConsumeWarning(consume)).toMatch(/Consumes 1 Mode charge/);
    expect(card(consume)).toContain('skill-card__consume-warning');
    expect(card(consume)).toContain('Consumes 1 Mode charge');

    const reason = formatSkillBlockReason('ap', {
      skill: createMockSkill({ apCost: 4 }),
      currentChakra: 10,
      currentHp: 40,
      maxHp: 40,
      currentAp: 1,
      activeBuffs: [],
    });
    const disabled = card(createMockSkill({ cardRole: CardRole.SUPPORT, apCost: 4 }), {
      canUse: false,
      blockReason: reason,
    });
    expect(disabled).toContain('data-block-reason');
    expect(disabled.match(/data-block-reason="/g)?.length).toBe(1);
    expect(disabled).toContain('Need 4 AP');

    const config = renderToStaticMarkup(
      createElement(SkillConfigInspector, {
        config: { mainAttackId: 'rasengan', modeUpkeepPriority: ['byakugan'] },
        weightTerms: [{ name: 'base', bonus: 2 }],
        weightTotal: 2,
        defaultOpen: true,
      }),
    );
    expect(config).toContain('rasengan');
    expect(config).toContain('byakugan');
    expect(config).toContain('weight-breakdown');
    expect(config).toContain('base: 2');
  });
});
