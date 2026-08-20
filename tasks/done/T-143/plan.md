# T-143 · plan

**Ring:** R0 · **auto-approved**

One call: `applySubstitutionIncoming(outgoing.damage, actionMarks, range)` after outgoing cuts, before shield. If consumed: damage 0, persist marks, set `range` from helper (forced PUSH). Do not set `playerMoveUsedThisTurn`. Reuse T-129 helper.

## Files (single implementer)

1. `src/game/systems/EnemyTurnSystem.ts`
2. `src/game/systems/__tests__/t143SubstitutionLive.test.ts`
3. `src/simulation/SubstitutionLiveBalance.ts` + `index.ts`
4. `CHANGELOG.md`
5. Helper comment T-129 “optional wire” → T-143 live

## Steps

### 1. Live wire (AC1–AC3)

```
const outgoing = applyOutgoingMarkCuts(...)
const sub = applySubstitutionIncoming(outgoing.damage, actionMarks, range)
actionMarks = sub.marks
if (sub.consumed && sub.range !== undefined) range = sub.range
const shield = absorbWithShieldMarks(sub.damage, actionMarks)
```

**Tests** via `executeEnemyAction` AUTO strike, CLOSE:
- `T-143 live` — substitution → HP loss 0, mark absent, `currentRange` MEDIUM
- `T-143 absent` — no mark → HP loss > 0, range CLOSE
- `T-143 once` — second action with returned marks takes HP loss

### 2. Sim probe: HP Δ 0 vs bare loss; range CLOSE→MEDIUM; second hit not ignored.

## Risks

1. Enemy voluntary move before attack can change range — pin CLOSE + any-range AUTO skill.
2. CESAR/shield: substitution before shield so ignore ≠ absorb.

OOS: Reanimation, skill reauthor, playerMoveUsedThisTurn writes.
