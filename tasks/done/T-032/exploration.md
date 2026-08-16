# T-032 · exploration

**Ring:** R0 Great Fireball: Sharingan 2T +50% + 1 charge. Reuse T-018 Rasengan `damageMultBonus` + `consumeCharges`. No new port.

## Relevant files

- `skills.ts` — `FIREBALL` ACTIVE, no `cardRole`/`modeInteraction`. AP 2 / base 15 / Burn 15×3 @80%. RANGED (defaults MEDIUM+LONG).
- `ResolveSkillSystem.ts` — auto Mode path already applies `damageMultBonus` + `consumeCharges` when `modeId` is ON. No `requireOn` → base legal when OFF.
- `t018RasenganModePayoff.test.ts` — OFF base; ON `floor(base * 1.5)` + spend 1, Mode stays ON.
- `t025ChidoriSharingan3.test.ts` — `sharingan_3` fixture; do not retune.

## Premises

- Catalog: base works **without** Mode. Enhance only `sharingan_2`. Do not apply on 3T-only boards.
- Tests must resolve at MEDIUM or LONG (RANGED / explicit `allowedRanges`).
- Burn 5×2 is packaging `effects[]`; resolve does not need a new DoT pipeline.

## Surprises

- Incomplete authoring today (`resolveSkill` rejects without `cardRole`).
- Live `useSkill` out of scope.

## Port / ring

No new field. Stays R0. Authoring-only + existing Rasengan enhance path.
