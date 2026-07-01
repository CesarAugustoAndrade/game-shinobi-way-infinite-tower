/**
 * Event outcome change summary (T-011 presentation helper).
 *
 * Pure formatting layer for the "WHAT CHANGED" panel of EventResultModal. It
 * turns a resolved event outcome into a flat list of readable deltas so the
 * player can see exactly what a choice did to them.
 *
 * Resource deltas (HP / Chakra / Ryo) are computed from the real before→after
 * player snapshots so clamping (e.g. a heal capped at max HP) shows as the true
 * change — or as no change at all. Everything else (XP, intel, stat changes,
 * granted skill, curse, lost item, narrative flags) is read from the declared
 * outcome effects, which is where those live authoritatively.
 *
 * This module holds NO React and NO game logic — it only describes what already
 * happened for display. Colour tone is decided here; the CSS maps each tone.
 */

import { Player, EventOutcome } from '../../game/types';
import { SKILLS } from '../../game/constants/skills';

/** Colour intent for a single delta chip. */
export type OutcomeTone = 'up' | 'down' | 'curse' | 'flag' | 'neutral';

/** One readable change produced by an event outcome. */
export interface OutcomeChange {
  /** Stable key for React lists. */
  key: string;
  /** Leading emoji glyph. */
  icon: string;
  /** Short label (game term, e.g. "HP", "Strength", "Learned"). */
  label: string;
  /** Formatted value / delta (e.g. "+30", "-200", "Fireball · 3t"). */
  value: string;
  /** Colour tone the UI renders. */
  tone: OutcomeTone;
}

/** Title-case display names for the primary stats touched by statChanges. */
const STAT_LABELS: Record<string, string> = {
  willpower: 'Willpower',
  chakra: 'Chakra',
  strength: 'Strength',
  spirit: 'Spirit',
  intelligence: 'Intelligence',
  calmness: 'Calmness',
  speed: 'Speed',
  accuracy: 'Accuracy',
  dexterity: 'Dexterity',
};

/** Render a signed integer with an explicit leading sign. */
const signed = (n: number): string => (n > 0 ? `+${n}` : `${n}`);

/**
 * Build the ordered list of changes for an event outcome. Returns an empty
 * array when nothing measurable happened — the caller renders a "no change"
 * placeholder in that case.
 */
export function buildOutcomeChanges(
  before: Player,
  after: Player,
  outcome: EventOutcome,
): OutcomeChange[] {
  const changes: OutcomeChange[] = [];
  const { effects } = outcome;

  // --- Resource deltas: exact (before→after) so clamping reads honestly. ---
  const hpDelta = after.currentHp - before.currentHp;
  if (hpDelta !== 0) {
    changes.push({ key: 'hp', icon: '❤', label: 'HP', value: signed(hpDelta), tone: hpDelta > 0 ? 'up' : 'down' });
  }

  const cpDelta = after.currentChakra - before.currentChakra;
  if (cpDelta !== 0) {
    changes.push({ key: 'cp', icon: '✦', label: 'Chakra', value: signed(cpDelta), tone: cpDelta > 0 ? 'up' : 'down' });
  }

  // Ryo is net of the choice's upfront cost, which is the honest bottom line.
  const ryoDelta = after.ryo - before.ryo;
  if (ryoDelta !== 0) {
    changes.push({ key: 'ryo', icon: '◈', label: 'Ryo', value: signed(ryoDelta), tone: ryoDelta > 0 ? 'up' : 'down' });
  }

  // --- Declared effects (leveling / on-close application make before→after
  //     unreliable for these, so read the authoritative declaration). ---
  if (effects.exp) {
    changes.push({ key: 'exp', icon: '▲', label: 'XP', value: signed(effects.exp), tone: effects.exp > 0 ? 'up' : 'down' });
  }

  if (effects.intelGain && effects.intelGain !== 0) {
    changes.push({
      key: 'intel',
      icon: '🔮',
      label: 'Intel',
      value: `${signed(effects.intelGain)}%`,
      tone: effects.intelGain > 0 ? 'up' : 'down',
    });
  }

  if (effects.statChanges) {
    for (const [stat, raw] of Object.entries(effects.statChanges)) {
      const value = raw as number | undefined;
      if (typeof value === 'number' && value !== 0) {
        changes.push({
          key: `stat-${stat}`,
          icon: '◆',
          label: STAT_LABELS[stat] ?? stat,
          value: signed(value),
          tone: value > 0 ? 'up' : 'down',
        });
      }
    }
  }

  if (effects.upgradeTreasureQuality) {
    changes.push({ key: 'treasure', icon: '🎁', label: 'Treasure', value: 'Quality ↑', tone: 'up' });
  }

  if (effects.addMerchantSlot) {
    changes.push({ key: 'slot', icon: '🛒', label: 'Merchant', value: '+1 slot', tone: 'up' });
  }

  // Skill grant is deduped by the engine — only report it if the loadout
  // actually gained the skill (not a repeat grant no-op).
  if (effects.grantSkillById) {
    const had = before.skills.some((s) => s.id === effects.grantSkillById);
    const has = after.skills.some((s) => s.id === effects.grantSkillById);
    if (!had && has) {
      const granted = Object.values(SKILLS).find((s) => s.id === effects.grantSkillById);
      changes.push({ key: 'skill', icon: '📜', label: 'Learned', value: granted?.name ?? 'New Jutsu', tone: 'up' });
    }
  }

  if (effects.buffs) {
    for (const buff of effects.buffs) {
      changes.push({ key: `buff-${buff.id}`, icon: '🛡', label: 'Effect', value: `${buff.name} · ${buff.duration}t`, tone: 'up' });
    }
  }

  if (effects.curse) {
    const pct = Math.round((effects.curse.value ?? 0.5) * 100);
    const dur = effects.curse.duration ?? 3;
    changes.push({ key: 'curse', icon: '☠', label: 'Curse', value: `+${pct}% dmg · ${dur}t`, tone: 'curse' });
  }

  // Item loss: find the slot that went item→null so we can name what was lost.
  if (effects.removeRandomItem) {
    const lost = before.bag.find((item, i) => item !== null && after.bag[i] === null);
    if (lost) {
      changes.push({ key: 'item-lost', icon: '✖', label: 'Lost', value: lost.name, tone: 'down' });
    }
  }

  // Narrative flags: surfaced quietly so the player knows a decision was recorded.
  if (effects.setFlags) {
    for (const flag of Object.keys(effects.setFlags)) {
      changes.push({ key: `flag-${flag}`, icon: '⚑', label: 'Mark', value: flag.replace(/_/g, ' '), tone: 'flag' });
    }
  }

  return changes;
}
