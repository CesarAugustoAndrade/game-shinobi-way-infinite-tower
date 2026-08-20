# T-129 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M

Explorer subagent spawn did not persist; orchestrator mapped the same files (read-only).

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `KAWARIMI` is BASIC ACTIVE AP1/CP3/CD4, Shield 30×1 + SPEED 0.3×2, `stanceShift` DEFENSIVE, no `cardRole` / `markEffects` | **true** | `skills.ts:198–222` |
| Catalog wants SUPPORT AP1/CP3/CD4, Substitution 2 ignore first hit + retreat 1, consume | **true** | spec + `#catalogo` kawarimi |
| `applyDecoyOutgoing` / `applyMistOutgoing` cut stacks once then strip | **true** | `MarkSystem.ts:140–178`; decoy/mist **target ENEMY** |
| `applyOutgoingMarkCuts` is Fear → Smoke → Read Window; Decoy/Mist **not** in the live chain | **true** | `MarkSystem.ts:227–238`; `EnemyTurnSystem.ts:515` calls only that chain |
| `MarkSpec.targetActor` `'self' \| 'enemy'`; SUPPORT plant via `applySkillMarkEffects` | **true** | `types.ts:457`; `ResolveSkillSystem.ts:396–422` self → `CombatActor.PLAYER` |
| `BandMoveKind.SELF_RETREAT` exists; authored retreat maps to PUSH (toward LONG) | **true** | `types.ts:432`; `ResolveSkillSystem.ts:464`; `RangeSystem.applyForcedMove` `259–270` |
| `SkillTag.DEFENSE` / `MOVEMENT` exist | **false** | tags: NINJUTSU / MARK / PHYSICAL available (`types.ts:340–364`) |
| T-124 Counter self-reaction plant | **true** | `counter_reflect` `targetActor: 'self'` `skills.ts:589–596` |
| Existing `substitution` / `kawarimi_sub` helper | **false** | no mark id in `MarkSystem.ts` |
| `KAWARIMI` already in academy loadouts | **true** | `constants/index.ts:144,165,178` (reauthor in place; do not add a second row) |

## Complexity premise

Spec’s “hard part” (ON_HIT reaction engine) is **already generalized** by Decoy/Mist one-shot helpers. Kawarimi needs a **self-target** incoming helper (nullify + `retreatSteps: 1`), not a new mit pipeline. Live EnemyTurn wire for Decoy is **absent** (T-074 bar) → live wire is OOS / follow-up.

## Relevant files

- `src/game/constants/skills.ts` — `KAWARIMI` authoring
- `src/game/systems/MarkSystem.ts` — decoy/mist helper shape to mirror
- `src/game/systems/ResolveSkillSystem.ts` — SUPPORT `markEffects` plant (no new branch if data-driven)
- `src/game/systems/RangeSystem.ts` — `applyForcedMove` PUSH = retreat toward LONG
- `src/game/systems/EnemyTurnSystem.ts` — live `applyOutgoingMarkCuts` (no decoy; do not invent a second engine)
- `src/game/systems/__tests__/t074Bunshin.test.ts` — AC plant + helper
- `src/game/systems/__tests__/t124CounterStance.test.ts` — self mark plant
- `src/simulation/BunshinBalance.ts` / `index.ts` — probe hook pattern

## Port signatures

None. New helper is a domain export on `MarkSystem` (same as `applyDecoyOutgoing`). Stay **R0**.

## Local deps

`skills.ts` → `types` · `ResolveSkillSystem` → `MarkSystem.addMark` · helper → `Mark` + optional `applyForcedMove`

## Existing tests

No `kawarimi` AC. Siblings: T-074 decoy, T-073 mist, T-038 smoke, T-124 counter self-plant.

## Surprises / debt

- Decoy/Mist plant on **enemy**; Substitution must plant on **self** (incoming, not outgoing).
- `applyOutgoingMarkCuts` still omits decoy/mist — live substitution wire would be a new engine (OOS).
- No DEFENSE/MOVEMENT tags.
- Retreat on **fire**, not on cast (`bandMove` on the skill would retreat at play — wrong vs T-023 Backstep).
