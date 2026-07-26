# A8 WAVE8 — INTEGRACIÓN final residual

**Agent:** A8 WAVE8  
**Date:** 2026-07-23  
**Branch:** develop (no commit / no git add)  
**Scope:** Glue only after WAVE7 peer landings. No feature rewrites. Final R1 inventory + honest polish-ceiling STOP.

---

## Summary

Post-WAVE7 residual integration (WAVE8 — **final**). Reconciles full WAVE7 peer products (A2–A7b), re-runs typecheck, audits painted-png paths, verifies public↔assets top-level mirror (**0 gaps**), refreshes CHANGELOG / OOS accurate counts, smoke-tests event content.

**`npx tsc --noEmit` → exit 0.** Event content tests **18/18**. **No TS glue fixes required.**

### Honest call — R1 polish ceiling

Region 1 is **at polish ceiling for agent art waves**. Further painted skill jpg / thin side-event plates / soft enemy shares are **diminishing returns** vs a human 20-minute playtest + ship cut.

**Recommend: STOP art waves. Hand to human playtest. Fix only what playtest proves.**

Integration is green. Residual is optional polish and OOS R2+, not blockers.

---

## 1. Peer landings (WAVE7 → WAVE8 baseline)

| Agent | Role | Status | Product delta (integration view) |
|-------|------|--------|----------------------------------|
| A2 WAVE7 | Combat residual | done | Reward Continue ref lock; elite Fight/Escape ref lock; victory ref lock |
| A3 WAVE7 | Cast / events art | done | +4 enemy plates (water_spirit, sea_creature, vengeful_ghost, hired_muscle) → **33/33**; +2 event plates (shipwreck_whisper, manor_haunt_debt) → **11** |
| A4 WAVE7 | Explore residual | done | Floor-complete leave CTA + map copy; fogged secret “veiled signal” UI |
| A5 WAVE7 | Events residual QA | done | Hope/destiny kill outside event DB; 41/41 tiedStoryEvents resolve |
| A6 WAVE7 | UX residual | done | MainMenu/Victory Enter deferral; CharacterSelect loadout tooltip focus; tooltip clamp/flip; item-tile below-flip; GameGuide tabs a11y |
| A7a WAVE7 | Loot residual | done | Loot claim mutex; merchant service lock; treasure bag-full stash; hunter ryo honesty; skill learn atomic |
| A7b WAVE7 | Skills residual | done | +12 painted faces → **85** painted / **29** jpg |
| WAVE8 A2–A7b | — | **none expected** | Final residual glue only |

> A8 WAVE7 report audited pre-WAVE7-peer art (73/29/9). WAVE8 counts below are authoritative post-WAVE7 disk + manifest audit.

---

## 2. Typecheck / imports

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** |
| Broken imports | None |
| Glue TS fixes required | **None** |

Peers already wired WAVE7 art + soft-lock fixes. `artRegistry.ART_BACKLOG_NOTES` already at 85 / 33 / 11.

---

## 3. Art tree mirror + path audit (final R1 inventory)

| Check | Result |
|-------|--------|
| `skill_*.png` (public top-level) | **85** |
| skill manifest painted / jpg | **85 / 29** (114 total) |
| enemy portraits (non-cut) | **33** |
| `enemy_cut_*.png` | **33** (parity) |
| enemy manifest painted keys / unique srcs / jpg | **44 / 33 / 8** |
| `event_*.png` dedicated | **11** |
| event manifest painted keys / unique srcs / jpg | **12 / 11 / 36** (`tazuna_road_mist` reuses meet_tazuna) |
| `lamina_mid_*` / `lamina_fg_*` | **14 / 14** |
| public top-level → `assets/` gaps | **0** (root `assets/` has 2 extra non-runtime: `assets_backup.zip`, `ui_seinen-sublime-…png`) |
| Manifest painted-png missing on disk | **0** |

### Manifest quality snapshot (WAVE8 final)

| Manifest | painted-png keys | imagine-jpg | unique top-level painted | missing files |
|----------|------------------|-------------|--------------------------|---------------|
| skillArtManifest | 85 | 29 | 85 | 0 |
| enemyArtManifest | 44 | 8 | 33 | 0 |
| eventArtManifest | 12 | 36 | 11 | 0 |

**Mirror action this wave:** none — 0 public→assets top-level gaps.  
(`public/assets/icons/**` jpg tree is intentionally public-only runtime Imagine set — not mirrored to root `assets/`.)

---

## 4. Glue changes (A8 WAVE8 only)

| File | Change |
|------|--------|
| `CHANGELOG.md` | WAVE8 final residual block; WAVE7 counts marked superseded |
| `out-of-scope.md` | OOS-A8-02/04/05 final R1 inventory + ceiling language |
| `.agents/swarm-grok/reports/A8-wave8-integration.md` | this report |

No `artRegistry` / manifest / runtime glue edits — peers already wired WAVE7; registry notes already accurate.

---

## 5. Docs / OOS final R1 inventory

| ID | WAVE8 status | Honest residual |
|----|--------------|-----------------|
| **OOS-A8-02** Skills art | **partial / ceiling** — **85** painted / **29** jpg | Sand/gates/summons/forbidden endgame — low first-hour impact; **stop without playtest promotion** |
| **OOS-A8-03** Laminas | **closed (R1)** | — |
| **OOS-A8-04** Event art | **partial / ceiling** — **11** dedicated plates | ~36 side/category still jpg/reuse |
| **OOS-A8-05** Enemy pool share | **partial / ceiling** — **33** portraits/cuts | camp_raider/ronin soft shares; ~8 spirit/job jpg keys |
| **OOS-A8-01** R2+ cast | open | Out of R1 scope |

---

## 6. Vitest smoke

```text
npx vitest run src/game/constants/events/__tests__/eventContent.test.ts
→ 18/18 passed (~800ms)
```

Cheap event-content smoke only; full suite not required for glue pass.

---

## 7. VISION-8 §13 checklist estimate

Source: `docs/VISION-8-AGENTES.md` §13 — *Criterio de éxito (playtest 20 min R1)*.  
**These are integration estimates only — not human playtest results.**

| # | Criterion | Est. readiness | Notes |
|---|-----------|----------------|-------|
| 1 | Identidad en 30 s: “ninja terror en niebla, en una máquina oscura” | **~70%** | Seinen plates + CRT chassis present; era-stack residual (map neon vs mist stage) unmeasured live |
| 2 | Combate se ve como el *show*; la mano es el mando | **~85%** | Laminas 14/14; cutouts 33/33; 85 skill faces; enemy stage focus wired |
| 3 | Derrota/victoria trade-off legible; sin soft-locks de modales | **~85%** | WAVE2–7 ref locks (reward/elite/victory/loot/merchant/approach Esc/focus traps); **needs human hold/double-click smoke** |
| 4 | Continuidad de tone (sin whiplash pergamino/party/pixel) | **~65%** | Hope-language killed; parchment chassis dead on path; residual genre polyglot still design tension |
| 5 | “Una sala más” sin necesitar R4 para entender el juego | **~80%** | Full R1 loop (map→room→combat/event/loot/amenities→boss arc) wired |
| 6 | Eventos y tooltips se sienten de producto, no de prototipo | **~75%** | Spine events + 11 plates; A6 tooltip clamp/product chrome improved; side events thinner |

**Aggregate playtest-gate estimate:** **~75–80%** of VISION-8 §13 is *plausibly* present in code/assets. **Only a 20-min human run can pass/fail the checklist.** Do not claim §13 complete from agent waves alone.

---

## 8. TOP residual only

1. **Human playtest (P0 next)** — 20-min Land of Waves; log real friction against VISION-8 §13.  
2. **29 skill imagine-jpg** — late-tier sand/gates/summons/forbidden; R1 loadouts already closed.  
3. **Side-event art thin** — outside 11 spine/key plates, residual jpg/reuse.  
4. **Enemy thin residual** — soft shares (camp_raider/ronin/guardians); ~8 jpg spirit/job keys.  
5. **Genre stack leftovers** — CRT map instrument vs mist combat stage (by design); residual chrome cohesion only if playtest complains.

**Not residual blockers:** tsc, painted path integrity, cutout parity, event content unit smoke, public↔assets mirror.

---

## 9. Playtest vs ship

| Signal | Status |
|--------|--------|
| Builds / typechecks | **GO** (`tsc` clean) |
| Event content unit smoke | **GO** (18/18) |
| Art paths for painted manifests | **GO** (0 missing) |
| public ↔ assets top-level mirror | **GO** (0 gaps) |
| Cutout parity (33/33) | **GO** |
| Known P0 soft-lock open from this audit | **None** |
| **Ready for human playtest** | **YES — GO for 20-min R1 playtest** |
| **Ship as “R1 vertical slice done”** | **NOT YET** — playtest first; optional art only after human verdict |
| **Further R1 art agent waves** | **STOP** — diminishing returns |

### Plain language

- **Playtest-ready:** **Yes.** Typecheck clean, event content green, WAVE7 peer bug hunts + art coherent, 0 mirror gaps. Hand a human a 20-minute Land of Waves run.  
- **Ship-ready:** **No — wait for human verdict.** Residual jpg skill tiles (29), thin side-event art, and soft enemy shares are **optional polish**, not integration blockers. Claiming “R1 done / release” without playtest would oversell.  
- **Art-wave-ready:** **No.** Ceiling reached. Prefer playtest → fix proven P0/P1 only.

### Diminishing returns (explicit)

Further agent art waves on R1 are past the steep part of the curve. Prefer:

1. Human playtest → log real P0/P1 friction  
2. Fix only what playtest proves  
3. Leave OOS art residual until promoted  
4. Do not open WAVE9 art without human evidence

---

## Verification

```text
npx tsc --noEmit                                              → exit 0
npx vitest run …/events/__tests__/eventContent.test.ts        → 18/18
public skill_*.png                                            → 85
public enemy portraits / cuts                                 → 33 / 33
public event_*.png                                            → 11
public lamina_mid_ / _fg_                                     → 14 / 14
public → assets top-level gap                                 → 0
manifest painted-png missing                                  → 0
skill / enemy / event painted counts                          → 85 / 44 keys (33 unique) / 12 keys (11 files)
```

No git commit / no git add (parent stages).

---

## Files touched (A8 WAVE8)

- `CHANGELOG.md` — WAVE8 final residual block + WAVE7 supersession note  
- `out-of-scope.md` — OOS-A8-02/04/05 final R1 inventory + ceiling  
- `.agents/swarm-grok/reports/A8-wave8-integration.md` (this file)
