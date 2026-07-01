# Diseño — Overhaul Cinemático de la Pantalla de Combate (T-014)

> Fecha: 2026-06-30 · Autoría externa al loop (brainstorming) → se vuelca a `loop/LOOP-TOPICS.md`.
> Resultado: 1 topic (T-014) de presentación con licencia de diseño.

## 1. Problema (diagnóstico de la captura actual)

La escena de combate (`src/scenes/combat/Combat.tsx`, resultado de T-004) se ve rota:

1. **El enemigo se renderiza como banner a sangre completa** (`CinematicViewscreen`, `aspect-21/9`, `object-cover`) → la ilustración se recorta/zoomea y el personaje **no se lee como enemigo**. Cae a un fallback (`/assets/image_3b2b13.jpg`).
2. **El `PlayerHUD` queda fuera de pantalla.** `.combat { height:100% }` + `.combat__interface { flex:1; justify-content:flex-end }` empujan la mano hacia abajo y el `PlayerHUD` (montado **después** de la interfaz) cae bajo el pliegue → **no se ve HP/Chakra del jugador**.
3. **Hueco vertical negro** entre el banner y la mano (el `flex:1`).
4. **Cartas poco legibles**: la carta sin recursos queda casi negra; texto de bajo contraste.
5. Atajos de teclado flotando sueltos en el centro, sin jerarquía.

## 2. Visión

Mantener un combate **cinemático**: el **enemigo + el fondo son el plano protagonista**; el jugador se representa **solo como HUD** (sin sprite del jugador). Todo debe verse **bien, correcto, en orden y completo**, sin huecos y sin elementos fuera de pantalla. Respeta los pilares de `loop/VISION.md` (legibilidad primero, feedback inmediato, sin dead code).

**Descartado:** el split-panel simétrico Pattern A (jugador vs enemigo lado a lado con sprites). El usuario quiere foco cinemático en el enemigo.

## 3. Deslinde con T-013 (ya existente)

Existe **T-013 · Escena de combate por capas (parallax + filtro CRT)**, separado de T-005 parte 3. Para no pisarse:

- **T-013 = CONTENIDO del stage**: render de 3 láminas (fondo/medio/primer plano), overlay CRT/scanlines, y re-corte de los retratos de enemigos a **sprites transparentes** para componer sobre las láminas.
- **T-014 (este) = ESTRUCTURA/ARREGLO de toda la escena**: el grid `stage / deck`, que el `PlayerHUD` esté **siempre visible**, eliminar el hueco, ordenar el deck, legibilidad de cartas y responsive.

T-014 define el **contenedor del stage**; T-013 lo **rellena** con las láminas. Orden (revisado 2026-07-02): **T-014 va ANTES de T-013** — primero la estructura (y el bug crítico del PlayerHUD fuera de pantalla), luego las láminas se montan dentro del stage nuevo. T-014 usa un encuadre interino (`object-contain` sobre `enemy.image`, enemigo entero, sin recorte) hasta que T-013 aporte las capas.

## 4. Wireframe aprobado

```text
╔══════════════════════════════════════════════════════════════════════╗
║                                              [🟢 BUFF 2] [🔥 DOT 3] ◂ enemy buffs (top-right)
║                                                                        ║
║                    B A C K G R O U N D   ( escena )                    ║   ◂ STAGE cinemático
║                                                                        ║     ocupa TODO el espacio
║                         🧍 ENEMIGO enmarcado                           ║     sobre el deck (1fr)
║                      (object-contain: se ve entero)                    ║     full-bleed width
║                                                                        ║
║   ┌────────────────────────────────────────────────────────────────┐ ║   ◂ "lower third" con
║   │ MERCENARY MONK                                       31 / 134    │ ║     scrim para legibilidad
║   │ ▸ CHUNIN · LIGHTNING    HP ██░░░░░░░░░░    Phys1+2% Elem4+7% …  │ ║
║   └────────────────────────────────────────────────────────────────┘ ║
╠══════════════════════════════════════════════════════════════════════╣   ◂ DECK (auto, anclado abajo)
║ 忍 UZUMAKI · Lv.5    HP ████████░░ 120/150    CP █████░░░ 40/80   🟢🔥 ║   ◂ Player HUD (SIEMPRE visible)
║ AP ▣▣▣▣▣ 5/5     🜲 AGGRESSIVE · BALANCED · DEFENSIVE    Z X C V·SPACE ║   ◂ Econ: AP + postura + hints
║ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  ║
║ │ TAIJUTSU │ │ FIREBALL │ │ SHURIKEN │ │   ...    │      [AUTO][END]  ║   ◂ Mano + controles
║ │  P PHYS  │ │  E FIRE  │ │  P PHYS  │ │          │                  ║
║ └──────────┘ └──────────┘ └──────────┘ └──────────┘                  ║
╚══════════════════════════════════════════════════════════════════════╝
```

## 5. Estructura y mediciones

- **Grid raíz**: `display:grid; grid-template-rows: 1fr auto; height:100dvh`.
  - **Stage = `1fr`**: llena todo el espacio sobre el deck → elimina el hueco negro.
  - **Deck = `auto`**: anclado abajo, alto por contenido.
- **Stage cinemático**: `min-height ~280px`; fondo full-bleed; enemigo entero (sin recorte raro); fallback claro si no hay arte; buffs del enemigo overlay top-right; floating text anclado al centro del stage. (El render por capas es de T-013.)
- **Lower-third (info enemigo)**: scrim en gradiente para contraste; nombre con `clamp()` (no `3rem` fijo que desborda); HP a ancho completo; tags (tier/afinidad) + fila de defensa con tooltip.
- **Deck**: `max-width ~1152px` centrado, padding `16–24px`; orden fijo **HUD → econ → mano → controles**.
  - Player HUD `~56–64px` (avatar de clan + nombre/Lv + HP/CP/XP + buffs), **siempre visible**.
  - Econ: AP pips + `PostureIndicator` + hints de teclado.
  - Mano: cartas legibles también sin recursos (atenuadas, **no casi negras**).
  - Controles: `AUTO` / `END TURN` alineados a la derecha.
- **Mobile (<768px)**: el stage reduce `min-height`; el deck compacta/hace scroll.
- **Z-index**: stage < deck < tooltips < floating text < modales.

## 6. Crear / retirar (sin dead code)

- Reorganizar `Combat.tsx` a la estructura grid `stage / deck`.
- Conservar `CinematicViewscreen` como base del stage (compatible con las capas de T-013), pero **enmarcando al enemigo** (no banner recortado).
- **Integrar `PlayerHUD` dentro del deck** (no montado suelto al final).
- **Preservar todas las features de T-004**: mano de cartas, AP pips, `PostureIndicator`, atajos Z/X/C/V/SPACE/TAB, auto-combat, floating text.
- Ajustar `Combat.css` (y `SkillCard.css` si hace falta) a las nuevas medidas y al contraste de cartas.

## 7. Topic para LOOP-TOPICS.md

### T-014 · Overhaul Cinemático de la Pantalla de Combate
- id: T-014
- section: presentation
- status: pending
- initialScore: 35
- targetScore: 85
- lensFocus: [PRESENTACION]
- description: >
    Rehacer el LAYOUT de la escena de combate a un formato cinemático legible y completo, con licencia de diseño.
    El maker usa la skill `frontend-design` (NO `combat-ui-pattern-a`: se descarta el split-panel simétrico).
    Deslinde: T-013 hace el contenido por capas del stage; este topic hace la estructura/arreglo de toda la escena.
    1. Grid raíz `grid-template-rows: 1fr auto; height:100dvh`: stage cinemático (1fr) + deck anclado abajo (auto), sin huecos.
    2. Stage: enemigo entero y centrado (sin recorte raro), compatible con las láminas de T-013; lower-third con scrim para el
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

## 8. Decisiones registradas

- **Cinemático, no Pattern A**: foco en enemigo + fondo; jugador solo HUD (sin sprite). Evita depender de arte del jugador inexistente y reduce churn.
- **Clave del fix**: `grid-rows: 1fr auto` (stage/deck) resuelve el hueco y el `PlayerHUD` fuera de pantalla de un solo golpe.
- **Orden en el backlog** (revisado 2026-07-02): T-014 corre **antes** de T-013 — arregla la estructura y el bug más crítico (PlayerHUD invisible) primero; T-013 monta el parallax dentro del stage nuevo, evitando retrabajo.
- **Section presentation → frontend-design** para este topic (no el split-panel de combat-ui-pattern-a).
