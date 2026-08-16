# T-021 · plan

**Ring:** R0 · **auto-approved**

Add `ModeInteraction.damagePerChargeBonus` + `consumeAllCharges`. Author Peacock `0.15` / consume-all. `validateIntent` rejects `requireOn` when Mode OFF or charges 0 (`mode-required`, consume nothing). After T-018 auto-spend of **remaining** charges, `modeDamageBonus += C * damagePerChargeBonus`. Floor on **total** multi-hit (same as T-018). Tests `t021MorningPeacock` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 requireOn reject | validateIntent |
| AC2 C=3 scale + close | resolveSkill spend-all + floor |
| AC3 C=4 scale + close | resolveSkill |

## Steps (single implementer)

1. Author fields + Peacock row (`types.ts`, `skillsCombatV1New.ts`) — AC2/3 data.
2. validate + spend-all + scale (`ResolveSkillSystem.ts`) — AC1–3.
3. Tests `t021MorningPeacock.test.ts` + `MorningPeacockBalance` probe.

## Risks

- Twin Lion `requireOn` becomes a hard reject until T-022 (noted; not this AC).
- Floor on total vs per-hit — lock `Math.floor(baseline * (1 + 0.15*C))`.
