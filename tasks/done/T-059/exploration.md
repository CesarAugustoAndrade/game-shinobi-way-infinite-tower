# T-059 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. `markEffects` bleed already exists.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `SWORD_SLASH` is unmarked ACTIVE AP2/CD1 base 10, BLEED 7×2 @30%, no CLOSE | **true** | `skills.ts` 804–823: no `cardRole`, no `allowedRanges`, no `markEffects` |
| Kunai Slash plants `bleed` 3×2 via `markEffects` | **true** | `skills.ts` 633–642; T-048 hit plants stacks 3 duration 2 |
| `resolveSkill` plants `markEffects` on ATTACK/SIDE when hits land | **true** | `applySkillMarkEffects` after impact (T-048 path) |
| No test locks Sword Slash 30%/7 identity | **true** | no `sword_slash` in `__tests__` |
| `SkillTag.WEAPON` exists | **true** | used by Kunai |

## Ports / reuse

- Damage: existing ATTACK `rollHit` (T-051/T-057).
- Bleed plant: same `markEffects` + `applySkillMarkEffects` as T-048; stacks **4** not 3.
- Range: `allowedRanges: [CLOSE]` (MEDIUM/LONG reject).
- Tags: WEAPON + PHYSICAL (not TOOL).

## Complexity premise

Spec said “mirror kunai_slash markEffects bleed with stacks 4.” Confirmed: authoring only. **Do not** edit `ResolveSkillSystem`. **Do not** keep BLEED 7@0.3 `effects[]`.

## Layers

R0: `skills.ts` `SWORD_SLASH` only. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `SWORD_SLASH` (legacy 30% Bleed 7).
- `src/game/systems/__tests__/t048KunaiSlash.test.ts` — sibling plant/miss template.
- `src/game/systems/ResolveSkillSystem.ts` — `applySkillMarkEffects` (read-only).

## Surprises / debt

- None blocking. DoT tick damage stays existing pipeline (out of scope).
