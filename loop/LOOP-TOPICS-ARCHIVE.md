# LOOP TOPICS — Backlog

> Backlog procesado de arriba hacia abajo por `/loop-run`. **La autoría de topics es
> EXTERNA al loop**: tú los brainstormeas con otro agente y los rellenas aquí.
> El loop solo **lee** un topic y **cambia su `status`**.
>
> ## Schema de un topic
> ```
> ## <id> · <título>
> - id: T-NNN
> - section: combat | jutsu | exploration | presentation | balance | architecture | events
> - status: pending | active | passed | escalated
> - initialScore: 0-100      # diagnóstico de partida (informativo)
> - targetScore: 0-100       # meta; el gate igual exige las 4 lentes >= 85
> - lensFocus: [LENTE, ...]  # lentes primarias (advisory); el gate evalúa las 4
> - description: >
>     Qué se quiere hacer/mejorar. Concreto y verificable.
> - entryPoints:             # opcional: archivos hint para el maker
>     - src/...
> ```
> `section` decide qué skill de proyecto carga el maker:
> combat→combat-system-creator · jutsu→jutsu-creator · exploration→exploration-creator ·
> presentation→combat-ui-pattern-a / frontend-design · balance→qa-balance + simulador ·
> architecture→a-review · events→event-creator (skill creada en T-009).

---

## T-001 · Transformar la UI/UX global al estilo Pixel-Arcade
- id: T-001
- section: presentation
- status: passed
- initialScore: 40
- targetScore: 85
- lensFocus: [PRESENTACION]
- description: >
    Transformar el chasis visual del juego (tipografía, botones y paneles/tarjetas) al estilo retro PIXEL-ARCADE neobrutalista siguiendo la guía de la skill local.
    1. Cargar las fuentes 'Silkscreen' y 'VT323' en la aplicación y mapearlas en las variables CSS.
    2. Reestilizar los botones para que tengan bordes gruesos, relleno sólido y sombras duras sin difuminado, con efecto de hundimiento al hacer clic.
    3. Reestilizar las tarjetas y paneles de las escenas clave (Menú Principal, Selección de Personaje, Exploración y Combate) con bordes e interfaces rectangulares 'blocky' y sombras duras.
    Mantener intactos los sprites y las ilustraciones de los personajes y fondos.
- entryPoints:
    - index.html
    - src/styles/design-system/_variables.css
    - src/styles/design-system/_components.css
    - src/styles/design-system/index.css

---

## T-002 · SkillCard muestra el coste de chakra
- id: T-002
- section: presentation
- status: passed
- initialScore: 60
- targetScore: 85
- lensFocus: [PRESENTACION, ARQUITECTURA]
- description: >
    La SkillCard de combate no muestra de forma clara el coste de chakra de la skill.
    Añadir un badge de coste consistente con los patrones de UI de combate existentes.
    Sin impacto de balance esperado.
- entryPoints:
    - src/components/combat/SkillCard.tsx

---

## T-003 · Convertir la guía de arte de combate en una skill local
- id: T-003
- section: presentation
- status: passed
- initialScore: 70
- targetScore: 90
- lensFocus: [PRESENTACION, ARQUITECTURA]
- description: >
    Crear una nueva skill local del proyecto en `.agents/skills/combat-art` basada en el documento
    `guia_direccion_de_arte_combate.md`. Esto estructurará las especificaciones de sprites,
    deconstrucción de capas (láminas), efectos de aura por CSS, filtro CRT y fórmulas de prompts
    en un formato indexable por el agente para futuras tareas de diseño de combate.
- entryPoints:
    - .agents/skills/combat-art/SKILL.md

---

## T-004 · Refactor del Sistema de Combate: Cartas, Posturas y Action Points
- id: T-004
- section: combat
- status: passed
- initialScore: 35
- targetScore: 85
- lensFocus: [COMBAT, PRESENTACION, ARQUITECTURA]
- description: >
    Refactorizar el sistema de combate de Shinobi Way según la propuesta detallada.
    1. Implementar en `CombatCalculationSystem.ts` el cálculo de pesos para la mano (pool de robo) basado en la postura.
    2. Modificar `CombatWorkflowSystem.ts` para gestionar el estado de la mano (4 slots de cartas), AP y la deducción de recursos al ejecutar habilidades.
    3. Integrar los controles de teclado rápidos (Z, X, C, V, SPACE) en el componente React `Combat.tsx` y la UI del HUD para mostrar las teclas y barras de AP.
- entryPoints:
    - src/game/systems/CombatCalculationSystem.ts
    - src/game/systems/CombatWorkflowSystem.ts
    - src/scenes/combat/Combat.tsx
    - src/components/combat/SkillCard.tsx

---

## T-005 · Creación de Assets de Combate usando /generar-asset
- id: T-005
- section: presentation
- status: passed
- nota: >
    Entregadas las partes 1-2 (8 skill backgrounds + 6 retratos de enemigos, vía /generar-asset
    siguiendo combat-art; renderizando en el juego, versionados). La parte 3 (fondos por 3 láminas
    para parallax + filtro CRT) se separó como **T-013** por ser una feature de escena de combate
    (código del CinematicViewscreen + sprites de enemigo transparentes), no generación de assets pura.
- initialScore: 50
- targetScore: 85
- lensFocus: [PRESENTACION]
- description: >
    Generar y organizar los assets visuales necesarios para el combate (técnicas de jutsus, sprites de enemigos
    y escenarios por capas) en formato Pixel-Art 16-Bit, siguiendo estrictamente las reglas estéticas
    y técnicas definidas en la nueva skill local `.agents/skills/combat-art` (creada en T-003). El proceso utilizará
    el comando `/generar-asset` (o la interfaz de generación de Asset Companion) y sus fórmulas de prompts.
    1. Generar sprites y retratos de enemigos con delineados oscuros marcados (outlines) y preparados para recibir auras de chakra dinámicas por CSS.
    2. Generar iconos de habilidades y herramientas con fondos transparentes y colores saturados/brillantes tipo Neo Geo.
    3. Generar y deconstruir fondos en 3 láminas independientes (Foreground, Middleground con enmarcado, Background) preparadas para scroll paralláctico y compatibles con la capa del filtro CRT.
- entryPoints:
    - src/config/assetCompanionConfig.ts
    - src/game/systems/EnemySystem.ts

---

## T-006 · Coordinación del Combate con Habilidades (Deep Dive & Licencia Creativa)
- id: T-006
- section: combat
- status: passed
- initialScore: 50
- targetScore: 90
- lensFocus: [COMBAT, PRESENTACION, ARQUITECTURA]
- description: >
    Realizar un análisis profundo (deep dive) de la integración de las habilidades (jutsus, rasgos de clan,
    elementos y herramientas) dentro del nuevo sistema de cartas y AP. El agente tiene total libertad y licencia
    creativa para modificar, ampliar o reestructurar los sistemas implicados (multiplicadores, efectos de estado,
    costes, etc.) en pro de la diversión, el dinamismo del gameplay y el impacto táctico del combate.
- entryPoints:
    - src/game/constants/index.ts
    - src/game/systems/CombatWorkflowSystem.ts
    - src/game/systems/CombatCalculationSystem.ts
    - src/game/types.ts

---

## T-007 · Rediseño de la Selección de Ubicación al estilo Retro-Arcada (RegionMap UI)
- id: T-007
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 85
- lensFocus: [PRESENTACION, ARQUITECTURA]
- description: >
    Refactorizar la pantalla de selección de ubicaciones (RegionMap) para replicar la interfaz retro de la referencia
    'ChatGPT Image 29 jun 2026, 15_53_31.png'.
    1. Diseñar las tarjetas horizontales de ubicación en un contenedor grid, aplicando bordes de neón delgados y brillantes,
    badges numéricos superiores ('1', '2', '3') y leyendas de clasificación ('WILDERNESS', 'SETTLEMENT').
    2. Implementar barras visuales de colores para DANGER (verde) y WEALTH (naranja/amarillo) en lugar de valores de texto planos.
    3. Añadir el pie de página de atajos ('1-3 SELECT CARD ♦ SPACE OR ENTER TO ENTER LOCATION') y la barra de progreso de región inferior.
    4. Generar/definir assets de imágenes pixel-art específicos para los fondos de las ubicaciones (ej. playa neblinosa con faro para Misty Beach,
    aldea pesquera iluminada para Fishing Village, e imagen glitched morada con castillo para zonas desconocidas/bloqueadas) usando el generador de la IA.
- entryPoints:
    - src/components/exploration/RegionMap.tsx
    - src/components/exploration/LocationCardDisplay.tsx
    - src/components/exploration/exploration.css

---

## T-008 · Motor de Eventos 2.0: Cadenas, Flags y Efectos
- id: T-008
- section: architecture
- status: passed
- initialScore: 35
- targetScore: 85
- lensFocus: [SISTEMA, ARQUITECTURA]
- description: >
    Extender el motor de eventos (hoy de un solo paso) de forma aditiva, sin romper los eventos existentes.
    1. En `types.ts`: añadir `Player.eventFlags: Record<string, number>`; ampliar `EventOutcome.effects` con
       `chainTo?`, `setFlags?`, `grantSkillById?`, `curse?`, `removeRandomItem?`; añadir `requiresFlags?`/`excludesFlags?`
       en `GameEvent` y `EventChoice`.
    2. En `EventSystem.ts` (puro): resolver cadenas (`chainTo`), aplicar/leer flags, gating por flags, y los efectos nuevos.
    3. Cablear en `Event.tsx` + `useActivityHandlers.ts` para que una cadena (`chainTo`) abra el siguiente evento de verdad
       y los flags persistan en el run (alcanzable, sin dead code).
    4. Ampliar `EventSystem.test.ts` cubriendo cadenas, flags y efectos nuevos.
    Fuera de alcance (YAGNI): reclutar aliados (no existe sistema de aliados).
- entryPoints:
    - src/game/types.ts
    - src/game/systems/EventSystem.ts
    - src/scenes/activities/Event.tsx
    - src/hooks/useActivityHandlers.ts
    - src/game/systems/__tests__/EventSystem.test.ts

---

## T-009 · Skill local event-creator + section 'events'
- id: T-009
- section: architecture
- status: passed
- initialScore: 50
- targetScore: 90
- lensFocus: [ARQUITECTURA]
- description: >
    Crear la skill local `.agents/skills/event-creator/SKILL.md` (el maker se apoya en la skill `skill-creator`)
    que documente el modelo de eventos ya extendido en T-008: estructura `GameEvent`/`EventChoice`/`EventOutcome`,
    reglas de oro (pesos que suman 100 por choice, `riskLevel` coherente con la varianza, `logType`/`logMessage`,
    requisitos/costos, `chainTo` para cadenas, `setFlags`/`requiresFlags` para persistencia, efectos nuevos),
    plantillas y ejemplos. La `section: events` y su mapeo (events→event-creator) ya están en el schema de este archivo.
- entryPoints:
    - .agents/skills/event-creator/SKILL.md
    - loop/LOOP-TOPICS.md

---

## T-010 · Contenido de Eventos: relleno de arcos + cadenas
- id: T-010
- section: events
- status: passed
- initialScore: 45
- targetScore: 85
- lensFocus: [SISTEMA]
- description: >
    Escribir eventos nuevos guiado por la skill `event-creator`, usando el motor de T-008.
    1. Rellenar arcos pobres, en especial el de guerra (hoy 2 eventos) hasta una cantidad pareja con los demás.
    2. Añadir al menos 2 eventos encadenados multi-escena reales (`chainTo`) que usen flags para ramificar.
    3. Añadir al menos 1 evento con consecuencia persistente que se note en un evento posterior (`requiresFlags`).
    4. Usar los efectos nuevos (`grantSkillById`, `curse`, `removeRandomItem`) donde aporten trade-off legible.
    Registrar los nuevos arrays en `ALL_EVENTS` (`src/game/constants/index.ts`).
- entryPoints:
    - src/game/constants/events/warArcEvents.ts
    - src/game/constants/events/academyArcEvents.ts
    - src/game/constants/events/genericEvents.ts
    - src/game/constants/index.ts

---

## T-011 · Presentación de la escena Event
- id: T-011
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 85
- lensFocus: [PRESENTACION]
- description: >
    Pulir la escena de eventos sobre el motor ya funcional de T-008.
    1. Transición clara entre escenas encadenadas (que se entienda que la historia continúa, no un evento suelto).
    2. Feedback de outcome más legible (qué cambió: stats/HP/chakra/ryo/intel/flags) con floating text/tooltips.
    3. Estilo coherente con el chasis PIXEL-ARCADE (T-001): paneles blocky, sombras duras, jerarquía visual.
    4. Indicador opcional de elecciones/flags relevantes cuando un choice está gated.
    Entregar mockup ASCII-box (estilo CLAUDE.md) antes de implementar.
- entryPoints:
    - src/scenes/activities/Event.tsx
    - src/components/events/EventChoicePanel.tsx
    - src/scenes/activities/Event.css

---

## T-016 · Limpieza de campos muertos del motor de eventos
- id: T-016
- section: architecture
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [ARQUITECTURA, SISTEMA]
- origen: discrepancias destapadas al documentar el motor en T-009 (ver `.agents/skills/event-creator/SKILL.md`, Notas de discrepancia).
- orden: ANTES de T-012 — sus decisiones (rarity pondera o no; clanBonus sesga o no) cambian la matemática que T-012 balancea.
- description: >
    Poner honesto el tipo de eventos: 4 campos declarados pero hoy inertes (dead code / no-ops). Para CADA uno
    decidir IMPLEMENTAR el comportamiento previsto o RETIRAR el campo (lo que deje el sistema más limpio), sin
    romper eventos ni tests existentes; actualizar la skill `event-creator` y sus tests en consecuencia.
    1. `EventOutcome.effects.items` y `effects.skills`: declarados en `types.ts` pero `applyOutcomeEffects` NO los
       aplica (solo colorean el preview). Decisión: aplicarlos de verdad (otorgar ítems/skills, con tests) o
       retirarlos dejando `grantSkillById` como única vía viva.
    2. `GameEvent.rarity`: no pondera la selección (uniforme en `LocationSystem`). Decisión: ponderar por rareza o
       retirar el campo.
    3. `clanBonus` (`{ clan, weightMultiplier }`): hoy no-op — `rollOutcome` escala TODOS los pesos por el mismo
       factor y renormaliza a 100. Decisión: sesgar de verdad (multiplicar solo el/los outcome(s) del clan, no
       todos) o retirar el campo.
    Actualizar `.agents/skills/event-creator/SKILL.md` (tablas + Notas de discrepancia) para reflejar el resultado.
- entryPoints:
    - src/game/types.ts
    - src/game/systems/EventSystem.ts
    - src/game/systems/LocationSystem.ts
    - src/game/systems/__tests__/EventSystem.test.ts
    - .agents/skills/event-creator/SKILL.md

---

## T-012 · Balance de Eventos
- id: T-012
- section: balance
- status: passed
- initialScore: 50
- targetScore: 85
- lensFocus: [BALANCE]
- orden: DESPUÉS de T-016 (sus decisiones sobre rarity/clanBonus definen la matemática a balancear).
- description: >
    Rebalancear los eventos sobre el contenido real de T-010 y el motor ya saneado por T-016.
    1. Revisar pesos de outcomes por riskLevel: que el riesgo alto pague de verdad y el bajo sea sólido pero modesto.
    2. Ajustar costos (ryo) y recompensas (exp/ryo/intel/stats) a la curva de progresión por arco/danger.
    3. Balancear las CADENAS de T-010 como unidad: la recompensa acumulada de una cadena completa (multi-escena,
       con flags) debe compararse contra eventos sueltos, no cada eslabón por separado.
    4. Revisar frecuencia de aparición de salas de evento y peso de `triggerCombat` para no romper el ritmo (TTK/win rate del VISION).
    5. Sin outcomes "trampa" sin contrajugada (agencia del jugador).
- entryPoints:
    - src/game/constants/events/
    - src/game/systems/EventSystem.ts
    - src/game/constants/index.ts

---

## T-014 · Overhaul Cinemático de la Pantalla de Combate
- id: T-014
- section: presentation
- status: passed
- initialScore: 35
- targetScore: 85
- lensFocus: [PRESENTACION]
- origen: brainstorming docs/superpowers/specs/2026-06-30-combat-screen-overhaul-design.md
- orden: ANTES de T-013 — este topic arregla la ESTRUCTURA (y el bug crítico del PlayerHUD fuera de pantalla); T-013 rellena después el stage con las láminas. Montar parallax sobre el layout roto sería retrabajo.
- description: >
    Rehacer el LAYOUT de la escena de combate a un formato cinemático legible y completo, con licencia de diseño.
    El maker usa la skill `frontend-design` (NO `combat-ui-pattern-a`: se descarta el split-panel simétrico).
    Deslinde: este topic hace la estructura/arreglo de toda la escena; T-013 (después) rellena el stage con
    las láminas parallax + filtro CRT.
    1. Grid raíz `grid-template-rows: 1fr auto; height:100dvh`: stage cinemático (1fr) + deck anclado abajo (auto), sin huecos.
    2. Stage: enemigo entero y centrado (sin recorte raro), listo para recibir las láminas de T-013; lower-third con scrim para el
       nombre (con `clamp()`), HP a ancho completo, tags y defensa; buffs del enemigo overlay top-right.
    3. Deck en orden HUD → econ (AP/postura/hints) → mano → controles; el `PlayerHUD` SIEMPRE visible (hoy queda fuera de pantalla).
    4. Mejorar contraste/legibilidad de cartas (incl. estado sin recursos) y feedback (floating text anclado a stage/HUD).
    5. Preservar TODAS las features de T-004 (mano, AP, posturas, atajos, auto-combat, floating text). Responsive: mobile compacta el stage.
    Entregar mockup ASCII-box (estilo CLAUDE.md) antes de implementar.
- entryPoints:
    - src/scenes/combat/Combat.tsx
    - src/scenes/combat/Combat.css
    - src/components/layout/CinematicViewscreen.tsx
    - src/components/character/PlayerHUD.tsx
    - src/components/combat/SkillCard.css

---

## T-013 · Escena de combate por capas (parallax + filtro CRT)
- id: T-013
- section: combat
- status: passed
- initialScore: 40
- targetScore: 85
- lensFocus: [PRESENTACION, ARQUITECTURA, SISTEMA]
- origen: separado de T-005 parte 3 (es feature de escena, no asset-gen puro)
- orden: DESPUÉS de T-014 — las láminas se montan DENTRO del stage nuevo (grid stage/deck), no del layout viejo.
- description: >
    Convertir el stage de combate de una sola imagen (`enemy.image`) a la escena por
    capas que describe la skill `.agents/skills/combat-art` (ver `references/css-implementation.css`):
    1. Cablear el render de 3 láminas con z-index — Fondo (lejano, opaco), Plano Medio (enmarcado),
       Primer Plano (oclusión) — más la capa de sprites del enemigo y un overlay CRT/scanlines + curvatura.
    2. Re-cortar los 6 retratos de enemigos (hoy opacos, generados en T-005) a SPRITES TRANSPARENTES
       para componer sobre las láminas (croma/alfa vía /generar-asset).
    3. Generar los fondos de lámina por arco/bioma (Land of Waves, Forest of Death, etc.) y opcionalmente
       auras de chakra por CSS (`drop-shadow` + `image-rendering: pixelated`) según la guía.
    Mantener un fallback limpio (si falta una lámina, no romper la escena actual).
- entryPoints:
    - src/components/layout/CinematicViewscreen.tsx
    - src/scenes/combat/Combat.tsx
    - .agents/skills/combat-art/references/css-implementation.css

---

## T-015 · Simulador Multi-Locación con Itemización
- id: T-015
- section: balance
- status: passed
- initialScore: 40
- targetScore: 85
- lensFocus: [BALANCE, ARQUITECTURA]
- origen: brainstorming docs/superpowers/specs/2026-07-01-multi-location-itemization-sim-design.md
- description: >
    Extender el simulador de desgaste para medir runs de VARIAS locaciones con ITEMIZACIÓN (profundidad media).
    1. Run multi-locación: encadenar N locaciones con dangerLevel creciente, carry-over de HP/chakra/ryo/equipment/componentBag/XP.
       Leveling fiel reusando el cálculo real de XP/ryo (RegionSystem) y level-up (StatSystem); reusar el generador y la
       navegación reales como el LocationSimulator actual.
    2. Itemización: combates/treasure sueltan loot (LootSystem real). IA heurística determinista que equipa el item si sube el
       score de build (por equipmentFocus) y vende/descarta el resto; merchant compra upgrades asequibles con ryo. Recalcular
       stats con getPlayerFullStats + EquipmentPassiveSystem antes de cada combate.
    3. Reporte: clear rate por profundidad de locación, curva de poder (stats del jugador vs escalado), y COMPARATIVA con/sin
       itemización sobre el mismo seed para aislar el aporte del gear. Economía de ryo.
    4. CLI: modo nuevo (p. ej. `--campaign` o `--location --locations <n> --items on|off`) + ayuda + script npm.
    Síntesis (componentes→artefactos) es stretch opcional, no requerida para el gate. Todo determinista por seed; no tocar la
    matemática de combate congelada.
- entryPoints:
    - src/simulation/LocationSimulator.ts
    - src/simulation/BattleSimulator.ts
    - src/simulation/index.ts
    - src/game/systems/LootSystem.ts
    - src/game/systems/StatSystem.ts
    - src/game/systems/RegionSystem.ts

---

## T-017 · Pixel-Arcade: pantallas de economía/recompensa
- id: T-017
- section: presentation
- status: passed
- initialScore: 45
- targetScore: 85
- lensFocus: [PRESENTACION]
- origen: brainstorming docs/superpowers/specs/2026-07-02-pixel-arcade-remaining-screens-design.md
- description: >
    Migrar al estilo PIXEL-ARCADE (skill local `pixel-arcade` + `frontend-design`, tokens del design-system) las pantallas
    de mayor tráfico/economía, replicando el chasis de T-001 (botones/paneles blocky, sombras duras sin blur, Silkscreen/VT323).
    Pantallas: Merchant (tienda), Loot, TreasureChoice, TreasureHuntReward, ScrollDiscovery, EliteChallenge, y el RewardModal.
    Solo chasis de UI; mantener intactos sprites/ilustraciones. Sin valores hardcodeados; retirar estilos viejos reemplazados.
    Entregar mockup ASCII-box antes de implementar.
- entryPoints:
    - src/scenes/activities/Merchant.tsx
    - src/scenes/rewards/Loot.tsx
    - src/scenes/rewards/TreasureChoice.tsx
    - src/scenes/rewards/TreasureHuntReward.tsx
    - src/scenes/rewards/ScrollDiscovery.tsx
    - src/scenes/combat/EliteChallenge.tsx
    - src/components/modals/RewardModal.tsx

---

## T-018 · Pixel-Arcade: pantallas secundarias
- id: T-018
- section: presentation
- status: passed
- initialScore: 50
- targetScore: 85
- lensFocus: [PRESENTACION]
- origen: brainstorming docs/superpowers/specs/2026-07-02-pixel-arcade-remaining-screens-design.md
- replan: 2026-07-05 por el humano tras T-017 — la integración de ESCENA va desde el arranque, no como parche.
- description: >
    Cerrar la migración PIXEL-ARCADE en las pantallas secundarias aplicando de una vez las DOS capas que T-017
    aprendió por las malas: (a) chasis pixel-arcade (botones/paneles blocky, sombras duras sin blur, Silkscreen/VT323,
    tokens sin hardcodeados, sin dead code, arte intacto) Y (b) INTEGRACIÓN EN EL MUNDO vía `SceneBackdrop`
    (components/layout, creado en T-017: bioma + scrim + viñeta + scanlines con fallback) — nada de paneles
    flotando en un vacío negro.
    1. Training: escena sobre el bioma; el dojo/entrenamiento con presencia (header con identidad, como el NPC
       del Merchant o el VICTORY del Loot); cards de stat con el patrón 2px+sombra dura.
    2. GameOver: ya tiene identidad DEATH fuerte — auditar y elevar (¿bioma donde caíste de fondo, muy oscurecido?);
       stats del run legibles; chasis blocky.
    3. GameGuide: legibilidad primero (es texto largo): panel de lectura pixel-arcade con navegación clara;
       SceneBackdrop opcional si no ensucia la lectura.
    4. EventResultModal y DiceRollResultModal: coherencia con los tokens `--ev-*`/patrón modal de T-011/T-017
       (backdrop que transparenta la escena, no negro pleno).
    5. MainMenu y CharacterSelect: auditar contra el chasis — si ya cumplen (T-001), solo retoques; si flotan
       en void, integrarlas también.
    Entregar por implementación directa (patrón probado; sin fase de mockup) con screenshots del LEAD al final.
- entryPoints:
    - src/scenes/activities/Training.tsx
    - src/scenes/menu/GameGuide.tsx
    - src/scenes/menu/GameOver.tsx
    - src/components/modals/EventResultModal.tsx
    - src/components/modals/DiceRollResultModal.tsx

---

## T-019 · Registry de arte + iconografía del juego
- id: T-019
- section: presentation
- status: passed
- initialScore: 35
- targetScore: 85
- lensFocus: [PRESENTACION, ARQUITECTURA]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA A)
- description: >
    Fundación del arte del juego. 1) Crear un REGISTRY central de arte (clave→asset, tipado, con fallback
    emoji limpio y en cascada; ubicación sugerida `src/game/constants/artRegistry.ts`) que TODOS los
    consumidores usen — hoy cada uno improvisa (`item.icon || '?'`, `icon.asset` apunta a
    `/assets/icons/locations/` que NO existe). 2) Generar con /generar-asset (estilo
    combat-art, pixel-art 16-bit) la iconografía: iconos de items/componentes/artefactos (adiós emoji),
    iconos de location (crear la carpeta referenciada), iconos de las 8 actividades de sala
    (combat/eliteChallenge/merchant/event/scrollDiscovery/rest/training/treasure) y avatares de los 5 clanes.
    3) Auditoría final: lista de toda clave sin arte, como backlog vivo para T-020/T-021.
- entryPoints:
    - src/game/constants/index.ts
    - src/game/systems/LootSystem.ts
    - src/game/constants/regions/landOfWaves.ts
    - src/components/inventory/Bag.tsx
    - src/components/character/PlayerHUD.tsx

---

## T-020 · Arte de skills (catálogo completo)
- id: T-020
- section: presentation
- status: passed
- initialScore: 40
- targetScore: 85
- lensFocus: [PRESENTACION]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA A)
- description: >
    Generar arte para las ~106 skills sin asset (de 114 en `skills.ts`) con /generar-asset siguiendo
    combat-art (pixel-art 16-bit, colores saturados tipo Neo Geo). Trabajar por lotes por categoría
    (taijutsu / ninjutsu elemental / genjutsu / herramientas / pasivas) con QA visual por lote.
    Cablear vía el registry de T-019 en SkillCard, Loot, ScrollDiscovery y Training. Ninguna skill
    debe caer a fallback al terminar.
- entryPoints:
    - src/game/constants/skills.ts
    - src/components/combat/SkillCard.tsx
    - src/scenes/rewards/Loot.tsx
    - src/scenes/rewards/ScrollDiscovery.tsx

---

## T-021 · Retratos de enemigos + ilustraciones de eventos
- id: T-021
- section: presentation
- status: passed
- initialScore: 40
- targetScore: 85
- lensFocus: [PRESENTACION]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA A)
- description: >
    1) Retratos para el enemy pool completo de Land of Waves (dock_worker, corrupt_guard, smuggler,
    beach_bandit, …), elites y bosses, más un set de FALLBACKS por arquetipo (TANK/ASSASSIN/BALANCED/
    CASTER/GENJUTSU) para enemigos sin retrato dedicado → el juego deja de depender de GenAI en runtime.
    2) Ilustraciones de eventos: 1 por evento clave + 1 por categoría como fallback (hoy la escena Event
    es solo texto). Cablear vía registry de T-019 con cascada: dedicado → arquetipo/categoría → emoji.
    Estilo combat-art vía /generar-asset.
- entryPoints:
    - src/game/systems/EnemySystem.ts
    - src/game/constants/events/
    - src/scenes/activities/Event.tsx

---

## T-022 · Exploración cinemática: overlays de mochila y ficha
- id: T-022
- section: presentation
- status: passed
- initialScore: 40
- targetScore: 85
- lensFocus: [PRESENTACION, ARQUITECTURA]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA B)
- description: >
    Despejar la pantalla de exploración: retirar los sidebars permanentes (LeftSidebarPanel: location+stats;
    RightSidebarPanel: equipo+bag+síntesis) y dejar la escena full-bleed cinemática con el arte protagonista.
    1) HUD mínimo persistente: nombre/Lv, HP/CP compactos, ryo, botones 🎒 y 📜.
    2) Overlay MOCHILA (atajo I): equipo + bag + síntesis drag&drop sobre la escena (conservar dnd-kit,
       reusar Bag/EquipmentPanel).
    3) Overlay FICHA (atajo C): stats primarios + derivados + buffs (reusar PrimaryStatsPanel/DerivedStatsPanel).
    4) ESC cierra; estilo pixel-arcade; sin dead code (retirar el layout viejo de sidebars en exploración).
    El maker usa frontend-design; mockup ASCII-box antes de implementar.
- entryPoints:
    - src/components/layout/LeftSidebarPanel.tsx
    - src/components/layout/RightSidebarPanel.tsx
    - src/App.tsx
    - src/components/inventory/Bag.tsx
    - src/components/character/PrimaryStatsPanel.tsx

---

## T-023 · Esqueleto de campaña + interludio entre regiones
- id: T-023
- section: exploration
- status: passed
- initialScore: 30
- targetScore: 85
- lensFocus: [SISTEMA, ARQUITECTURA, PRESENTACION]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA C)
- description: >
    El arco macro del run: hoy solo se genera LAND_OF_WAVES_CONFIG y vencer al boss no lleva a nada.
    1) `REGION_ORDER`: registro de las 4 regiones de la campaña con baseDifficulty creciente.
    2) Al vencer al boss (isRegionBossDefeated ya existe) → escena INTERLUDIO: cierre narrativo del arco +
       curación total + boon a elegir 1-de-3 (stat permanente / item / skill) + resumen del run → generar
       la siguiente región de REGION_ORDER.
    3) Tras la región 4: PANTALLA DE VICTORIA con stats del run. Debe funcionar desde el día 1 con solo
       Waves (Waves → victoria provisional) para no depender de T-024..T-026.
- entryPoints:
    - src/App.tsx
    - src/game/systems/RegionSystem.ts
    - src/game/constants/regions/landOfWaves.ts
    - src/game/types.ts

---

## T-024 · Región 2: Chunin Exams (Forest of Death)
- id: T-024
- section: exploration
- status: passed
- initialScore: 30
- targetScore: 85
- lensFocus: [SISTEMA, PRESENTACION, BALANCE]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA C)
- description: >
    Segunda región curada de la campaña, patrón `landOfWaves.ts` con paridad de tamaño: ~13 locations
    (10 principales + 3 secretas), curva de danger Entry(1-2)→Boss(7), enemy pools del arco EXAMS, eventos
    atados, boss temático. Incluye SU PROPIA ola de assets (fondos de location, iconos, retratos de
    enemigos — patrón T-007/T-021, vía /generar-asset). Registrarla en REGION_ORDER (T-023). Validar curva
    con el simulador multi-locación.
- entryPoints:
    - src/game/constants/regions/chuninExams.ts
    - src/game/constants/regions/landOfWaves.ts
    - src/game/systems/RegionSystem.ts
    - src/game/systems/EnemySystem.ts

---

## T-025 · Región 3: Sasuke Retrieval (Valley of the End)
- id: T-025
- section: exploration
- status: passed
- initialScore: 30
- targetScore: 85
- lensFocus: [SISTEMA, PRESENTACION, BALANCE]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA C)
- description: >
    Tercera región curada, mismos criterios que T-024 (patrón landOfWaves, ~13 locations, curva de danger,
    enemy pools del arco ROGUE, eventos atados, boss temático, ola propia de assets, registro en
    REGION_ORDER, validación con simulador). Bioma: Valley of the End.
- entryPoints:
    - src/game/constants/regions/sasukeRetrieval.ts
    - src/game/constants/regions/landOfWaves.ts
    - src/game/systems/RegionSystem.ts
    - src/game/systems/EnemySystem.ts

---

## T-026 · Región 4: Great Ninja War (Divine Tree Roots)
- id: T-026
- section: exploration
- status: passed
- initialScore: 30
- targetScore: 85
- lensFocus: [SISTEMA, PRESENTACION, BALANCE]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA C)
- description: >
    Cuarta y última región de la campaña, mismos criterios que T-024/T-025 (patrón landOfWaves, ~13
    locations, enemy pools del arco WAR, eventos atados, ola propia de assets, REGION_ORDER, simulador).
    Bioma: Divine Tree Roots. Su boss es el FINAL de la campaña: al vencerlo dispara la pantalla de
    victoria de T-023 (ya no provisional).
- entryPoints:
    - src/game/constants/regions/greatNinjaWar.ts
    - src/game/constants/regions/landOfWaves.ts
    - src/game/systems/RegionSystem.ts
    - src/game/systems/EnemySystem.ts

---

## T-027 · Ascenso infinito (modo torre)
- id: T-027
- section: exploration
- status: passed
- initialScore: 30
- targetScore: 85
- lensFocus: [SISTEMA, BALANCE, ARQUITECTURA]
- origen: brainstorming docs/superpowers/specs/2026-07-02-roadmap-assets-ui-macro-arc-design.md (OLA C)
- description: >
    El modo que da nombre al juego. Al ganar la campaña (T-023..T-026) se desbloquea el ASCENSO INFINITO:
    generador procedural de regiones que cicla los 4 arcos con baseDifficulty creciente sin tope, reusando
    las piezas curadas (location configs, enemy pools, biomas) recombinadas. El run acaba solo al morir;
    SCORE = altura alcanzada (regiones superadas), mostrado en GameOver. Lente BALANCE fuerte: curva de
    escalado validada con el simulador multi-locación (T-015).
    Nota: aún NO existe sistema de guardado — persistir el unlock del modo como 1 flag mínimo en
    localStorage es aceptable (excepción puntual); la persistencia completa llega en una ola posterior.
- entryPoints:
    - src/game/systems/RegionSystem.ts
    - src/game/systems/ScalingSystem.ts
    - src/scenes/menu/GameOver.tsx
    - src/simulation/LocationSimulator.ts

---

## T-028 · Todo el arte del juego con /imagine (CERO SVG)
- id: T-028
- section: presentation
- status: passed
- initialScore: 35
- targetScore: 90
- lensFocus: [PRESENTACION, ARQUITECTURA]
- origen: decisión humana — "nada SVG, todo con /imagine". Anula el enfoque de tiles SVG de T-019..T-024.
- orden: puede partirse en sub-lotes (T-028·A..E) pero el **definition of done** es global: 0 .svg servidos al juego.
- description: >
    **REGLA DE ORO: NADA DE SVG para arte del juego.** Todo asset visual jugable se genera con **Imagine**
    (`image_gen` / `image_edit`; dirección `combat-art` + `game-asset-core` / `game-ui-icons` / `game-character-consistency`).
    Prohibido como arte final: SVG, emoji-en-SVG, generadores `scripts/generate-*-icons.mjs` que emitan .svg,
    hotlinks externos. El emoji del registry queda SOLO como fallback onError de PNG, no como asset principal.
    ## Definition of done
    1) Cero archivos `.svg` bajo `public/assets/` referenciados por el registry (borrar o dejar de servir).
    2) Todas las claves de `ART_REGISTRY` / manifests tienen `src` → **PNG Imagine** (path `/assets/.../*.png`).
    3) `npx tsc`, `npm test`, `npm run build`; smoke: SkillCard, Bag, Location cards, Event art, enemy portraits
       cargan PNG sin 404.
    4) Documentar prompts en `loop/logs/T-028-prompts.md` (lote, prompt, path salida).
    ## Pipeline (cada lote del loop)
    - Generar con Imagine (pixel/16-bit Neo Geo: outlines 1–2px, cel-shading, saturado; transparencia en iconos).
    - Guardar PNG en `public/assets/icons/{components|artifacts|locations|activities|clans|skills|enemies|events}/`
      o `public/assets/enemy_*.png` / `skill_*.png` según convención existente.
    - Actualizar manifests + `artRegistry` a `.png` únicamente (sin dual svg|png).
    - Eliminar el `.svg` sustituido.
    ## Lotes obligatorios (cubrir TODO, no solo “priority polish”)
    A. Clans (5) + activities (9) + components (9)
    B. Artifacts (todas las del synthesis matrix)
    C. Skills (114 − las que ya tengan PNG pintado válido; re-generar o conservar PNG reales, nunca SVG)
    D. Locations: Land of Waves (13) + Chunin Exams (13) y futuras regiones al nacer
    E. Enemies: archetypes, jobs, bosses, pool ids Waves+Exams
    F. Events: todos los event ids + category fallbacks
    ## Anti-patrones
    - Dejar “temporalmente” un SVG “mientras tanto”.
    - Scripts que regeneren SVG.
    - Art “placeholder” que no sea PNG Imagine.
    Fuera de alcance de este topic: mecánicas de juego, regiones nuevas (solo su arte cuando existan).
- entryPoints:
    - src/game/constants/artRegistry.ts
    - src/game/constants/skillArtManifest.ts
    - src/game/constants/enemyArtManifest.ts
    - src/game/constants/eventArtManifest.ts
    - public/assets/
    - public/assets/icons/
    - .agents/skills/combat-art/SKILL.md
    - scripts/generate-skill-icons.mjs
    - scripts/generate-enemy-event-art.mjs
    - scripts/generate-exams-location-icons.mjs
    - scripts/generate-icon-set.mjs

---

## T-029 · Combate sin fallback SVG + cascade de arte
- id: T-029
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, ARQUITECTURA]
- origen: discovery post T-028 — Combat.tsx cae a archetype_*.svg (borrados); SkillCard oculta img en error sin emoji.
- description: >
    Tras T-028 (CERO SVG), el stage de combate aún usa un fallback hardcodeado a
    `/assets/icons/enemies/archetype_*.svg` cuando `enemy.image` falta — 404 y escena rota.
    SkillCard usa registry jpg pero `onError` solo hide del img (carta vacía).
    ## DoD
    1) Combat.tsx resuelve retrato con `getEnemyArt` / `resolveEnemyImageSrc` (jpg Imagine); cero paths `.svg`.
    2) Grep `src/**/*.{ts,tsx}` no contiene referencias a assets de juego `.svg` (salvo comentarios).
    3) SkillCard: si falla la imagen, muestra emoji del art registry (cascade src→emoji) sin tarjeta en blanco.
    4) `npx tsc`, `npm test`, `npm run build`.
    Fuera de alcance: secrets discovery, clan traits, synthesis modal, RewardModal loot preview.
- entryPoints:
    - src/scenes/combat/Combat.tsx
    - src/components/combat/SkillCard.tsx
    - src/game/constants/artRegistry.ts
    - src/components/shared/ArtIcon.tsx

---

## T-030 · Secret locations se descubren de verdad
- id: T-030
- section: exploration
- status: passed
- initialScore: 40
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery — secrets con weight 0 forever; unlockCondition / discoveredSecretIds nunca se escriben.
- description: >
    Las locations secretas (isSecret + unlockCondition) nunca pasan isDiscovered=true,
    así que drawLocationCards las deja en weight 0 y el jugador nunca las ve en el mapa.
    ## DoD
    1) API pura en RegionSystem: descubrir secretos desde eventFlags (requirement string)
       y desde paths SECRET al completar una location origen.
    2) Al volver al region map / dibujar cartas, region se sincroniza con player.eventFlags.
    3) Al completar una location con secretPaths, se marcan targets secretos como discovered.
    4) ≥1 evento Waves escribe un setFlags que desbloquea un secreto (narrativa).
    5) Tests unitarios: flags → weight > 0; complete location con secret path → discovered.
    6) tsc + test + build.
    Fuera de alcance: nuevo UI de “?” en mapa, rebalance de loot secret, más regiones de contenido.
- entryPoints:
    - src/game/systems/RegionSystem.ts
    - src/hooks/useLocationCards.ts
    - src/hooks/useActivityHandlers.ts
    - src/game/constants/events/wavesArcEvents.ts
    - src/game/systems/__tests__/RegionSystem.test.ts

---

## T-031 · Clan trait artifacts afectan combate de verdad
- id: T-031
- section: combat
- status: passed
- initialScore: 45
- targetScore: 90
- lensFocus: [SISTEMA, BALANCE]
- origen: discovery CONNECT — getClanTraitPassives existe y 0 callers; craft fantasy is fluff.
- description: >
    Artefactos Sharingan Implant / Byakugan Awakening / Shadow Mastery / Uzumaki Vitality
    solo dan bonusStats. getClanTraitPassives lista traits pero no se usa en el pipeline de daño.
    ## DoD
    1) getClanTraitCombatModifiers (puro) con efectos por trait:
       UCHIHA +crit chance/damage; HYUGA drain chakra on hit; NARA reduce enemy speed/evasion;
       UZUMAKI heal % max HP at combat start (on top of stats).
    2) Cableado en PlayerTurnSystem + CombatSimulationService (daño/hit).
    3) processPassivesOnCombatStart logs + UZUMAKI heal; processPassivesOnHit HYUGA drain.
    4) Tests unitarios por trait + equip path.
    5) tsc, test, build.
    Fuera de alcance: synthesis UI reveal, nuevos recipes, balance global re-sim.
- entryPoints:
    - src/game/systems/EquipmentPassiveSystem.ts
    - src/game/systems/PlayerTurnSystem.ts
    - src/game/systems/CombatSimulationService.ts
    - src/game/systems/__tests__/EquipmentPassiveSystem.test.ts
    - src/game/constants/synthesis.ts

---

## T-032 · Synthesis craft reveal (arte + equip)
- id: T-032
- section: presentation
- status: passed
- initialScore: 50
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — craft TFT solo escribe log; el momento “lo forjaste” muere.
- description: >
    Tras sintetizar, el jugador solo ve un log line. Falta revelar el artefacto (Imagine art),
    coste, passive blurb y CTA Equip si hay slot libre.
    ## DoD
    1) handleSynthesize devuelve el Item creado (o null) en éxito.
    2) Bag muestra panel bag__craft-result: ArtIcon, nombre, rarity, passive/description, cost paid.
    3) Botones: Equip (si onEquipFromBag) y Dismiss.
    4) Fallos siguen solo en log (sin panel falso).
    5) tsc, test, build.
    Fuera de alcance: nueva escena modal global, drag-drop craft, balance de costes.
- entryPoints:
    - src/hooks/useInventoryHandlers.ts
    - src/components/inventory/Bag.tsx
    - src/components/inventory/inventory.css
    - src/components/layout/RightSidebarPanel.tsx
    - src/game/constants/artRegistry.ts

---

## T-033 · Location tiedStoryEvents alimentan el event pool
- id: T-033
- section: exploration
- status: passed
- initialScore: 45
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — tiedStoryEvents en region data nunca se usan al generar rooms.
- description: >
    Locations declaran tiedStoryEvents (p.ej. forest_death_trap, rival_team_encounter) pero
    generateEventActivity solo filtra por arco + flags. Los lugares se sienten genéricos.
    ## DoD
    1) FloorGenerationConfig + BranchingFloor llevan preferredEventIds (desde location.tiedStoryEvents).
    2) generateEventActivity prioriza eventos preferidos elegibles; si ninguno, pool de arco.
    3) locationToBranchingFloor pasa tiedStoryEvents; children generation los reutiliza.
    4) Test: preferred id eligible → always that event when only one preferred; gated flag blocks it.
    5) tsc, test, build.
    Fuera de alcance: reescribir todos los atmosphereEvents, UI de “story hook”, nuevos eventos.
- entryPoints:
    - src/game/systems/LocationSystem.ts
    - src/game/systems/RegionSystem.ts
    - src/game/systems/EventSystem.ts
    - src/game/types.ts
    - src/game/systems/__tests__/LocationSystem.test.ts
    - src/game/constants/regions/

---

## T-034 · Event flags dan poder real (daño + ryo)
- id: T-034
- section: combat
- status: passed
- initialScore: 48
- targetScore: 90
- lensFocus: [SISTEMA, BALANCE]
- origen: discovery CONNECT — eventFlags solo gatean historia; no afectan combate/loot.
- description: >
    Las elecciones de eventos escriben flags (envoy_freed, subject_harvested, sunken_ship_discovered…)
    pero el run no cambia mecánicamente. El jugador no siente consecuencias de poder.
    ## DoD
    1) API pura getEventFlagRunModifiers(player): damageBonus + ryoMultiplier desde flags existentes.
    2) Flags cableadas (mínimo):
       - envoy_freed → +10% ryo
       - envoy_debt_settled → +5% damage
       - subject_harvested → +8% damage
       - subject_freed → +5% ryo
       - sunken_ship_discovered | hidden_cove_discovered → +5% ryo
    3) damageBonus sumado en PlayerTurnSystem + CombatSimulationService.
    4) ryoMultiplier en recompensa de combate (useCombatVictory).
    5) Tests unitarios de modifiers; tsc/test/build.
    Fuera de alcance: nuevos eventos, UI de “buffs activos”, enemy HP scaling.
- entryPoints:
    - src/game/systems/EventSystem.ts
    - src/game/systems/PlayerTurnSystem.ts
    - src/game/systems/CombatSimulationService.ts
    - src/hooks/useCombatVictory.ts
    - src/game/systems/__tests__/EventSystem.test.ts

---

## T-035 · RewardModal preview de loot (CONNECT victoria→drops)
- id: T-035
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — victoria solo muestra XP/Ryo; drops ya existen pero el modal los ignora.
- description: >
    Tras ganar, RewardModal solo muestra XP/Ryo/level-up. Los componentes y artefactos
    se revelan en LOOT después, así la recompensa se siente vacía.
    ## DoD
    1) combatReward incluye lootPreviews (items).
    2) RewardModal lista previews con ArtIcon + rarity + name.
    3) Footer "Claim Loot" si hay drops, si no "Continue".
    4) Flujo LOOT / returnToMap sin cambios de balance.
    5) tsc, test, build.
    Fuera de alcance: rediseño total del modal, animaciones pesadas.
- entryPoints:
    - src/components/modals/RewardModal.tsx
    - src/components/modals/RewardModal.css
    - src/hooks/useCombatVictory.ts
    - src/App.tsx

---

## T-036 · EliteChallenge con arte Imagine (enemigo + premio)
- id: T-036
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION]
- origen: discovery CONNECT — elite peak moment usa emoji/Shield; registry Imagine no aparece.
- description: >
    La pantalla de elite challenge no muestra retrato del guardian ni tile del artefacto
    (solo emoji artifact.icon). Tras T-028 el arte existe en registry.
    ## DoD
    1) Enemy panel: ArtIcon/getEnemyArt (image o archetype jpg).
    2) Artifact prize: resolveItemArt + ArtIcon (no solo emoji).
    3) CSS para portrait/tile legibles estilo pixel-arcade.
    4) tsc, test, build.
    Fuera de alcance: rebalance escape chance, nuevas mecánicas elite.
- entryPoints:
    - src/scenes/combat/EliteChallenge.tsx
    - src/scenes/combat/EliteChallenge.css
    - src/game/constants/artRegistry.ts
    - src/components/shared/ArtIcon.tsx

---

## T-037 · HUD muestra buffs de event flags (T-034 visible)
- id: T-037
- section: presentation
- status: passed
- initialScore: 60
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — T-034 da daño/ryo pero el jugador no ve por qué.
- description: >
    getEventFlagRunModifiers aplica daño/ryo, pero no hay feedback en UI de combate.
    Sin chips legibles el trade-off de eventos se siente invisible.
    ## DoD
    1) activeLabels de getEventFlagRunModifiers son strings legibles (no keys crudas).
    2) PlayerHUD muestra chips de run-flags cuando hay mods activos (también compact combat).
    3) CSS chips pixel-arcade, no rompe layout compact.
    4) tsc, test, build.
    Fuera de alcance: tooltip de todas las flags del juego, nueva escena.
- entryPoints:
    - src/game/systems/EventSystem.ts
    - src/components/character/PlayerHUD.tsx
    - src/components/character/character.css
    - src/scenes/combat/Combat.tsx

---

## T-038 · Hand tooltip: arte Imagine + preview de daño real
- id: T-038
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — tooltips de mano sin tile Imagine; preview ignora clan traits y event flags.
- description: >
    Hand tooltips son texto-only y el damage preview no aplica T-031/T-034, así el trade-off
    de cartas no es legible (VISION: decisión con trade-off legible).
    ## DoD
    1) Tooltip header muestra getSkillArt via ArtIcon.
    2) calculateDamage en Hand usa applyClanTraitToDamageContext + getEventFlagRunModifiers.damageBonus.
    3) CSS para icono de tooltip (pixelated).
    4) tsc, test, build.
    Fuera de alcance: reescribir SkillCard tooltips fuera de Hand, nuevas mecánicas.
- entryPoints:
    - src/components/combat/Hand.tsx
    - src/components/combat/Hand.css
    - src/game/constants/artRegistry.ts
    - src/game/systems/EquipmentPassiveSystem.ts
    - src/game/systems/EventSystem.ts


---

## T-039 · Approach define opening posture (mapa completo + UI)
- id: T-039
- section: combat
- status: passed
- initialScore: 56
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — solo Silent Strike → Aggressive; resto abre Balanced sin UI.
- description: >
    La entrada al combate solo mapea Stealth success → Aggressive. Genjutsu/trap/frontal
    no tienen identidad de stance; ApproachSelector no menciona posture.
    ## DoD
    1) Pure openingPostureForApproach(approach, success) en PostureSystem.
    2) useCombat startCombat usa el helper (log de ambush conservado).
    3) ApproachSelector cards + confirm muestran opening stance on success.
    4) Tests del mapa approach→posture.
    5) tsc, test, build.
    Fuera de alcance: nuevas approaches, rebalance firstHit/AP.
- entryPoints:
    - src/game/systems/PostureSystem.ts
    - src/hooks/useCombat.ts
    - src/components/combat/ApproachSelector.tsx
    - src/components/combat/ApproachSelector.css
    - src/game/systems/__tests__/postureSystem.test.ts

---

## T-040 · ExplorationHUD chips de event flags
- id: T-040
- section: presentation
- status: passed
- initialScore: 62
- targetScore: 90
- lensFocus: [PRESENTACION]
- origen: discovery CONNECT — T-037 chips solo en PlayerHUD de combate; explore no muestra poder de historia.
- description: >
    En exploracion el HUD (T-022) no muestra getEventFlagRunModifiers. El jugador ve
    bonos de eventos en combate pero no en mapa/region.
    ## DoD
    1) ExplorationHUD muestra chips legibles cuando activeLabels.length > 0.
    2) Mismos labels que T-037 (getEventFlagRunModifiers).
    3) CSS compacto que no rompa strip (scroll o wrap controlado).
    4) tsc, test, build.
    Fuera de alcance: tooltips detallados, nuevos flags.
- entryPoints:
    - src/components/layout/ExplorationHUD.tsx
    - src/components/layout/ExplorationHUD.css
    - src/game/systems/EventSystem.ts

---

## T-041 · Event choices gated by requiredClan (clan identity)
- id: T-041
- section: events
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — requiredClan engine exists, 0 content uses it.
- description: >
    Clan pick shapes stats/skills but story treats every clan the same.
    requiredClan is already validated in EventSystem and Event.tsx.
    ## DoD
    1) ≥3 choices across ≥2 arcs use requirements.requiredClan with unique rewards/text.
    2) Matching clan can choose; others disabled with clan reason.
    3) No new API — reuse existing requiredClan.
    4) Content test asserts ≥3 requiredClan choices.
    5) tsc, test, build.
    Fuera de alcance: nuevos clans, rebalance global.
- entryPoints:
    - src/game/constants/events/wavesArcEvents.ts
    - src/game/constants/events/examsArcEvents.ts
    - src/game/constants/events/rogueArcEvents.ts
    - src/game/constants/events/__tests__/eventContent.test.ts

---

## T-042 · Character sheet story bonuses + Yamanaka clan choice
- id: T-042
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — sheet sin chips T-034; Yamanaka sin requiredClan post T-041.
- description: >
    CharacterSheetOverlay muestra buffs de combate pero no bonos de eventFlags.
    Ademas Yamanaka no tiene choice exclusiva (Uchiha/Hyuga/Lee/Uzumaki si).
    ## DoD
    1) Character sheet seccion Story Bonuses con activeLabels de getEventFlagRunModifiers.
    2) ≥1 choice requiredClan YAMANAKA en un evento (texto/reward unicos).
    3) CSS legible en overlay.
    4) tsc, test, build.
    Fuera de alcance: reescribir ficha completa, mas clans.
- entryPoints:
    - src/components/layout/CharacterSheetOverlay.tsx
    - src/components/layout/exploreOverlays.css
    - src/game/constants/events/
    - src/game/systems/EventSystem.ts

---

## T-043 · Interlude boons con arte Imagine + story summary
- id: T-043
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — interlude 1-of-3 es texto puro; boons item/skill ya tienen registry art.
- description: >
    Tras boss, el interludio elige boon sin tiles Imagine. Los boons item/skill tienen
    art en registry; stat puede usar icono legible. Tambien falta resumen de story bonuses.
    ## DoD
    1) Boon cards muestran ArtIcon para item (resolveItemArt) y skill (getSkillArt).
    2) Stat boons muestran icono/emoji de stat legible.
    3) Opcional: chips story flags del run si hay activeLabels.
    4) CSS pixel-arcade en cards.
    5) tsc, test, build.
    Fuera de alcance: rebalance boons, nuevos kinds.
- entryPoints:
    - src/scenes/menu/Interlude.tsx
    - src/scenes/menu/Interlude.css
    - src/game/systems/CampaignSystem.ts
    - src/game/constants/artRegistry.ts

---

## T-044 · GameOver + Victory story-run chips
- id: T-044
- section: presentation
- status: passed
- initialScore: 60
- targetScore: 90
- lensFocus: [PRESENTACION]
- origen: discovery CONNECT — end screens sin eventFlags; cadena T-037..043 incompleta.
- description: >
    GameOver y Victory muestran stats numericas pero no story bonuses del run.
    ## DoD
    1) GameOver muestra chips activeLabels cuando hay flags.
    2) Victory muestra los mismos chips.
    3) Source getEventFlagRunModifiers only; pass player/labels from App.
    4) CSS pixel chips.
    5) tsc, test, build.
    Fuera de alcance: atmosphereEvents, rebalance.
- entryPoints:
    - src/scenes/menu/GameOver.tsx
    - src/scenes/menu/GameOver.css
    - src/scenes/menu/Victory.tsx
    - src/scenes/menu/Victory.css
    - src/App.tsx

---

## T-045 · CharacterSelect starting jutsu Imagine chips
- id: T-045
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION]
- origen: discovery CONNECT — clan cards text-only for loadout; getSkillArt exists (T-028/038).
- description: >
    Character select shows signature skill names as plain text. Imagine skill tiles
    already exist for combat/hand/interlude.
    ## DoD
    1) Clan cards show 1-2 signature skill ArtIcon chips (main loadout, skip basic_atk).
    2) Tooltip loadout rows keep names; optional small art next to main skills.
    3) CSS pixel frames; keyboard 1-5 unchanged.
    4) tsc, test, build.
    Fuera de alcance: nuevos clans, balance loadout.
- entryPoints:
    - src/scenes/menu/CharacterSelect.tsx
    - src/scenes/menu/CharacterSelect.css
    - src/game/constants/artRegistry.ts

---

## T-046 · atmosphereEvents flavor al entrar location
- id: T-046
- section: exploration
- status: passed
- initialScore: 50
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — atmosphereEvents se copian a Location pero nunca se leen.
- description: >
    Cada location declara atmosphereEvents (ids flavor snake_case) que no afectan el juego.
    No son event ids reales; usar como ambient flavor sin inventar catalogo de eventos.
    ## DoD
    1) Helper puro humanizeAtmosphereEventId + pickAtmosphereFlavor(location, rng).
    2) Al entrar location (handleEnterSelectedLocation) log de flavor si hay atmosphereEvents.
    3) LocationMap muestra una linea de atmosphere cuando hay selected location.
    4) Test unitario del humanize/pick.
    5) tsc, test, build.
    Fuera de alcance: mapear ids a GameEvent reales, nuevos events.
- entryPoints:
    - src/game/systems/RegionSystem.ts
    - src/hooks/useLocationCards.ts
    - src/components/exploration/LocationMap.tsx
    - src/game/systems/__tests__/RegionSystem.test.ts

---

## T-047 · RegionMap preview muestra location.description
- id: T-047
- section: exploration
- status: passed
- initialScore: 52
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — description autorada en cada location, UI de seleccion no la lee.
- description: >
    Tras T-046 atmosphere entra al log/mapa interno; en RegionMap al elegir card solo
    aparece Ready to explore {name}. location.description queda muerta.
    ## DoD
    1) CardDisplayInfo.description: null en NONE; texto en PARTIAL/FULL.
    2) RegionMap selected preview muestra description (+ atmosphere humanize en FULL opcional).
    3) No leak en mystery cards.
    4) Test intel gate; tsc test build.
    Fuera de alcance: reescribir descriptions, spawn/loot.
- entryPoints:
    - src/game/types.ts
    - src/game/systems/RegionSystem.ts
    - src/components/exploration/RegionMap.tsx
    - src/components/exploration/exploration.css
    - src/game/systems/__tests__/RegionSystem.test.ts

---

## T-048 · Training result panel (payoff before leave)
- id: T-048
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — train aplica y sale al mapa; peak solo en addLog.
- description: >
    Tras confirmar training el handler muta stats y desmonta la escena. El jugador no
    ve before/after ni coste pagado en un panel (a diferencia de RewardModal/synthesis).
    ## DoD
    1) Result panel en Training: stat before→after, intensity, cost HP/CK, gain.
    2) Continue aplica via onTrain existente y vuelve al mapa.
    3) Skip sin panel.
    4) CSS pixel-arcade.
    5) tsc, test, build.
    Fuera de alcance: rebalance gains, multi-session training.
- entryPoints:
    - src/scenes/activities/Training.tsx
    - src/scenes/activities/Training.css
    - src/hooks/useActivityHandlers.ts

---

## T-049 · InfoGathering intel result panel
- id: T-049
- section: exploration
- status: passed
- initialScore: 52
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — intel gathering only logs; peak meta payoff invisible.
- description: >
    infoGathering applies +intel and flavor via addLog only. Same gap as T-048 training.
    ## DoD
    1) Modal/panel shows flavorText, +intelGain%, before→after intel (capped 100).
    2) Continue dismisses; activity completes once; optional ArtIcon activity tile.
    3) tsc, test, build.
    Fuera de alcance: rest panel, intel formula rebalance.
- entryPoints:
    - src/hooks/useActivityHandler.ts
    - src/App.tsx
    - src/components/modals/

---

## T-050 · Rest activity result panel
- id: T-050
- section: exploration
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION]
- origen: discovery CONNECT — rest heals then log only; mirror T-049 intel panel.
- description: >
    Rest applies HP/CK heal and completes activity with addLog only. Peak invisible.
    ## DoD
    1) RestResultModal: +HP/+CK, before→after, heal %, rest ArtIcon.
    2) Wire useActivityHandler + App mount; dismiss Enter/Space/Esc.
    3) Activity completes once; log kept.
    4) tsc, test, build.
    Fuera de alcance: rebalance heal, GameGuide.
- entryPoints:
    - src/hooks/useActivityHandler.ts
    - src/App.tsx
    - src/components/modals/RestResultModal.tsx

---

## T-051 · ScrollDiscovery learn result panel
- id: T-051
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — learn/upgrade/replace solo addLog y sale al mapa.
- description: >
    Tras aprender un scroll la escena se desmonta; payoff invisible.
    ## DoD
    1) Result beat: skill ArtIcon, mode learned/upgraded/replaced, chakra cost.
    2) Continue applies via onLearnScroll once then leave.
    3) Skip unchanged.
    4) CSS pixel; tsc test build.
    Fuera de alcance: balance skills, loot juice.
- entryPoints:
    - src/scenes/rewards/ScrollDiscovery.tsx
    - src/scenes/rewards/ScrollDiscovery.css
    - src/hooks/useActivityHandlers.ts

---

## T-052 · Loot leave confirm (unclaimed spoils)
- id: T-052
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — Leave All / Space abandona drops sin intent explícito.
- description: >
    En LOOT, Space/Enter/Leave All sale al mapa y descarta items/skills no reclamados
    sin confirmacion. Misma familia de payoff-clarity que T-048..051.
    ## DoD
    1) Si quedan droppedItems o droppedSkill, leave pide confirm (count + Cancel/Leave).
    2) Si no queda nada, leave inmediato.
    3) Footer badge de remaining count.
    4) CSS pixel; tsc test build.
    Fuera de alcance: auto-loot, balance drops, cambiar equip-one-leaves-map.
- entryPoints:
    - src/scenes/rewards/Loot.tsx
    - src/scenes/rewards/Loot.css

---

## T-053 · TreasureChoice claim result panel
- id: T-053
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — pick treasure va al mapa sin beat (solo log).
- description: >
    handleTreasureSelectItem mete en bag y sale; no hay panel de claim.
    ## DoD
    1) Tras pick con espacio en bag: panel item ArtIcon, name/rarity, ryo bonus.
    2) Continue aplica onSelectItem una vez y sale.
    3) Bag-full / hunt / guardian sin cambios.
    4) CSS pixel; tsc test build.
    Fuera de alcance: rebalance loot, multi-pick.
- entryPoints:
    - src/scenes/rewards/TreasureChoice.tsx
    - src/scenes/rewards/treasure.css
    - src/hooks/useTreasureHandlers.ts

---

## T-054 · Combat opening banner (approach + posture)
- id: T-054
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — approachResult existe pero no se ve en combate (solo logs).
- description: >
    Tras T-039 posture abre con approach; el resultado del approach no se muestra en UI de combate.
    ## DoD
    1) Banner primer turno: approach name, success/fail, opening posture + draw bias, key effects.
    2) Auto-dismiss timeout o al jugar carta/pass.
    3) Pixel CSS; tsc test build.
    Fuera de alcance: rebalance approach, new approaches.
- entryPoints:
    - src/scenes/combat/Combat.tsx
    - src/scenes/combat/Combat.css
    - src/App.tsx
    - src/hooks/useCombat.ts

---

## T-055 · Merchant purchase result juice
- id: T-055
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — buy solo addLog; shop stay abierto sin peak visual.
- description: >
    buyItem actualiza bag/ryo y loguea. No hay toast/panel de compra exitosa.
    ## DoD
    1) buyItem returns boolean; success shows toast: ArtIcon, name, -price, bag note.
    2) Fail paths keep logs only (no false toast).
    3) Stay in merchant; auto-dismiss ~2s or Esc/click.
    4) CSS pixel; tsc test build.
    Fuera de alcance: rebalance prices, sell panel.
- entryPoints:
    - src/hooks/useActivityHandlers.ts
    - src/scenes/activities/Merchant.tsx
    - src/scenes/activities/Merchant.css
    - src/App.tsx

---

## T-056 · Wire location.enemyPool into room spawns
- id: T-056
- section: combat
- status: passed
- initialScore: 48
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — enemyPool muerto; getEnemyArt poolId listo.
- description: >
    Locations autoran enemyPool pero generateEnemy usa prefijos genericos de arco.
    ## DoD
    1) generateEnemy accepts optional enemyPool; NORMAL/ELITE pick pool id for name + poolId art.
    2) humanizeEnemyPoolId; empty pool keeps legacy prefix+job.
    3) LocationSystem combat/elite pass floor.enemyPool from location.
    4) FloorGenerationConfig + BranchingFloor.enemyPool from locationToBranchingFloor.
    5) Tests; tsc test build.
    Fuera de alcance: boss kits, new stats catalogs.
- entryPoints:
    - src/game/systems/EnemySystem.ts
    - src/game/systems/LocationSystem.ts
    - src/game/systems/RegionSystem.ts
    - src/game/types.ts
    - src/game/systems/__tests__/EnemySystem.test.ts

---

## T-057 · Event/treasure/guardian spawns use enemyPool
- id: T-057
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT residual — T-056 room combat only; event/treasure/exit guardian omit pool.
- description: >
    generateEnemy ya acepta enemyPool. Event triggerCombat, treasure guardian y exit
    guardian siguen sin pasarlo.
    ## DoD
    1) Event combat passes locationFloor/branchingFloor enemyPool.
    2) Treasure guardian + generateGuardian pass pool; named overrides still win.
    3) Empty pool legacy.
    4) tsc test build.
    Fuera de alcance: boss kits, bag toast.
- entryPoints:
    - src/hooks/useActivityHandlers.ts
    - src/hooks/useTreasureHandlers.ts
    - src/game/systems/LocationSystem.ts

---

## T-058 · Bag equip/sell toast (mirror T-055)
- id: T-058
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION]
- origen: discovery CONNECT — bag equip/sell solo addLog; T-055 pattern ready.
- description: >
    equipFromBag y sellComponent mutan y loguean sin peak visual.
    ## DoD
    1) Equip success toast: ArtIcon, name, equip note (swap if replaced).
    2) Sell success toast: art, name, +ryo.
    3) Fail log-only; auto-dismiss ~2s / Esc / click.
    4) CSS pixel; tsc test build.
    Fuera de alcance: lootTable, leave location.
- entryPoints:
    - src/hooks/useInventoryHandlers.ts
    - src/components/inventory/Bag.tsx
    - src/components/inventory/inventory.css

---

## T-059 · Wire location.lootTable into combat/treasure drops
- id: T-059
- section: exploration
- status: passed
- initialScore: 48
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT — lootTable muerto; drops usan pesos globales.
- description: >
    Locations autoran lootTable (settlement/wilderness/boss/secret) pero generateLoot
    ignora el id. Bias de pesos por sufijo de tabla.
    ## DoD
    1) parseLootTableKind + weight multipliers by kind.
    2) generateLoot/broken/common honor lootTable?; unknown → global.
    3) Combat victory passes currentLocation.lootTable; treasure gens if cheap.
    4) Unit tests; tsc test build.
    Fuera de alcance: full per-id catalogs, leave location panel.
- entryPoints:
    - src/game/systems/LootSystem.ts
    - src/hooks/useCombatVictory.ts
    - src/game/systems/LocationSystem.ts
    - src/game/systems/__tests__/LootSystem.test.ts

---

## T-060 · Location complete result panel
- id: T-060
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — leave/complete location salta a REGION_MAP con solo log.
- description: >
    Completar location es peak de progresion; solo addLog y salto a cartas.
    ## DoD
    1) Panel: nombre location, danger, rooms, locationsCleared after, region progress, secret unlocks.
    2) Continue ejecuta completeLocationAndReturnToRegion una vez.
    3) Revisit sin double count copy.
    4) CSS pixel; Enter/Space; tsc test build.
    Fuera de alcance: lootTheme, terrainEffects, new rewards.
- entryPoints:
    - src/hooks/useLocationCards.ts
    - src/hooks/useExploration.ts
    - src/App.tsx
    - src/components/modals/LocationCompleteModal.tsx

---

## T-061 · Wire region.lootTheme into ryo + component drops
- id: T-061
- section: exploration
- status: passed
- initialScore: 50
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT — lootTheme en 4 regiones, copiado, nunca leido (post T-059).
- description: >
    goldMultiplier y equipmentFocus no afectan ryo ni drops. primaryElement documentado
    en bias leve de flavor via focus.
    ## DoD
    1) goldMultiplier multiplies combat ryo after wealth/flags.
    2) equipmentFocus boosts matching component primaryStat weights (stack T-059).
    3) Call sites pass region.lootTheme; missing → 1.0 / global.
    4) Unit tests; tsc test build.
    Fuera de alcance: terrainEffects, equipment toast.
- entryPoints:
    - src/game/systems/LootSystem.ts
    - src/hooks/useCombatVictory.ts
    - src/game/systems/__tests__/LootSystem.test.ts

---

## T-062 · Equipment sell toast (mirror T-058 bag)
- id: T-062
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION]
- origen: discovery CONNECT residual — bag sell tiene toast; equipped sell solo addLog.
- description: >
    sellEquipped muta y loguea sin peak visual. T-058 cubrio bag.
    ## DoD
    1) sellEquipped returns price | null.
    2) EquipmentPanel toast: ArtIcon, name, +ryo; auto-dismiss.
    3) Fail log-only; tsc test build.
    Fuera de alcance: terrainEffects, unequip toast.
- entryPoints:
    - src/hooks/useInventoryHandlers.ts
    - src/components/inventory/EquipmentPanel.tsx
    - src/components/inventory/inventory.css

---

## T-063 · Wire location.terrainEffects (S-slice)
- id: T-063
- section: combat
- status: passed
- initialScore: 48
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — terrainEffects muertos; 13 types autorados.
- description: >
    Location.terrainEffects nunca se leen. S-slice: stealth + element/mental damage
    + enemy defense. Defer hazards/ambush/attack.
    ## DoD
    1) Pure getLocationTerrainMods + skillLocationDamageMult + tests.
    2) stealth_bonus → approach success (frac*100 + room stealth).
    3) water/fire/mental damage on player outgoing; enemy_defense_bonus reduces it.
    4) CombatState.locationTerrainMods from current location.
    5) Optional FULL intel line for terrain effects on cards.
    6) tsc test build.
    Fuera de alcance: poison/fall hazards, ambush_chance, enemy_attack, full sim parity.
- entryPoints:
    - src/game/systems/LocationTerrainSystem.ts
    - src/game/systems/ApproachSystem.ts
    - src/game/systems/PlayerTurnSystem.ts
    - src/game/systems/combat-types.ts
    - src/App.tsx
    - src/hooks/useCombat.ts

---

## T-064 · terrainEffects residual: enemy attack + ambush
- id: T-064
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT residual T-063 — enemy_attack_bonus y ambush_chance stubbed only.
- description: >
    LocationTerrainMods already sums enemyAttackBonus and ambushChance but unused.
    ## DoD
    1) enemy_attack_bonus multiplies enemy→player damage in EnemyTurnSystem.
    2) ambush_chance increases room elite combat roll (base 0.3 + value, cap ~0.7).
    3) Thread terrainEffects on BranchingFloor from location for room gen.
    4) Tests; tsc test build.
    Fuera de alcance: hazards, sim full parity.
- entryPoints:
    - src/game/systems/EnemyTurnSystem.ts
    - src/game/systems/LocationSystem.ts
    - src/game/systems/RegionSystem.ts
    - src/game/types.ts
    - src/game/systems/__tests__/LocationTerrainSystem.test.ts

---

## T-065 · ApproachSelector shows location stealth_bonus
- id: T-065
- section: presentation
- status: passed
- initialScore: 60
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-063 — executeApproach stacks loc stealth; UI does not.
- description: >
    Preview de % de approach miente vs roll real (solo room stealth).
    ## DoD
    1) Success % = room stealth + location stealth pts (same as executeApproach).
    2) Terrain UI shows combined stealth when loc bonus != 0.
    3) Pass locationStealthBonusPts from App currentLocation.
    4) tsc test build.
    Fuera de alcance: hazards residuales, unequip toast.
- entryPoints:
    - src/components/combat/ApproachSelector.tsx
    - src/App.tsx
    - src/game/systems/ApproachSystem.ts

---

## T-066 · Location terrain hazards + evasion
- id: T-066
- section: combat
- status: passed
- initialScore: 52
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT residual terrain — poison/fall/chakra_drain/evasion unused.
- description: >
    LocationTerrainMods no suma hazards ni evasion. Room hazards existen; location no.
    ## DoD
    1) Sum poison_hazard, fall_hazard, chakra_drain, evasion_bonus in mods.
    2) End of enemy turn: location hazards on player (HP % / chakra %).
    3) evasion_bonus adds to player evade vs enemy attacks.
    4) Tests; tsc test build.
    Fuera de alcance: movement/visibility exploration, sim full parity.
- entryPoints:
    - src/game/systems/LocationTerrainSystem.ts
    - src/game/systems/EnemyTurnSystem.ts
    - src/game/systems/__tests__/LocationTerrainSystem.test.ts

---

## T-067 · Unequip toast + movement/visibility terrain
- id: T-067
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — unequip log-only; movement/visibility terrain still dead.
- description: >
    1) unequipToBag toast like sell/equip.
    2) Sum movement_penalty + visibility_penalty; combat maxAp reduced by movement;
       intel gains reduced by |visibility_penalty| when negative.
    ## DoD
    1) Unequip toast ArtIcon + Moved to bag.
    2) Mods sum movement/visibility; AP + intel wire.
    3) Labels FULL intel; tests; tsc build.
    Fuera de alcance: full exploration path costs.
- entryPoints:
    - src/hooks/useInventoryHandlers.ts
    - src/components/inventory/EquipmentPanel.tsx
    - src/game/systems/LocationTerrainSystem.ts
    - src/hooks/useCombat.ts
    - src/hooks/useCombatVictory.ts
    - src/hooks/useActivityHandler.ts

---

## T-068 · Event intel visibility + lootTheme primaryElement
- id: T-068
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT residual T-067/T-061 — event intel ignores fog; primaryElement never used.
- description: >
    1) Event terminal intelGain scaled by applyVisibilityToIntelGain.
    2) generateEnemy biases element toward region lootTheme.primaryElement (~50%).
    ## DoD
    1) handleEventOutcomeClose uses visibility-scaled intel.
    2) generateEnemy optional preferredElement / lootTheme primary.
    3) Pass region primaryElement from combat gen paths when cheap.
    4) Tests; tsc build.
    Fuera de alcance: disassemble toast, sim parity.
- entryPoints:
    - src/hooks/useActivityHandlers.ts
    - src/game/systems/EnemySystem.ts
    - src/game/systems/LocationSystem.ts
    - src/game/systems/__tests__/EnemySystem.test.ts

---

## T-069 · Disassemble toast + region element theme chip
- id: T-069
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-068 — disassemble log-only; primaryElement now affects enemies but UI silent.
- description: >
    1) Disassemble equipped returns component; toast shows result.
    2) RegionMap header shows lootTheme primaryElement chip.
    ## DoD
    1) handleDisassembleEquipped returns component | null.
    2) EquipmentPanel toast Disassembled → component name.
    3) RegionMap shows Affinity: {element} when lootTheme set.
    4) tsc test build.
- entryPoints:
    - src/hooks/useInventoryHandlers.ts
    - src/components/inventory/EquipmentPanel.tsx
    - src/components/exploration/RegionMap.tsx
    - src/components/exploration/exploration.css

---

## T-070 · Merchant lootTheme + auto-combat location terrain
- id: T-070
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT — merchant ignores lootTheme; simulateGameCombat ignores locationTerrainMods.
- description: >
    Manual combat has terrain mods + lootTheme; auto combat and merchant stock lag.
    ## DoD
    1) generateMerchantItem call sites pass lootTable + lootTheme.
    2) simulateGameCombat optional locationTerrainMods; apply dmg/defense/attack/evasion/hazards lightly.
    3) Auto-combat callers pass currentLocation terrain mods.
    4) tsc test build.
    Fuera de alcance: full sim deckbuilder AP parity.
- entryPoints:
    - src/game/systems/LocationSystem.ts
    - src/hooks/useActivityHandlers.ts
    - src/game/systems/CombatSimulationService.ts
    - src/hooks/useCombatVictory.ts

---

## T-071 · Treasure lootTheme + combat open terrain lines
- id: T-071
- section: exploration
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — treasure drops miss lootTheme; open banner ignores location terrain.
- description: >
    Merchant has lootTheme (T-070); treasure/exit loot still only lootTable.
    Combat open banner shows approach but not location terrain effects already active.
    ## DoD
    1) generateTreasureActivity + exit treasure pass lootTheme.
    2) Combat open banner lists 1-3 location terrain effect labels when present.
    3) tsc test build.
    Fuera de alcance: full sim AP deck.
- entryPoints:
    - src/game/systems/LocationSystem.ts
    - src/scenes/combat/Combat.tsx
    - src/App.tsx

---

## T-072 · Hunt reward lootTheme + sim evasion
- id: T-072
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT residual T-070/071 — hunt rewards miss lootTheme; auto-combat misses evasion.
- description: >
    getTreasureHuntReward generates components without lootTable/theme.
    simulateGameCombat does not apply location evasion_bonus on enemy attacks.
    ## DoD
    1) getTreasureHuntReward accepts lootTable + lootTheme and passes to generateComponentByQuality.
    2) Callers pass location/region loot context.
    3) Sim enemy attacks use evasion_bonus like EnemyTurnSystem.
    4) tsc test build.
- entryPoints:
    - src/game/systems/LocationSystem.ts
    - src/hooks/useTreasureHandlers.ts
    - src/hooks/useCombatVictory.ts
    - src/game/systems/CombatSimulationService.ts

---

## T-073 · Event/hunt generateEnemy preferredElement parity
- id: T-073
- section: combat
- status: passed
- initialScore: 60
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT residual T-068 — room combat has preferredElement; event/guardian omit it.
- description: >
    Pass region.lootTheme.primaryElement into event combat and treasure guardian generateEnemy.
    Optionally generateGuardian in LocationSystem.
    ## DoD
    1) Event triggerCombat + treasure guardian pass preferredElement.
    2) Exit guardian uses preferredElement when available.
    3) tsc test build.
- entryPoints:
    - src/hooks/useActivityHandlers.ts
    - src/hooks/useTreasureHandlers.ts
    - src/game/systems/LocationSystem.ts

---

## T-074 · Region equipmentFocus + LocationMap terrain strip
- id: T-074
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — equipmentFocus wired in drops (T-061) but silent on map; terrain active in location only on cards/combat open.
- description: >
    1) RegionMap shows Focus: Speed · Dexterity · Spirit from lootTheme.equipmentFocus.
    2) LocationMap header shows active terrain effect lines from floor.terrainEffects.
    ## DoD
    1) Focus chip humanized; no-op if empty.
    2) LocationMap terrain strip when effects present.
    3) CSS pixel; tsc test build.
- entryPoints:
    - src/components/exploration/RegionMap.tsx
    - src/components/exploration/LocationMap.tsx
    - src/components/exploration/exploration.css

---

## T-075 · Combat AP terrain note + location-complete affinity
- id: T-075
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — movement_penalty reduces maxAp but AP HUD is silent; location complete omits region/location identity.
- description: >
    1) Combat AP bar notes terrain AP cut when maxAp < natural budget.
    2) Location complete panel shows optional terrain summary + region affinity if available.
    ## DoD
    1) Pass baseMaxAp or reduced flag to Combat; show 'Terrain AP −N' under pips.
    2) LocationCompleteResult optional terrainLines + affinityLabel.
    3) tsc test build.
- entryPoints:
    - src/scenes/combat/Combat.tsx
    - src/hooks/useCombat.ts
    - src/App.tsx
    - src/components/modals/LocationCompleteModal.tsx
    - src/hooks/useLocationCards.ts

---

## T-076 · GameGuide honesty: terrain + region lootTheme
- id: T-076
- section: presentation
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT — handbook terrain fluff; live systems T-063..075.
- description: >
    Rewrite HELP_TEXT terrain/exploration to match LocationTerrainSystem and region lootTheme
    (Affinity, Focus, Ryo). Optional note room vs location terrain layers.
    ## DoD
    1) TERRAIN cards list real location effects with short effects.
    2) EXPLORATION or combat section mentions region Affinity/Focus/Ryo bias.
    3) tsc test build; no formula change.
- entryPoints:
    - src/game/constants/helpText.ts
    - src/scenes/menu/GameGuide.tsx

---

## T-077 · Room terrain evasion + dead elite helpers cleanup
- id: T-077
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT — getTerrainEvasionBonus never called; location evasion wired.
- description: >
    Stack room terrain.evasionModifier into defender evasion in manual + auto combat.
    Delete unused generateLocationElite / generateRegionBoss.
    ## DoD
    1) EnemyTurn + PlayerTurn + sim stack room evasion with location evasion (cap 0.75).
    2) Remove dead RegionSystem elite/boss helpers.
    3) tsc test build.
- entryPoints:
    - src/game/systems/EnemyTurnSystem.ts
    - src/game/systems/PlayerTurnSystem.ts
    - src/game/systems/CombatSimulationService.ts
    - src/game/systems/RegionSystem.ts

---

## T-078 · ApproachSelector room evasion + element amplify
- id: T-078
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-065/T-077 — combat uses evasion/element; approach strip hides them.
- description: >
    Terrain Effects strip shows Evasion (room + optional loc) and element amplify.
    Keep stealth/initiative/hazard. No formula change.
    ## DoD
    1) Non-zero evasionModifier / location evasion shown.
    2) elementAmplify shown when set.
    3) App passes locationEvasionBonus if needed.
    4) tsc test build.
- entryPoints:
    - src/components/combat/ApproachSelector.tsx
    - src/App.tsx

---

## T-079 · Combat open banner room evasion + element amp
- id: T-079
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-078 — approach strip shows room mods; open banner only location.
- description: >
    Merge room terrain lines (evasion, element amp, initiative, hazard) into combat open banner.
    Cap labels; keep location lines. Display only.
    ## DoD
    1) formatRoomTerrainEffectLines helper.
    2) App merges room + location into Combat open banner (max 4).
    3) tsc test build.
- entryPoints:
    - src/game/systems/LocationTerrainSystem.ts
    - src/scenes/combat/Combat.tsx
    - src/App.tsx

---

## T-080 · Room visibilityRange on LocationMap foresight
- id: T-080
- section: exploration
- status: passed
- initialScore: 52
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — visibilityRange authored on every room terrain, never read.
- description: >
    When current room terrain visibilityRange is 1, fog/hide grandchild row.
    Range 2+ keeps current full foresight. Header Sight chip optional.
    Generation unchanged (display-only).
    ## DoD
    1) Helper getRoomVisibilityRange(terrain).
    2) LocationMap hides or fogs grandchildren when range <= 1.
    3) Sight N chip in header.
    4) tsc test build.
    Fuera de alcance: hiddenRoomBonus, movementCost.
- entryPoints:
    - src/game/systems/LocationTerrainSystem.ts
    - src/components/exploration/LocationMap.tsx
    - src/components/exploration/exploration.css

---

## T-081 · Room hiddenRoomBonus into exit discovery
- id: T-081
- section: exploration
- status: passed
- initialScore: 52
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — hiddenRoomBonus authored, never read; exit roll is live hook.
- description: >
    Parent room terrain hiddenRoomBonus adjusts exit probability when generating children.
    LocationMap Secrets chip when non-zero.
    ## DoD
    1) getRoomHiddenRoomBonus helper (bonus/100 fraction, clamp).
    2) shouldBeExitRoom uses parent room terrain bonus.
    3) Sight-style Secrets chip on LocationMap.
    4) tests tsc build.
    Fuera de alcance: movementCost.
- entryPoints:
    - src/game/systems/LocationTerrainSystem.ts
    - src/game/systems/LocationSystem.ts
    - src/components/exploration/LocationMap.tsx

---

## T-082 · Room movementCost into combat AP + Pace chip
- id: T-082
- section: combat
- status: passed
- initialScore: 52
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — last dead room TerrainEffects exploration field after T-080/081.
- description: >
    movementCost multiplies combat AP budget (max 1 floor). LocationMap Pace chip.
    Stack after base, with location movement_penalty. No enter gates.
    ## DoD
    1) getRoomMovementCost + applyRoomMovementCostToMaxAp.
    2) useCombat open + upkeep apply room cost from combatState.terrain.
    3) LocationMap Pace chip when cost != 1.
    4) tests tsc build.
- entryPoints:
    - src/game/systems/LocationTerrainSystem.ts
    - src/hooks/useCombat.ts
    - src/components/exploration/LocationMap.tsx

---

## T-083 · Pace honesty: room movementCost in UI + guide
- id: T-083
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-082 — movementCost affects AP but approach/banner/guide lag LocationMap Pace chip.
- description: >
    Surface room movementCost in formatRoomTerrainEffectLines, ApproachSelector,
    combat open banner (via formatter), and GameGuide exploration/combat copy.
    ## DoD
    1) formatRoomTerrainEffectLines includes Pace ×N when cost != 1.
    2) ApproachSelector shows Pace line.
    3) helpText mentions Sight/Secrets/Pace room terrain.
    4) tsc test build.
- entryPoints:
    - src/game/systems/LocationTerrainSystem.ts
    - src/components/combat/ApproachSelector.tsx
    - src/game/constants/helpText.ts
    - src/scenes/menu/GameGuide.tsx

---

## T-084 · Selected room panel: terrain Pace/Sight/Secrets
- id: T-084
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-080..083 — header shows current room foresight; selected room panel ignores its own terrain.
- description: >
    Selected room detail shows terrain name + non-default Pace/Sight/Secrets/combat chips
    from TERRAIN_DEFINITIONS[room.terrain]. Display only.
    ## DoD
    1) Selected panel lists terrain name and key mods.
    2) CSS pixel consistent with map chips.
    3) tsc test build.
- entryPoints:
    - src/components/exploration/LocationMap.tsx
    - src/components/exploration/exploration.css

---

## T-085 · RoomCard terrain micro-hints
- id: T-085
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-084 — selected panel honest after click; cards still blind.
- description: >
    RoomCard shows terrain name + non-default Sight/Secrets/Pace chips for path scan.
    ## DoD
    1) Terrain short name on card.
    2) Chips when Sight != 2, Secrets != 0, Pace != 1.
    3) CSS pixel; tsc test build.
- entryPoints:
    - src/components/exploration/RoomCard.tsx
    - src/components/exploration/exploration.css

---

## T-086 · Intel result modal: visibility fog honesty
- id: T-086
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-067 — intel gain scaled by fog; modal only shows effective number.
- description: >
    When visibility_penalty reduces intel, IntelResultModal shows base vs effective and a Fog note.
    ## DoD
    1) IntelResultData optional baseIntelGain + fogNote.
    2) useActivityHandler passes base and effective.
    3) Modal copy when reduced.
    4) tsc test build.
- entryPoints:
    - src/components/modals/IntelResultModal.tsx
    - src/hooks/useActivityHandler.ts
    - src/App.tsx

---

## T-087 · RewardModal combat intel + fog honesty
- id: T-087
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-067/086 — combat grants fog intel silently.
- description: >
    Victory RewardModal shows intel gain; base→effective when fog reduces.
    addLog on victory for intel.
    ## DoD
    1) combatReward includes intel fields.
    2) RewardModal intel row + fog note.
    3) Victory log includes intel.
    4) tsc test build.
- entryPoints:
    - src/hooks/useCombatVictory.ts
    - src/components/modals/RewardModal.tsx
    - src/App.tsx

---

## T-088 · Event choice preview fog-honest intel
- id: T-088
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-086 — result modal fog-honest; choice preview still raw.
- description: >
    Pass visibilityPenalty into Event; formatOutcomeText shows effective intel and fog note.
    ## DoD
    1) Event props: visibilityPenalty or locationTerrainEffects.
    2) Preview intel line fog-scaled.
    3) tsc test build.
- entryPoints:
    - src/scenes/activities/Event.tsx
    - src/App.tsx

---

## T-089 · RewardModal ryo: region gold multiplier honesty
- id: T-089
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-061 — RegionMap shows Ryo ×N; victory UI silent on gold mult.
- description: >
    Victory RewardModal + log note when goldMultiplier != 1 (and wealth note already).
    ## DoD
    1) combatReward.ryoNote optional string.
    2) RewardModal shows note under gold.
    3) addLog includes region ryo when mult != 1.
    4) tsc test build.
- entryPoints:
    - src/hooks/useCombatVictory.ts
    - src/components/modals/RewardModal.tsx
    - src/App.tsx

---

## T-090 · Merchant lootTheme Focus honesty
- id: T-090
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-070/074 — stock biased by Focus; merchant UI silent.
- description: >
    Pass region.lootTheme into Merchant; show Affinity / Focus / Ryo × when present.
    ## DoD
    1) Merchant props lootTheme optional.
    2) Header chips for Affinity, Focus stats, Ryo ×N.
    3) tsc test build.
- entryPoints:
    - src/scenes/activities/Merchant.tsx
    - src/scenes/activities/Merchant.css
    - src/App.tsx

---

## T-091 · Merchant item Focus match cue
- id: T-091
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-090 — header Focus abstract; per-item cue missing.
- description: >
    Items with stats matching lootTheme.equipmentFocus show Focus badge; matching stats highlighted in preview.
    ## DoD
    1) Focus badge on ItemCard when match.
    2) PreviewPanel marks matching stats.
    3) tsc test build.
- entryPoints:
    - src/scenes/activities/Merchant.tsx
    - src/scenes/activities/Merchant.css

---

## T-092 · TreasureChoice lootTheme Focus honesty
- id: T-092
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-071/091 — treasure drops biased by Focus; UI silent.
- description: >
    Pass lootTheme; show Affinity/Focus chips; Focus badge on matching choice cards.
    ## DoD
    1) lootTheme prop + App wire.
    2) Header chips + Focus badge on revealed cards.
    3) Tooltip ★ on matching stats.
    4) tsc test build.
- entryPoints:
    - src/scenes/rewards/TreasureChoice.tsx
    - src/scenes/rewards/treasure.css
    - src/App.tsx

---

## T-093 · Loot scene Focus honesty (combat drops)
- id: T-093
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-061/091/092 — combat loot biased by Focus; Loot UI silent.
- description: >
    Pass lootTheme; Affinity/Focus chips; Focus badge + tooltip ★ on matching drops.
    ## DoD
    1) lootTheme prop + App wire.
    2) Header chips.
    3) Focus badge on matching items.
    4) tsc test build.
- entryPoints:
    - src/scenes/rewards/Loot.tsx
    - src/scenes/rewards/Loot.css
    - src/App.tsx

---

## T-094 · TreasureHuntReward lootTheme Focus honesty
- id: T-094
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-072/093 — hunt rewards biased; UI silent.
- description: >
    Pass lootTheme; Affinity/Focus chips; Focus badge + tooltip ★ on matching items.
    ## DoD
    1) lootTheme prop + App wire.
    2) Header chips.
    3) Focus on matching reward cards.
    4) tsc test build.
- entryPoints:
    - src/scenes/rewards/TreasureHuntReward.tsx
    - src/scenes/rewards/treasure.css
    - src/App.tsx

---

## T-095 · Interlude next-region Focus honesty
- id: T-095
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-090–094 — Focus honest on loot peaks; interlude blind to next region theme.
- description: >
    Pass nextLootTheme into Interlude; chips Affinity/Focus/Ryo under continue; Focus badge on matching boons.
    ## DoD
    1) App wires next region lootTheme into interludeMeta.
    2) Interlude shows theme chips for next region.
    3) Item/stat boons matching Focus marked.
    4) tsc test build.
- entryPoints:
    - src/scenes/menu/Interlude.tsx
    - src/scenes/menu/Interlude.css
    - src/App.tsx

---

## T-096 · Bag Focus honesty (equip residual)
- id: T-096
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-090–095 — Focus honest on loot peaks; bag equip path silent.
- description: >
    Pass lootTheme into Bag; Focus chip + badge on matching bag items; tooltip ★.
    ## DoD
    1) App/RightSidebar/InventoryOverlay pass lootTheme.
    2) Bag header Focus chip; matching items badge + tooltip.
    3) tsc test build.
- entryPoints:
    - src/components/inventory/Bag.tsx
    - src/components/layout/RightSidebarPanel.tsx
    - src/App.tsx

---

## T-097 · EquipmentPanel Focus honesty (equipped residual)
- id: T-097
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-096 — bag shows Focus; worn slots silent.
- description: >
    Pass lootTheme into EquipmentPanel; F badge + tooltip ★ on matching equipped items.
    ## DoD
    1) lootTheme prop; RightSidebar wires it.
    2) Matching equipped: F + tooltip Focus cues.
    3) tsc test build.
- entryPoints:
    - src/components/inventory/EquipmentPanel.tsx
    - src/components/inventory/inventory.css
    - src/components/layout/RightSidebarPanel.tsx

---

## T-098 · Craft result Focus honesty
- id: T-098
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-096/097 — craft reveal lacks Focus at equip decision.
- description: >
    Crafted panel shows Focus badge + stats with ★ when product matches region Focus.
    ## DoD
    1) Focus mark on craft reveal when match.
    2) Product stats listed with Focus ★.
    3) tsc test build.
- entryPoints:
    - src/components/inventory/Bag.tsx
    - src/components/inventory/inventory.css

---

## T-099 · LocationPanel region theme honesty
- id: T-099
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-074/090–098 — Focus honest on peaks/inventory; left LocationPanel only shows region name.
- description: >
    LocationPanel shows Affinity / Focus / Ryo × from region.lootTheme (persistent explore chrome).
    ## DoD
    1) lootTheme prop optional.
    2) Chips under region name when present.
    3) LeftSidebar passes region.lootTheme.
    4) tsc test build.
- entryPoints:
    - src/components/exploration/LocationPanel.tsx
    - src/components/layout/LeftSidebarPanel.tsx
    - src/components/exploration/exploration.css

---

## T-100 · ExplorationHUD region theme honesty
- id: T-100
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-099 — LocationPanel has theme; cinematic HUD (sidebars hidden) does not.
- description: >
    ExplorationHUD shows Affinity / Focus / Ryo × from region.lootTheme.
    ## DoD
    1) Optional lootTheme prop.
    2) Compact chips next to story flags or ryo.
    3) App passes region?.lootTheme.
    4) tsc test build.
- entryPoints:
    - src/components/layout/ExplorationHUD.tsx
    - src/components/layout/ExplorationHUD.css
    - src/App.tsx

---

## T-101 · Character sheet region theme + Focus stats
- id: T-101
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-099/100 — HUD/LocationPanel have theme; C sheet only story flags.
- description: >
    CharacterSheetOverlay shows Affinity/Focus/Ryo; PrimaryStatsPanel marks Focus stats with ★.
    ## DoD
    1) lootTheme prop on CharacterSheet + App wire.
    2) Region theme chips section.
    3) PrimaryStats Focus highlight via isFocusStat.
    4) tsc test build.
- entryPoints:
    - src/components/layout/CharacterSheetOverlay.tsx
    - src/components/character/PrimaryStatsPanel.tsx
    - src/App.tsx

---

## T-102 · Wire room CombatActivity.modifiers into combat
- id: T-102
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT — room types roll CombatModifierType; COMBAT_MODIFIER_EFFECTS authored but never applied.
- description: >
    Pure helper merges room modifiers into approach CombatModifiers (init, first-hit, sanctuary heal).
    startCombat applies; log active room modifier names.
    ## DoD
    1) applyRoomCombatModifiers helper using COMBAT_MODIFIER_EFFECTS.
    2) startCombat accepts roomModifiers and merges.
    3) Call sites pass combat.modifiers / elite modifiers.
    4) Log active modifier name when not NONE.
    5) tsc test build.
    Fuera: full env poison/fall systems if not trivial.
- entryPoints:
    - src/game/systems/LocationSystem.ts or new helper
    - src/hooks/useCombat.ts
    - src/App.tsx / useActivityHandlers approach select

---

## T-103 · Room combat mods residual: evasion + fall + open UI
- id: T-103
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT residual T-102 — init/heal/poison wired; FOREST evasion, CLIFF fall, open banner still thin.
- description: >
    Apply playerEffects.evasionModifier from room combat mods into dodge stack.
    On player miss apply fallDamageOnMiss HP if set.
    Surface active room condition names on combat open banner.
    ## DoD
    1) RoomCombatModifierSystem returns evasionBonus + fallDamageOnMiss.
    2) CombatState stores roomCombatEvasion + fallOnMiss + roomConditionNames.
    3) EnemyTurn/PlayerTurn stack roomCombatEvasion.
    4) Miss path applies cliff fall damage.
    5) Combat open banner shows room conditions.
    6) tsc test build.
- entryPoints:
    - src/game/systems/RoomCombatModifierSystem.ts
    - src/game/systems/combat-types.ts
    - src/hooks/useCombat.ts
    - src/game/systems/EnemyTurnSystem.ts
    - src/game/systems/PlayerTurnSystem.ts
    - src/scenes/combat/Combat.tsx

---

## T-104 · ApproachSelector room combat condition honesty
- id: T-104
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-102/103 — combat applies room conditions; approach strip silent.
- description: >
    Pass room combat modifiers to ApproachSelector; show Room: Ambush · Forest names + short description.
    Optional selected-room panel chip.
    ## DoD
    1) ApproachSelector props roomConditionNames or modifiers.
    2) Terrain strip shows room combat conditions when non-NONE.
    3) App passes combat.modifiers labels via COMBAT_MODIFIER_EFFECTS.
    4) tsc test build.
- entryPoints:
    - src/components/combat/ApproachSelector.tsx
    - src/App.tsx
    - src/components/exploration/LocationMap.tsx (optional)

---

## T-105 · Enemy ambush first-hit + map room condition chip
- id: T-105
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT residual T-102/103 — AMBUSH authoring has enemy first-hit 1.25 unused; map path silent on combat condition.
- description: >
    Apply enemyEffects.damageMultiplierFirstTurn on first enemy hit.
    LocationMap selected panel shows Room condition chips from combat.modifiers.
    ## DoD
    1) CombatState.enemyFirstHitMultiplier from room mods.
    2) EnemyTurnSystem applies on first turn attack.
    3) LocationMap selected shows condition names.
    4) tsc test build.
- entryPoints:
    - src/game/systems/RoomCombatModifierSystem.ts
    - src/game/systems/combat-types.ts
    - src/hooks/useCombat.ts
    - src/game/systems/EnemyTurnSystem.ts
    - src/components/exploration/LocationMap.tsx

---

## T-106 · Auto-combat room modifiers + RoomCard Fight chip
- id: T-106
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT residual T-102–105 — manual combat has room mods; auto/sim does not; cards lack Fight chip.
- description: >
    simulateGameCombat applies room combat modifiers (init, first-hit, sanctuary, enemy ambush, evasion).
    RoomCard shows Fight condition chip when combat.modifiers non-NONE.
    ## DoD
    1) sim accepts roomModifiers; merge via applyRoomCombatModifiers.
    2) enemyFirstHit in sim on first enemy hit.
    3) Call sites pass combat.modifiers.
    4) RoomCard Fight chip.
    5) tsc test build.
- entryPoints:
    - src/game/systems/CombatSimulationService.ts
    - src/hooks/useCombatVictory.ts
    - src/hooks/useActivityHandlers.ts
    - src/components/exploration/RoomCard.tsx

---

## T-107 · Treasure guardian sim room mods + GameGuide room conditions
- id: T-107
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT residual T-106 — auto combat has room mods; treasure guardian sim and handbook lag.
- description: >
    Pass locationTerrainMods + combat.modifiers into treasure guardian simulateGameCombat.
    Document room combat conditions (Ambush, Prepared, Sanctuary, Corrupted, Forest, Cliff, Swamp) in helpText.
    ## DoD
    1) useTreasureHandlers sim parity.
    2) helpText TERRAIN or new ROOM_CONDITIONS cards.
    3) tsc test build.
- entryPoints:
    - src/hooks/useTreasureHandlers.ts
    - src/game/constants/helpText.ts

---

## T-108 · Elite challenge room combat modifiers
- id: T-108
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT residual T-102–107 — elite rooms lack combat activity; room type combatModifiers never applied to elite path.
- description: >
    EliteChallengeActivity.modifiers from room type pool at gen.
    Manual/auto elite + ApproachSelector + RoomCard/LocationMap use combat ?? elite modifiers.
    ## DoD
    1) Type + generateEliteChallengeActivity modifiers.
    2) startCombat / auto elite / approach UI / RoomCard / map panel.
    3) tsc test build.
- entryPoints:
    - src/game/types.ts
    - src/game/systems/LocationSystem.ts
    - src/App.tsx
    - src/hooks/useCombatVictory.ts
    - src/components/exploration/RoomCard.tsx
    - src/components/exploration/LocationMap.tsx

---

## T-109 · resolveBattle / simulators room combat modifiers
- id: T-109
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT residual T-106–108 — live auto has room mods; LocationSimulator/CampaignSimulator resolveBattle does not.
- description: >
    resolveBattle accepts roomCombatModifiers; applyRoomCombatModifiers for init/first-hit/sanctuary/enemy ambush.
    LocationSimulator + CampaignSimulator pass combat ?? elite modifiers.
    ## DoD
    1) resolveBattle optional room mods param.
    2) Call sites pass modifiers from room activities.
    3) tsc test build.
- entryPoints:
    - src/simulation/BattleSimulator.ts
    - src/simulation/LocationSimulator.ts
    - src/simulation/CampaignSimulator.ts

---

## T-110 · CLIFF fall + FOREST evasion in auto/sim
- id: T-110
- section: combat
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA]
- origen: discovery CONNECT residual T-103/109 — live applies fall/evasion; auto miss and BattleSimulator dodge lag.
- description: >
    Store fallDamageOnMiss in sim contexts; on player miss apply cliff fall HP.
    BattleSimulator stacks roomCombatEvasion (+ terrain) into defender dodge.
    ## DoD
    1) CombatSimulationService: fall on player miss.
    2) BattleSimulator: evasion stack + fall on miss.
    3) tsc test build.
- entryPoints:
    - src/game/systems/CombatSimulationService.ts
    - src/simulation/BattleSimulator.ts

---

## T-111 · EliteChallenge scene room condition honesty
- id: T-111
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-108 — elite has modifiers; pre-fight EliteChallenge UI silent.
- description: >
    Pass roomConditionNames/hints into EliteChallenge; show Fight condition strip before Accept/Escape.
    ## DoD
    1) EliteChallenge props for conditions.
    2) App/eliteChallengeData wires modifiers labels.
    3) CSS pixel strip.
    4) tsc test build.
- entryPoints:
    - src/scenes/combat/EliteChallenge.tsx
    - src/scenes/combat/EliteChallenge.css
    - src/App.tsx

---

## T-112 · Training scene region Focus honesty
- id: T-112
- section: presentation
- status: passed
- initialScore: 58
- targetScore: 90
- lensFocus: [PRESENTACION, SISTEMA]
- origen: discovery CONNECT residual T-101 — Focus marks character sheet; training pick still blind to region Focus.
- description: >
    Pass equipmentFocus/lootTheme into Training; mark Focus stats with chip/★.
    ## DoD
    1) Training props equipmentFocus.
    2) Focus badge on matching stat cards.
    3) App passes region.lootTheme.equipmentFocus.
    4) tsc test build.
- entryPoints:
    - src/scenes/activities/Training.tsx
    - src/scenes/activities/Training.css
    - src/App.tsx

---

## T-113 · ScrollDiscovery region Affinity/Focus bias
- id: T-113
- section: jutsu
- status: passed
- initialScore: 52
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT residual T-061/112 — loot/train themed; scroll gen still tier-only.
- description: >
    generateSkillForFloor biases by lootTheme primaryElement + equipmentFocus scalingStat.
    ScrollDiscovery UI shows Affinity/Focus chips and marks matching scrolls.
    ## DoD
    1) generateSkillForFloor(floor, lootTheme?).
    2) generateScrollDiscoveryActivity passes lootTheme.
    3) ScrollDiscovery UI + App wire.
    4) tsc test build.
- entryPoints:
    - src/game/systems/LootSystem.ts
    - src/game/systems/LocationSystem.ts
    - src/scenes/rewards/ScrollDiscovery.tsx
    - src/App.tsx

---

## T-114 · Treasure-hunt skills + skill loot region theme
- id: T-114
- section: jutsu
- status: passed
- initialScore: 55
- targetScore: 90
- lensFocus: [SISTEMA, PRESENTACION]
- origen: discovery CONNECT residual T-113 — scroll discovery themed; hunt reward skills and generateSkillLoot still unthemed.
- description: >
    Pass lootTheme into treasure hunt skill rolls (generateSkillForFloor).
    generateSkillLoot accepts lootTheme with same Affinity/Focus bias.
    TreasureHuntReward UI shows Affinity/Focus when present.
    ## DoD
    1) Hunt reward matrix uses lootTheme for skills.
    2) generateSkillLoot(lootTheme?).
    3) TreasureHuntReward scene chips optional.
    4) tsc test build.
- entryPoints:
    - src/game/systems/LootSystem.ts
    - src/game/systems/LocationSystem.ts
    - src/scenes/rewards/TreasureHuntReward.tsx
