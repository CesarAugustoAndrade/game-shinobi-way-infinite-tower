# T-078 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Demon Slash ATTACK AP3/CP0/CD2 CLOSE 15. `markEffects` bleed duration 3 stacks 6 `perHit` (DOT, enemy). Drop PIERCING and BLEED 15 `effects[]`. No ResolveSkillSystem change. Tests `t078DemonSlash` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `DEMON_SLASH` authoring.
2. `src/game/systems/__tests__/t078DemonSlash.test.ts` — AC1–3.
3. `src/simulation/DemonSlashBalance.ts` + `src/simulation/index.ts` — probe vs Sword Slash 10/4×2 and unused BLEED 15.
4. `CHANGELOG.md` — Unreleased line.

Do **not** edit `ResolveSkillSystem.ts`.

## Authoring

- `cardRole: CardRole.ATTACK`; AP3/CP0/CD2/HP0; `baseDamage: 15`; `hitCount: 1`; MELEE; NORMAL; `allowedRanges: [CLOSE]`.
- Tags: `WEAPON` + `PHYSICAL`.
- `markEffects: [{ id: 'bleed', duration: 3, stacks: 6, family: DOT, targetActor: 'enemy', perHit: true }]`.
- No `effects` BLEED 15.
- Honest description: 15 CLOSE; Bleed 6 for 3 opportunities on hit.

## Resolve

- Existing ATTACK `applySkillMarkEffects`.
- CLOSE hit → dmg 15 + bleed 6×3; miss → 0 + no bleed; AP−3.
- MEDIUM/LONG rejected.

## Tests

- **AC1 authoring:** ATTACK AP3/CP0/CD2 15 CLOSE Bleed 6×3; not AP2 / BLEED 15 / PIERCING.
- **AC2 hit:** CLOSE hit → 15 + enemy bleed 6 duration 3.
- **AC3 miss costs:** miss → no bleed; AP 6→3.

## Sim

Probe: chip 15; bleed 6×3 package 18 vs Sword 8; dmg/AP 5.0 vs Sword 5.0; vs unused BLEED 15×3 + PIERCING. Hook after Air Bullet.
