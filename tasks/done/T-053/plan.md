# T-053 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Shuriken SIDE AP1/CD1 MEDIUM/LONG 11 RANGED TOOL. Plant `aim` 2 on ≥1 hit (`perHit: true`, self, STAT, ATTEMPT). Next ATTACK +1 ACC via T-043 integer-stat rule (`scalingPerPoint` if `ACCURACY`, else +1). Consume only on ATTACK. Drop `critBonus`. Tests `t053Shuriken` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `SHURIKEN` authoring.
2. `src/game/systems/ResolveSkillSystem.ts` — consume gate + Aim ACC add.
3. `src/game/systems/__tests__/t053Shuriken.test.ts` — AC1–3.
4. `src/simulation/ShurikenBalance.ts` + `src/simulation/index.ts` — probe.
5. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.SIDE_ATTACK`; AP1/CP0/CD1/HP0; `baseDamage: 11`; single hit; RANGED; `allowedRanges: [MEDIUM, LONG]`.
- Tags: `TOOL` + `WEAPON` + `PHYSICAL`.
- `markEffects`: `aim`, duration 2, stacks 1, `ATTEMPT`, `STAT`, `self`, `perHit: true`.
- Delete `critBonus: 25`. Keep `scalingPerPoint: 3` / `ACCURACY` (chip tests use `rollHit` so AC2 stays 11).
- Honest description: 11 dmg M/L; Aim 2 → next ATTACK +1 ACC.
- No Mode; no band move; no Bleed; no `nextDrawTagBonus`.

## Resolve

- Consume: `if (mark.id === 'aim') return role === CardRole.ATTACK;` (sibling of `feint`).
- Payoff (lock AC3): next to `shunshin_dex`:
  - if spent `aim` and `hitsLanded > 0`: add `scalingStat === ACCURACY ? scalingPerPoint : 1`.
- SIDE plays do not spend `aim`.
- Full miss ATTACK: spend at attempt; no bonus (`hitsLanded > 0` gates add).
- Full miss Shuriken: `perHit` → no plant; damage 0.

## Out of scope

Elbow Strike / Wire Trap / Strong Fist / Barrage; Feint/Launched/Kunai retune; live hit-roll ACC UI; new SkillTag.

## Tests (`t053Shuriken.test.ts`)

- **AC1 authoring:** SIDE, AP1/CD1, 11, MEDIUM+LONG (not CLOSE), `aim` duration 2 +1 ACC contract (`STAT`, ATTEMPT, self, perHit), no `critBonus`.
- **AC2 plant:** MEDIUM hit → `damageDealt === 11`, own `aim` duration 2; miss → 0 + no plant; CLOSE reject.
- **AC3 payoff:** ACC ATTACK `base 10` / `scalingPerPoint 4` with `aim` → 14 and mark gone; without mark → 10; miss ATTACK → 0 + consumed; SIDE after plant does not spend / does not add.

## Sim

Probe: authoring flags; chip 11; ACC ATTACK 10→14; SIDE does not consume; miss no plant. Hook `printShurikenProbe` in `simulate:quick` path (`index.ts` next to Rising Wind).
