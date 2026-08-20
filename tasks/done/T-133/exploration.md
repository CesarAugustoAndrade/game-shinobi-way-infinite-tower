# T-133 exploration

**Ring:** R0. Route: autonomous.

## Relevant files

- `src/game/systems/MarkSystem.ts` `applyOutgoingMarkCuts` (~383): Fear → Smoke → ReadWindow only. `applyDecoyOutgoing` / `applyMistOutgoing` exist unused by the chain.
- `src/game/systems/EnemyTurnSystem.ts` ~516: already `applyOutgoingMarkCuts(hit.finalDamage, actionMarks)`.
- Tests: t074 / t073 helpers; t038 smoke 40→15 (stacks 25); t084 live Fear via EnemyTurn.

## Reuse

Insert helpers into the existing chain. No new formula. No skill reauthor.

## Order pick

Fear → Smoke → Mist → Decoy → ReadWindow. Independent sequential cuts; dual Decoy+Mist both fire.

**RE-CLASSIFY:** no.
