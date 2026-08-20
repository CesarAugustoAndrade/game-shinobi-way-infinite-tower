# T-146 · plan

**Ring:** R1 · **auto-approved**

Thin `commitDiscoverOnCombatState` maps CombatState → `commitDiscoverChoice` and writes hand/marks/clears pending. `useCombat.commitDiscover` calls it. `DiscoverPicker` lists candidates; Combat mounts it while pending and blocks other plays.

## Files

1. `src/hooks/discoverCommit.ts` — helper (no React)
2. `src/hooks/useCombat.ts` — commitDiscover; refuse plays while pending
3. `src/components/combat/DiscoverPicker.tsx` + `.css`
4. `src/scenes/combat/Combat.tsx` + `src/App.tsx`
5. `src/components/combat/__tests__/t146DiscoverPicker.test.ts`
6. `src/simulation/DiscoverLiveBalance.ts` + `index.ts`
7. `CHANGELOG.md`

No R0 edits.

## Steps

### 1. Commit helper (AC1, AC3)

`commitDiscoverOnCombatState(combatState, chosenSkillId, skills?)` → `{ combatState, refused }`.

### 2. Picker (AC2)

`data-testid="discover-picker"` / `discover-candidate`. Name + role + cooldown text.

### 3. Wire live

useCombat + Combat overlay. Hand `canUseSkill` false while pending.

### 4. Sim: commit/refuse/candidate count.

## Risks

1. Mapping ResolveSkillState dummy pools — commit only needs pending/hand/marks/skills.
2. Auto-combat must not silent-skip (OOS: no auto-pick).
