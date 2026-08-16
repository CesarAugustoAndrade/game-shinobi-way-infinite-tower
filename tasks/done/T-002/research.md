# T-002 · research

Internal R0 clock. No external libraries.

## 1. Placement

**A — `TurnClockSystem.ts` + optional `Skill.readyOnTurn` (recommended)**  
Pure phase order, `readyOnTurn = T+N+1`, Mode upkeep hook, `resetCombatFrontier`. Tests at `t002TurnClock.test.ts`.  
+ RING-GUARD obvious. + Leaves `processUpkeep` toggle/AP tests green.  
− Live `currentCooldown` remains until a later wiring task.

**B — Rewrite `processUpkeep` in place**  
+ Single live blob.  
− High break risk (AP/hand/toggle tests). Mixes Mode hook with toggle-buffs. Out of conservative scope.

**C — Split CooldownSystem + TurnClockSystem**  
− Two files for one SOUL clock. Not needed at S/M.

## 2. SOUL clock (canonical)

1. Mode upkeep (priority order) — pay from **current** pools; fail → Mode off + start CD; later modes still attempt. HP upkeep must not drop HP below **1**.
2. Ticks then regen — upkeep **must not** spend this phase’s regen.
3. Snapshot + draw (hook; may call `drawNewTurnHand`).
4. Support/Mark duration decrement (no-op if empty).
5. Actions (existing turn systems).
6. Virtual discard (pure helper; deck deletion is T-003).

CD: used on T with authored N → `readyOnTurn = T+N+1`. Blocked `T+1…T+N`. N=2 → blocked two player turns, ready third.

Encounter: reset CDs to ready; empty Modes/charges/Marks. No Heat/Encounter-Chain persistence.

## 3. Dual clock policy

Normative: `isSkillReadyOnTurn(readyOnTurn, T)`.  
Legacy `currentCooldown` stays for live `useSkill` / sim this slice. Dual-write helper `markSkillUsedOnTurn` sets `readyOnTurn` and may set `currentCooldown` for compile compat — **readiness on turn T is only `readyOnTurn`**.

## 4. Simulation

`simulate:quick` does not run Modes or `readyOnTurn`. RING-GUARD forbids R3 files on this task. Expect **no battle equilibrium change**. Clock impact is the AC suite (blocked turns, upkeep-fail vs regen). Do not add sim metrics here.

## 5. Recommendation

Option A. Pure clock module. Optional CombatState fields (`turnIndex`, `activeModes`, `marks`) default empty. `createCombatState` / sim start may call `resetCombatFrontier` (same CD-zero behavior). Do not rewrite `processUpkeep` toggle/regen/draw.
