# Diseño — Simulador Multi-Locación con Itemización (T-015)

> Fecha: 2026-07-01 · Autoría externa al loop (brainstorming) → se vuelca a `loop/LOOP-TOPICS.md`.
> Resultado: 1 topic (T-015) de balance/simulación.

## 1. Problema

El `LocationSimulator.ts` (T-006 Fase B.1) mide el desgaste de **una sola locación** con carry-over de HP/chakra, pero tiene dos límites que impiden medir la curva de poder real:

1. **Una locación por run.** El juego real es una progresión de **varias locaciones** (nivel región, `dangerLevel` creciente). Nunca mide cómo aguanta el jugador una secuencia larga.
2. **Ignora la itemización.** `merchant / event / treasure` se marcan **NEUTRAL** y `createSimPlayer` arma un build **estático sin equipo**. El jugador nunca gana, equipa ni compra objetos → el simulador no puede ver si la curva de loot mantiene el ritmo del escalado enemigo.

## 2. Visión

Un **run multi-locación (nivel región)** con carry-over completo que **modele la itemización a profundidad media**: el loot cae, el jugador se equipa/vende con una heurística, hay economía de ryo con compras en merchant, y los stats se recalculan entre peleas. El objetivo es de **balance**: ver si el poder por objetos escala junto al peligro a lo largo de varias locaciones, y dónde se rompe.

**Profundidad media (elegida):** loot + auto-equipar + ryo/merchant. **Síntesis (componentes→artefactos) queda como stretch opcional**, no requerida para el gate.

## 3. Diseño

### 3.1 Run multi-locación (carry-over)
- Encadenar **N locaciones** con `dangerLevel` creciente (p. ej. 1→7, o hasta morir / tope configurable), reutilizando el generador real (`generateBranchingFloorFromConfig`) y la máquina de navegación real, igual que el `LocationSimulator` actual.
- **Persisten entre locaciones**: HP/chakra (desgaste), **ryo**, **equipment (4 slots)**, **componentBag**, XP/nivel.
- **Leveling fiel**: los combates otorgan XP/ryo con el cálculo real (`RegionSystem.calculateLocationXP/Ryo` + level-up de `StatSystem`) para que la progresión no quede artificialmente estancada. El nivel deja de ser fijo.
- Cada combate sigue siendo un encuentro FRESCO (mirroring `startCombat`), solo carry-over de recursos/gear.

### 3.2 Itemización (nuevo, profundidad media)
- **Drops**: combats/eliteChallenge/treasure generan loot con `LootSystem` real (`generateLoot`, `generateRandomArtifact`, `generateComponent`) según floor/difficulty.
- **IA de itemización** (heurística determinista, sin React):
  - Al obtener un item: calcular un **score de build** (suma ponderada de los stats que le importan al build, reusando `equipmentFocus`) para el item vs. el equipado en ese slot.
  - **Equipar** si mejora el score (`equipItem`); si no, **vender** por ryo (`sellItem`) o descartar si el bag está lleno.
  - **Merchant**: comprar upgrades asequibles con el ryo acumulado (mismo score heurístico), respetando `merchantSlots`.
- **Recalcular stats** con `getPlayerFullStats` (incluye `equipmentBonuses` + `EquipmentPassiveSystem`) **antes de cada combate**, para que el gear afecte de verdad (los pasivos `combat_start`/`on_hit`/etc. ya los aplica el motor).
- **Stretch opcional (no gate)**: `synthesize` de dos componentes del bag cuando forme un artefacto claramente mejor.

### 3.3 Reporte (valor de balance)
- **Clear rate por profundidad de locación** (locación 1..N) y **profundidad de muerte más común**.
- **Curva de poder**: stats efectivos del jugador (con gear) vs escalado enemigo por locación → ver si el loot mantiene el ritmo.
- **Comparativa con/sin itemización**: correr el mismo seed con itemización ON/OFF para aislar el aporte del gear al clear rate (esta es la señal clave).
- **Economía de ryo**: ganado vs gastado, y cuánto valor de gear se acumuló.
- Determinista por seed (PRNG global ya instalado en `index.ts`).

### 3.4 CLI
- Nuevo modo `--campaign` (o extender `--location` con `--locations <n>` y `--items on|off`) en `src/simulation/index.ts`, con su bloque de ayuda y scripts npm (`simulate:campaign`).

## 4. Topic para LOOP-TOPICS.md

### T-015 · Simulador Multi-Locación con Itemización
- id: T-015
- section: balance
- status: pending
- initialScore: 40
- targetScore: 85
- lensFocus: [BALANCE, ARQUITECTURA]
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

## 5. Decisiones registradas

- **Profundidad media** de itemización (loot + equipar + ryo/merchant); síntesis como stretch para no meter ruido ni una IA compleja.
- **Reusar los sistemas reales** (LootSystem, StatSystem, RegionSystem, EquipmentPassiveSystem) → el simulador no debe reimplementar reglas; solo orquestar y medir. No tocar la matemática de combate congelada.
- **Comparativa con/sin itemización** como métrica estrella: aísla el aporte del gear, que es el punto del pedido.
- **Leveling incluido** en el carry-over para que el run multi-locación sea fiel (si no, el jugador se queda atrás del escalado y el dato se sesga).
- **Section balance** → el maker usa qa-balance + el simulador.
