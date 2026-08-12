---
name: combat-art
description: >-
  Dirección de arte para las escenas de batalla y los sprites de Shinobi Way (painted HQ
  neo-retro + chrome pixel-arcade). Úsalo siempre que haya que diseñar, componer o generar
  assets de combate: fondos por capas, sprites/retratos de héroes o enemigos, auras de chakra,
  HUD de batalla, overlay CRT/scanlines, o cuando se escriban prompts de generación de imágenes
  para la escena de combate. Define las 5 láminas de composición (z-index), las reglas de sprite
  (outlines, cel-shading, halo de chakra — painted HQ, no 16-bit puro), la implementación CSS
  (capas, auras por filtro, CRT) y las fórmulas de prompts. Dispara con: "escena de combate",
  "sprite de enemigo/boss", "fondo por capas", "aura de chakra", "filtro CRT/scanlines",
  "prompt de asset de batalla".
---

# Combat Art Direction (Painted HQ Neo-Retro)

Las batallas de Shinobi Way se construyen como un **duelo pintado en cabina arcade**:

| Capa | Estilo |
|------|--------|
| **Contenido** (sprites, pósters, skills, láminas) | **Painted HQ** — ilustración digital neo-retro, cel-shaded, outlines duros, atmósfera seinen |
| **Chrome** (UI, HUD, fuentes, sombras) | **Pixel-arcade** retro |
| **Opcional** | CRT/scanlines ligeros, grain sutil en BG escénico — **nunca** aplastar sujetos a 8-bit chunky |

Regla de oro (alineada con `pixel-arcade`): **el marco/chrome es arcade; el contenido ilustrado es heroico y pintado.** El pixel-art no es el estilo principal de personajes ni enemigos.

> Fuente de verdad: `docs/guia_direccion_de_arte_combate.md`. No inventes especificaciones fuera
> de ese documento; lo que no esté ahí, márcalo como pendiente, no lo fabriques.

## Estado actual
La estructura por capas + CRT descrita aquí es el **objetivo de diseño** de la guía. A día de hoy
`src/scenes/combat/Combat.css` NO implementa todavía las clases `.layer-*` ni el `.crt-overlay`.
Al implementar, usa los tokens reales del design-system (`src/styles/design-system/_variables.css`,
prefijo `--sw-*`) en lugar de los valores hardcodeados de la guía, salvo los que el design-system
no cubre (aspect ratio de escena, scanlines).

Los assets reales de combate (cutouts de enemigo, heroes, placas) son **pintura HQ / anime-seinen**,
no sprites SNES. Los prompts y la skill deben reflejar esa realidad.

## 1. Composición por capas — las 5 láminas
La escena NO es un fondo plano: son láminas apiladas para dar parallax y animación focalizada sin
sobrecargar el render. De atrás (z bajo) hacia delante (z alto):

| # | Lámina | z-index (guía) | Contenido | Función |
|---|--------|----------------|-----------|---------|
| 5 | **Fondo** | 10 | Cielo nocturno degradado (azul oscuro→violeta), luna creciente, montañas boscosas en niebla, cascada central | Atmósfera + profundidad. Tonos fríos/desaturados para que resalten los personajes. Cascada animable (loop / scroll). Placa painted HQ; grain pixel opcional |
| 4 | **Plano Medio** | 20 | Suelo de tierra/arena transitable, dos árboles monumentales con musgo/hiedra que enmarcan el duelo | Base física donde se posicionan los sprites; los árboles laterales son límites visuales |
| 3 | **Sprites** | 30 | Personajes (héroe y enemigo) — cutouts painted HQ | Capa propia para animar y aplicar auras de forma focalizada (ver §2) |
| 2 | **Primer Plano** | 40 | Rocas oscuras en los extremos inferiores, vegetación de oclusión | Oclusión: tapa parcialmente suelo y pies en los extremos → profundidad 3D en un entorno 2D |
| 1 | **UI & FX** | 50 | Auras de chakra, barras HP/Chakra, iconos, textos del HUD | **Chrome pixel-arcade** interactivo sobre escena pintada |

Sobre todo ello va el **overlay CRT/scanlines** opcional (z 100) — sutil, mood de tubo, no aplastar pintura.

Nota de z-index: la guía usa 10/20/30/40/50 y CRT a 100. El design-system reserva `--sw-z-*` para
el chrome de la app (`--sw-z-tooltip: 100`), así que **renderiza las capas dentro del propio
stacking context de la escena de combate** (un contenedor `position: relative; isolation: isolate`)
para que el CRT no compita con tooltips globales.

## 2. Reglas de estilo de sprites (Painted HQ + legibilidad arcade)
- **Outlines (delineado oscuro)**: borde definido (~1–2px a escala de asset o trazo duro) en todos
  los personajes. Evita que el sujeto se mezcle con bosque/niebla.
- **Cel-shading**: sombras en bloques legibles (pocos tonos por zona). Nada de fotorealismo suave
  que mate la silueta de combate. Posterización ligera opcional como polish neo-retro.
- **Painted HQ**: detalle de tela, metal, rostro y volumen propio de ilustración digital de calidad.
  **No** generar ni pedir “16-bit pixel art sprite” / “SNES asset” como estilo principal.
- **Halo de chakra (inner & outer glow)**: brillo externo sutil que da volumen. Color por bando:
  - Héroe → verde/amarillo (mapea a `--sw-clan-lee #22c55e` / `--sw-risk-safe-light`).
  - Enemigo → azul/celeste (chakra oscuro/elemental).

  El halo NO se dibuja a mano por sprite: se aplica con filtro CSS dinámico (ver §3).
- **Alpha**: cutouts siempre RGBA real procesados con la suite **Deep Clean** (`scripts/deep_clean_all_enemies.py`: detección croma + alpha erosion + full-channel despilling `g = max(r, b)` + zero RGB) sin puntitos ni halo. Ver `docs/guia_direccion_de_arte_combate.md` §5.

## 3. Implementación técnica CSS
El bloque CSS completo (capas z-index, auras por `filter: drop-shadow`, overlay CRT/scanlines +
curvatura) vive en **`references/css-implementation.css`** — copia y mapea a los tokens `--sw-*`
reales. Resumen:

- **Capas**: contenedor `.combat-scene` 1024×576 (16:9 arcade), `overflow: hidden`; cada `.layer-*`
  es `position: absolute` con su z-index.
- **Auras**: dos `drop-shadow` apilados (glow amplio + halo fino) sobre el sprite. **No** forzar
  `image-rendering: pixelated` en cutouts painted HQ (aplasta detalle); reservar pixelated a
  iconos/chrome UI si aplica.
- **CRT**: `::after` con `linear-gradient` a `background-size: 100% 4px` (scanlines), `pointer-events:
  none`; `box-shadow: inset` para curvatura esférica sutil. Intensidad baja.

Lee ese archivo antes de tocar `src/scenes/combat/Combat.css`.

## 4. Fórmulas de prompts para generación de assets
Las plantillas de prompt (fondos por capa, sprites/retratos de enemigos y boss) y cómo extenderlas a
otras regiones/biomas están en **`references/asset-prompts.md`**.

**Style lock de prompts:**
- Contenido: `painted digital illustration, high quality, cel-shaded, hard black outlines, neo-retro seinen`
- Escénicos: painted + opcional `subtle pixel grain` / neo-geo mood
- **No** usar `16-bit pixel art sprite` / `SNES game asset style` como descriptor primario de personajes

**Cutouts / alpha real:** al generar cualquier asset que se vaya a recortar (`enemy_cut_*`, heroes,
láminas mid/fg, props), usa **green screen plano `#00FF00`** (chroma key), no matte negro ni
“transparent background” del generador. Si el sujeto lleva mucho verde, usa **magenta `#FF00FF`** o
**azul `#0000FF`**. Detalle y tabla en `references/asset-prompts.md` § Chroma key.

## Coherencia con `pixel-arcade`
Esta skill cubre el **contenido de la escena** (sprites + fondos + FX); `pixel-arcade` cubre el
**chrome de la UI** (fuentes, botones, ventanas). Comparten vocabulario: tipografía
`--sw-font-display` (Silkscreen) en el HUD, sombras duras sin blur, esquinas casi rectas
(`--sw-radius-*`). Mantén ambas alineadas: el HUD de batalla (lámina UI&FX) es chrome pixel-arcade
sobre una escena **painted HQ** combat-art.

## Recursos del skill
- `references/css-implementation.css` — capas z-index, auras por filtro y overlay CRT, listos para
  mapear a `--sw-*`.
- `references/asset-prompts.md` — fórmulas de prompts de IA para fondos por capa y sprites/retratos.
