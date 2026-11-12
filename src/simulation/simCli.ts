/**
 * Shared CLI knobs for battle / location / campaign / progression.
 * R3 only — does not change combat math.
 */

import { ApproachType, Clan } from '../game/types';
import type { PlayerBuildConfig } from './types';

export interface SharedSimFlags {
  clan?: Clan;
  /** Present only when --approach was passed. */
  approach?: ApproachType | null;
  approachProvided: boolean;
  heat?: number;
  danger?: number;
  floorProvided: boolean;
}

export function parseClanArg(raw: string): Clan | null {
  const key = raw.trim().toLowerCase().replace(/[_-]+/g, ' ');
  const map: Record<string, Clan> = {
    uzumaki: Clan.UZUMAKI,
    uchiha: Clan.UCHIHA,
    hyuga: Clan.HYUGA,
    lee: Clan.LEE,
    'lee disciple': Clan.LEE,
    yamanaka: Clan.YAMANAKA,
  };
  return map[key] ?? null;
}

export function parseApproachArg(raw: string): ApproachType | null | 'invalid' {
  const key = raw.trim().toUpperCase().replace(/[-\s]+/g, '_');
  if (key === 'NONE' || key === 'NULL') return null;
  const map: Record<string, ApproachType> = {
    FRONTAL: ApproachType.FRONTAL_ASSAULT,
    FRONTAL_ASSAULT: ApproachType.FRONTAL_ASSAULT,
    STEALTH: ApproachType.STEALTH_AMBUSH,
    STEALTH_AMBUSH: ApproachType.STEALTH_AMBUSH,
    SILENT: ApproachType.STEALTH_AMBUSH,
    SILENT_STRIKE: ApproachType.STEALTH_AMBUSH,
    GENJUTSU: ApproachType.GENJUTSU_SETUP,
    GENJUTSU_SETUP: ApproachType.GENJUTSU_SETUP,
    TRAP: ApproachType.ENVIRONMENTAL_TRAP,
    ENVIRONMENTAL: ApproachType.ENVIRONMENTAL_TRAP,
    ENVIRONMENTAL_TRAP: ApproachType.ENVIRONMENTAL_TRAP,
    IRON: ApproachType.IRON_GUARD,
    IRON_GUARD: ApproachType.IRON_GUARD,
    SHADOW: ApproachType.SHADOW_BYPASS,
    SHADOW_BYPASS: ApproachType.SHADOW_BYPASS,
    BYPASS: ApproachType.SHADOW_BYPASS,
  };
  return map[key] ?? 'invalid';
}

export function parseDangerArg(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > 7) return null;
  return n;
}

export function parseHeatArg(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return n;
}

export function parseSharedSimFlags(args: readonly string[]): SharedSimFlags | { error: string } {
  const out: SharedSimFlags = { approachProvided: false, floorProvided: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === '--clan') {
      if (next === undefined) return { error: '--clan requires uzumaki|uchiha|hyuga|lee|yamanaka' };
      const clan = parseClanArg(next);
      if (!clan) return { error: `Unknown clan "${next}". Use uzumaki|uchiha|hyuga|lee|yamanaka` };
      out.clan = clan;
      i += 1;
    } else if (arg === '--approach') {
      if (next === undefined) {
        return { error: '--approach requires frontal|stealth|genjutsu|trap|iron|bypass|none' };
      }
      const approach = parseApproachArg(next);
      if (approach === 'invalid') {
        return { error: `Unknown approach "${next}". Use frontal|stealth|genjutsu|trap|iron|bypass|none` };
      }
      out.approach = approach;
      out.approachProvided = true;
      i += 1;
    } else if (arg === '--heat') {
      if (next === undefined) return { error: '--heat requires 0-100' };
      const heat = parseHeatArg(next);
      if (heat === null) return { error: `--heat must be 0-100, got "${next}"` };
      out.heat = heat;
      i += 1;
    } else if (arg === '--danger') {
      if (next === undefined) return { error: '--danger requires 1-7' };
      const danger = parseDangerArg(next);
      if (danger === null) return { error: `--danger must be 1-7, got "${next}"` };
      out.danger = danger;
      i += 1;
    } else if (arg === '--floor' || arg === '-f') {
      out.floorProvided = true;
    }
  }
  return out;
}

export function filterBuildsByClan(
  builds: PlayerBuildConfig[],
  clan?: Clan,
): PlayerBuildConfig[] {
  if (!clan) return builds;
  return builds.filter((build) => build.clan === clan);
}
