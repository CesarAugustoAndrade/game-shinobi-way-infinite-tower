# TODOs — SHINOBI WAY

Índice de tareas del proyecto.

| Carpeta | Contenido |
|---------|-----------|
| [`active/`](./active/) | Tareas **pendientes** (un `.md` por tarea) |
| [`archived/`](./archived/) | Tareas **hechas** (archivadas del loop T-001…T-018) |

**Fuentes de verdad relacionadas**

- Loop backlog: [`loop/LOOP-TOPICS.md`](../loop/LOOP-TOPICS.md)
- Loop ledger: [`loop/LOOP-STATE.md`](../loop/LOOP-STATE.md)
- Logs de intentos: [`loop/logs/`](../loop/logs/)
- Análisis multiagente: [`docs/analisis-estado-actual-multiagente.md`](../docs/analisis-estado-actual-multiagente.md)

## Convención

```text
todos/
├── README.md                 ← este índice
├── active/
│   ├── T-019.md              ← topic del loop (pending)
│   ├── A-003.md              ← fix del análisis multiagente
│   └── ...
└── archived/
    ├── T-001.md
    └── ...
```

| Prefijo | Significado |
|---------|-------------|
| `T-NNN` | Topic del loop (`/loop-run`) |
| `A-NNN` | Acción del análisis de estado / deuda técnica priorizada |

**Al completar una tarea**

1. Mover `active/X.md` → `archived/X.md`
2. Cambiar `status: todo` → `done` y anotar fecha
3. Actualizar este README (tablas)
4. Si es `T-NNN`: `status: passed` en `loop/LOOP-TOPICS.md` + log en `loop/logs/`

---

## Active (todo)

### P0 — máximo impacto en el run

| ID | Título | Section |
|----|--------|---------|
| [T-023](./active/T-023.md) | Esqueleto de campaña + interludio entre regiones | exploration |

### P1 — confianza y UX

| ID | Título | Section |
|----|--------|---------|
| [T-019](./active/T-019.md) | Registry de arte + iconografía del juego | presentation |
| [T-022](./active/T-022.md) | Exploración cinemática: overlays de mochila y ficha | presentation |

### P2 — polish / deuda fina + contenido

| ID | Título | Section |
|----|--------|---------|
| [T-020](./active/T-020.md) | Arte de skills (catálogo completo) | presentation |
| [T-021](./active/T-021.md) | Retratos de enemigos + ilustraciones de eventos | presentation |
| [T-024](./active/T-024.md) | Región 2: Chunin Exams | exploration |
| [T-025](./active/T-025.md) | Región 3: Sasuke Retrieval | exploration |
| [T-026](./active/T-026.md) | Región 4: Great Ninja War | exploration |

### P3 — post-campaña

| ID | Título | Section |
|----|--------|---------|
| [T-027](./active/T-027.md) | Ascenso infinito (modo torre) | exploration |

**Orden sugerido de ejecución:**  
T-023 → T-019 → T-022 → T-020+ / regiones.

**Conteo active:** 0 acciones `A-*` + 9 topics `T-019…T-027` = **9 tareas**.  
**Swarm 2026-07-18:** todas las **A-001…A-018** implementadas y archivadas (`npm test` 341/341, `tsc` clean).

---

## Archived (done)

### Acciones multiagente (A-*) — completadas 2026-07-18

| ID | Título | Log |
|----|--------|-----|
| [A-001](./archived/A-001.md) | Cerrar meta location→region (cartas, deck, locationsCleared, EXPLORE) | — |
| [A-002](./archived/A-002.md) | Crafting real: drops de combate + pasivas de artefactos | — |
| [A-003](./archived/A-003.md) | Enemigos con identidad: kits, bosses, telegraph | — |
| [A-004](./archived/A-004.md) | Promesas rotas de combate: HEAL, stun, silence, preview, Auto | — |
| [A-005](./archived/A-005.md) | Onboarding honesto: handbook, elementos, loadout, GameOver | — |
| [A-006](./archived/A-006.md) | Economía merchant: precio, stock, sell ratio | — |
| [A-007](./archived/A-007.md) | Unificar combate sim ↔ live | — |
| [A-008](./archived/A-008.md) | Fix doble-conteo de equipo en `getPlayerFullStats` | — |
| [A-009](./archived/A-009.md) | Approach initiative real + sinergia posture/deck | — |
| [A-010](./archived/A-010.md) | GameLog en combate + jugo de hit mínimo | — |
| [A-011](./archived/A-011.md) | Event combat: honrar `triggerCombat.archetype` | — |
| [A-012](./archived/A-012.md) | Limpieza feature flags muertos + defaults debug | — |
| [A-013](./archived/A-013.md) | Tests PlayerTurnSystem + RegionSystem (+ golden scaling) | — |
| [A-014](./archived/A-014.md) | Skill passives `damageBonus`/`defenseBonus` (FIRE_AFFINITY) | — |
| [A-015](./archived/A-015.md) | Semántica ActionType MAIN/SIDE alineada con AP | — |
| [A-016](./archived/A-016.md) | Taxonomía unificada de las 9 stats (Body/Mind/Technique) | — |
| [A-017](./archived/A-017.md) | Counter passive un solo RNG + REGEN/SHIELD max | — |
| [A-018](./archived/A-018.md) | Event RNG seedable (`rollOutcome` → `utils/rng`) | — |

### Loop topics (T-001…T-018)
| [T-001](./archived/T-001.md) | UI/UX Pixel-Arcade global | [log](../loop/logs/T-001.md) |
| [T-002](./archived/T-002.md) | SkillCard coste de chakra | [log](../loop/logs/T-002.md) |
| [T-003](./archived/T-003.md) | Skill combat-art | [log](../loop/logs/T-003.md) |
| [T-004](./archived/T-004.md) | Combate: cartas, posturas, AP | [log](../loop/logs/T-004.md) |
| [T-005](./archived/T-005.md) | Assets de combate | [log](../loop/logs/T-005.md) |
| [T-006](./archived/T-006.md) | Coordinación combate / skills | [log](../loop/logs/T-006.md) |
| [T-007](./archived/T-007.md) | RegionMap retro-arcada | [log](../loop/logs/T-007.md) |
| [T-008](./archived/T-008.md) | Event Engine 2.0 | [log](../loop/logs/T-008.md) |
| [T-009](./archived/T-009.md) | Skill event-creator | [log](../loop/logs/T-009.md) |
| [T-010](./archived/T-010.md) | Contenido de eventos | [log](../loop/logs/T-010.md) |
| [T-011](./archived/T-011.md) | Presentación Event | [log](../loop/logs/T-011.md) |
| [T-012](./archived/T-012.md) | Balance de eventos | [log](../loop/logs/T-012.md) |
| [T-013](./archived/T-013.md) | Combate capas + CRT | [log](../loop/logs/T-013.md) |
| [T-014](./archived/T-014.md) | Overhaul cinemático combate | [log](../loop/logs/T-014.md) |
| [T-015](./archived/T-015.md) | Sim multi-locación + items | [log](../loop/logs/T-015.md) |
| [T-016](./archived/T-016.md) | Limpieza campos eventos | [log](../loop/logs/T-016.md) |
| [T-017](./archived/T-017.md) | Pixel-Arcade economía | [log](../loop/logs/T-017.md) |
| [T-018](./archived/T-018.md) | Pixel-Arcade pantallas secundarias | [log](../loop/logs/T-018.md) |

Último topic pasado del loop: **T-018** (ver `loop/LOOP-STATE.md`).
