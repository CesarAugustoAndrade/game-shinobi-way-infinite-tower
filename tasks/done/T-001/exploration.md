# T-001 · exploration

**Ring:** R0 (confirmed). **Route:** autonomous. **Type:** create.  
**Re-classify to R1?** No. Adding optional `Skill` authoring fields and new domain types is not a port-signature change. `CombatSetup` is terrain/approach, not a skill-config port. No new R0→R1/R2 imports required.

## 1. Relevant files

| Path | Why |
|---|---|
| `src/game/types.ts` | Canonical type surface. `ActionType` (307–311), `Skill` (554–622), `CombatSetup` (1143–1171), `Buff` (469–475), `Clan`/`ElementType`. |
| `src/game/constants/combatCards.ts` | Legacy role-ish classification: `getCardCategory` damage-threshold (73–96), `CARD_BASE_WEIGHT = 1.0` (42), `weightFor` (162–166). **Do not delete this slice.** |
| `src/game/systems/DeckSystem.ts` | Consumes `ActionType` + `weightFor`/`getCardCategory`. Later T-003. |
| `src/game/systems/combat-types.ts` | Live combat state (`CombatState`); no Main/Mode/Mark board. |
| `src/game/systems/PlayerTurnSystem.ts` | Toggle upkeep via `isToggle`/`upkeepCost`; not Mode machine. |
| `src/game/systems/__tests__/combatCards.test.ts` | Locks heuristic `getCardCategory` (leave intact). |
| `src/game/systems/__tests__/testFixtures.ts` | `createMockSkill(Partial<Skill>)` (~250) — optional new Skill fields compile without catalog edits. |
| `src/game/systems/__tests__/t001CardContracts*` | **Absent** — AC gate path does not exist yet. |
| `src/simulation/{BattleSimulator,StatisticsCollector,types}.ts` | Win rate / TTK / AP/cards metrics; no `cardRole` / Main / Mode / Mark. |

## 2. Existing ports / interfaces to reuse

- `ActionType` (`types.ts:308`) — conserved AP surface; map FROM `CardRole`, do not replace.
- `Skill` (`types.ts:554`) — extend additively; `actionType` stays required; `cardRole` optional this slice.
- `Skill.allowedRanges?: CombatRange[]` already exists (`types.ts:593`).
- `Posture`, `ElementType`, `Clan` — reuse for tags; do not invent new mechanics.
- `CombatSetup` (`types.ts:1143`) — **not** Skill Config (terrain/approach). New type needed.
- No existing `resolveCardRole` / `mainAttackId` / Mode/Mark types.

## 3. Local dependency map (affected area)

```
types.ts  ←  combatCards.ts  ←  DeckSystem / posture helpers / combatCards.test
types.ts  ←  almost every R0 system + R1/R2/R3 (Skill shape)
combatCards.ts  ←  LaunchProperties (R3 featureFlags) via weightFor only
```

New helpers must **not** import `combatCards.getCardCategory`. New R0 files must not import React/DOM or `src/components|scenes|hooks|contexts`.

## 4. Existing tests

- `combatCards.test.ts` — category from expected damage + effects; AP defaults; posture weights.
- `deckSystem.test.ts` / `postureSystem.test.ts` — live draw still heuristic.
- No T-001 contract tests.

## 5. Spec premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| No `CardRole` / `TargetScope` / `ModeDefinition` / `Mark` / `mainAttackId` / skill `baseWeight` / `discover` / `markEffects` / `modeInteraction` | **Confirmed absent** as combat contracts | grep `src/game` empty except location-deck `DeckLocation.baseWeight` (`types.ts:1850`, RegionSystem) — different domain |
| Role is `ActionType` only | **Confirmed** | `ACTIVE \| TOGGLE \| PASSIVE` at `types.ts:308–311`; `Skill.actionType` at 561 |
| Draw classifies by damage threshold | **Confirmed** | `getCardCategory` `types.ts` no — `combatCards.ts:73` `(baseDamage + scalingPerPoint×3) > 6` → `offensive` |
| Modes are toggle-buffs | **Confirmed** | `Skill.isToggle` / `isActive` / `upkeepCost` 599–601 |
| Marks not first-class | **Confirmed** | only `Buff` / `activeBuffs` |
| `Skill.cardRole` missing | **Confirmed** | `Skill` 554–622 has no such field |

## 6. Surprises / tech debt (no solutions)

- Two different “baseWeight” concepts: location-deck vs future skill draw weight. Name collision risk if helpers are generic.
- `CARD_BASE_WEIGHT` today is **1.0**; SOUL v1 skill `baseWeight` is **2**. Dual numbers will coexist until T-003.
- `CombatSetup` name will confuse “Skill Config / Tactical Setup”.
- `combatCards.ts` already imports R3 `LaunchProperties` — existing ring smell; T-001 must not extend that import into new helpers.
- Catalog has no `cardRole`; making it required would force mass authoring (spec already forbids that this slice).
- Explorer/researcher subagents did not register this fire; synthesis is from direct R0 reads.

## 7. Skills to inject on implement

- `combat-system-creator` (taxonomy / contracts only; no formula rewrite).
- SOUL §3.1, §5, §13; HTML `#contratos`.
- loop `RULES.md`: new load-bearing combat logic should ship with its unit test (spec already requires AC tests).
