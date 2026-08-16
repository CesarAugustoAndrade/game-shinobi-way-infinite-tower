# T-041 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — `FALSE_SURROUNDINGS` is `CardRole.SUPPORT`, AP 2 / CP 8 / CD 5 / `baseDamage: 0`. `controlConfusion` 0.75 / duration 2. `read_mind` duration 2. `nextDrawMentalAttackBonus: 1`. Legacy Confusion 3 @80% gone.
- **AC2 resolve:** PASS — `rng() => 0` → 0 dmg, enemy CONFUSION 2, `read_mind` 2. `rng() => 0.99` → no Confusion, Read Mind still planted.
- **AC3 weight:** PASS — consume bag `mentalAttackBonus === 1`; MENTAL ATTACK `effectiveWeight` +1 once; physical ATTACK unchanged; second consume 0.
- **T-016 / T-038:** skillId and role bag paths unchanged (mental-attack is a separate `kind` filter).

## Architecture

- RING-GUARD PASS: R0 `types.ts`, `SupportWeightSystem.ts`, `DeckSystem.ts`, `ResolveSkillSystem.ts`, `skills.ts`. No React/UI.
- Predicate locked: `CardRole.ATTACK && damageType === MENTAL`. No Terrain. No baseWeight mutation. No Mode.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live `processUpkeep` draw does not pass `supportMentalAttackBonus` (same class as T-038 role bag; OOS — no live useSkill AC).

## Out of scope

- Mind Destruction +50% Read Mind payoff.
- Live UI; EnemyTurn Confusion AI already keys the buff.

## Verdict rationale

Authoring, chance-only Confusion + always Read Mind, and filtered MENTAL ATTACK +1 match catalog without reusing SIDE role bonus. APPROVE → verify.
