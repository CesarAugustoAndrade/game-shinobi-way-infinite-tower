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
- status: active
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

