# T-077 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Air Bullet SIDE AP2/CP5/CD2 M/L 13 WIND. `bandMove: { kind: 'PUSH', steps: 1, requireHit: true }`. On hit plant enemy `air_acc_down` stacks 1 duration 1 STAT. Remove WIL −0.15×2. No ResolveSkillSystem change. Tests `t077AirBullet` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `AIR_BULLET` authoring.
2. `src/game/systems/__tests__/t077AirBullet.test.ts` — AC1–3.
3. `src/simulation/AirBulletBalance.ts` + `src/simulation/index.ts` — probe vs Explosive Tag 11 / unused WIL %.
4. `CHANGELOG.md` — Unreleased line.

Do **not** edit `ResolveSkillSystem.ts`.

## Authoring

- `cardRole: CardRole.SIDE_ATTACK`; AP2/CP5/CD2/HP0; `baseDamage: 13`; RANGED; WIND; `allowedRanges: [MEDIUM, LONG]`.
- Tags: `NINJUTSU` + `WIND` (`SkillTag.MOVEMENT` does not exist).
- `bandMove: { kind: 'PUSH', steps: 1, requireHit: true }`.
- `markEffects: [{ id: 'air_acc_down', duration: 1, stacks: 1, family: STAT, targetActor: 'enemy', requireHit: true }]`.
- No `effects` WIL −0.15×2.
- Honest description: 13 M/L; PUSH 1 on hit; −1 ACC for 1 opportunity.

## Resolve

- Existing SIDE damage + `applySkillMarkEffects` + `bandMove.requireHit`.
- MEDIUM hit → LONG + ACC mark; LONG hit stays LONG; miss no PUSH no mark.
- Forced PUSH does not set `playerMoveUsedThisTurn`.
- CLOSE rejected by `allowedRanges`.

## Out of scope

Kawarimi; Explosive Tag / Air Palm / Flash Bomb / Windmill retune; great_breakthrough; UI.

## Tests (`t077AirBullet.test.ts`)

- **AC1 authoring:** SIDE, AP2/CP5/CD2, 13, M/L, PUSH 1 requireHit, `air_acc_down` 1/1 STAT enemy requireHit; no WIL −0.15.
- **AC2 hit:** MEDIUM hit → dmg 13, range LONG, ACC mark stacks 1 duration 1, `playerMoveUsedThisTurn` false.
- **AC3 miss:** MEDIUM miss → dmg 0, still MEDIUM, no ACC mark.

## Sim

Probe: authoring; chip 13; MEDIUM→LONG; LONG edge stay; miss no mark; vs Explosive Tag 11 / unused WIL −15%. Hook after Sand Shield.
