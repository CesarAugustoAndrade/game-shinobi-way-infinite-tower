# T-057 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Strong Fist ATTACK AP2/CD1 CLOSE 2×5. `hitCount: 2`, `baseDamage: 5`. Independent rolls via existing `resolveMultiHit`. Full connect 10; full miss 0. Do not retune Phoenix / Barrage / Leaf Whirlwind. Do not edit `ResolveSkillSystem`. Tests `t057StrongFist` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `STRONG_FIST` authoring.
2. `src/game/systems/__tests__/t057StrongFist.test.ts` — AC1–3 (+ optional partial).
3. `src/simulation/StrongFistBalance.ts` + `src/simulation/index.ts` — probe.
4. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.ATTACK`; AP2/CP0/CD1/HP0; `hitCount: 2`; `baseDamage: 5`; MELEE; PHYSICAL; `allowedRanges: [CLOSE]`.
- Tags: `TAIJUTSU` + `PHYSICAL` + `MULTI_HIT`.
- Honest description: 2×5 independent hits at CLOSE; on-hit effects once per card if ≥1 hit.
- Keep `scalingPerPoint: 2` / STRENGTH (tests use `rollHit` → AC2 stays 10).
- No Mode; no bandMove; no Stun/Bleed package.

## Resolve

- Existing path only: `hitCount` + `resolveMultiHit` + test `rollHit`.
- Do not edit `ResolveSkillSystem.ts` or `MarkSystem.ts`.
- MEDIUM/LONG rejected by `allowedRanges`.

## Out of scope

Phoenix / Uzumaki Barrage / Leaf Whirlwind retune; Senbon; Wire Trap; Sword Slash; live `useSkill` / `SkillResolutionSystem` hitCount wiring; UI.

## Tests (`t057StrongFist.test.ts`)

- **AC1 authoring:** ATTACK, AP2/CD1, `hitCount` 2, `baseDamage` 5 (not 10), CLOSE, TAIJUTSU/PHYSICAL/MULTI_HIT, no `modeInteraction`.
- **AC2 full:** CLOSE two hits → `hitsLanded === 2`, `damageDealt === 10`; MEDIUM reject.
- **AC3 miss:** two misses → `hitsLanded === 0`, `damageDealt === 0`.
- Optional (ports exist): sequence hit then miss → 1 / 5.

Keep T-033 Phoenix 3×5 as regression (do not change).

## Sim

Probe: authoring; full 2/10; miss 0/0; optional 1/5; vs legacy single 10 (dmg/AP 5.0 same on full connect). Hook `printStrongFistProbe` next to Explosive Tag in `simulate:quick`.

Note (do not implement): TANK-kit legacy `resolveSuccessfulHit` will read `baseDamage` 5 until that path learns `hitCount`.
