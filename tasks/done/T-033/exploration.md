# T-033 · exploration

**Ring:** R0 Phoenix Flower: 3×5 + Sharingan 2T +40% + 1 charge. Reuse T-018/T-032 `damageMultBonus` + `consumeCharges` and T-007 `hitCount`. No new port.

## Relevant files

- `skills.ts` — `PHOENIX_FLOWER` BASIC ACTIVE, no `cardRole`/`hitCount`/`modeInteraction`. AP 1 / base 14 / Burn 10×2 @50%. RANGED (defaults MEDIUM+LONG).
- `ResolveSkillSystem.ts` — `hitCount` rolls then `Math.floor(total * (1 + modeDamageBonus))` when Mode ON. No `requireOn` → base legal when OFF.
- `t032Fireball.test.ts` / `t018RasenganModePayoff.test.ts` — OFF base; ON floor(total × 1+bonus) + spend 1, Mode stays ON.
- `t021MorningPeacock.test.ts` — documents floor on **total** multi-hit: `Math.floor(base * hitCount * (1 + bonus))`.
- Fireball/Chidori — do not retune.

## Premises

- Catalog: base 3-hit works **without** Mode. Enhance only `sharingan_2` +40%.
- Tests must resolve at MEDIUM or LONG.
- Burn 4×2 is packaging `effects[]`; resolve does not need a new DoT pipeline. “si impacta” → chance 1.0, not per-hit stacks.
- Complexity premise: **no new resolve fork**. Existing `hitCount` + `damageMultBonus` already generalizes 3×5 +40%. Confirmed `ResolveSkillSystem.ts` 658–666.

## Surprises

- Incomplete authoring today (`resolveSkill` rejects without `cardRole`).
- Live `useSkill` / auto Main assign out of scope.

## Port / ring

No new field. Stays R0. Authoring-only + existing Rasengan/Fireball enhance path.
