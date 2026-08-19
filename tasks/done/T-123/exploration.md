# T-123 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `REAPER_DEATH_SEAL` is KINJUTSU AP2/CD99, `mutualKo: true`, TRUE 0 dmg, no `cardRole`, no HP% gate | **true** | `skills.ts:3615–3642` |
| Catalog wants ATTACK AP6, ≤35% enemy HP, mutual KO, once/combat, ignore Guts | **true** | spec + `#catalogo` |
| Live `useSkill` zeros both HP when `mutualKo` **before** `applyGutsIfLethal` | **true** | `PlayerTurnSystem.ts:725–757` then guts at 761 |
| Pure `resolveSkill` does **not** zero both HP today | **true** | costs use `hpCost` 0; live overwrites after |
| `ResolveSkillState` has `enemyHp`, no `enemyMaxHp` | **true** | `ResolveSkillSystem.ts:100–129` |
| CD 99 + `markSkillUsedOnTurn` → readyOnTurn = T+100 | **true** | `TurnClockSystem.ts:39–53`; encounter reset via `resetCombatFrontier` |

## Complexity premise

Authoring + `mutualKoMaxHpFraction` + `enemyMaxHp` on state + validate `'hp-threshold'` + resolve short-circuit zeros both HP. Live path stays (already ignores Guts). CD 99 is once/combat.

## Relevant files

- `src/game/types.ts` — fraction field
- `src/game/constants/skills.ts` — `REAPER_DEATH_SEAL`
- `src/game/systems/ResolveSkillSystem.ts` — gate + KO
- `src/game/systems/PlayerTurnSystem.ts` — pass `enemyMaxHp` (existing adapter)

## Port signatures

Optional `enemyMaxHp` on ResolveSkillState. Optional `mutualKoMaxHpFraction` on Skill. Stay R0.
