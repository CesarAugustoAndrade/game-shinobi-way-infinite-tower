# T-041 · exploration

**Ring:** R0 False Surroundings: SUPPORT 75% Confusion 2 + Read Mind 2 + MENTAL ATTACK +1 next draw. Reuse T-036 rng helper shape + T-016/T-038 bag.

## Relevant files

- `skills.ts` — `FALSE_SURROUNDINGS` HIDDEN, no `cardRole`. AP2 / CP8 / CD5 / base 0. Confusion 3 @80%.
- `ResolveSkillSystem.ts` SUPPORT — marks, sealing, discover, controlStun. No Confusion roll.
- EnemyTurn keys `EffectType.CONFUSION` on `enemy.activeBuffs` — **buff preferred**.
- `SupportWeightSystem` — skillId + role bag. No mental-attack filter.
- `DeckSystem.effectiveWeight` — skillId + role bonuses. Predicate lock: `CardRole.ATTACK && damageType === MENTAL`.

## Premises

- Always plant `read_mind` duration 2; chance only on Confusion (`rng() < 0.75`).
- One-shot bag, no baseWeight mutation, no Terrain.
- T-036 fail-self-stun pattern is sibling, not reused (no fail self confusion).

## Surprises

- Incomplete authoring today.
- T-038 role bonus would boost ALL ATTACK if reused — need a **filter** entry, not role-only.

## Port / ring

R0: types, SupportWeightSystem, DeckSystem, ResolveSkillSystem, skills. No React.
