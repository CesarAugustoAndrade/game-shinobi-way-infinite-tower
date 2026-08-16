# T-065 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. SUPPORT `applySkillMarkEffects` already plants self SHIELD (T-064/T-028). **No new resolve path.**

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `BRACE` unmarked ACTIVE AP1/CP0/CD3, WIL +0.3×1, `stanceShift: DEFENSIVE` | **true** | `skills.ts` 1021–1042 |
| T-064 `mud_wall_shield` 35/99 exists | **true** | `skills.ts` 137–145 |
| SUPPORT plants `markEffects` | **true** | `applySkillMarkEffects` |
| `SkillTag.DEFENSE` / `POSTURE` exist | **false** | SkillTag has PHYSICAL/MARK, no DEFENSE/POSTURE |
| Pure resolve applies `stanceShift` | **false** | PlayerTurn / PostureSystem only |
| No test locks WIL +0.3 on `brace` | **true** | no `brace` authoring in `__tests__` |

## Ports / reuse

- Plant: same as T-064 — `targetActor: 'self'`, `family: SHIELD`, **id `brace_shield`**, stacks **20**, duration **1**.
- Costs: T-007 AP−1, CP 0, `readyOnTurn = T + 3 + 1`.
- SHIELD instances coexist (T-004 merge is STAT-only).

## Complexity premise

Spec listed ResolveSkillSystem. Verified: SUPPORT already plants. **Do not edit resolve.** Authoring only.

## Layers

R0: `skills.ts` `BRACE`. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `BRACE`.
- `src/game/systems/__tests__/t064MudWall.test.ts` — plant/costs template.

## Surprises / debt

- No DEFENSE/POSTURE tags — omit tags (do not grow SkillTag).
- Leave `stanceBonus` DEFENSIVE AP discount (not in AC).
