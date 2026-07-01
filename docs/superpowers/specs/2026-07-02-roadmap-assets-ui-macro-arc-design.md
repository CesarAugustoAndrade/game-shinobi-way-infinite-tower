# Diseño — Ruta: Assets completos → Exploración cinemática → Arco macro (T-019…T-027)

> Fecha: 2026-07-02 · Autoría externa al loop (brainstorming) → se vuelca a `loop/LOOP-TOPICS.md`.
> Resultado: 9 topics en 3 olas ordenadas. Decisión del usuario: TODOS los assets del juego actual
> se generan ANTES de los topics del arco macro.

## 1. Diagnóstico

**El run individual ya está fuerte** (combate cartas/AP/posturas, eventos 2.0, chasis pixel-arcade, simuladores).
Los huecos estructurales:

1. **Arte incompleto**: existen ~30 assets (14 fondos de location, 6 retratos de enemigos, 8 fondos de skill, menú/charselect). Faltan: ~106 de 114 skills sin arte; enemy pools por location sin retrato (dependen de GenAI runtime o fallback); items/componentes/artefactos 100% emoji; `icon.asset: '/assets/icons/locations/*.png'` referenciado pero **la carpeta no existe**; avatares de clan en emoji; eventos sin ilustración; iconos de actividades (combat/merchant/rest/…) en emoji.
2. **Exploración = sándwich de datos**: `LeftSidebarPanel` (location + stats primarios + derivados) y `RightSidebarPanel` (equipo + mochila + síntesis) siempre visibles flanqueando el mapa. Nada cinemático.
3. **Sin arco macro**: solo existe Land of Waves (`App.tsx` genera únicamente `LAND_OF_WAVES_CONFIG`); vencer al boss no lleva a nada. Sin regiones 2-4, sin victoria, sin torre infinita pese al título.

Además (anotado para olas futuras, NO en esta ruta): **cero persistencia** (ni `localStorage`; un F5 mata el run — será urgente cuando el run dure 4 regiones) y **cero audio**.

## 2. La ruta (3 olas, orden estricto)

```text
OLA A · ASSETS (todo el juego actual)   OLA B · UI        OLA C · ARCO MACRO
T-019 Registry + iconografía            T-022 Exploración  T-023 Esqueleto campaña + interludio
T-020 Arte de skills (114)              cinemática         T-024 Región 2: Chunin Exams
T-021 Enemigos + eventos                (overlays 🎒/📜)   T-025 Región 3: Sasuke Retrieval
                                                           T-026 Región 4: Great Ninja War
                                                           T-027 Ascenso infinito
```

**Regla de assets de regiones 2-4**: no pueden generarse antes de que existan sus configs; cada topic de
región (T-024..T-026) incluye su propia ola de arte (fondos, iconos, enemigos), patrón T-007.

## 3. OLA A — Assets (todos, con /generar-asset + combat-art)

### T-019 · Registry de arte + iconografía del juego
- Crear un **REGISTRY central de arte** (clave→asset, con fallback emoji limpio y tipado) para que cualquier
  sistema resuelva su imagen por clave — hoy cada consumidor improvisa (`item.icon || '?'`, `icon.asset` roto).
- Generar la **iconografía**: iconos de items/componentes/artefactos (sustituyen emoji), iconos de location
  (crear `/assets/icons/locations/` que hoy no existe), iconos de actividades (combat/eliteChallenge/merchant/
  event/scrollDiscovery/rest/training/treasure), avatares de los 5 clanes (reemplazan 🔥🌀👁️💪💠).
- Auditoría final: lista de toda clave sin arte (el backlog vivo de las olas siguientes).

### T-020 · Arte de skills (catálogo completo)
- Generar arte para las ~106 skills sin asset (de 114 en `skills.ts`), estilo pixel-art 16-bit según
  `combat-art` (fondos saturados tipo Neo Geo, transparencias donde aplique).
- Cablear vía el registry de T-019 en SkillCard, Loot, ScrollDiscovery, Training.
- Por lotes por categoría (taijutsu/ninjutsu elemental/genjutsu/herramientas/pasivas) con QA visual.

### T-021 · Retratos de enemigos + ilustraciones de eventos
- Retratos para el enemy pool completo de Waves (dock_worker, corrupt_guard, smuggler, beach_bandit, …),
  elites y bosses; y un set de **fallbacks por arquetipo** (TANK/ASSASSIN/BALANCED/CASTER/GENJUTSU) para
  enemigos generados sin retrato dedicado → deja de depender de GenAI runtime.
- Ilustraciones de eventos: 1 por evento clave + 1 por categoría como fallback (la escena Event es solo texto).
- Cablear vía registry con fallback en cascada: dedicado → arquetipo → emoji.

## 4. OLA B — Exploración cinemática

### T-022 · Overlays de mochila y ficha; exploración full-bleed
- Retirar los sidebars permanentes de la exploración; la escena queda **cinemática** (arte protagonista).
- **HUD mínimo** persistente (nombre/Lv, HP/CP compactos, ryo, botones 🎒 y 📜).
- **Overlay Mochila (I)**: equipo + bag + síntesis drag&drop (mueve `RightSidebarPanel`/`Bag`/`EquipmentPanel`
  a un drawer/modal sobre la escena; conservar dnd-kit).
- **Overlay Ficha (C)**: stats primarios + derivados + buffs (mueve `PrimaryStatsPanel`/`DerivedStatsPanel`).
- Cierre con ESC; estilo pixel-arcade; sin dead code (retirar los sidebars viejos del layout de exploración).

## 5. OLA C — Arco macro (aprobado previamente)

Decisiones ya tomadas: **campaña de 4 regiones curadas + modo infinito desbloqueable**; regiones 2-4 del
**mismo tamaño que Waves** (~13 locations: 10 + 3 secretas); **interludio completo** entre regiones.

### T-023 · Esqueleto de campaña + interludio
- `REGION_ORDER` (registro de las 4 regiones con `baseDifficulty` creciente). Al vencer al boss
  (`isRegionBossDefeated` ya existe) → escena **Interludio**: cierre narrativo del arco + curación total +
  **boon a elegir 1-de-3** (stat permanente / item / skill) + resumen del run → generar la siguiente región.
- Tras la región 4: **pantalla de victoria** (stats del run). Funciona desde el día 1 con solo Waves
  (Waves → victoria provisional).

### T-024 · Región 2: Chunin Exams (Forest of Death)
### T-025 · Región 3: Sasuke Retrieval (Valley of the End)
### T-026 · Región 4: Great Ninja War (Divine Tree Roots)
- Cada una: ~13 locations (patrón `landOfWaves.ts`), curva de danger Entry→Boss 7, enemy pools del arco,
  eventos atados, boss temático, **y su propia ola de assets** (fondos, iconos, retratos — patrón T-007).

### T-027 · Ascenso infinito
- Al ganar la campaña se desbloquea: generador procedural de regiones que cicla los 4 arcos con
  `baseDifficulty` creciente sin tope; el run acaba al morir; **score = altura alcanzada**.
- Lente BALANCE fuerte (curva de escalado); apoyarse en el simulador multi-locación (T-015).

## 6. Decisiones registradas

- **Assets primero, todos** (pedido explícito): olas A completa antes de C; regiones nuevas traen su arte dentro.
- **Registry central de arte** (T-019) como fundación: elimina los 3 patrones ad-hoc actuales y da fallback en cascada.
- **Overlays, no pantallas dedicadas**, para mochila/ficha (mantiene al jugador en la escena).
- **Campaña + infinito**, regiones paridad con Waves, interludio con boon (patrón Slay the Spire).
- Persistencia/meta-progresión y audio: siguientes olas tras esta ruta (la persistencia sube de urgencia con
  runs de 4 regiones).
