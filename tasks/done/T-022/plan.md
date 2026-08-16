# T-022 · plan

**Ring:** R0 · **auto-approved**

Invert Twin Lion `requireOn` (soft base). Add `ModeInteraction.requireMarkId`. Author Lions `requireMarkId: 'chakra_point'` + `damageMultBonus: 0.5`; drop self-`markEffects`. Gate T-018 bonus on mark when authored. On enhance apply 30% pen vs 0% def (identity for AC1). Reuse `consumeOnImpact`. Tests `t022TwinLionFists` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 Byakugan+CP 1.5× + consume | resolveSkill |
| AC2 miss keeps CP | consumeOnImpact existing |
| AC3 base without setup | no requireOn reject |

## Steps (single implementer)

1. Authoring invert + fields (`types.ts`, `skillsCombatV1New.ts`).
2. Mark-gated enhance + pen wire (`ResolveSkillSystem.ts`).
3. Tests + `TwinLionFistsBalance` probe.

## Risks

- Peacock `requireOn` must stay hard (do not touch T-021 gate).
- Rasengan has no `requireMarkId` — bonus still fires on Mode ON only.
