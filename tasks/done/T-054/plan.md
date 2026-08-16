# T-054 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Elbow Strike SIDE AP1/CD1 CLOSE 8 MELEE. Plant `guard_break` 2 on ≥1 hit (`perHit: true`). Next ATTACK applies 15% pen via existing `applySkillPenetration` (`GUARD_BREAK_PEN = 0.15`) and consume only on ATTACK. Drop SIDE `PIERCING`. Tests `t054ElbowStrike` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `ELBOW_STRIKE` authoring.
2. `src/game/systems/ResolveSkillSystem.ts` — consume gate + fold 0.15 into Studied/def pen block.
3. `src/game/systems/__tests__/t054ElbowStrike.test.ts` — AC1–3.
4. `src/simulation/ElbowStrikeBalance.ts` + `src/simulation/index.ts` — probe.
5. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.SIDE_ATTACK`; AP1/CP0/CD1/HP0; `baseDamage: 8`; single hit; MELEE; `allowedRanges: [CLOSE]`.
- Tags: `TAIJUTSU` + `PHYSICAL`.
- `damageProperty: DamageProperty.NORMAL` (delete PIERCING).
- `markEffects`: `guard_break`, duration 2, stacks 1, `ATTEMPT`, `STAT`, `self`, `perHit: true`.
- Honest description: 8 dmg CLOSE; Guard Break 2 → next ATTACK ignores 15% defense.
- Keep `scalingPerPoint: 2` / STRENGTH (chip tests use `rollHit` so AC2 stays 8).
- No Mode; no band move.

## Resolve

- Consume: `if (mark.id === 'guard_break') return role === CardRole.ATTACK;` (sibling of `feint`/`aim`).
- Payoff: in the existing Studied/def block:
  - `spentGuard = afterAttempt.spent.some(id === 'guard_break')`
  - `pen = Math.max(studied ? 0.2 : 0, spentGuard ? 0.15 : 0, skill.penetration ?? 0)`
  - apply when `hitsLanded > 0 && (studied || spentGuard || defensePercent > 0)`
- SIDE plays do not spend `guard_break`.
- Full miss ATTACK: spend at attempt; no pen (`hitsLanded > 0` gates apply).
- Full miss Elbow: `perHit` → no plant; damage 0.
- Do **not** retune Studied stay-on-board or 0.2 value.

## Out of scope

Wire Trap / Sweeping Kick / Strong Fist; Feint / Launched / Aim / Studied / Twin Lion retune; UI; MarkSpec metadata field.

## Tests (`t054ElbowStrike.test.ts`)

- **AC1 authoring:** SIDE, AP1/CD1, 8, CLOSE, MELEE, `guard_break` duration 2 ATTEMPT self perHit STAT; `damageProperty` NORMAL (not PIERCING).
- **AC2 plant:** CLOSE hit → `damageDealt === 8`, own `guard_break` duration 2; miss → 0 + no plant; MEDIUM reject.
- **AC3 payoff (lock):** ATTACK base 20, `enemyDefensePercent: 0.4` → without mark 12; with `guard_break` 13 and mark gone; miss ATTACK → 0 + consumed; SIDE after plant does not spend / no pen.

## Sim

Probe: authoring flags; chip 8; ATTACK 20@40% def 12→13; SIDE keeps mark; miss no plant. Hook `printElbowStrikeProbe` next to Shuriken in `simulate:quick`.
