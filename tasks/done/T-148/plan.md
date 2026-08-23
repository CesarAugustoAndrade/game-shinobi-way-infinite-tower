# T-148 · plan

**Ring:** R2 · **auto-approved**

Mount `<SkillConfigInspector>` in `Combat.tsx` beside Modes/Setup with `config={player.skillConfig ?? { mainAttackId: null, modeUpkeepPriority: [] }}`, `combatLocked={true}`, `defaultOpen={false}`. Empty weightTerms (toggle still shown).

## Files

1. `src/scenes/combat/Combat.tsx`
2. `src/scenes/combat/__tests__/t148SkillConfigMount.test.ts`
3. `src/simulation/SkillConfigMountBalance.ts` + `index.ts`
4. `CHANGELOG.md`

No R0.

## Tests

- `T-148 mount` — Combat.tsx imports and renders `<SkillConfigInspector`
- `T-148 props` — `player.skillConfig` in config prop
- `T-148 locked` — `combatLocked={true}` or `{true}`
