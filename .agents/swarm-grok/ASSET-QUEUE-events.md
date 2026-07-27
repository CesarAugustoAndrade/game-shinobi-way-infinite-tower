# ASSET-QUEUE — Story Events (Land of Waves)

**Agent:** A3-enemy  
**Source:** `.agents/swarm-grok/reports/E5-assets.md` §2.1–2.2 / §4.3 (7 tiedStory events missing art)  
**Date:** 2026-07-22  
**Output path:** `public/assets/icons/events/`  
**Aspect:** `16:9` cinematic plates  
**Style base (append to every prompt):**

```
16-bit pixel art cinematic event plate, high-contrast cel-shaded lighting, black outlines,
SNES game asset style, Sega Genesis aesthetic, sober terror, seinen-sublime atmosphere,
Land of Waves mist, muted abyssal blue #1a2633, fog grey, bone white highlights,
rust accents, restrained palette, no comic speedlines, no bright neon, no UI chrome,
no text, no watermark, clean pixel boundaries, wide cinematic composition, aspect ratio 16:9
```

**Already have art (skip):** `bridge_worker_plea`, `mist_ambush_cache`, `tazuna_request`  
**Prompt count:** 7 (one 16:9 plate each)

---

### 1. `meet_tazuna`
- **location:** the_docks  
- **file:** `public/assets/icons/events/meet_tazuna.jpg` (or `.png`)  
- **prompt:**
  ```
  16-bit pixel art cinematic event plate 16:9, weary bridge builder Tazuna on rainy docks of
  Land of Waves, salt-cracked hands, pleading silhouette against grey sea, Gato enforcers as
  distant fog silhouettes on the pier, hope under tyranny, sober terror, misty harbor lanterns
  swallowed by fog, muted abyssal blue #1a2633 fog grey bone white rust accents, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, restrained palette, no text no
  watermark, clean pixel boundaries, wide cinematic composition
  ```

### 2. `protect_village`
- **location:** fishing_village  
- **file:** `public/assets/icons/events/protect_village.jpg`  
- **prompt:**
  ```
  16-bit pixel art cinematic event plate 16:9, fishing village under tax intimidation, empty
  nets hanging, children half-hidden in doorways, Gato thugs at the wooden gate, cold rain,
  poverty and dread, Land of Waves rural village, sober terror, muted abyssal blue #1a2633
  fog grey bone white rust accents, high-contrast cel-shaded lighting, black outlines, SNES
  game asset style, restrained palette, no text no watermark, clean pixel boundaries, wide
  cinematic composition
  ```

### 3. `meet_inari`
- **location:** fishing_village  
- **file:** `public/assets/icons/events/meet_inari.jpg`  
- **prompt:**
  ```
  16-bit pixel art cinematic event plate 16:9, quiet dockside encounter with young Inari,
  empty fishing boats, heavy coastal mist, fragile courage in a still frame, Land of Waves
  fishing village pier, sober terror and restrained hope, muted abyssal blue #1a2633 fog grey
  bone white, high-contrast cel-shaded lighting, black outlines, SNES game asset style,
  restrained palette, no text no watermark, clean pixel boundaries, wide cinematic composition
  ```

### 4. `protect_bridge`
- **location:** bridge_construction  
- **file:** `public/assets/icons/events/protect_bridge.jpg`  
- **prompt:**
  ```
  16-bit pixel art cinematic event plate 16:9, incomplete Great Bridge spans vanishing into
  mist, workers frozen mid-task on wet planks, threat approaching along scaffold beams,
  rope and tools abandoned, Land of Waves bridge construction, sober terror, muted abyssal
  blue #1a2633 fog grey bone white rust accents, high-contrast cel-shaded lighting, black
  outlines, SNES game asset style, restrained palette, no text no watermark, clean pixel
  boundaries, wide cinematic composition
  ```

### 5. `final_showdown_setup`
- **location:** bridge_construction → path to compound  
- **file:** `public/assets/icons/events/final_showdown_setup.jpg`  
- **prompt:**
  ```
  16-bit pixel art cinematic event plate 16:9, path to Gato compound gates through rain,
  banners of greed hanging limp, low horizon dread, fortified mansion silhouette in fog,
  empty road and cold power waiting, Land of Waves, sober terror, muted abyssal blue #1a2633
  fog grey bone white rust accents, high-contrast cel-shaded lighting, black outlines, SNES
  game asset style, restrained palette, no text no watermark, clean pixel boundaries, wide
  cinematic composition
  ```

### 6. `final_confrontation`
- **location:** gatos_compound  
- **file:** `public/assets/icons/events/final_confrontation.jpg`  
- **prompt:**
  ```
  16-bit pixel art cinematic event plate 16:9, compound courtyard confrontation, magnate's
  fortified mansion, ring of enforcers in rain, cold authoritarian power, Land of Waves Gato
  estate, sober terror, muted abyssal blue #1a2633 fog grey bone white rust accents,
  high-contrast cel-shaded lighting, black outlines, SNES game asset style, restrained palette,
  no text no watermark, clean pixel boundaries, wide cinematic composition
  ```

### 7. `gato_defeat`
- **location:** gatos_compound  
- **file:** `public/assets/icons/events/gato_defeat.jpg`  
- **prompt:**
  ```
  16-bit pixel art cinematic event plate 16:9, aftermath of fallen tyranny, empty throne of
  wealth in ruined compound hall, discarded banners of greed, villagers as distant silhouettes
  in mist outside, restrained catharsis not fireworks, Land of Waves, sober terror resolving
  into quiet relief, muted abyssal blue #1a2633 fog grey bone white, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, restrained palette, no text no watermark,
  clean pixel boundaries, wide cinematic composition
  ```

---

## Batch checklist (for lead)

| # | event id | file | aspect |
|--:|----------|------|--------|
| 1 | meet_tazuna | icons/events/meet_tazuna.jpg | 16:9 |
| 2 | protect_village | icons/events/protect_village.jpg | 16:9 |
| 3 | meet_inari | icons/events/meet_inari.jpg | 16:9 |
| 4 | protect_bridge | icons/events/protect_bridge.jpg | 16:9 |
| 5 | final_showdown_setup | icons/events/final_showdown_setup.jpg | 16:9 |
| 6 | final_confrontation | icons/events/final_confrontation.jpg | 16:9 |
| 7 | gato_defeat | icons/events/gato_defeat.jpg | 16:9 |

### Post-generate wire-up
1. Drop under `public/assets/icons/events/`.
2. Update `eventArtManifest.ts` for each `event:<id>` → new `src`, `quality: 'imagine-jpg'`.
3. Keys already match `wavesArcEvents` / tiedStory IDs — no new category required for these seven.

### Deferred (E5 §4.4)
Atmosphere flavor plates (`atm_*`) — generate only after story set if product wants illustrated ambient.
