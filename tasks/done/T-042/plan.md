# T-042 · plan

**Ring:** R0 · **auto-approved** (standing automatic /task-dev loop)

Reauthor Mind Destruction as ATTACK AP3/CP6/CD4, 15 mental, Confusion 2 @65% on hit. Dedicated `setupRead` field: enemy `read_mind` → Setup-bucket +50% (`floor(dmg * 1.5)`), **do not consume**. No Mode. Tests `t042MindDestruction` + sim probe.

## Design (3–5 lines)

Add `SetupReadSpec` / `Skill.setupRead` — mark-only lectura, not `modeInteraction`. In ATTACK resolve, after hit total (and existing Mode/off_balance buckets), if `setupRead` and `hasEnemyMark`, `damageDealt = floor(damageDealt * (1 + damageMultBonus))`. Consume only when `setupRead.consume === true` (Mind Destruction authors `false`). Apply `controlConfusion` on ATTACK iff `hitsLanded >= 1`. Empty modes in fixtures prove Yamanaka sin Mode.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | `skills.ts` + `types.ts` `setupRead` / `controlConfusion` |
| AC2 baseline | `resolveSkill` no mark → 15; Confusion only on rng < 0.65 |
| AC3 setup read | enemy `read_mind` → 22; mark duration/stacks unchanged; no Mode |

## Steps (single implementer)

1. `types.ts`: `SetupReadSpec` + `Skill.setupRead`.
2. `ResolveSkillSystem.ts`: Setup bucket + ATTACK-on-hit Confusion; optional consume filter (new array).
3. Reauthor `MIND_DESTRUCTION`; write `t042MindDestruction.test.ts`; add `MindDestructionBalance` probe + CHANGELOG.

## Risks / plan B

- Do not gate Setup on Mode ON.
- Do not consume `read_mind`.
- Do not retune T-041 plant.
- If rounding ever ≠ 22, lock actual `floor` result — here 22 is exact.

## Research

In-tree only (see research.md).
