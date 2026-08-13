/**
 * T-008 catalog probe — 12 new techniques vs starters / vendor / loadout pickup.
 */

import { Clan, SkillTier } from '../game/types';
import { getClanStartingSkills, SKILLS } from '../game/constants';
import {
  V1_CLAN_SKILL_IDS,
  V1_NEW_TECHNIQUE_IDS,
  V1_UNIVERSAL_SKILL_IDS,
} from '../game/constants/skillsCombatV1New';
import { calculatePlayerStats, generateOptimalLoadout } from './BuildGenerator';

export interface CatalogV1Probe {
  catalogSize: number;
  newPresent: number;
  startersContainingNew: number;
  universalVendorEligible: number;
  clanGated: number;
  loadoutPickups: Record<string, string[]>;
}

export function runCatalogV1Probe(): CatalogV1Probe {
  const newSet = new Set<string>(V1_NEW_TECHNIQUE_IDS);
  let startersContainingNew = 0;
  for (const clan of Object.values(Clan)) {
    if (getClanStartingSkills(clan).some((skill) => newSet.has(skill.id))) {
      startersContainingNew += 1;
    }
  }

  const vendorTiers = new Set([SkillTier.BASIC, SkillTier.ADVANCED]);
  const vendorEligible = V1_UNIVERSAL_SKILL_IDS.filter((id) => {
    const skill = Object.values(SKILLS).find((entry) => entry.id === id);
    return Boolean(skill && vendorTiers.has(skill.tier) && !skill.requirements?.clan);
  }).length;

  const loadoutPickups: Record<string, string[]> = {};
  for (const clan of Object.values(Clan)) {
    const stats = calculatePlayerStats(clan, 10);
    const loadout = generateOptimalLoadout(stats, clan, 16, 10);
    loadoutPickups[clan] = loadout.map((skill) => skill.id).filter((id) => newSet.has(id));
  }

  return {
    catalogSize: Object.keys(SKILLS).length,
    newPresent: V1_NEW_TECHNIQUE_IDS.filter((id) =>
      Object.values(SKILLS).some((skill) => skill.id === id),
    ).length,
    startersContainingNew,
    universalVendorEligible: vendorEligible,
    clanGated: V1_CLAN_SKILL_IDS.length,
    loadoutPickups,
  };
}

export function printCatalogV1Probe(probe: CatalogV1Probe): void {
  console.log('\n── T-008 catalog v1 probe ──');
  console.log(`  catalog size:           ${probe.catalogSize}`);
  console.log(`  new techniques present: ${probe.newPresent}/12`);
  console.log(`  starter kits with new:  ${probe.startersContainingNew}`);
  console.log(`  universal vendor-ready: ${probe.universalVendorEligible}/7`);
  console.log(`  clan-gated:             ${probe.clanGated}/5`);
  for (const [clan, ids] of Object.entries(probe.loadoutPickups)) {
    console.log(`  L10 loadout pickups ${clan}: ${ids.length ? ids.join(', ') : '(none)'}`);
  }
}
