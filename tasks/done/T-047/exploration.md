# T-047 exploration

**Ring:** R0. Route: `autonomous`.

## Terrain

| Path | Role |
|---|---|
| `skills.ts` ~853 | `ANALYZE` — STR +0.15×3, no role/discover |
| T-014 `applyDiscoverOffer` / `commitDiscoverChoice` | filter tag/element/predicate |
| `DiscoverSpec` | count, tag, element — no Main-tag flag |
| `applySkillPenetration` | floor(dmg * (1 - def * (1-pen))); only on Mode path today |

## Premises

- Reuse discoverThree + predicate. Empty if Main missing/untagged (no widen).
- Studied duration 2, `boundSkillId` = chosen ATTACK, no consume on hit.
- Pen via optional `enemyDefensePercent` fixture.

## Re-classify

No.
