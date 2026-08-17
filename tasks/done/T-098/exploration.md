# T-098 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| BYAKUGAN_SCAN is legacy ACC +30% no Mode gate | **true** | `skills.ts:2590–2615` |
| Catalog wants SUPPORT require Byakugan ON + Tenketsu Exposed 2 / 30% pen + HYUGA ATTACK +2 | **true** | `#catalogo` byakugan_scan |
| T-039 `requireOn` rejects Mode OFF | **true** | `validateIntent` `mode-required` |
| `nextDrawTagBonus` needs hitsLanded ≥ 1 | **true** | `SupportWeightSystem.ts:78` (T-049) |
| Hyuga ATTACKs have SkillTag.HYUGA | **false** | only Mode `byakugan` tagged HYUGA |
| `nextDrawSkillBonuses` enqueue on SUPPORT (no hit) | **true** | `applySupportWeightOnPlay` |
| Studied 20% pen mark exists | **true** | `ResolveSkillSystem` `studied` |

## Complexity premise

Mode gate is authoring (`requireOn` + `modeId: byakugan`). Weight lock: `nextDrawSkillBonuses` on Hyuga ATTACK ids (tag path would miss Gentle Fist). Pen: consume `tenketsu_exposed` on next Hyuga ATTACK (family HYUGA) at 0.3 — reuse studied pen helper. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `BYAKUGAN_SCAN`
- `src/game/systems/ResolveSkillSystem.ts` — Tenketsu pen consume
- `src/game/systems/__tests__/t039SharinganPredict.test.ts`

## Port signatures

None. Stay R0.
