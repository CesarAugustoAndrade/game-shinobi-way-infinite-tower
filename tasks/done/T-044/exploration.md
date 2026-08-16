# T-044 exploration

**Ring:** R0 confirmed. Route: `autonomous`.

## Terrain

| Path | Role |
|---|---|
| `skills.ts` ~471 | `DANCING_LEAF` — AP1/CP1/CD3, 0 dmg, STR+0.5/DEX+0.3, no role/move/mark/weight |
| `SupportWeightSystem.ts` | T-016 bag: skillId / role / mental-attack. No generic `nextDrawSkillBonuses` |
| `ResolveSkillSystem.ts` | SUPPORT plants marks; `bandMove` steps loop; ATTEMPT consume only on Offensive (T-043) |
| T-030/T-021/T-031 | GATES finishers: `requireFamily`/`modeId` + `consumeAllCharges` + charge % |
| T-016 tests | consume bag one-shot |

## Premises

- 3-band board: `SELF_APPROACH` **steps: 2** snaps LONG/MEDIUM/CLOSE → CLOSE without voluntary spend.
- Generic ATTEMPT consume would eat `lotus_opening` on any Offensive — **must skip** unless GATES finisher.
- Weight: author `nextDrawSkillBonuses` for `primary_lotus` + `hidden_lotus` +2 (not Peacock).

## Re-classify

No. R0 stays. `applySupportWeightOnPlay` inline type extended — not a new port.
