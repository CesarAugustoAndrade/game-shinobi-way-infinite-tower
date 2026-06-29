# Combat-Art — Fórmulas de prompts para generación de assets

Fuente: `docs/guia_direccion_de_arte_combate.md` (§4). No añadas plantillas que no deriven de
este patrón; al adaptarlas a otra región/bioma cambia solo el sujeto y la paleta, conserva los
descriptores de estilo (`16-bit pixel art`, `black outlines`, `cel-shaded`, transparencia, `--ar`).

## Patrón base común
- `16-bit pixel art` + tipo de asset (`background` / `middleground` / `sprite portrait`).
- Paleta declarada explícitamente (ej. `cool blue and dark purple color palette`).
- Estilo arcade retro de referencia: `Sega Genesis aesthetic` / `SNES game asset style`.
- `black outlines` + `cel-shaded lighting` (coherente con las reglas de sprite, §2 del SKILL).
- Elementos componibles por capa → `transparent background` / `alpha transparent background` +
  `clean pixel boundaries`.
- Escénicos en `--ar 16:9` (encajan en la escena 1024×576).

## Para fondos por capas (scenic elements)

**Fondo lejano (Lámina 5 / Capa 4 de la guía)**
```
16-bit pixel art background, distant view of a misty waterfall in a forest at night under a
crescent moon, cool blue and dark purple color palette, Sega Genesis aesthetic, retro gaming
environment --ar 16:9
```

**Plano medio (Lámina 4 / Capa 3 de la guía)**
```
16-bit pixel art middleground, two massive ancient mossy trees framing left and right sides of
the screen, flat dirt ground path in the center, transparent background element style, clean
pixel boundaries --ar 16:9
```

## Para retratos y sprites de enemigos (Asset Companion)

**Enemigo Boss / Rogue Ninja**
```
16-bit pixel art sprite portrait of a dangerous ninja warrior wearing a detailed metallic gas
mask and ragged dark cloak, holding a small sickle weapon. High-contrast cel-shaded lighting,
black outlines, alpha transparent background, SNES game asset style.
```

## Pendientes (no fabricar)
La guía no documenta plantillas explícitas para: sprite del héroe jugable, capa de Primer Plano
(rocas/helechos) ni elementos de UI&FX. Si se necesitan, derívalas del patrón base manteniendo los
descriptores de estilo y márcalas como extrapolación, no como spec de la guía.
