# T-019 · exploration

**Ring:** R0 Sealing Tag drain-or-silence. Optional `enemyModes` on existing ResolveSkillState (fixtures stay valid).

## Relevant files

- `CombatModeSystem.ts` — `drainCharges` aliases `trySpendCharges`; unused by resolve.
- `ResolveSkillSystem.ts` — SUPPORT = marks + Discover; single player `modes` board; no `enemyModes`.
- `skillsCombatV1New.ts` — `sealing_tag_chakra_lock` SUPPORT; `consumeCharges: 1`; unconditional `effects: SILENCE` (not even applied by resolve today).
- Silence is a player/enemy `Buff` with `effect.type === EffectType.SILENCE`.

## Premises

- Pick first ON in `instances` (optional priority list).
- Drain success → no Silence. No ON Mode → Silence 1 on `enemyBuffs`.
- Player `modes` must not be drained.

## Surprises

- Silence `effects[]` is packaging-only; resolve never applies `skill.effects`.
- T-008 tests do not assert Silence on the row.
