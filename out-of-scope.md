# Out of Scope (Region 1 Polish Swarm)

Issues found outside Region 1 / first-player journey. Do **not** fix these in this swarm wave unless promoted by lead.

## R1 polish ceiling (A8 WAVE13 — regression FINAL; 2026-07-23)

**Status: CEILING HOLDS + WAVE13 REGRESSION CLEAN + HARD STOP.** WAVE10 stamped ceiling; WAVE11 reconfirm; WAVE12 soft-lock residual; WAVE13 static regression of WAVE12 fixes — **CLEAN**, **no NEW blockers**, production chunk **identical** to WAVE12. Residual optional polish remains **human-only**.

| Gate | Rule |
|------|------|
| **Human playtest** | **Only remaining work** for R1 ship claim. 20-min Land of Waves against `docs/VISION-8-AGENTES.md` §13. |
| **Agent waves** | **HARD STOP** further scheduled agent waves until human playtest. Do **not** open WAVE14+ (or re-open art/polish/soft-lock residual waves) unless playtest logs a **blocker** (P0 soft-lock, missing path, broken import, wrong identity on critical spine). |
| **Automated swarm** | **Recommend cancel / pause automated swarm ticks** — peers all CLEAN (static); diminishing returns stamped. |
| **WAVE13 regression** | WAVE12 soft-locks **HELD** (approach Exit, spent-room, dice one-shot, LOOT multi-exit, FREE_FIRST toggle, death hang). tsc/build green. No product code this wave. |
| **WAVE12 soft-lock residual** | Closed for agents. Non-blocking residuals (cosmetic blank ticks, optional `e.repeat` hygiene, floor-gen dead-ends) — **human promotion only**. |
| **Optional polish** | Residual jpg skills (21 endgame), side-event plates (~36), thin elite soft shares — **human-only promotion**. **STOP art waves.** |
| **Ship claim** | Not from agent waves alone. Playtest first. |

Integration audits: `.agents/swarm-grok/reports/A8-wave13-integration.md` (**latest**) · `A8-wave12-integration.md` · `A8-wave11-integration.md` · `A8-wave10-integration.md`.

| ID | Area | Description | Found by | Date | Status |
|----|------|-------------|----------|------|--------|
| OOS-000 | — | (seed) | grok-lead | 2026-07-22 | open |
| OOS-A8-01 | Assets R2+ | Dedicated painted cutouts for Exams/Retrieval/War enemy pools (R1 still shares plates with some pools; R2+ need own cast) | A8 | 2026-07-23 | open |
| OOS-A8-02 | Skills art | Painted faces **93** / **21** imagine-jpg of 114. R1 loadouts closed. Residual endgame (tsukuyomi/amaterasu/sand/gates-limit/…) — **ceiling holds W13; human playtest gate** | A7b-w2…w12 / A8-w13 | 2026-07-23 | **partial / ceiling** |
| OOS-A8-03 | Laminas | mid/fg parallax for R1 biomes | A8 | 2026-07-23 | **closed (R1)** — all 14 location slugs mid+fg |
| OOS-A8-04 | Event art | Dedicated plates **11** (spine+key sides; 12 painted keys, tazuna_road_mist reuses meet_tazuna). Residual ~36 side/category jpg — **ceiling holds W13** | A3-w3…w12 / A8-w13 | 2026-07-23 | **partial / ceiling** |
| OOS-A8-05 | Enemy pool share | Disk **39** portraits+cuts (WAVE9 closed shrine_demon + corrupted_priest; soft elite remaps). Residual: 5 archetype jpg; thin aliases (river_bandit/hidden_guard→mist_ninja, elite_mercenary→bridge_saboteur) — **ceiling holds W13** | A3-w3…w12 / A8-w13 | 2026-07-23 | **partial / ceiling** — R1 dedicated cast closed |
