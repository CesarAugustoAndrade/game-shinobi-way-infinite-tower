# T-062 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Cloak of Invisibility SUPPORT AP1/CP3/CD4. Plant self `cloaked` duration 2 ATTEMPT. Next ATTACK (not SIDE): consume at attempt (even miss); on hit `floor(dmg * 1.5)` + +1 DEX. Remove SPEED/DEX % buffs. Do not retune Shunshin / Poison Coat / Iaido. Tests `t062CloakInvis` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `CLOAK_INVIS` authoring.
2. `src/game/systems/ResolveSkillSystem.ts` — ATTACK-only `cloaked` consume + crit/DEX payoff.
3. `src/game/systems/__tests__/t062CloakInvis.test.ts` — AC1–3.
4. `src/simulation/CloakInvisBalance.ts` + `src/simulation/index.ts` — probe.
5. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.SUPPORT`; AP1/CP3/CD4/HP0; `baseDamage: 0`; AUTO (ANY range).
- Tags: `NINJUTSU` + `MARK` (no `SkillTag.STEALTH`).
- `markEffects: [{ id: 'cloaked', duration: 2, stacks: 1, consume: ATTEMPT, family: STAT, targetActor: 'self' }]`.
- No `effects` SPEED 0.6 / DEX 0.5.
- Honest description: Cloaked 2; next ATTACK force crit +1 DEX; consume on attempt.

## Resolve

- SUPPORT: existing `applySkillMarkEffects` plants self `cloaked`. `damageDealt === 0`.
- In `consumeOnAttempt` allow: `if (mark.id === 'cloaked') return role === CardRole.ATTACK;` (feint sibling). Must not fall through to `return true`.
- After damage aggregation, if `hitsLanded > 0` and spent includes `cloaked`:
  - `damageDealt = Math.floor(damageDealt * 1.5)` (`BALANCE.CRIT_DAMAGE_MULT`).
  - then +1 DEX: if `scalingStat === DEXTERITY` add `scalingPerPoint`, else +1 (shunshin formula).
- Miss: coat gone, dmg 0, no crit/DEX apply.
- Do not change `rollHit` signature. Do not call StatSystem.

## Out of scope

Iaido Cloak +50%; Poison Coat; Shunshin retune; mud_wall; evasion dodge; UI.

## Tests (`t062CloakInvis.test.ts`)

- **AC1 authoring:** SUPPORT, AP1/CP3/CD4, dmg 0, self `cloaked` 2 ATTEMPT; no SPEED 0.6 / DEX 0.5.
- **AC2 plant:** resolve → `cloaked` duration 2 on player, dmg 0, no Mode/Terrain.
- **AC3 payoff:** same `rollHit` `{ hit: true, damage: 10 }` — uncloaked ATTACK 10; cloaked ATTACK `floor(10 * 1.5) + DEX`; mark gone. Miss → 0, mark gone. SIDE hit → 10, mark remains.

Keep T-043 / T-050 / T-061 as regression (do not change).

## Sim

Probe: authoring; plant; ATTACK 10→15+DEX + consume; miss consumes; SIDE leaves; vs legacy SPEED +60% / DEX +50%. Hook `printCloakInvisProbe` next to Poison Coat in `simulate:quick`.
