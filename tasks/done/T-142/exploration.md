# T-142 · exploration

**Ring:** R0 (EnemyTurnSystem + existing MarkSystem helper). No port signature break. Route: autonomous.

## Spec premises vs code

- T-131 shipped `resolveC4AtEnemyOpportunity` / `stripC4` / plant `c4` on enemy. Comment still says live EnemyTurn wire is optional.
- Grep `resolveC4AtEnemyOpportunity` in `EnemyTurnSystem.ts` = empty. Armed C4 never detonates live.
- Enemy opportunity start already exists: `processEnemyTurn` Phase 1 ticks enemy DoT Marks (`tickDotMarksForActor`) **before** `executeEnemyAction`. Stun skip lives **inside** `executeEnemyAction` after actionMarks clone — putting C4 after that stun return would cancel C4 (forbidden: Stun/Silence do not cancel C4).
- T-137 live tests `processEnemyTurn` with a stunned enemy so HP delta is isolated from attacks.
- Helper returns `{ trueDamage: 35, marks: stripped, fired }`. `C4_TRUE_DAMAGE = 35`. DoT ticks subtract HP directly (no CESAR). `calculateDamage` TRUE would CESAR ×2 → would make 70, contradicting catalog 35.

No port change. Helper reuse only.

## Relevant files

| Path | Why |
|---|---|
| `src/game/systems/MarkSystem.ts` ~288 | `resolveC4AtEnemyOpportunity` — reuse, do not rewrite |
| `src/game/systems/EnemyTurnSystem.ts` ~1054–1082 | Phase 1 opportunity start; DoT already here |
| `src/game/systems/__tests__/t131C4Karura.test.ts` | plant + pure helper |
| `src/game/systems/__tests__/t137DotMarksLive.test.ts` | stunned `processEnemyTurn` live pattern |
| `src/simulation/C4KaruraBalance.ts` | plant/helper probe; live wire not measured |

## Ports to reuse

- `resolveC4AtEnemyOpportunity(marks)` — already the detonation engine
- `processEnemyTurn` return `marks` / `newEnemyHp`
- Do not add a second fire helper

## Surprises

- `executeEnemyAction` is used by many live-mark tests (shield/reflect) but stun-returns before any prelude. Opportunity-start belongs in `processEnemyTurn`, not after the stun gate.
- C4 mark family is STAT (T-131); helper keys on `id === 'c4'` + enemy target only.
