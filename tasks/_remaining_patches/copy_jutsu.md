# Patch: copy_jutsu (applied)

Catalog SUPPORT: requires Sharingan ON; copy telegraphed enemy technique as one-use temp card; no charge spend.

## Applied authoring (skills.ts)
- `cardRole: CardRole.SUPPORT`
- `tags: [UCHIHA, DISCOVER, MENTAL, NINJUTSU]`
- `baseDamage: 0` / `scalingPerPoint: 0` (sin hit)
- `discover: { count: 1 }` stub
- `modeInteraction: { family: SHARINGAN, requireOn: true, consumeCharges: 0 }`
- `allowedRanges: CLOSE|MEDIUM|LONG`
- Honest description noting live temp-card spawn is follow-up

## Follow-up (not in this change)
- Live resolve: spawn one-use temporary card from enemy telegraph; preserve costs/range.
