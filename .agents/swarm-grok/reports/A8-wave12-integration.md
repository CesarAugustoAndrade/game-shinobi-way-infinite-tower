# A8 WAVE12 — INTEGRACIÓN (soft-lock residual smoke)

**Agent:** A8 WAVE12  
**Date:** 2026-07-23  
**Branch:** develop (staged only — **no commit**)  
**Scope:** Glue after WAVE12 peer soft-lock hunt. Pure integration. No feature rewrites. No art generation.

---

## Summary

WAVE12 is a **soft-lock residual smoke** wave (no art). Peers A2–A7b hunted hangs / double-exits / blank shells. Several **ship-relevant soft-locks were fixed** and are in tree. Integration glue is green. **R1 art polish ceiling still holds.**

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** (initial + re-run after full A2–A7b WAVE12 landings) |
| `npm run build` | **exit 0** (initial ~7.74s; post-peer ~6.56s; 1857 modules; chunk `index-E0ut_4yH.js` ~1.07 MB / 292 kB gzip) |
| Event content smoke | **18/18** (~829ms) |
| public ↔ assets top-level gaps (`skill_` / `enemy_` / `lamina_` / `event_`) | **0** |
| Manifest / disk painted inventory | Unchanged from WAVE11 (93 / 39+39 / 11 / 14+14) |
| Glue TS fixes by A8 | **None** |
| Mirror copies required | **None** |
| Peer product delta | **Multiple soft-lock P1s** (A2, A4, A5, A7a, A7b) — self-contained; no A8 glue |

### Explicit recommendation

> **STOP scheduled agent waves pending human playtest.**

No new integration blockers. Soft-lock residual smoke is the right last agent pass. Optional polish and further waves need **human-proven P0/P1** from a 20-min Land of Waves session against `docs/VISION-8-AGENTES.md` §13.

**Do not open WAVE13 art polish** (or further scheduled art/polish agent waves) without playtest blockers.

**Ship readiness:** **STILL human playtest gate.** Typecheck/build green + soft-lock fixes ≠ R1 vertical-slice “done.”

---

## 1. Peer matrix (WAVE12 soft-lock residual)

| Agent | Report | Verdict | Product delta (integration view) |
|-------|--------|---------|----------------------------------|
| **A2** | `A2-wave12-combat.md` | **1 P1 + harden** | Approach Exit Room mid-Engage gated on `commitLockRef` (no blank `COMBAT` without enemy). Victory → `resolveExploreReturnState`; RewardModal also on `REGION_MAP`. W11 death hang re-verified. Six double-submit locks present. |
| **A3** | `A3-wave12-art.md` | **CLEAN** | First-hour shell void underlay; 0 parchment TSX callers; laminas 14/14; **0 code / 0 images** (ceiling) |
| **A4** | `A4-wave12-explore.md` | **1 soft-lock family + guards** | `clearRoomIfSpent` unseals empty spent rooms; EXPLORE/null-floor blank-map recovery; leave/complete/rest-intel one-shots **held** |
| **A5** | `A5-wave12-events.md` | **2 soft-lock fixes** | `DiceRollResultModal` `closedRef` parity; treasure hunt piece path always stages modal. Event zero-options + EventResult one-shot **intact**. Events suite 78/78 (peer) |
| **A6** | `A6-wave12-ux.md` | **CLEAN** | First-hour CTAs / Esc / tooltips — verify-only; no double-leave from missing `e.repeat` |
| **A7a** | `A7a-wave12-loot.md` | **1 P1 fixed** | LOOT multi-path `exitLootOnce` / `lootExitLockRef` (Leave All / Learn / finish-claim). Merchant/treasure mutexes **hold** |
| **A7b** | `A7b-wave12-skills.md` | **bugs fixed; no paint** | FREE_FIRST toggle chakra waiver + flag consume; sim parity; silence banner; empty/blocked hand pass nudge. Skills **93/21** held; R1 loadouts 35/35 |
| **A8** | this report | **Integration GO** | tsc/build/mirror/docs; soft-lock residual landed; **STOP scheduled waves → human playtest** |

**Prior WAVE11** (`A8-wave11-integration.md`): ceiling reconfirmed; A2 death-hang P1. WAVE12 does **not** reopen art waves; it closes agent soft-lock residual smoke.

---

## 2. Typecheck / build / imports

| Pass | When | Result |
|------|------|--------|
| Initial `npx tsc --noEmit` | before full peer re-land wait | **exit 0** |
| Re-run `npx tsc --noEmit` | after all A2–A7b WAVE12 reports + code in tree | **exit 0** |
| Initial `npm run build` | early WAVE12 | **exit 0** (~7.74s, chunk `index-BS8zLDcY.js`) |
| Re-run `npm run build` | after peer soft-lock fixes | **exit 0** (~6.56s, chunk `index-E0ut_4yH.js` ~1069.78 kB / 292.06 kB gzip) |

| Check | Result |
|-------|--------|
| Broken imports | None |
| Glue TS fixes required from peer landings | **None** (fixes self-contained in peer files) |
| Chunk size warning | Known (`index-*.js` ~1.07 MB min) — not a blocker |

---

## 3. Art inventory (ceiling reconfirmed — no WAVE12 paint)

### Disk (top-level `public/assets/` and mirrored `assets/`)

| Asset class | Count | Notes |
|-------------|------:|-------|
| `skill_*.png` | **93** | Unchanged; A7b no new paint |
| enemy portraits (non-cut) | **39** | Dedicated R1 plates |
| `enemy_cut_*.png` | **39** | Parity 39/39 |
| `event_*.png` dedicated | **11** | Spine + key sides |
| `lamina_mid_*` | **14** | All R1 location slugs |
| `lamina_fg_*` | **14** | All R1 location slugs |
| public → assets gaps (`skill_`/`enemy_`/`lamina_`/`event_`) | **0** | |
| assets → public gaps (same prefixes) | **0** | |

**Mirror action this wave:** none.  
**Imagine generation this wave:** none (mandate + ceiling).

---

## 4. Glue changes (A8 WAVE12 only)

| File | Change |
|------|--------|
| `CHANGELOG.md` | WAVE12 integration note — soft-lock residual smoke; peer P1s; ceiling holds |
| `out-of-scope.md` | WAVE12 soft-lock residual; **STOP scheduled agent waves**; still STOP art; human playtest gate |
| `.agents/swarm-grok/reports/A8-wave12-integration.md` | this report |
| Staging | Peer WAVE12 code fixes + reports (no commit) |

No A8 edits to `artRegistry`, manifests, combat math, or runtime glue beyond docs/staging.

### Peer code files (staged; not authored by A8)

| Peer | Paths (summary) |
|------|-----------------|
| A2 | `ApproachSelector.tsx`, `useCombatVictory.ts`, `App.tsx` (RewardModal REGION_MAP) |
| A4 | `LocationSystem.ts` (`clearRoomIfSpent`), `useActivityHandler.ts`, `useExploration.ts`, `useLocationCards.ts`, `App.tsx` (EXPLORE recovery) |
| A5 | `DiceRollResultModal.tsx`, `useTreasureHandlers.ts` |
| A7a | `useInventoryHandlers.ts` (`exitLootOnce`), `App.tsx` (LOOT wire) |
| A7b | `useCombat.ts`, `CombatSimulationService.ts`, `Combat.tsx`/`.css`, `Hand.tsx`/`.css`, `artRegistry.ts` note |

---

## 5. Vitest smoke

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
→ 18/18 passed (~829ms)
```

A5 WAVE12 also reported broader event suite **78/78** and related story/tiedStory smokes. Cheap content smoke only required for A8 glue pass.

---

## 6. Soft-lock residual status (honest)

| Area | Status after WAVE12 |
|------|---------------------|
| Combat death hang (W11) | **Still fixed** (A2 re-verify) |
| Approach Exit mid-Engage blank COMBAT | **Fixed** (A2) |
| Victory reward → map | **Hardened** (A2) |
| Spent room seals branch | **Fixed** (A4 runtime recovery) |
| Blank EXPLORE / null floor map | **Guarded** (A4) |
| Dice double Continue / piece no modal | **Fixed** (A5) |
| Event zero-options / EventResult one-shot | **Held** (A5) |
| LOOT multi-exit double `returnToMap` | **Fixed** (A7a) |
| FREE_FIRST toggle false-positive playable | **Fixed** (A7b) |
| Silence / empty hand feedback | **Improved** (A7b; not soft-lock alone) |
| First-hour CTAs / Esc / shell void | **Held** (A3/A6 CLEAN) |
| Known **integration P0** open | **None** from static peer + tsc/build |

### Residuals (non-blocking / human playtest)

- Floor-gen mid-width dead-ends (design; no backtrack) — not agent rewrite
- Merchant Esc lacks `e.repeat` (leave mutex prevents double-leave)
- Cosmetic ~100ms blank between victory `setEnemy(null)` and explore transition
- 21 endgame skill jpg, ~36 side-event plates, thin enemy aliases — **art ceiling; STOP art waves**

---

## 7. Ship readiness

| Signal | Status |
|--------|--------|
| Typechecks | **GO** |
| Production build | **GO** |
| Event content unit smoke | **GO** (18/18) |
| Art paths / mirror | **GO** (0 gaps; ceiling held) |
| Cutout parity 39/39 | **GO** |
| Soft-lock residual smoke (agent) | **GO** — ship-relevant fixes landed |
| Known integration P0 open | **None** |
| **Ready for human playtest** | **YES** |
| **Ship as “R1 vertical slice done”** | **NOT YET** — playtest first |
| **Further scheduled agent waves** | **STOP** — no new blockers; wait for human |

### Explicit directive

> **If no new blockers (this pass found none at integration layer beyond fixes already landed): STOP scheduled agent waves pending human playtest.**

Optional polish remains human-only promotion. Art waves remain stopped.

### Plain language

- **Playtest-ready:** Yes. Integration green after WAVE12 soft-lock residual + prior ceiling.  
- **Ship-ready:** No — still wait for a human 20-min Land of Waves verdict.  
- **More agent waves:** No. ROI of residual agent smoke is spent. **STOP scheduled waves.**

---

## Verification

```text
npx tsc --noEmit                                              → exit 0 (×2)
npm run build                                                 → exit 0 (~6.6–7.7s)
npx vitest run …/events/__tests__/eventContent.test.ts        → 18/18
public skill_*.png                                            → 93
public enemy portraits / cuts                                 → 39 / 39
public event_*.png                                            → 11
public lamina_mid_ / _fg_                                     → 14 / 14
public ↔ assets top-level gap (runtime prefixes)              → 0
WAVE12 A2                                                     → P1 approach Exit + reward harden
WAVE12 A3                                                     → CLEAN (0 code/0 art)
WAVE12 A4                                                     → spent-room + blank-map guards
WAVE12 A5                                                     → dice closedRef + piece stage
WAVE12 A6                                                     → CLEAN (UX verify)
WAVE12 A7a                                                    → P1 LOOT multi-exit
WAVE12 A7b                                                    → FREE_FIRST + silence/empty hand (no paint)
A8 glue TS                                                    → none
Recommendation                                                → STOP scheduled waves → human playtest
```
