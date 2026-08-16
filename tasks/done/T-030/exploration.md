# T-030 · exploration

**Ring:** R0 Primary Lotus: any GATES ON finisher (+15%/charge, consume-all close). Reuse T-021 Peacock path. No new port.

## Relevant files

- `skills.ts` — `PRIMARY_LOTUS` legacy ACTIVE, no `cardRole`/`modeInteraction`/`hitCount`. STR buff + 15 dmg / AP 2 / CD 4.
- `ResolveSkillSystem.ts` — `requireOn` only checks `mi.modeId`. Auto-spend / `damagePerChargeBonus` / `consumeAllCharges` already work once a live id is bound.
- `types.ts` — `ModeInteraction` has `family`, `requireOn`, `consumeAllCharges`, `damagePerChargeBonus`. No `requireFamily`.
- `t021MorningPeacock.test.ts` — scale `floor(base * hits * (1+0.15*C))`; Limit-only `modeId`.

## Premises

- Catalog: any GATES Mode ON (Life or Limit). Fixed `modeId: gate_of_life` would reject Limit boards.
- Bind ON instance by family; Peacock/Chidori/Rasengan stay `modeId`.
- Invalid Mode → consume nothing.

## Surprises

- Incomplete authoring today (`resolveSkill` rejects without `cardRole`).
- Live `useSkill` out of scope.

## Port / ring

`requireFamily?: string` is a domain authoring field, not a port. Stays R0.
