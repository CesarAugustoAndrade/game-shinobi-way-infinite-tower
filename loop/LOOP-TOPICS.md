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
- status: pending
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
- status: pending
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
- status: pending
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

