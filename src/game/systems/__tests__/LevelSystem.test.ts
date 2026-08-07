/**
 * LevelSystem tests — F1 unspent stat points (no CLAN_GROWTH).
 */

import { describe, it, expect } from 'vitest';
import { Clan, PrimaryAttributes } from '../../types';
import { createPlayer } from '../../entities/Player';
import {
  applyLevelUp,
  assignStatPoints,
  finalizeLevelUpResources,
  autoAssignUnspentStatPoints,
} from '../LevelSystem';
import { getPlayerFullStats } from '../StatSystem';

function playerAtExp(clan: Clan, exp: number) {
  const p = createPlayer(clan);
  return { ...p, exp };
}

describe('LevelSystem F1', () => {
  it('grants unspent points and restores full HP and Chakra on level up', () => {
    const p = { ...playerAtExp(Clan.UZUMAKI, 100), currentHp: 10, currentChakra: 5 };
    const before = { ...p.primaryStats };
    const next = applyLevelUp(p);
    const full = getPlayerFullStats(next);
    expect(next.level).toBe(2);
    expect(next.unspentStatPoints).toBe(1);
    expect(next.primaryStats).toEqual(before);
    expect(next.currentHp).toBe(full.derived.maxHp);
    expect(next.currentChakra).toBe(full.derived.maxChakra);
  });

  it('accumulates points for multi-level gains', () => {
    // level 1 maxExp 100; after L2 maxExp 200; after L3 maxExp 300
    let p = createPlayer(Clan.LEE);
    p = { ...p, exp: 100 + 200 }; // enough for 2 levels if sequential
    // Actually: while exp >= maxExp: level1 needs 100 → L2 maxExp200; need another 200 for L3
    p = { ...createPlayer(Clan.LEE), exp: 100 };
    p = applyLevelUp(p);
    expect(p.level).toBe(2);
    expect(p.unspentStatPoints).toBe(1);
    p = { ...p, exp: p.exp + p.maxExp };
    p = applyLevelUp(p);
    expect(p.level).toBe(3);
    expect(p.unspentStatPoints).toBe(2);
  });

  it('assignStatPoints requires exact total and floors at 1', () => {
    let p = applyLevelUp(playerAtExp(Clan.HYUGA, 100));
    expect(assignStatPoints(p, { strength: 2 })).toBeNull();
    const ok = assignStatPoints(p, { strength: 1 });
    expect(ok).not.toBeNull();
    expect(ok!.unspentStatPoints).toBe(0);
    expect(ok!.primaryStats.strength).toBe(p.primaryStats.strength + 1);
  });

  it('finalizeLevelUpResources heals only when unspent is 0', () => {
    let p = applyLevelUp(playerAtExp(Clan.UCHIHA, 100));
    p = { ...p, currentHp: 1, currentChakra: 1 };
    const blocked = finalizeLevelUpResources(p);
    expect(blocked.currentHp).toBe(1);

    const assigned = assignStatPoints(p, { spirit: 1 })!;
    const hurt = { ...assigned, currentHp: 1, currentChakra: 1 };
    const healed = finalizeLevelUpResources(hurt);
    const full = getPlayerFullStats(healed);
    expect(healed.currentHp).toBe(full.derived.maxHp);
    expect(healed.currentChakra).toBe(full.derived.maxChakra);
  });

  it('autoAssignUnspentStatPoints clears points for sims', () => {
    let p = applyLevelUp(playerAtExp(Clan.YAMANAKA, 100));
    p = autoAssignUnspentStatPoints(p);
    expect(p.unspentStatPoints).toBe(0);
    expect(p.primaryStats.willpower).toBeGreaterThanOrEqual(1);
  });

  it('clan start affinities are 3 / others 1', () => {
    const u = createPlayer(Clan.UZUMAKI);
    expect(u.primaryStats.willpower).toBe(3);
    expect(u.primaryStats.chakra).toBe(3);
    expect(u.primaryStats.strength).toBe(1);
    expect(u.unspentStatPoints).toBe(0);
  });
});
