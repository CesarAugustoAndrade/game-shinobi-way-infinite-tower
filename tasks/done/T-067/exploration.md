# T-067 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M
**Port signatures:** additive optional field on `ResolveSkillState` + optional `applyModeUpkeep` opt. No adapter/port change → **stays R0**.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `FOCUSED_BREATHING` unmarked ACTIVE AP1/CP0/CD2, CHAKRA_REGEN 10 | **true** | `skills.ts` 598–617 |
| T-017 one-shot pending + consume on successful pay | **true** | `GatePrepDiscountSystem` + `activateMode` `gateHpDiscount` |
| `ResolveSkillPools` has maxChakra | **false** | pools: ap/chakra/hp/maxHp only → uncapped +8 |
| `SkillTag.CHAKRA` / `SUSTAIN` | **false** | SkillTag has MODE/NINJUTSU/MENTAL, no CHAKRA/SUSTAIN |
| Mode upkeep CP 4 exists | **true** | `byakugan` / `sharingan_2` `upkeep: { chakra: 4 }` |
| Live clock already reads a CP discount | **false** | `runTurnStartClock` / `PlayerTurnSystem` have no CP discount hook |

## Ports / reuse

- Arm: Gate Prep sibling — `pendingCpUpkeepDiscount: 2` on resolve state; clone it.
- Grant: Kai-style `pools.chakra + 8` after cost pay (CP cost 0).
- Discount: new `FocusedBreathingDiscountSystem.applyCpUpkeepDiscount` → `max(0, N-2)`; consume only when `chakra > 0` is reduced.
- Pay hook: optional `cpUpkeepDiscount` on `applyModeUpkeep` (T-017 `gateHpDiscount` shape). Do **not** edit `PlayerTurnSystem` (spec out of scope).

## Complexity premise

Spec listed ResolveSkillSystem + thin helper. Verified: both needed. **Do not** invent marks, regen ticks, or SkillTag values. **Do not** change `resolveModeUpkeep` signature — pre-discount costs in `applyModeUpkeep`.

## Layers

R0: `skills.ts` `FOCUSED_BREATHING`; `FocusedBreathingDiscountSystem.ts`; `ResolveSkillSystem.ts` arm+grant; `CombatModeSystem.applyModeUpkeep` opt. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `FOCUSED_BREATHING`
- `src/game/systems/GatePrepDiscountSystem.ts` — pattern
- `src/game/systems/ResolveSkillSystem.ts` — Gate Prep arm ~1119; `cloneState` pending
- `src/game/systems/CombatModeSystem.ts` — `applyModeUpkeep`
- `src/game/systems/__tests__/t017GatePrepDiscount.test.ts` / `t040GatePrepSupport.test.ts` / `t066FlashBomb.test.ts`

## Surprises / debt

- No `SkillTag.CHAKRA`/`SUSTAIN` — omit tags.
- Live `PlayerTurnSystem` will not consume the pending field this task (documented out of scope).
