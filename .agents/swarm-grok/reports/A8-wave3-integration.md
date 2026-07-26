# A8 WAVE3 — INTEGRACIÓN residual (final)

**Agent:** A8 WAVE3  
**Date:** 2026-07-23  
**Branch:** develop (no commit / no git add)  
**Scope:** Glue only after parallel WAVE3 agents (A2–A7b). No feature rewrites.

---

## Summary

Post-WAVE3 integration pass: scanned baseline while peers landed, re-ran typecheck, audited enemy/skill/event painted paths vs manifests, mirrored residual public→`assets/` orphans, refreshed `ART_BACKLOG_NOTES` / CHANGELOG / out-of-scope. **`npx tsc --noEmit` → exit 0.** No TS glue fixes required.

---

## 1. Typecheck / imports

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` (final) | **exit 0** |
| Broken imports after WAVE3 landings | None |
| Parallel noise (Bag / RewardModal / manifests) | Settled clean |

**Action:** No code glue required for tsc.

---

## 2. Art path audit (WAVE3 landings)

### Skills (`skill_*.png`)

| Metric | Count |
|--------|-------|
| On disk `public/assets/skill_*.png` | **37** |
| Manifest `painted-png` entries | **37** |
| Missing vs manifest | **0** |
| Still imagine-jpg | **~77** of 114 |
| R1 clan loadout unique ids | **35/35 painted** (A7b-w3) |

Wave3 new faces (17):  
`bunshin`, `brace`, `analyze`, `precision`, `taijutsu_training`, `chakra_reserves`, `wire_setup`, `smoke_bomb`, `sharingan_predict`, `fire_affinity`, `air_palm`, `byakugan_scan`, `dancing_leaf`, `focused_breathing`, `iron_body`, `kai`, `mental_fortitude`.

### Enemies (`enemy_*` / `enemy_cut_*`)

| Metric | Count / status |
|--------|----------------|
| Portraits (non-cut) | **17** |
| Cutouts | **17** (1:1 pairs) |
| Manifest `enemy_*.png` refs | **17 unique** — all on disk |
| WAVE3 new dedicated pool | `forest_bandit`, `village_thug`, `corrupt_guard`, `bandit_captain` (+ cuts) |
| Cutout rewrite | `enemy_` → `enemy_cut_` (A2-w3 hardened; skips already-cut paths) |

### Events (`event_*.png`)

| id | Path | Status |
|----|------|--------|
| `meet_tazuna` | `/assets/event_meet_tazuna.png` | painted (prior) |
| `tazuna_road_mist` | reuses meet_tazuna | painted quality |
| `protect_bridge` | `/assets/event_protect_bridge.png` | WAVE3 painted |
| `final_confrontation` | `/assets/event_final_confrontation.png` | WAVE3 painted |
| Other events | `icons/events/*.jpg` | ~44 imagine-jpg |

### Laminas / locations

| Layer | Count |
|-------|-------|
| `lamina_mid_*` | **14** |
| `lamina_fg_*` | **14** |
| `location_*` | **14** |

### public → assets mirror (this agent)

| File | Action |
|------|--------|
| `enemy_gato.png` | Mirrored (was public-only) |
| `event_meet_tazuna.png` | Mirrored (was public-only) |
| `button_enter_location.png` | Mirrored |
| `translucent_begin_journey.png` | Mirrored |
| WAVE3 skill/enemy/event plates | Already mirrored by A3/A7b peers — verified 0 residual gaps |

---

## 3. Peer WAVE3 reports observed

| Report | Theme |
|--------|-------|
| A2-wave3-combat | Reward cinema, Approach risk-before-commit, Seals bar, cutout harden, neon kill |
| A3-wave3-enemies | +4 enemy identities + cuts; protect_bridge + final_confrontation plates |
| A4-wave3-explore | StS first-run clarity, fog honesty, CRT visor, location scar panel |
| A5-wave3-events | +3 side mystery events + deferred flags; mysteryFlavor; caravan soft-gate |
| A6-wave3-ux | Dead parchment CSS deleted; beige→bone; GameGuide handbook; rust focus rings |
| A7a-wave3-loot | Rarity BEM tokens (Tailwind dead fix); mysterious empty states; void plates |
| A7b-wave3-skills | +17 painted faces → 37 total; R1 loadouts 100% |

---

## 4. Glue fixes landed (this agent)

| Change | Why |
|--------|-----|
| Mirror 4 residual public top-level files → `assets/` | Project mirror lagged runtime tree |
| `ART_BACKLOG_NOTES` T020/T021 refresh | WAVE3 painted counts + shared-pool residual honesty |
| `CHANGELOG.md` WAVE3 integration block | Facts only |
| `out-of-scope.md` | OOS-A8-02 partial (R1 loadouts closed); OOS-A8-04/05 event + pool-share notes |
| This report | Residual gaps + R1 20-min checklist |

**Not done (out of glue scope):** painting remaining 77 skills; dedicated side-event plates; remaining shared enemy pool aliases; R2+ cast.

---

## 5. Residual product gaps (honest — for human playtest)

1. **~77 skill cards still imagine-jpg** — R1 start loadouts are fully painted; scroll-loot / late-tier / non-loadout kits still jpg tiles.  
2. **Event art still thin outside spine** — only 3 dedicated painted event PNGs; W2/W3 side residuals reuse existing plates (A5 intentional, no image_gen).  
3. **Enemy pool sharing remains** — `beach_bandit`→dock_worker, smugglers→puppeteer, `stranded_ronin`→samurai, `assassin`→mist_ninja; animal/trap pools still jpg. Name-keyword `mist` in `getEnemyArt` resolves via beach_bandit (dock worker), not mist_ninja plate.  
4. **Lamina compositing** — mid/fg still solid black void centers (not true alpha). Fine for stage stack.  
5. **Genre stack** — CRT map instrument vs mist combat stage is intentional (A4/A6); watch any reintroduction of party cyan / amber into world plates. A7a fixed dead Tailwind rarity colors (was invisible hierarchy).  
6. **Mystery side-event discoverability** — new residual events depend on preferred pools + event rolls; spine payoffs may feel sparse if flags never set in a short run.  
7. **Multi-agent residual risk** — if more agents land after this report, re-run `npx tsc --noEmit` before parent stages.  
8. **Human playtest still required** — systems + art are present; 20-min mood criteria below are estimates, not measured.

---

## 6. Production readiness vs VISION-8 §13 (20-min R1)

Criteria from `docs/VISION-8-AGENTES.md` §13. Checkbox status = **honest estimate** from code/art audit + peer reports — **not a live playtest**.

| # | Criterion | Est. | Notes |
|---|-----------|------|-------|
| 1 | Identidad en 30 s: “ninja terror en niebla, en una máquina oscura” | [~] **partial → likely** | Menu/clan + void stage + painted laminas/enemies; CRT map is instrument not world. Beige parchment chassis removed (A6-w3). Needs human eye on first boot. |
| 2 | El combate se ve como el *show*; la mano es el mando | [x] **likely** | Enemy-focus stage, cutouts, laminas, intent/seals polish (A2), painted skill faces on R1 hands (A7b). |
| 3 | Derrota/victoria con trade-off legible; sin soft-locks de modales | [~] **partial** | Soft-lock fixes landed earlier (rest/loot/event multi-click). Approach failure chips visible pre-commit (A2-w3). Full defeat/epitaph mood needs playtest; multi-click residual risk low but not zero. |
| 4 | Continuidad de tone (sin whiplash pergamino/party/pixel) | [~] **partial → improved** | Parchment CSS deleted; rarity Tailwind dead-path fixed; Approach/Reward neon killed. Hybrid pixel jpg leftovers + map CRT still two languages by design. |
| 5 | “Una sala más” sin necesitar región 4 para entender el juego | [x] **likely** | First-run coach CTAs (W2/A4), location scar panel, amenities honesty, R1 spine events. |
| 6 | Eventos y tooltips se sienten de producto, no de prototipo | [~] **partial** | Spine events + residual mystery (A5) + unified abyss tooltips (A6). Event art sparse outside 3 plates; tooltip chrome much better but copy depth uneven. |

### Pillar snapshot (VISION-8 §10)

| Pilar | Est. R1 readiness | Residual |
|-------|-------------------|----------|
| P0 Eventos | Medium-high | Side art; discoverability of residual flags in 20 min |
| P1 Cámara siempre | High | True-alpha laminas optional |
| P2 Location-as-transform | Medium-high | Scar UI landed; player may still miss mechanical “you changed” |
| P3 Items = assets | Medium-high | Rarity color fixed; empty-state voice in; full legendary VFX optional |
| P4 Skills con gracia | High for R1 start | 77 non-loadout jpg remain |
| P5 Tooltips de juego real | Medium-high | One language direction; depth/consistency still playtest |
| P6 Tone R1 | Medium-high | Whiplash greatly reduced; human verdict needed |

### Go / no-go for human playtest

| Signal | Status |
|--------|--------|
| Builds / typechecks | **GO** (`tsc` clean) |
| Art paths for painted manifests | **GO** (0 missing) |
| public ↔ assets mirror | **GO** (0 top-level gaps) |
| Soft-lock blockers known open | **No known P0 soft-lock** from this audit |
| Mood = product not prototype | **NEEDS HUMAN** (estimate ~70–80% of §13) |
| Ship as “R1 vertical slice done” | **NOT YET** — playtest first; residual OOS art optional |

---

## Verification

```text
npx tsc --noEmit              → exit 0
public skill_*.png            → 37 / 37 manifest painted
public enemy_*.png (portraits)→ 17
public enemy_cut_*.png        → 17
public event_*.png            → 3
public lamina_mid_ / _fg_     → 14 / 14
public → assets top-level gap → 0
```

No git commit / no git add (parent stages).

---

## Files touched (A8 WAVE3)

- `assets/enemy_gato.png` (mirrored)
- `assets/event_meet_tazuna.png` (mirrored)
- `assets/button_enter_location.png` (mirrored)
- `assets/translucent_begin_journey.png` (mirrored)
- `src/game/constants/artRegistry.ts` (`ART_BACKLOG_NOTES`)
- `CHANGELOG.md`
- `out-of-scope.md`
- `.agents/swarm-grok/reports/A8-wave3-integration.md` (this file)
