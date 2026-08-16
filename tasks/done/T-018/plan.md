# T-018 · plan

**Ring:** R0 · **auto-approved**

Add `ModeInteraction.damageMultBonus`. Author Rasengan ATTACK + clones consume 1 / +50%. Auto-spend + enhance in `resolveSkill` when Mode ON and `intent.modeCharges` omitted. Tests `t018RasenganModePayoff` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts rasengan |
| AC2 ON enhance + charge | resolveSkill |
| AC3 OFF baseline | resolveSkill |
