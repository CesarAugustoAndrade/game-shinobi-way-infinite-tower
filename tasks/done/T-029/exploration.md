# T-029 · exploration

**Ring:** R0 Dynamic Entry: MEDIUM→CLOSE rush, Gate charges intact. Reuse T-023 `bandMove` + `resolveForcedMove`. No new port.

## Relevant files

- `skills.ts` — `DYNAMIC_ENTRY` MELEE ACTIVE, no `cardRole`, no `allowedRanges` → CLOSE-only. Description is crit/first-strike, not SOUL rush.
- `ResolveSkillSystem.ts` — `skillForcedMove` maps `SELF_RETREAT`→PUSH; PULL/PUSH pass through. No Mode spend without `modeId`.
- `types.ts` — `BandMoveKind` is PULL | PUSH | SELF_RETREAT.
- T-023 Backstep / Wire — same forced-move path, no voluntary spend.

## Premises

- MEDIUM must be legal. Approach is PULL-equivalent (MEDIUM→CLOSE). CLOSE stay CLOSE.
- No `modeInteraction` → Gate charges never spent.
- Do not add LONG. Do not invent guaranteed crit.

## Surprises

- Catalog row is incomplete authoring (`resolveSkill` rejects without `cardRole`).
- Live `useSkill` out of scope.

## Port / ring

Optional `SELF_APPROACH` is a domain authoring alias for PULL. Stays R0.
