# T-141 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

`elementalDefenseFlatFromMarks` allowlists `suijinheki_elem_def` and sums stacks for the given target. `getPlayerFullStats` / `getEnemyFullStats` add that integer onto `derived.elementalDefenseFlat` after `calculateDerivedStats`. `executeEnemyAction` overlays the same helper onto `defenderDerived` from `actionMarks` (live `playerStats` is marks-less). Physical hits unchanged. No skill reauthor. Duration stays on TurnClock.

## Design (3–5 lines)

Elem-def is a **derived flat**, not a T-140 primary. Helper lives in `MarkSystem` next to `primaryDeltasFromStatMarks`, keyed by id (and STAT family), not by `STAT_MARK_PRIMARY`. Live mit for Suijinheki is **enemy hit vs player**: EnemyTurn already has marks. Getters fold for AC3 derived + any caller that passes `marks`. Do not pass marks through `App.tsx`/`useCombat` (RING-GUARD R0; would double-count with EnemyTurn overlay).

## Files (single implementer — overlapping R0 files)

1. `src/game/systems/MarkSystem.ts` — helper + allowlist
2. `src/game/systems/StatSystem.ts` — getter fold-in
3. `src/game/systems/EnemyTurnSystem.ts` — live defenderDerived overlay
4. `src/game/systems/__tests__/t141ElemDefMarksLive.test.ts` — AC1–AC3
5. `src/simulation/ElemDefMarksLiveBalance.ts` + `index.ts` — probe
6. `CHANGELOG.md`

## Steps

### 1. Pure helper (AC1, AC2)

**File:** `MarkSystem.ts` (R0)

```ts
export const ELEM_DEF_MARK_IDS = new Set(['suijinheki_elem_def']);

export function elementalDefenseFlatFromMarks(
  marks: TacticalSetup,
  target: CombatActor,
): number {
  let flat = 0;
  for (const mark of marks) {
    if (mark.family !== MarkFamily.STAT || mark.target !== target) continue;
    if (!ELEM_DEF_MARK_IDS.has(mark.id)) continue;
    flat += mark.stacks;
  }
  return flat;
}
```

- empty / `spd_down` / `blinded` / `aim` / `cloaked` → 0
- stacks 1 → 1; two instances or stacks 2 → 2
- wrong target → 0
- no duration tick

**Tests:** `t141ElemDefMarksLive.test.ts` describes `T-141 pure` and `T-141 stacks`.

### 2. Getter fold-in (AC3 derived)

**File:** `StatSystem.ts` (R0)

After `calculateDerivedStats` in both getters:

`derived.elementalDefenseFlat += elementalDefenseFlatFromMarks(marks, CombatActor.PLAYER|ENEMY)`

Existing `marks = []` default keeps callers unchanged.

### 3. Live enemy-hit overlay (AC3 live mit)

**File:** `EnemyTurnSystem.ts` (R0)

When building `defenderDerived`, add `elementalDefenseFlatFromMarks(actionMarks, CombatActor.PLAYER)` onto a copied derived (same spread as evasion overlay). `playerStats` stays marks-less → no double-count.

**Tests:** `T-141 live`
- `getPlayerFullStats(player, [suijinheki_elem_def stacks 1])` → `derived.elementalDefenseFlat` is bare + 1
- `calculateDamage` ELEMENTAL AUTO forceHit/forceCrit false: armed finalDamage < bare
- `executeEnemyAction` elemental AUTO skill: HP loss with mark < without; physical AUTO HP loss equal with vs without mark

### 4. Sim probe (mandatory balance)

**Files:** `ElemDefMarksLiveBalance.ts`, `index.ts` `--quick`

Metrics: helper 1→1, stacks 2→2, live derived Δ +1, elemental finalDamage Δ, physical Δ 0. Verdict: +1 integer flat is a small mit bump vs decorative 0; Shield 40 still the bulk of Suijinheki.

### 5. CHANGELOG [Unreleased]

One bullet: T-141 Suijinheki `suijinheki_elem_def` stacks feed `elementalDefenseFlat`.

## AC coverage

| AC | Step |
|---|---|
| RING-GUARD | only R0 systems + tests + sim + changelog |
| typecheck | verify |
| AC1 pure | step 1 tests `T-141 pure` |
| AC2 stacks | step 1 tests `T-141 stacks` |
| AC3 live | steps 2–3 tests `T-141 live` |

## Split

One implementer. Do not parallelize (shared MarkSystem/StatSystem/EnemyTurn).

## Risks / plan B

1. **CESAR ×2** makes HP Δ 2 not 1 — assert derived +1 and `armed < bare`, not Δ === 1.
2. **Double-count** if a later task passes marks into `playerStats` and EnemyTurn still overlays — document; do not change App this task.
3. **Chip floor 1** on tiny hits hides +1 — use baseDamage ≥ 20, scalingPerPoint 0, AUTO.

OOS: skill costs/shield stacks; T-135 absorb; T-140 primaries; R2 panels; SPIRIT %.
