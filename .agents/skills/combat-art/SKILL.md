---
name: combat-art
description: >-
  Dirección de arte para las escenas de batalla y los sprites de Shinobi Way (estilo 16-bit
  Neo-Retro / Neo Geo–Capcom arcade). Úsalo siempre que haya que diseñar, componer o generar
  assets de combate: fondos por capas, sprites/retratos de héroes o enemigos, auras de chakra,
  HUD de batalla, overlay CRT/scanlines, o cuando se escriban prompts de generación de imágenes
  para la escena de combate. Define las 5 láminas de composición (z-index), las reglas de sprite
  (outlines, cel-shading, halo de chakra), la implementación CSS (capas, auras por filtro, CRT)
  y las fórmulas de prompts. Dispara con: "escena de combate", "sprite de enemigo/boss",
  "fondo por capas", "aura de chakra", "filtro CRT/scanlines", "prompt de asset de batalla".
---

# Combat Art Direction (16-Bit Neo-Retro)

Las batallas de Shinobi Way se construyen como una **cabina arcade Neo Geo / Capcom**: capas
superpuestas con profundidad, sprites de outline duro y cel-shading, auras de chakra por CSS y un
overlay CRT que une todo en "una sola pantalla de tubo". Regla de oro heredada de `pixel-arcade`:
**el marco/chrome es arcade, el contenido ilustrado es heroico** — el pixel-art vive en la
composición y el HUD, no aplasta los sprites pintados.

> Fuente de verdad: `docs/guia_direccion_de_arte_combate.md`. No inventes especificaciones fuera
> de ese documento; lo que no esté ahí, márcalo como pendiente, no lo fabriques.

## Estado actual
La estructura por capas + CRT descrita aquí es el **objetivo de diseño** de la guía. A día de hoy
`src/scenes/combat/Combat.css` NO implementa todavía las clases `.layer-*` ni el `.crt-overlay`.
Al implementar, usa los tokens reales del design-system (`src/styles/design-system/_variables.css`,
prefijo `--sw-*`) en lugar de los valores hardcodeados de la guía, salvo los que el design-system
no cubre (aspect ratio de escena, scanlines).

## 1. Composición por capas — las 5 láminas
La escena NO es un fondo plano: son láminas apiladas para dar parallax y animación focalizada sin
sobrecargar el render. De atrás (z bajo) hacia delante (z alto):

| # | Lámina | z-index (guía) | Contenido | Función |
|---|--------|----------------|-----------|---------|
| 5 | **Fondo** | 10 | Cielo nocturno degradado (azul oscuro→violeta), luna creciente, montañas boscosas en niebla, cascada central | Atmósfera + profundidad. Tonos fríos/desaturados para que resalten los personajes. La cascada se anima con un loop de 4 frames |
| 4 | **Plano Medio** | 20 | Suelo de tierra/arena transitable, dos árboles monumentales con musgo/hiedra que enmarcan el duelo | Base física donde se posicionan los sprites; los árboles laterales son límites visuales |
| 3 | **Sprites** | 30 | Personajes (héroe y enemigo) | Capa propia para animar y aplicar auras de forma focalizada (ver §2). Conceptualmente "viven" sobre el Plano Medio pero se separan técnicamente |
| 2 | **Primer Plano** | 40 | Rocas oscuras en los extremos inferiores, helechos pixelados | Oclusión: tapa parcialmente suelo y pies en los extremos → profundidad 3D en un entorno 2D |
| 1 | **UI & FX** | 50 | Auras de chakra, barras HP/Chakra con gradientes, iconos en botones dorados, textos del HUD | Capa interactiva: estado del combate y decisiones del jugador |

Sobre todo ello va el **overlay CRT/scanlines** (z 100) que funde la composición en una imagen de
monitor de tubo.

Nota de z-index: la guía usa 10/20/30/40/50 y CRT a 100. El design-system reserva `--sw-z-*` para
el chrome de la app (`--sw-z-tooltip: 100`), así que **renderiza las capas dentro del propio
stacking context de la escena de combate** (un contenedor `position: relative; isolation: isolate`)
para que el CRT no compita con tooltips globales.

## 2. Reglas de estilo de sprites (Neo Geo / Capcom)
- **Outlines (delineado oscuro)**: borde definido de **1–2px** en todos los personajes. Evita que el
  sprite se "mezcle" con los detalles del bosque.
- **Cel-shading dinámico**: limita las sombras a **4–5 tonos** por bloque de color. Nada de degradados
  modernos suaves: rompen la ilusión del píxel.
- **Halo de chakra (inner & outer glow)**: brillo externo sutil que proyecta luz secundaria sobre los
  bordes del propio sprite y le da volumen. Color por bando:
  - Héroe → verde/amarillo (mapea a `--sw-clan-lee #22c55e` / `--sw-risk-safe-light`).
  - Enemigo → azul/celeste (chakra oscuro/elemental).

  El halo NO se dibuja a mano por sprite: se aplica con filtro CSS dinámico (ver §3).

## 3. Implementación técnica CSS
El bloque CSS completo (capas z-index, auras por `filter: drop-shadow` + `image-rendering: pixelated`,
y el overlay CRT/scanlines + curvatura de pantalla) vive en
**`references/css-implementation.css`** — copia y mapea a los tokens `--sw-*` reales. Resumen:

- **Capas**: contenedor `.combat-scene` 1024×576 (16:9 arcade), `overflow: hidden`; cada `.layer-*`
  es `position: absolute` con su z-index.
- **Auras**: dos `drop-shadow` apilados (glow amplio + halo fino) sobre el sprite, más
  `image-rendering: pixelated` para que el navegador no suavice los píxeles. Evita duplicar sprites
  con auras pintadas.
- **CRT**: `::after` con `linear-gradient` a `background-size: 100% 4px` (scanlines), `pointer-events:
  none` para no bloquear los botones; `box-shadow: inset` para curvatura esférica sutil.

Lee ese archivo antes de tocar `src/scenes/combat/Combat.css`.

## 4. Fórmulas de prompts para generación de assets
Las plantillas de prompt (fondos por capa, sprites/retratos de enemigos y boss) y cómo extenderlas a
otras regiones/biomas están en **`references/asset-prompts.md`**. Patrón base común: `16-bit pixel
art`, paleta declarada, `black outlines`, `cel-shaded`, fondo transparente para elementos componibles
y `--ar 16:9` en los escénicos.

## Coherencia con `pixel-arcade`
Esta skill cubre el **contenido de la escena** (sprites + fondos + FX); `pixel-arcade` cubre el
**chrome de la UI** (fuentes, botones, ventanas). Comparten vocabulario: tipografía
`--sw-font-display` (Silkscreen) en el HUD, sombras duras sin blur, esquinas casi rectas
(`--sw-radius-*`). Mantén ambas alineadas: el HUD de batalla (lámina UI&FX) es chrome pixel-arcade
sobre una escena ilustrada combat-art.

## Recursos del skill
- `references/css-implementation.css` — capas z-index, auras por filtro y overlay CRT, listos para
  mapear a `--sw-*`.
- `references/asset-prompts.md` — fórmulas de prompts de IA para fondos por capa y sprites/retratos.
