# Combat-Art — Fórmulas de prompts para generación de assets

Fuente: `docs/guia_direccion_de_arte_combate.md` (§4). No añadas plantillas que no deriven de
este patrón; al adaptarlas a otra región/bioma cambia solo el sujeto y la paleta, conserva el
**style lock** de abajo.

## Style lock (canon)

| Qué generas | Descriptor primario | Evitar |
|-------------|---------------------|--------|
| **Personajes / cutouts / pósters / skills** | `painted digital illustration, high quality, cel-shaded edges, black/dark outlines, neo-retro seinen atmosphere` | `16-bit pixel art sprite`, `SNES game asset style` como estilo principal |
| **Láminas de location (BG / MID / FG)** | Painted HQ + opcional `subtle pixel grain`, `neo-geo arcade mood`, `slight posterization` | Convertir la placa entera en tileset 8/16-bit chunky |
| **Chrome UI** | Fuera de estos prompts → skill `pixel-arcade` | Mezclar pixel-UI dentro del prompt del sujeto |

**Opcional sutil en escénicos:** grain ligero, posterización suave, mood arcade — **nunca** aplastar
sujetos pintados a sprites chunky 8-bit.

## Patrón base común
- Tipo de asset: `background` / `middleground` / `character portrait` / `cutout sprite`.
- Estilo de contenido: `painted digital illustration, high quality` + `cel-shaded` + `hard black outlines` + `neo-retro seinen`.
- Paleta declarada explícitamente (ej. `cool blue and dark purple color palette`).
- Elementos componibles por capa → **chroma key sólido** (ver § Chroma key). No confiar en
  “transparent background” del generador ni en matte negro.
- Escénicos en `--ar 16:9` (encajan en la escena 1024×576).
- Cutouts: frase anti-drift opcional: `NOT 16-bit pixel art, NOT SNES sprite`.

## Chroma key para cutouts (regla de producción)
Cualquier asset que vaya a recortarse a alpha real (`enemy_cut_*`, hero cutouts, láminas mid/fg,
props con silueta libre) se genera sobre un **fondo plano de un solo color keyable**:

| Caso | Color de fondo | Frase de prompt |
|------|----------------|-----------------|
| Default (la mayoría de sprites) | Verde puro `#00FF00` | `flat pure green screen background #00FF00, no gradients, no cast shadows on background` |
| Sujeto con mucho verde (musgo, follaje, chakra verde, slime…) | Magenta `#FF00FF` o azul `#0000FF` | `flat pure magenta screen background #FF00FF…` (o blue) |

- **Prohibido** matte negro / gris oscuro como fondo de cutout: se come ropa oscura, pelo y botas.
- Tras generar: chroma-key → PNG RGBA (`enemy_cut_<id>.png`, etc.). El retrato UI puede quedarse
  con placa/fondo si hace falta; el cutout de combate siempre es alpha real.
- Preferir borde limpio del sujeto (outline negro) sin glow suave que contamine el key.

## Para fondos por capas (scenic elements)

**Fondo lejano (Lámina 5 / Capa 4 de la guía)**
```
Painted digital illustration background, high quality, distant view of a misty waterfall in a
forest at night under a crescent moon, cool blue and dark purple color palette, neo-retro
seinen atmosphere, optional subtle pixel grain, arcade scenic plate mood --ar 16:9
```

**Plano medio (Lámina 4 / Capa 3 de la guía)**
```
Painted digital illustration middleground, high quality, two massive ancient mossy trees
framing left and right sides of the screen, flat dirt ground path in the center, cel-shaded,
hard black outlines, isolated scenic element, flat pure green screen background #00FF00,
no gradients, no cast shadows on background, optional subtle pixel grain --ar 16:9
```

## Para retratos y sprites de enemigos (Asset Companion)

**Enemigo Boss / Rogue Ninja** (cutout-ready — green key)
```
Painted digital illustration, high quality character portrait of a dangerous ninja warrior
wearing a detailed metallic gas mask and ragged dark cloak, holding a small sickle weapon.
High-contrast cel-shaded lighting, hard black outlines, neo-retro seinen atmosphere,
isolated subject, flat pure green screen background #00FF00, no gradients, no cast shadows
on background. NOT 16-bit pixel art, NOT SNES sprite.
```

**Variante si el sujeto es verde-heavy** — sustituye el fondo por `#FF00FF` (magenta) o `#0000FF`.

## Pendientes (no fabricar)
La guía no documenta plantillas explícitas para: sprite del héroe jugable, capa de Primer Plano
(rocas/helechos) ni elementos de UI&FX. Si se necesitan, derívalas del style lock (painted HQ +
chroma para cutouts; pixel-arcade solo en chrome) y márcalas como extrapolación, no como spec
de la guía.
