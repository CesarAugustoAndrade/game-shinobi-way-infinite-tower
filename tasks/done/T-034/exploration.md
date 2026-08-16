# T-034 · exploration

**Ring:** R0 Chidori Stream: Sharingan 3T +40% + 1 charge + Stun 60%. Reuse T-018/T-032 `damageMultBonus` + `consumeCharges`. No new port.

## Relevant files

- `skills.ts` — `CHIDORI_STREAM` HIDDEN ACTIVE, no `cardRole`/`modeInteraction`. AP 2 / base 18 / Stun 1 @80%. `AttackMethod.AUTO` AoE flavor.
- `SKILLS.CHIDORI` (T-025) — sibling `sharingan_3` consume **2** + `grantRanges` MEDIUM. Do not retune.
- `ResolveSkillSystem.ts` — auto Mode path applies `damageMultBonus` + `consumeCharges` when `modeId` is ON. No `requireOn` → base legal when OFF.
- `t018` / `t032` / `t033` — OFF base; ON `floor(base * 1.4)` + spend 1, Mode stays ON.

## Premises

- Catalog: base works **without** Mode. Enhance only `sharingan_3`. Sharingan 2 alone must not enhance.
- Tests resolve at CLOSE (explicit `allowedRanges`; no MEDIUM grant).
- Stun 0.6×1 is packaging `effects[]`; live Stun RNG not required (same honesty as Fireball Burn).
- Complexity premise: **no new resolve fork**. Confirmed T-018 path. Do not invent multi-enemy AoE.

## Surprises

- Incomplete authoring today (`resolveSkill` rejects without `cardRole`).
- AUTO AoE comment is flavor only — switch to MELEE + CLOSE for honesty.

## Port / ring

No new field. Stays R0. Authoring-only + existing Rasengan enhance path.
