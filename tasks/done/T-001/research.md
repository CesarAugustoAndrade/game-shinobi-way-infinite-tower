# T-001 · research

Internal domain-types task. No external libraries.

## 1. Placement options (max 3)

**A — Additive `types.ts` + `CardContractSystem.ts` (recommended)**  
Enums/interfaces + optional `Skill` fields live on the existing type surface. Pure helpers in `src/game/systems/CardContractSystem.ts`. Tests at `src/game/systems/__tests__/t001CardContracts.test.ts`.  
+ Matches AC1 “game type surface”. + `createMockSkill` / catalog keep compiling. + RING-GUARD obvious.  
− `types.ts` grows again.

**B — New `src/game/cardContracts.ts` re-exported from `types.ts`**  
Cleaner file split.  
+ Smaller `types.ts`.  
− Extra hop; AC1 still needs re-exports; easy to forget a type on the public surface.

**C — Put helpers in `src/game/constants/` beside `combatCards.ts`**  
+ Next to draw constants.  
− Mixes **new** authoring contracts with the **legacy heuristic they must not become**. High risk of someone wiring `getCardCategory` as a fallback.

## 2. Canon field shapes (SOUL §5 + §13 · HTML `#contratos`)

### Enums
- `CardRole`: `SUPPORT | MODE | SIDE_ATTACK | ATTACK` (UI label SIDE).
- `TargetScope`: `MAIN_ATTACK | ATTACK | SIDE_ATTACK | OFFENSIVE_SKILL`.
- `SkillTag` (combinable, not a role): at least `TOOL`, `WEAPON`, `TAIJUTSU`, `NINJUTSU`, `GENJUTSU`, `MODE`, `MARK`, `DISCOVER`, `MULTI_HIT`, `PASSIVE`, `SIGNATURE`. Elemental/clan tags only where `ElementType` / `Clan` already exist (e.g. `FIRE`… / `UCHIHA`…). **TOOL is a tag, never a fifth role.**

### `Skill` authoring extras (optional this slice)
`cardRole?`, `tags?`, `baseWeight?` (default **2** via helper, not via `CARD_BASE_WEIGHT=1`), `hitCount?`, `discover?`, `markEffects?`, `modeInteraction?`, `perHitEffects?`.  
`allowedRanges?` already on `Skill`.

### Nested stubs (real types, not `any`) — HTML names
```
TypedCost           { ap?: number; chakra?: number; hp?: number }
WeightModifier      { skillId?: string; tag?: SkillTag; role?: CardRole; delta: number }
EnhancementRule     { targetScope: TargetScope; note: string }
ModeEndClause       { kind: ModeEndKind }  // payoff | manualOff | zeroCharges | upkeepFail | familyReplace | finisher
DiscoverSpec        { count: number; tag?: SkillTag; element?: ElementType }
MarkSpec            { id: string; duration: number; stacks?: number; consume?: MarkConsumeTiming; trigger?: CombatTrigger }
ModeInteraction     { modeId?: string; family?: string; consumeCharges?: number; requireOn?: boolean }
MarkConsumeTiming   ATTEMPT | IMPACT | NONE
CombatActor         PLAYER | ENEMY
CombatTrigger       stub enum (ON_PLAY | ON_HIT | ON_MOVE | …) — names only
```

### `ModeDefinition`
`id`, `family`, `stage?`, `maxCharges`, `activationCost: TypedCost`, `upkeep: TypedCost`, `cooldown`, `weightModifiers[]`, `enhancements[]`, `endClauses[]`.

### `Mark` (runtime)
`id`, `sourceSkillId`, `owner: CombatActor`, `target: CombatActor`, `duration`, `stacks`, `trigger?`, `consume?`.

### `SkillConfig` (out-of-combat; **not** `CombatSetup`)
`mainAttackId: string | null`, `modeUpkeepPriority: string[]`.

## 3. Role resolution (no damage inference)

`resolveCardRole(skill)` reads **only** `skill.cardRole` (or an explicit authoring map keyed by skill id).  
Missing `cardRole` = **incomplete authoring** → helper returns `{ ok: false }` / throws a typed error — it must **not** fall back to `getCardCategory` or `baseDamage`.  
Two fixtures that differ only in `baseDamage` and share the same authored `cardRole` → same role. Two fixtures with no `cardRole` and different damage → both incomplete, neither inferred ATTACK.

## 4. Main Attack helpers

Inject `rng: () => number` (uniform `[0,1)`). Never `Math.random` inside the helper.

- Loadout with ≥1 `cardRole === ATTACK` and empty/invalid Main → pick one ATTACK uniformly → `{ config, notified: true }`.
- Never leave Main empty when an ATTACK exists.
- `learnSkill(config, newSkillId)` / `withAddedSkill` **must not** change an already-set Main.
- Main must be an ATTACK id (not SIDE/SUPPORT/MODE).

Compat: `actionTypeForCardRole`: MODE→`TOGGLE`; SUPPORT/SIDE_ATTACK/ATTACK→`ACTIVE`.  
`isHandPlayableRole`: true for the four `CardRole`s. PASSIVE is `ActionType` only — out of 6–20 pool.  
`defaultBaseWeight()` → `2`.

## 5. Recommendation (≤5 lines)

Use **option A**. Keep `Skill.cardRole` optional so the catalog still typechecks. Put invariants in `CardContractSystem` (pure, injected rng). Leave `getCardCategory` untouched (deprecated-in-comment only if a one-liner is needed). Do not migrate catalog or draw. This unblocks T-002–T-005 without publishing dual-compat heuristic-OR-cardRole.

## 6. Simulation / balance

Today’s sim (`npm run simulate:quick`) reports win rate, TTK/`averageTurns`, damage, chakra, AP/cards via `StatisticsCollector`. It does **not** know `cardRole`/Main/Modes/Marks.  
T-001 must **not** change draw, damage, or AI. After implement, `simulate:quick` is a **regression baseline** (expect identical equilibrium). New role-mix / setup-completion metrics belong to later tasks (SOUL §15) — note only, do not add here unless the implement increment would otherwise be unmeasurable (it remains measurable as “no delta”).
