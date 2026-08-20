# T-142 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

One call: `resolveC4AtEnemyOpportunity` at `processEnemyTurn` start of enemy opportunity (Phase 1, before DoT / before stun-gated `executeEnemyAction`). If `fired`, subtract `trueDamage` (35 TRUE, no phys mit, no CESAR) from enemy HP and persist returned marks. Absent-safe. Second opportunity on stripped board is a noop. No skill reauthor.

## Design

C4 is delayed TRUE at **opportunity start**, sibling to T-137 DoT ticks, not an attack. Stun skip is inside `executeEnemyAction`; firing in Phase 1 keeps C4 live while stunned. Helper already strips after fire → AC3 single detonation.

## Files (single implementer)

1. `src/game/systems/EnemyTurnSystem.ts` — live wire
2. `src/game/systems/__tests__/t142C4LiveOpportunity.test.ts` — AC1–AC3
3. `src/simulation/C4LiveOpportunityBalance.ts` + `index.ts`
4. `CHANGELOG.md`
5. Optional one-line comment on `resolveC4AtEnemyOpportunity` (T-131 “optional wire” is now live)

## Steps

### 1. Live wire (AC1–AC3)

**File:** `EnemyTurnSystem.ts` (R0)

After `boardMarks` clone, before Phase 1 DoT:

```
const c4Burst = resolveC4AtEnemyOpportunity(boardMarks);
boardMarks = c4Burst.marks;
if (c4Burst.fired) {
  updatedEnemy.currentHp -= c4Burst.trueDamage;
  logs.push(`C4 detonates for ${c4Burst.trueDamage} TRUE damage!`);
}
```

Import `resolveC4AtEnemyOpportunity`. Do not call from `executeEnemyAction` (would double-count if also in processEnemyTurn; stun-gated if after skip).

**Tests:** stunned enemy (isolate from attacks), `processEnemyTurn`:
- `T-142 live` — enemy `c4` → HP −35, mark absent
- `T-142 absent` — no C4 → HP unchanged, marks empty
- `T-142 once` — second turn with returned marks does not apply another 35

### 2. Sim probe

Live HP 80→45 vs decorative unused C4; absent 80→80; second opp Δ 0.

### 3. CHANGELOG [Unreleased]

T-142 C4 detonates 35 TRUE at live enemy opportunity start.

## AC coverage

| AC | Step |
|---|---|
| RING-GUARD | EnemyTurn + tests + sim only |
| typecheck | verify |
| AC1 live | step 1 `T-142 live` |
| AC2 absent | step 1 `T-142 absent` |
| AC3 once | step 1 `T-142 once` |

## Risks

1. CESAR ×2 if someone later routes through `calculateDamage` — keep direct HP.
2. Unstunned enemy attack would mix HP deltas — tests use stun like T-137.
3. Lethal C4: Phase 3 `checkDoTDeaths` already handles HP ≤ 0 after Phase 1.

OOS: skill costs/plant; stripC4 auto on Kai; copy_jutsu.
