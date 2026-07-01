# Diseño — Migración Pixel-Arcade del Resto de Pantallas (T-017, T-018)

> Fecha: 2026-07-02 · Autoría externa al loop (brainstorming) → se vuelca a `loop/LOOP-TOPICS.md`.
> Resultado: 2 topics de presentación (economía primero, secundarias después).

## 1. Problema

T-001 llevó el **chasis global** al estilo PIXEL-ARCADE (fuentes Silkscreen/VT323, botones/paneles blocky, sombras duras sin blur) y T-007 hizo el RegionMap. Pero los marcadores pixel-arcade (`sw-pix-shadow`, `Silkscreen`, `VT323`, `--sw-hard`) **solo** aparecen hoy en `Combat.css`, `Event.css`, `MainMenu.css`, `CharacterSelect.css`. El resto de pantallas sigue con el estilo viejo (bordes redondeados, sombras con blur, `rgba()` suaves — p. ej. `Merchant.css` con 34 de esos), rompiendo la consistencia visual.

## 2. Visión

Migrar las pantallas restantes al mismo lenguaje PIXEL-ARCADE del proyecto, usando la skill local `pixel-arcade` (y `frontend-design` para el layout) y los tokens del design-system (`src/styles/design-system/`). **Solo tocar el chasis de UI** (tipografía, botones, ventanas/paneles/tarjetas, sombras duras): **mantener intactos** sprites, ilustraciones y arte pintado, igual que hizo T-001.

## 3. Alcance y exclusiones

**Pantallas a migrar** (11 + modales):
- Recompensas: `Loot`, `ScrollDiscovery`, `TreasureChoice`, `TreasureHuntReward`
- Actividades: `Merchant` (tienda), `Training`
- Combate: `EliteChallenge`
- Menú secundario: `GameGuide`, `GameOver`
- Modales: `RewardModal`, `EventResultModal`, `DiceRollResultModal`

**Excluidas (ya tienen dueño):** `Event` (presentación en T-011), `Combat` (overhaul en T-014), `RegionMap` (T-007, hecho), `MainMenu`/`CharacterSelect` (T-001, hecho).

## 4. Reparto en dos topics

- **T-017 · Alto tráfico / economía** (lo que el jugador ve más a menudo): `Merchant`, `Loot`, `TreasureChoice`, `TreasureHuntReward`, `ScrollDiscovery`, `EliteChallenge` + `RewardModal`.
- **T-018 · Secundarias**: `Training`, `GameGuide`, `GameOver` + `EventResultModal`, `DiceRollResultModal`.

Cada topic pasa el gate de 4 lentes por separado; se procesan en orden.

## 5. Criterios de aceptación (ambos)

- Botones, ventanas/paneles/tarjetas con bordes gruesos, relleno sólido y **sombras duras sin blur**; hundimiento al click (patrón de T-001).
- Tipografía Silkscreen/VT323 mapeada por variables CSS (nada de fuentes sueltas).
- Reutilizar tokens `--sw-*` del design-system; **cero valores hardcodeados** de color/espaciado en los componentes.
- Legibilidad primero: jerarquía clara, sin layout roto ni texto cortado (pilar VISION PRESENTACIÓN).
- **No** alterar el arte pintado/ilustraciones/sprites.
- Sin dead code: retirar estilos viejos que se reemplacen.
- Entregar mockup ASCII-box (estilo CLAUDE.md) de al menos las pantallas de economía antes de implementar.

## 6. Topics para LOOP-TOPICS.md

### T-017 · Pixel-Arcade: pantallas de economía/recompensa
- id: T-017
- section: presentation
- status: pending
- initialScore: 45
- targetScore: 85
- lensFocus: [PRESENTACION]
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

### T-018 · Pixel-Arcade: pantallas secundarias
- id: T-018
- section: presentation
- status: pending
- initialScore: 50
- targetScore: 85
- lensFocus: [PRESENTACION]
- description: >
    Continuar la migración PIXEL-ARCADE (skill local `pixel-arcade` + `frontend-design`, tokens del design-system) en las
    pantallas secundarias, con los mismos criterios que T-017 (botones/paneles blocky, sombras duras, Silkscreen/VT323, sin
    hardcodeados, sin dead code, arte intacto). Pantallas: Training, GameGuide, GameOver, y los modales EventResultModal y
    DiceRollResultModal.
- entryPoints:
    - src/scenes/activities/Training.tsx
    - src/scenes/menu/GameGuide.tsx
    - src/scenes/menu/GameOver.tsx
    - src/components/modals/EventResultModal.tsx
    - src/components/modals/DiceRollResultModal.tsx

## 7. Decisiones registradas

- **Dos topics** (economía primero) para que cada gate sea limpio y priorizar lo que el jugador ve más.
- **Skill `pixel-arcade`** es la guía primaria (existe en `.agents/skills/pixel-arcade`); `frontend-design` para el layout.
- **Excluir** Event/Combat/RegionMap/MainMenu/CharacterSelect: ya tienen dueño (T-011/T-014/T-007/T-001) → evitar churn y solapamiento.
- **Solo chasis de UI**, arte pintado intacto (mismo principio que T-001).
