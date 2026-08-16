# T-066 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. SUPPORT already plants enemy STAT marks (T-038). **No new resolve path.**

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `FLASH_BOMB` unmarked ACTIVE AP1/CP0/CD4, ACC −0.4×2 @0.5 | **true** | `skills.ts` 974–993 |
| T-038 enemy `markEffects` plant works | **true** | `smoke` targetActor enemy |
| `SkillTag.CONTROL` exists | **false** | SkillTag has TOOL / MARK |
| `ResolveSkillState` has enemy intent | **false** | no `intendedSkillId` on resolve state |
| No test locks ACC −40%@50% | **true** | no `flash_bomb` in `__tests__` |

## Ports / reuse

- Plant: T-038 sibling — `id: 'blinded'`, duration 1, stacks **2** (= −2 ACC), family STAT, `targetActor: 'enemy'`.
- Costs: T-007 AP−1, CP 0, `readyOnTurn = T + 4 + 1`.
- Telegraph interrupt: **no R0 intent field** — skip (spec: AC does not require).

## Complexity premise

Spec listed ResolveSkillSystem. Verified: SUPPORT plant is enough. **Do not edit resolve.** Do not invent intent interrupt.

## Layers

R0: `skills.ts` `FLASH_BOMB`. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `FLASH_BOMB`.
- `src/game/systems/__tests__/t038SmokeBomb.test.ts` / `t065Brace.test.ts` — templates.

## Surprises / debt

- No `SkillTag.CONTROL` — use TOOL + MARK.
- Combat hit math does not yet read `blinded` ACC (spec: out of AC). Later R1/R0 hit-read.
