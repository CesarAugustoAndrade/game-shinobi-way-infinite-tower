# Enemy Art Canon — Buenos vs Malos

Fuente de verdad del criterio de calidad de assets de enemigos (retratos de combate).  
Derivado de la clasificación en `buenos/` y `malos/`.

**Fórmula en una frase**

> Retrato 2D anime-seinen con outline duro, cel-shade, silueta icónica y props del mundo shinobi/Wave — generado en chroma verde `#00FF00` (o magenta `#FF00FF` si el sujeto tiene verde) — listo para cutout/panel — nunca fotoreal, nunca PMC/D&D/obra moderna, nunca escena con suelo ni matte negro.

Alineado con `combat-art` / `docs/guia_direccion_de_arte_combate.md`: **painted HQ neo-retro**, no pixel-art de personaje.

---

## Carpetas

| Carpeta | Significado |
|---------|-------------|
| `buenos/` | Assets que cumplen el canon (referencia positiva) |
| `malos/` | Assets que fallan algún gate (referencia negativa / regenerar) |

---

## Qué es BUENO

### 1. Medio y técnica (no negociable)

- Ilustración **2D anime/manga seinen** (no foto, no 3D CGI).
- **Outlines negros duros** en silueta y formas internas.
- **Cel-shading**: bloques de color legibles; pocas sombras suaves.
- Aspecto de **cómic pintado HQ** (painted neo-retro).

Los buenos se leen como **el mismo set de cartas del mismo juego**.  
Los fotorealistas parecen de **otro producto**.

### 2. Composición de asset

| Regla | Bueno | Malo típico |
|--------|--------|-------------|
| Fondo (generación) | **Chroma key plano** (ver § Chroma key) | Escena, suelo, muelle, matte negro |
| Fondo (producto final / referencia visual) | Negro puro o alpha real tras cutout | Entorno en el asset |
| Encuadre | Busto / ¾ torso, llena el cuadro | Cuerpo completo + props de entorno |
| Sujeto | Solo el personaje (+ arma) | Personaje + escenario |
| Silueta | Icónica, legible a tamaño UI | Ruido (mochila, gafas, MOLLE, muelle) |

### 2b. Chroma key (generación de enemigos)

Al **generar** cualquier enemigo (y sus cutouts `enemy_cut_*`), el fondo es **chroma key sólido plano**, nunca negro ni “transparent” del generador.

| Caso | Color de fondo | Hex |
|------|----------------|-----|
| **Default** (casi todos los enemigos) | Verde pantalla puro | `#00FF00` |
| **Sujeto con mucho verde** (musgo, follaje, slime, chakra verde, ropa/piel verde, etc.) | Magenta / hot-pink | `#FF00FF` |

Reglas:

- **Por defecto: verde `#00FF00`.**
- **Si el personaje o sus props son verdes (o verde-dominantes): magenta `#FF00FF`.**
- Fondo **plano, uniforme, sin gradientes ni textura** (para que el key limpie bien).
- Después de generar: **chroma-key → PNG RGBA real**. No confiar en matte negro para cutouts nuevos.
- No mezclar verde y magenta en el mismo batch sin criterio: el color del key se elige por el sujeto.

### 3. Registro del mundo (Land of Waves / shinobi)

**Pertenece al universo:**

- Japón / shinobi / seinen: kimono, haori, kabuto, ofuda, kanji, hitai-ate, katana, tatuajes yakuza, oni, yokai.
- Grit moderno **solo si es anime-canon** (ej. Gato + pistola; thug con tank top + kanji).
- Violencia como **tinta gráfica** (sangre/sudor de cómic), no gore fotoreal.

**Rompe el mundo (malo):**

| Asset (ej. en `malos/`) | Por qué falla |
|-------------------------|----------------|
| `corrupt_foreman` | Casco amarillo “FOREMAN / SITE 7” → obra moderna occidental |
| `dock_worker` | “PORT AUTHORITY 47”, botas de seguridad → burocracia portuaria actual |
| `corrupt_guard` | Casco tipo WWI + lanza → soldado europeo, no guarda de Wave |
| `elite_mercenary` | Plate carrier / MOLLE / dog tags → PMC contemporáneo |
| `trap_master` | Goggles steampunk + chaleco táctico → tech-fantasy ajeno |
| `desperate_traveler` | Aventurera D&D / ranger occidental |
| `cove_smuggler` | Pirata genérico **sobre muelle** (escena, no portrait) |
| `sea_creature` | Horror lovecraft/neón abismal, no monstruo de mar shinobi |

### 4. Identidad y legibilidad

En **~0.3 s** debe quedar claro *quién* es:

| Rol | Lectura rápida |
|-----|----------------|
| Ronin | Kimono roto + katana a medio desenvainar |
| Samurai | Armadura + topknot + katana |
| Gato | Kimono púrpura + monedas + arma + sonrisa |
| Oni / shrine demon | Rojo, cuernos, ofuda, fuego |
| Spirit | Forma etérea, ojos de chakra, silueta no-humana |

Si es genérico o el prop miente (casco de obra en un “foreman” de Wave) → malo.

### 5. Expresión

- **Bueno:** cara de manga exagerada (rabia, ironía, amenaza).
- **Malo (fotoreal):** piel SSS, ojos “modelo 3D”, key art AAA → pierde punch en panel de combate.

---

## Qué es MALO

Un asset es **malo** si incumple **cualquiera** de estos gates:

### Gate A — Estilo

> ¿Es 2D cel-shaded con outline duro?  
> **No** → malo (aunque sea “bonito”).

### Gate B — Mundo

> ¿Encaja en Wave / shinobi / yokai japonés?  
> Si parece **construcción moderna, PMC, D&D, steampunk o Cthulhu** → malo.

### Gate C — Formato de asset

> ¿Portrait sobre chroma key plano (o alpha limpio post-cutout), listo para panel?  
> Si trae **suelo, muelle o escena** → malo para este pipeline.  
> Si se generó sobre **negro/matte** en vez de verde/magenta → malo para cutout.

### Gate D — Identidad

> ¿Silueta + 1 prop cuentan el rol del enemigo?  
> Si es genérico o el prop miente → malo.

---

## Casi buenos que siguen siendo malos

Estilo técnico OK no basta si el **diseño de personaje** no es del universo:

| Asset | Estilo OK | Falla real |
|-------|-----------|------------|
| `corrupt_guard` | Sí, cómic | Casco occidental; no “guarda de Gato” japonesa |
| `dock_worker` | Sí | Texto burocrático + botas modernas + full body |
| `cove_smuggler` | Sí | Muelle = escena; vibra pirata genérico |
| `desperate_traveler` | Sí | Fantasy occidental, no viajera del País de las Olas |
| `sea_creature` | Sí | Horror sci-fi abismal, no mar/yokai del setting |

**Nota:** texto en inglés suelto no es dealbreaker por sí solo (ej. caja “CONTRABAND” en un smuggler bueno). Fallan el **medio + registro cultural + formato**.

---

## Checklist de QA (pass / fail)

```
[ ] 2D ilustrado (NO photo / 3D / oil soft)
[ ] Outline negro + cel-shade
[ ] Generado en chroma: verde #00FF00 (default) o magenta #FF00FF si el sujeto tiene verde
[ ] Fondo de generación plano (sin gradiente/escena); sin matte negro
[ ] Tras key: alpha RGBA limpio / sin entorno
[ ] Busto/torso dominante (no full-body con suelo)
[ ] Vestuario/props de mundo shinobi-seinen (o grit anime-canon)
[ ] Cero anacronismos occidentales fuertes
    (casco de obra, Brodie, MOLLE, “SITE 7”, “PORT AUTHORITY”…)
[ ] Silueta + 1–2 props = rol legible
[ ] Expresión manga legible a escala panel
[ ] Sangre/daño como tinta gráfica, no gore realista
```

- **Todo ✓** → bueno (candidatos a `buenos/`).
- **Un ✗ grave (sobre todo A o B)** → malo / regenerar (`malos/`).

---

## Prompts de regeneración

### Style lock (incluir)

**Default (sin verde en el sujeto):**

```
painted digital illustration, high quality, cel-shaded, hard black outlines,
neo-retro seinen anime, character portrait bust, combat enemy card,
Land of Waves / shinobi world,
flat solid pure green screen background #00FF00, chroma key green, no environment
```

**Si el sujeto tiene verde** (ropa, musgo, slime, chakra verde, etc.):

```
painted digital illustration, high quality, cel-shaded, hard black outlines,
neo-retro seinen anime, character portrait bust, combat enemy card,
Land of Waves / shinobi world,
flat solid pure magenta hot-pink background #FF00FF, chroma key magenta, no environment
```

### Negativos (excluir)

```
photorealistic, 3D render, CGI, oil painting, soft skin SSS,
tactical vest, MOLLE, plate carrier, dog tags, hard hat, construction site,
modern military, western fantasy, D&D adventurer, steampunk goggles,
environment floor, wooden dock, full body standing on ground,
lovecraft neon abyss, deep-sea angler sci-fi,
black background, pure black matte, transparent background, gradient background
```

### Rediseños orientativos (malos → mundo Wave)

| ID | Dirección de redesign |
|----|------------------------|
| `corrupt_foreman` | Capataz del puente: ropa de obrero japonesa, mazo/herramienta de obra, **sin** casco OSHA ni “SITE 7” |
| `corrupt_guard` | Matón/guarda de Gato: armadura ligera o yoroi de pueblo, emblema del gato; **no** casco Brodie |
| `dock_worker` | Estibador del puerto de Wave: haori/ropa de muelle, gancho; **sin** “PORT AUTHORITY” ni botas modernas |
| `elite_mercenary` | Shinobi de alquiler: malla, chaleco ninja, kunai/tanto; **no** plate carrier |
| `trap_master` | Trampero shinobi: senbon, hilos, tags explosivos; **no** goggles steampunk ni chaleco táctico |
| `desperate_traveler` | Viajera del País de las Olas: ropa de viaje japonesa rota, lanza/bastón; **no** ranger D&D |
| `cove_smuggler` | Contrabandista de cala: portrait negro, cuchillo/cuerda; **sin** muelle bajo los pies |
| `sea_creature` | Monstruo de mar / yokai de niebla; **no** abismo neón lovecraft |
| `boss_haku` | Look de canon Haku, **forzado 2D cel-shaded** (no CGI) |
| `hired_assassin` | Asesino shinobi con máscara/capucha, tanto; **2D outline**, no key art AAA |
| `exhausted_shinobi` | Genin/chunin destrozado, hitai-ate, kunai; **manga**, no oil portrait |

---

## Pipeline de Recorte: Deep Clean (Alpha Real)

Para garantizar un recorte perfecto a **transparencia RGBA real** sin halos ni motas flotantes de croma, todos los retratos se procesan con la suite de limpieza **Deep Clean**:

1. **Script principal:** `python scripts/deep_clean_all_enemies.py` (o `deep_clean_beach_bandit.py` para recortes individuales).
2. **Detección dinámica:** Verde `#00FF00` (default) vs Magenta `#FF00FF` (si viste verde).
3. **Alpha Erosion:** Reducción de alpha en bordes semitransparentes con exceso de croma para borrar motas o puntitos pegados.
4. **Full-Channel Despilling:** Forzar `g = max(r, b)` (o despill magenta) en píxeles visibles para erradicar cualquier rebote de luz verde/magenta.
5. **Zero RGB:** Limpieza de RGB en píxeles con `alpha < 5`.
6. **Script de verificación estructural:** `python scripts/verify_enemy_art_chroma.py` (debe retornar exit code 0 y `PASS`).

---

## Referencias del repo

- Skill: `.agents/skills/combat-art/SKILL.md`
- Guía: `docs/guia_direccion_de_arte_combate.md`
- Script Deep Clean: `scripts/deep_clean_all_enemies.py`
- Script Verificación: `scripts/verify_enemy_art_chroma.py`
- Chroma key (proyecto): `AGENTS.md` — default verde `#00FF00`; si el sujeto es verde-heavy → magenta `#FF00FF` (o azul `#0000FF` como alternativa de proyecto; **en enemies preferir magenta**)

