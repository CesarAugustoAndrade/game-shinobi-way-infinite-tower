# T-001 · plan

**Ring:** R0 · **Route:** autonomous · **Estimate:** S · **Implementers:** 1 (sequential)  
**Worktree:** `.worktrees/T-001` · **Branch:** `task/T-001`  
**HUMAN CHECKPOINT (R0):** auto-approved 2026-08-12 by standing automatic `/task-dev` loop order (ALWAYS APPROVE; treat coherent `plan.md` as approved). Implementing now.

## Design decision

Keep contracts on the existing game type surface (`src/game/types.ts`) and put all invariants in a new pure R0 module `src/game/systems/CardContractSystem.ts`. `Skill.cardRole` and other SOUL authoring fields stay **optional** so the catalog compiles; `resolveCardRole` **requires** an explicit `cardRole` (or explicit id→role map) and never calls `getCardCategory` / damage. `SkillConfig` is a new type (not `CombatSetup`). Push-outward does not apply: these are domain rules, not adapter logic.

## Implementation steps (one implementer, TDD)

### Step 1 — AC tests first
- **Files:** `src/game/systems/__tests__/t001CardContracts.test.ts` (R0 tests)
- **AC:** AC1, AC2, AC3 (all three live in this file; gate `npm test -- src/game/systems/__tests__/t001CardContracts`)
- Write failing tests:
  - **AC1:** `CardRole`, `TargetScope`, `ModeDefinition`, `Mark` exported from `src/game/types`; fixture objects satisfy required fields (enum members + Mode/Mark/SkillConfig shapes).
  - **AC2:** `T-001 cardRole not inferred from damage` — two skills, identical authored `cardRole`, different `baseDamage` → same resolved role; missing `cardRole` + high vs low damage → both incomplete, **not** inferred.
  - **AC3:** `ensureMainAttack` with ≥1 ATTACK and empty Main → assigns via injected rng + `notified: true`; never empty Main when an ATTACK exists; `withAddedSkill` does not change an already-set Main.
  - Also pin: `defaultBaseWeight() === 2`, `actionTypeForCardRole` / `isHandPlayableRole` mapping, MODE↔TOGGLE.

### Step 2 — Type surface
- **Files:** `src/game/types.ts` only (R0 domain)
- **AC:** AC1
- Add TypeScript **enums** `CardRole`, `TargetScope`, `SkillTag`, plus small stub enums `CombatActor`, `MarkConsumeTiming` (and a minimal `CombatTrigger` / `ModeEndKind` if referenced).
- Add interfaces: `TypedCost`, `WeightModifier`, `EnhancementRule`, `ModeEndClause`, `DiscoverSpec`, `MarkSpec`, `ModeInteraction`, `ModeDefinition`, `Mark`, `SkillConfig`.
- Extend `Skill` **optionally**: `cardRole?`, `tags?`, `baseWeight?`, `hitCount?`, `discover?`, `markEffects?`, `modeInteraction?`, `perHitEffects?`.
- Comment: missing `cardRole` = incomplete authoring, not “guess from DPS”. Do not make `cardRole` required.

### Step 3 — Pure helpers
- **Files:** `src/game/systems/CardContractSystem.ts` (R0)
- **AC:** AC2, AC3
- Export:
  - `defaultBaseWeight(): 2`
  - `actionTypeForCardRole(role)`, `isHandPlayableRole(role)`
  - `resolveCardRole(skill)` — reads only `cardRole` (or explicit map). No `baseDamage` / `getCardCategory`.
  - `ensureMainAttack(config, loadout, rng)` — immutable `{ ...config }`; uniform pick among ATTACK ids; `notified`.
  - `withAddedSkill(config, skillId)` — returns same `mainAttackId`.
- `rng` injected; no `Math.random`. No React/DOM. No import of `combatCards`.
- Optional one-line `@deprecated` on `getCardCategory` **only if** needed for discoverability; **do not** change its behavior or tests.

### Step 4 — Compile + RING-GUARD + sim regression
- **Files:** none new
- **AC:** RING-GUARD, `npm run typecheck`, targeted tests
- Confirm new R0 files import only `src/game/types` (and nothing under components/scenes/hooks/contexts).
- `npm run simulate:quick` — **expect no equilibrium change** (types/helpers unused by live draw/combat). Record win rate / TTK / damage / AP vs pre-change baseline.

## AC coverage

| AC | Step | Gate |
|---|---|---|
| RING-GUARD | 3–4 | verifier inspects diff imports |
| typecheck | 2–4 | `npm run typecheck` |
| AC1 taxonomy | 1+2 | `npm test -- src/game/systems/__tests__/t001CardContracts` |
| AC2 no damage inference | 1+3 | same; case name `T-001 cardRole not inferred from damage` |
| AC3 Main invariants | 1+3 | same |

## Out of scope (do not touch)

DeckSystem / discard / `getCardCategory` behavior / catalog `cardRole` authoring / Mode runtime / Mark pipeline / UI / AI / sim metrics expansion / SOUL edits.

## Risks and plan B (max 3)

1. **`Skill` required-field fallout** — if implementer makes `cardRole` required, catalog + mocks explode. Plan B: keep optional (already specified).
2. **Name clash `baseWeight`** with `DeckLocation.baseWeight` — keep skill helper named `defaultBaseWeight` / `skill.baseWeight`; do not create a generic `baseWeight()`.
3. **Someone wires heuristic fallback “temporarily”** — reviewer BLOCK; AC2 must fail that path.

## Implementer split

Single implementer in `.worktrees/T-001` on `task/T-001`. No parallel files.

## Merge policy (after verify)

R0: **no auto-merge**. Human reads full diff. Worktree stays until that merge.

## Status

`auto-approved` — standing loop order; IMPLEMENT in progress.
