# T-148 · exploration

**Ring:** R2 (`Combat.tsx` + existing `SkillConfigInspector`). No R0 changes.

## Spec premises vs code

- `SkillConfigInspector` already implements Main, upkeep list, weight toggle, `combatLocked` text, testids.
- Production grep: zero mounts outside `t010CombatUi`. Modes/Setup/Discover are mounted in `combat__board`.
- `player.skillConfig` already used for Hand `mainAttackId`.

## Relevant files

| Path | Why |
|---|---|
| `SkillConfigInspector.tsx` | reuse |
| `Combat.tsx` ~739 | mount beside Modes/Setup |
| `t087CombatMount.test.ts` | source-assert pattern |
