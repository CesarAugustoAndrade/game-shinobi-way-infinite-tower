# T-056 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Explosive Tag SIDE AP1/CD2 CLOSE/MEDIUM 11 FIRE. `bandMove: { kind: 'PUSH', steps: 1, requireHit: true }`. Hit PUSHes 1 without spending manual move. Miss: 0 dmg, no band change. Do not retune Air Palm. Tests `t056ExplosiveTag` + probe.

## Files (disjoint; one implementer)

1. `src/game/types.ts` — optional `requireHit?: boolean` on `BandMoveSpec`.
2. `src/game/constants/skills.ts` — `EXPLOSIVE_TAG` authoring.
3. `src/game/systems/ResolveSkillSystem.ts` — skip forced move when `requireHit && hitsLanded < 1`.
4. `src/game/systems/__tests__/t056ExplosiveTag.test.ts` — AC1–3.
5. `src/simulation/ExplosiveTagBalance.ts` + `src/simulation/index.ts` — probe.
6. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.SIDE_ATTACK`; AP1/CP0/CD2/HP0; `baseDamage: 11`; RANGED; FIRE; `allowedRanges: [CLOSE, MEDIUM]`.
- Tags: `TOOL` + `FIRE` (no `SkillTag.MOVEMENT`).
- `bandMove: { kind: 'PUSH', steps: 1, requireHit: true }`.
- Honest description: 11 dmg CLOSE/MEDIUM; PUSH 1 on impact.
- Keep `scalingPerPoint: 2` / DEXTERITY (chip tests use `rollHit` → AC2 stays 11).
- No Mode; no Stun; no Bleed.

## Resolve

- After existing post-hit work, movement block:
  - if `skill.bandMove?.requireHit && hitsLanded < 1` → do not call `skillForcedMove`.
  - else existing loop unchanged.
- Forced PUSH does not set `playerMoveUsedThisTurn` (existing `resolveForcedMove`).
- CLOSE hit → MEDIUM; MEDIUM hit → LONG; miss stays put.
- LONG play rejected by `allowedRanges` (no LONG-edge PUSH case).

## Out of scope

Air Palm / Blastback / Kunai / Sweeping Kick retune; Strong Fist; Wire Trap; Senbon; UI.

## Tests (`t056ExplosiveTag.test.ts`)

- **AC1 authoring:** SIDE, AP1/CD2, 11, CLOSE+MEDIUM (not LONG), FIRE, `bandMove` PUSH 1 `requireHit`.
- **AC2 push:** CLOSE hit → dmg 11, range MEDIUM, `playerMoveUsedThisTurn` false; LONG reject.
- **AC3 miss:** CLOSE miss → dmg 0, range still CLOSE.

Keep T-026 miss PUSH as regression (do not change).

## Sim

Probe: authoring; chip 11; CLOSE→MEDIUM on hit; miss no move; AP 2→1. Hook `printExplosiveTagProbe` next to Sweeping Kick in `simulate:quick`.
