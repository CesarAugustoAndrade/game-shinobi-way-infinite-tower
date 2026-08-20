/**
 * T-146 AC: live Discover commit + picker listing candidates.
 */

import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CardRole, CombatRange } from '../../../game/types';
import { createCombatState } from '../../../game/systems/CombatWorkflowSystem';
import { createMockSkill } from '../../../game/systems/__tests__/testFixtures';
import { commitDiscoverOnCombatState } from '../../../hooks/discoverCommit';
import { DiscoverPicker } from '../DiscoverPicker';
import type { PendingDiscover } from '../../../game/systems/ResolveSkillSystem';

function candidate(id: string, extra: { disabled?: boolean; reasons?: string[] } = {}) {
  return {
    skill: createMockSkill({
      id,
      name: id,
      cardRole: CardRole.ATTACK,
    }),
    disabled: extra.disabled ?? false,
    reasons: extra.reasons ?? [],
  };
}

function pendingOf(...ids: string[]): PendingDiscover {
  return {
    sourceId: 'rehearsal',
    candidates: ids.map((id) => candidate(id)),
  };
}

function combatWithPending(pending: PendingDiscover) {
  return {
    ...createCombatState(),
    currentRange: CombatRange.MEDIUM,
    hand: [createMockSkill({ id: 'in-hand', cardRole: CardRole.ATTACK })],
    playablePool: [
      createMockSkill({ id: 'rehearsal', cardRole: CardRole.SUPPORT }),
      createMockSkill({ id: 'fire_atk', cardRole: CardRole.ATTACK }),
      createMockSkill({ id: 'wind_atk', cardRole: CardRole.ATTACK }),
      createMockSkill({ id: 'earth_atk', cardRole: CardRole.ATTACK }),
    ],
    pendingDiscover: pending,
  };
}

describe('T-146 commit', () => {
  it('commits a valid id, appends it to hand, and clears pending', () => {
    const pending = pendingOf('fire_atk', 'wind_atk');
    const before = combatWithPending(pending);
    const result = commitDiscoverOnCombatState(before, 'fire_atk');
    expect(result.refused).toBe(false);
    expect(result.combatState.pendingDiscover).toBeUndefined();
    expect(result.combatState.hand.some((card) => card.id === 'fire_atk')).toBe(true);
    expect(result.combatState.hand.some((card) => card.id === 'in-hand')).toBe(true);
  });
});

describe('T-146 ui', () => {
  it('renders a picker with three candidate controls', () => {
    const html = renderToStaticMarkup(
      createElement(DiscoverPicker, {
        pending: pendingOf('fire_atk', 'wind_atk', 'earth_atk'),
        onChoose: () => undefined,
      }),
    );
    expect(html).toContain('data-testid="discover-picker"');
    expect(html).toContain('Discover');
    expect((html.match(/data-testid="discover-candidate"/g) ?? []).length).toBe(3);
    expect(html).toContain('fire_atk');
    expect(html).toContain('wind_atk');
    expect(html).toContain('earth_atk');
    expect(html).toContain('ATTACK');
  });

  it('shows a text cooldown cue, not color-only', () => {
    const pending: PendingDiscover = {
      sourceId: 'rehearsal',
      candidates: [candidate('cooled', { disabled: true, reasons: ['cooldown'] })],
    };
    const html = renderToStaticMarkup(
      createElement(DiscoverPicker, { pending, onChoose: () => undefined }),
    );
    expect(html).toMatch(/On cooldown/i);
  });
});

describe('T-146 refuse', () => {
  it('unknown id leaves pending intact', () => {
    const pending = pendingOf('fire_atk', 'wind_atk');
    const before = combatWithPending(pending);
    const result = commitDiscoverOnCombatState(before, 'missing');
    expect(result.refused).toBe(true);
    expect(result.combatState.pendingDiscover?.candidates).toHaveLength(2);
    expect(result.combatState.hand.some((card) => card.id === 'missing')).toBe(false);
  });
});
