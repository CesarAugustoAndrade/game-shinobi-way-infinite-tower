# T-146 · exploration

**Ring:** R1 (useCombat + thin commit helper). R2 picker. No R0 formula change. Reuse `commitDiscoverChoice`.

## Spec premises vs code

- T-014 `commitDiscoverChoice` inserts chosen skill into `hand`, clears `pendingDiscover`, refuses unknown ids.
- Live `useSkill` already writes `pendingDiscover` onto CombatState (`useCombat` ~324). Never committed.
- No Discover picker in components/Combat.tsx.
- `CombatState` already has `pendingDiscover`, `hand`, `playablePool`, `turnIndex`, `marks`.

## Relevant files

| Path | Why |
|---|---|
| `ResolveSkillSystem.ts` `commitDiscoverChoice` | reuse |
| `useCombat.ts` | commit API + preserve pending |
| `Combat.tsx` / `App.tsx` | mount picker |
| `CombatModesPanel` | chrome pattern |
| `t014DiscoverResolve.test.ts` | commit contract |
| `t010CombatUi.test.ts` | static markup tests |

No port signature break on R0.
