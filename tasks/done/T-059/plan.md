# T-059 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Sword Slash ATTACK AP2/CD1 CLOSE 10. `markEffects` bleed duration 2 stacks 4 `perHit` (DOT, enemy). Hit plants Bleed 4×2; miss plants nothing. Remove BLEED 7@0.3 `effects[]`. Do not retune Kunai / Senbon / Strong Fist. Do not edit `ResolveSkillSystem`. Tests `t059SwordSlash` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `SWORD_SLASH` authoring.
2. `src/game/systems/__tests__/t059SwordSlash.test.ts` — AC1–3.
3. `src/simulation/SwordSlashBalance.ts` + `src/simulation/index.ts` — probe.
4. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.ATTACK`; AP2/CP0/CD1/HP0; `baseDamage: 10`; MELEE; `allowedRanges: [CLOSE]`.
- Tags: `WEAPON` + `PHYSICAL`.
- `markEffects: [{ id: 'bleed', duration: 2, stacks: 4, family: DOT, targetActor: 'enemy', perHit: true }]`.
- No `effects` BLEED 7@0.3.
- Honest description: 10 dmg CLOSE; on hit Bleed 4 for 2.
- Keep `scalingPerPoint: 2` / STRENGTH (tests use `rollHit` → AC2 stays 10).
- No Mode; no multi-hit; no Silence/Stun.

## Resolve

- Existing `applySkillMarkEffects` only.
- MEDIUM/LONG rejected by `allowedRanges`.

## Out of scope

Kunai Slash / Senbon / Strong Fist retune; Wire Trap; Iaido Cloak; Senbon Rain; DoT tick sim AC; UI.

## Tests (`t059SwordSlash.test.ts`)

- **AC1 authoring:** ATTACK, AP2/CD1, 10, CLOSE, WEAPON/PHYSICAL, bleed 4×2 DOT; no BLEED 7@0.3.
- **AC2 hit:** CLOSE hit → dmg 10, enemy `bleed` stacks 4 duration 2; MEDIUM reject.
- **AC3 miss:** miss → dmg 0, no bleed.

Keep T-048 Kunai 3×2 as regression (do not change).

## Sim

Probe: authoring; hit 10 + Bleed 4×2; miss clean; vs legacy 30% Bleed 7 (plant 0→4 guaranteed). Hook `printSwordSlashProbe` next to Senbon in `simulate:quick`.
