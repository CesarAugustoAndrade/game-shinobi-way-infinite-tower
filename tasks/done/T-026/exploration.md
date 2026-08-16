# T-026 · exploration

**Ring:** R0 Air Palm SIDE chip + PUSH 1 + CP per hit, no Mode spend. Reuse T-023 `markEffects` + `bandMove`. No new port.

## Relevant files

- `skills.ts` — `AIR_PALM` is RANGED ACTIVE, no `cardRole`, no `markEffects`, no `bandMove`.
- `skillsCombatV1New.ts` — Twin Lion `requireMarkId: 'chakra_point'`; T-023 Wire/Blastback show SIDE `markEffects` + `bandMove`.
- `ResolveSkillSystem.ts` — SIDE/ATTACK already plants `markEffects` then `consumeOnImpact`; `skillForcedMove` reads `bandMove`. Auto-spend only if `modeId` set.
- `MarkSystem.ts` — `addMark` STAT merge; IMPACT consume spends enemy marks after ≥1 hit.
- `RangeSystem.ts` — RANGED default = MEDIUM+LONG (CLOSE illegal unless authored).
- `t022TwinLionFists.test.ts` — CP fixture: id `chakra_point`, duration 2, `consume: IMPACT`.
- `t023SideToolMarksMove.test.ts` — SIDE mark + forced move template.

## Premises

- Twin Lion reads `chakra_point` duration 2 IMPACT. Air Palm must plant that same id.
- Planting IMPACT **before** `consumeOnImpact` would eat the new CP on the same card.
- T-023 ATTEMPT marks must still plant once (including miss).
- Air Palm has no `modeInteraction` → T-018 auto-spend does not touch Byakugan.

## Surprises

- Catalog Air Palm is incomplete authoring (`resolveSkill` rejects without `cardRole`).
- RANGED default excludes CLOSE — AC2 must use MEDIUM (PUSH → LONG).
- Live `useSkill` still not on this path (out of scope).

## Port / ring

No port signature change. Stays R0. Optional `MarkSpec.perHit` / `family` are domain authoring fields, not a port.
