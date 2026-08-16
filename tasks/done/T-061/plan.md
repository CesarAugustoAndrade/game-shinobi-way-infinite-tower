# T-061 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Poison Coat SUPPORT AP1/CP1/CD4. Plant self `coated` duration 2. Next Offensive (ATTACK or SIDE) hit: Poison 5×3 on enemy, consume coat. Miss/SUPPORT/MODE: coat stays. Remove immediate POISON 8×3. Do not retune Wire Trap / Kunai / Sword. Tests `t061PoisonCoat` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `POISON_COAT` authoring.
2. `src/game/systems/ResolveSkillSystem.ts` — Offensive coat payoff after wire-trap block.
3. `src/game/systems/__tests__/t061PoisonCoat.test.ts` — AC1–3.
4. `src/simulation/PoisonCoatBalance.ts` + `src/simulation/index.ts` — probe.
5. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.SUPPORT`; AP1/CP1/CD4/HP0; `baseDamage: 0`; AUTO (ANY range).
- Tags: `TOOL` + `MARK` (no `SkillTag.POISON`).
- `markEffects: [{ id: 'coated', duration: 2, stacks: 1, consume: IMPACT, family: STAT, targetActor: 'self' }]`.
- No `effects` POISON 8×3.
- Honest description: Coated 2; next Offensive on hit applies Poison 5×3 and consumes the coat.

## Resolve

- SUPPORT: existing `applySkillMarkEffects` plants self `coated`. `damageDealt === 0`.
- After T-060 wire-trap block, still inside `hitsLanded ≥ 1`:
  - if `(ATTACK || SIDE) && hasPlayerMark(coated)` → `addMark` enemy `poison` stacks 5 duration 3 DOT; remove `coated` (`target === PLAYER`).
- Miss: no poison, coat remains.
- Do not change Wire Trap skip/mult.

## Out of scope

Wire Trap retune; Cloak; Iaido; DoT tick sim; UI.

## Tests (`t061PoisonCoat.test.ts`)

- **AC1 authoring:** SUPPORT, AP1/CP1/CD4, dmg 0, self `coated` 2 IMPACT; no POISON 8×3.
- **AC2 plant:** resolve → `coated` duration 2 on player, no enemy poison, dmg 0.
- **AC3 payoff:** mock SIDE (or ATTACK) hit → poison 5×3, coat gone; miss → 0, coat remains, no poison.

Keep T-060 Wire Trap as regression (do not change).

## Sim

Probe: authoring; plant; SIDE/ATTACK hit poison 5×3 + consume; miss keeps coat; vs legacy immediate Poison 8. Hook `printPoisonCoatProbe` next to Wire Trap in `simulate:quick`.
