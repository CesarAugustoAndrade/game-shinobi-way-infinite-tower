# T-128 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `SHADOW_POSSESSION` is ADVANCED ACTIVE AP2/CP6/CD5, Stun 0.8×2 + Reflect 0.3×2, no `cardRole` / Bound / Setup | **true** | `skills.ts:2343–2371` |
| Catalog wants SUPPORT AP2/CP6/CD5, 80% Bound 1, +20% Setup next ATTACK | **true** | spec + `#catalogo` |
| Chance SUPPORT control plant exists (`controlStun`) | **true** | `types.ts:794–799`, `resolveControlSupport` |
| Enemy Setup +20% next ATTACK exists (`wire_trap` ×1.2 IMPACT consume) | **true** | `ResolveSkillSystem.ts:431–432, 1095–1116, 1194–1201, 1268–1322` |
| `setupRead` is per-skill ATTACK authoring, not a board convention | **true** | `Skill.setupRead`; Water Dragon / Mind Destruction |
| Bound movement-lock gate exists | **false** | `lockVoluntaryRangeUp` is Water Prison impactStun only (`t080`); no Bound band gate |
| `SkillTag.CONTROL` exists | **false** | tags: GENJUTSU / MENTAL / MARK available |
| `Clan.NARA` exists | **false** | Clan enum: Uzumaki/Uchiha/Hyuga/Lee/Yamanaka |

## Complexity premise

Authoring + `controlBound` sibling (Bound ≠ Stun) + one wire-trap-style Bound board convention (ATTACK ×1.2 + consume on hit). Movement lock **absent** — OOS.

## Relevant files

- `src/game/types.ts` — `ControlStunSpec` / `Skill` fields
- `src/game/constants/skills.ts` — `SHADOW_POSSESSION`
- `src/game/systems/ResolveSkillSystem.ts` — SUPPORT plant + ATTACK Setup
- `src/game/systems/__tests__/t060WireSetup.test.ts` — Setup consume pattern
- `src/game/systems/__tests__/t079KillingIntent.test.ts` — chance plant
- `src/simulation/WireSetupBalance.ts` / `index.ts`

## Port signatures

None. Optional domain field on `Skill`. Stay R0.

## Local deps

`skills.ts` → `types` · `ResolveSkillSystem` → `types` + `MarkSystem.addMark` / `consumeOnImpact`

## Existing tests

No `shadow_possession` AC. Siblings: T-060 wire, T-079/T-111 controlStun, T-100 coffined HARD_CONTROL.
