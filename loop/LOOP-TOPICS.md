# LOOP TOPICS — Backlog

> Backlog procesado de arriba hacia abajo por `/loop-run`. **La autoría de topics es
> EXTERNA al loop**: tú los brainstormeas con otro agente y los rellenas aquí.
> El loop solo **lee** un topic y **cambia su `status`**.
>
> ## Schema de un topic
> ```
> ## <id> · <título>
> - id: T-NNN
> - section: combat | jutsu | exploration | presentation | balance | architecture
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
> architecture→a-review.

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
- status: pending
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
- status: pending
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

## T-013 · Escena de combate por capas (parallax + filtro CRT)
- id: T-013
- section: combat
- status: pending
- initialScore: 40
- targetScore: 85
- lensFocus: [PRESENTACION, ARQUITECTURA, SISTEMA]
- origen: separado de T-005 parte 3 (es feature de escena, no asset-gen puro)
- description: >
    Convertir el CinematicViewscreen de combate de una sola imagen (`enemy.image`) a la escena por
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

