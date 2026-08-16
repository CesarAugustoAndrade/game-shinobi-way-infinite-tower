# T-043 exploration

**Ring:** R0 confirmed. No port-signature change (`intent.movement` already exists). Route: `autonomous`.

## Terrain

| Path | Role |
|---|---|
| `src/game/constants/skills.ts` ~239 | `SHUNSHIN` — AP1/CP4/CD3, 0 dmg, SPEED +0.4×2 `effects`, no `cardRole` / `bandMove` / mark |
| `src/game/types.ts` | `BandMoveSpec` SELF_APPROACH / SELF_RETREAT; `MarkSpec.targetActor`; `ResolveSkillIntent.movement?: { kind: 'PUSH' \| 'PULL' }` |
| `ResolveSkillSystem.ts` ~352–358 | `skillForcedMove` maps SELF_APPROACH→PULL, SELF_RETREAT→PUSH |
| same ~605–606 | `consumeOnAttempt` on **every** role (would eat `shunshin_dex` if a SUPPORT followed) |
| same ~719 | SUPPORT `applySkillMarkEffects` (plants after attempt consume — self-plant is safe) |
| same ~829–850 | `intent.movement ?? skillForcedMove` → `resolveForcedMove` (never spends voluntary move) |
| T-023 / T-029 tests | band + `playerMoveUsedThisTurn === false` fixtures |

## Premises

- **Data:** catalog costs already match AP1/CP4/CD3. Identity gap is SPEED % + missing SUPPORT/move/DEX mark.
- **Complexity:** range engine exists (T-023/T-029). New work is (1) authoring, (2) gate ATTEMPT consume to Offensive so SUPPORT/MODE do not spend `shunshin_dex`, (3) +1 DEX on spent mark.
- **Intent field:** reuse `intent.movement` (`PULL` = approach, `PUSH` = retreat). Do not add `bandChoice`.

## Re-classify

No. R0 stays.
