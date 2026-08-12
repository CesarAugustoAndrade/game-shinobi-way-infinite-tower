# ASSET-QUEUE — Enemies (Land of Waves)

**Agent:** A3-enemy  
**Source:** `.agents/swarm-grok/reports/E5-assets.md` §4.1–4.2 (27 missing dedicated identities)  
**Date:** 2026-07-22  
**Output path:** `public/assets/`  
**Aspect:** `1:1` (square portrait)  
**Style base (append to every prompt):**

```
16-bit pixel art sprite portrait, high-contrast cel-shaded lighting, black outlines,
SNES game asset style, Sega Genesis aesthetic, sober terror, seinen-sublime atmosphere,
Land of Waves mist, muted abyssal blue #1a2633, fog grey, bone white highlights,
rust accents, restrained palette, no comic speedlines, no bright neon, no text, no watermark,
clean pixel boundaries, aspect ratio 1:1
```

**Cutout rule:** `enemy_cut_<id>.png` uses the **same subject/pose** as `enemy_<id>.png` but
`solid flat magenta #FF00FF background` (chroma-keyable). Full-body or 3/4 combat silhouette,
readable at combat UI scale.

**Priority:** A = late-game / identity critical · B = coastal grit thugs

**Prompt count:** 54 (27 enemies × 2 variants)

---

## Priority A — Boss / late-game identity

### 1. `eldritch_guardian`
- **location:** drowned_shrine
- **files:** `enemy_eldritch_guardian.png` · `enemy_cut_eldritch_guardian.png`
- **portrait (`enemy_eldritch_guardian.png`):**
  ```
  16-bit pixel art sprite portrait of a drowned shrine eldritch guardian, half ancient stone
  statue half waterlogged flesh, coral growth on lacquer armor, empty eye sockets, abyssal
  pressure aura, mist tendrils, cosmic dread, cold phosphorescent rim light, Land of Waves
  underwater temple mood, high-contrast cel-shaded lighting, black outlines, SNES game asset
  style, sober terror, muted abyssal blue #1a2633 fog grey bone white, restrained palette,
  no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_eldritch_guardian.png`):**
  ```
  16-bit pixel art sprite portrait of a drowned shrine eldritch guardian, half stone statue
  half waterlogged flesh, coral growth, empty eyes, mist tendrils, combat silhouette,
  solid flat pure magenta #FF00FF background only, no other backdrop, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror, clean pixel
  boundaries, square 1:1, chroma key ready
  ```

### 2. `assassin`
- **location:** gatos_compound
- **files:** `enemy_assassin.png` · `enemy_cut_assassin.png`
- **portrait (`enemy_assassin.png`):**
  ```
  16-bit pixel art sprite portrait of a mist assassin in soaked dark cloak, half-face mask,
  senbon needles glinting, predatory stillness not heroic pose, fog silhouette, rain-slick
  shadows, Land of Waves Gato compound mood, high-contrast cel-shaded lighting, black outlines,
  SNES game asset style, sober terror, muted abyssal blue #1a2633 fog grey bone white rust,
  restrained palette, no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_assassin.png`):**
  ```
  16-bit pixel art sprite portrait of a mist assassin in soaked dark cloak, half-face mask,
  senbon glint, lean predatory combat silhouette, solid flat pure magenta #FF00FF background
  only, high-contrast cel-shaded lighting, black outlines, SNES game asset style, sober terror,
  clean pixel boundaries, square 1:1, chroma key ready
  ```

### 3. `elite_guard`
- **location:** gatos_compound
- **files:** `enemy_elite_guard.png` · `enemy_cut_elite_guard.png`
- **portrait (`enemy_elite_guard.png`):**
  ```
  16-bit pixel art sprite portrait of Gato compound elite guard, polished black armor plates,
  mon crest of greed, rain-slick steel, cold disciplined stance not generic samurai, misty
  fortified mansion mood, high-contrast cel-shaded lighting, black outlines, SNES game asset
  style, sober terror Land of Waves, muted abyssal blue #1a2633 fog grey bone white rust,
  restrained palette, no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_elite_guard.png`):**
  ```
  16-bit pixel art sprite portrait of Gato compound elite guard in polished black armor plates,
  mon crest of greed, rain-slick, cold discipline combat silhouette, solid flat pure magenta
  #FF00FF background only, high-contrast cel-shaded lighting, black outlines, SNES game asset
  style, sober terror, clean pixel boundaries, square 1:1, chroma key ready
  ```

### 4. `ronin`
- **location:** gatos_compound
- **files:** `enemy_ronin.png` · `enemy_cut_ronin.png`
- **portrait (`enemy_ronin.png`):**
  ```
  16-bit pixel art sprite portrait of a rain-ruined ronin hired by Gato, chipped katana, empty
  tired eyes, poverty and murder-for-hire, wet torn haori, Wave coast fog behind, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror Land of Waves,
  muted abyssal blue #1a2633 fog grey bone white rust, restrained palette, no text no watermark,
  clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_ronin.png`):**
  ```
  16-bit pixel art sprite portrait of a rain-ruined ronin, chipped katana, empty eyes, torn
  wet clothes, combat silhouette, solid flat pure magenta #FF00FF background only,
  high-contrast cel-shaded lighting, black outlines, SNES game asset style, sober terror,
  clean pixel boundaries, square 1:1, chroma key ready
  ```

### 5. `bandit_captain`
- **location:** bandit_outpost
- **files:** `enemy_bandit_captain.png` · `enemy_cut_bandit_captain.png`
- **portrait (`enemy_bandit_captain.png`):**
  ```
  16-bit pixel art sprite portrait of scarred bandit captain of Gato's thugs, heavy salt-stained
  coat, cruel calm expression, fortified camp torchlight swallowed by fog, Land of Waves
  bandit outpost, high-contrast cel-shaded lighting, black outlines, SNES game asset style,
  sober terror, muted abyssal blue #1a2633 fog grey bone white rust, restrained palette,
  no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_bandit_captain.png`):**
  ```
  16-bit pixel art sprite portrait of scarred bandit captain, heavy coat, cruel calm, combat
  ready silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 6. `elite_mercenary`
- **location:** bandit_outpost
- **files:** `enemy_elite_mercenary.png` · `enemy_cut_elite_mercenary.png`
- **portrait (`enemy_elite_mercenary.png`):**
  ```
  16-bit pixel art sprite portrait of a professional foreign mercenary in Wave Country, better
  gear than local bandits, impassive face, mud and mist on armor, cold professionalism,
  Land of Waves fog, high-contrast cel-shaded lighting, black outlines, SNES game asset style,
  sober terror, muted abyssal blue #1a2633 fog grey bone white rust, restrained palette,
  no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_elite_mercenary.png`):**
  ```
  16-bit pixel art sprite portrait of professional foreign mercenary, better gear, impassive,
  combat silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 7. `treasure_guardian`
- **location:** sunken_ship
- **files:** `enemy_treasure_guardian.png` · `enemy_cut_treasure_guardian.png`
- **portrait (`enemy_treasure_guardian.png`):**
  ```
  16-bit pixel art sprite portrait of a spectral armored treasure guardian fused with shipwreck
  cargo chains, wet corroded metal, phosphorescent cold light, drowned cargo hold mood,
  Land of Waves sunken ship, high-contrast cel-shaded lighting, black outlines, SNES game
  asset style, sober terror, muted abyssal blue #1a2633 fog grey bone white, restrained palette,
  no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_treasure_guardian.png`):**
  ```
  16-bit pixel art sprite portrait of spectral armored treasure guardian fused with wet cargo
  chains, phosphorescent cold light, combat silhouette, solid flat pure magenta #FF00FF
  background only, high-contrast cel-shaded lighting, black outlines, SNES game asset style,
  sober terror, clean pixel boundaries, square 1:1, chroma key ready
  ```

### 8. `manor_guardian`
- **location:** abandoned_manor
- **files:** `enemy_manor_guardian.png` · `enemy_cut_manor_guardian.png`
- **portrait (`enemy_manor_guardian.png`):**
  ```
  16-bit pixel art sprite portrait of ruined-estate manor guardian in faded ceremonial armor,
  dust and moonlight, wrong unnatural stillness, Land of Waves abandoned manor, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue
  #1a2633 fog grey bone white, restrained palette, no text no watermark, clean pixel
  boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_manor_guardian.png`):**
  ```
  16-bit pixel art sprite portrait of ruined-estate manor guardian in faded ceremonial armor,
  wrong stillness, combat silhouette, solid flat pure magenta #FF00FF background only,
  high-contrast cel-shaded lighting, black outlines, SNES game asset style, sober terror,
  clean pixel boundaries, square 1:1, chroma key ready
  ```

---

## Priority B — Human thugs / coastal grit

### 9. `dock_worker`
- **location:** the_docks
- **files:** `enemy_dock_worker.png` · `enemy_cut_dock_worker.png`
- **portrait (`enemy_dock_worker.png`):**
  ```
  16-bit pixel art sprite portrait of a brawler dockhand turned enforcer, gaff hook weapon,
  salt-stained clothes, grey rain on misty pier, intimidation not fantasy heroics, Land of
  Waves docks, high-contrast cel-shaded lighting, black outlines, SNES game asset style,
  sober terror, muted abyssal blue #1a2633 fog grey bone white rust, restrained palette,
  no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_dock_worker.png`):**
  ```
  16-bit pixel art sprite portrait of dockhand enforcer with gaff hook, salt-stained clothes,
  combat silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 10. `corrupt_guard`
- **location:** the_docks
- **files:** `enemy_corrupt_guard.png` · `enemy_cut_corrupt_guard.png`
- **portrait (`enemy_corrupt_guard.png`):**
  ```
  16-bit pixel art sprite portrait of harbor guard with Gato bribe badge, cold bribed eyes,
  rusted polearm, misty pier backdrop, Land of Waves docks, high-contrast cel-shaded lighting,
  black outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633 fog grey
  bone white rust, restrained palette, no text no watermark, clean pixel boundaries,
  square 1:1 composition
  ```
- **cutout (`enemy_cut_corrupt_guard.png`):**
  ```
  16-bit pixel art sprite portrait of corrupt harbor guard with rusted polearm, Gato badge,
  combat silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 11. `smuggler`
- **location:** the_docks
- **files:** `enemy_smuggler.png` · `enemy_cut_smuggler.png`
- **portrait (`enemy_smuggler.png`):**
  ```
  16-bit pixel art sprite portrait of night smuggler in oilskin coat, sealed crates, lantern
  glow swallowed by heavy fog, Land of Waves docks, high-contrast cel-shaded lighting, black
  outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633 fog grey bone white
  rust, restrained palette, no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_smuggler.png`):**
  ```
  16-bit pixel art sprite portrait of night smuggler in oilskin coat, sealed crate, combat
  silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 12. `beach_bandit`
- **location:** misty_beach
- **files:** `enemy_beach_bandit.png` · `enemy_cut_beach_bandit.png`
- **portrait (`enemy_beach_bandit.png`):**
  ```
  16-bit pixel art sprite portrait of shore bandit half-buried in coastal fog, wet sand on
  boots, scavenged gear, Land of Waves misty beach, high-contrast cel-shaded lighting, black
  outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633 fog grey bone white
  rust, restrained palette, no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_beach_bandit.png`):**
  ```
  16-bit pixel art sprite portrait of shore bandit with scavenged gear, wet sand grit, combat
  silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 13. `forest_bandit`
- **location:** coastal_forest
- **files:** `enemy_forest_bandit.png` · `enemy_cut_forest_bandit.png`
- **portrait (`enemy_forest_bandit.png`):**
  ```
  16-bit pixel art sprite portrait of coastal forest ambusher with bark and leaf camouflage,
  damp leaves, restrained dread not cartoon stealth, Land of Waves coastal forest, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue
  #1a2633 fog grey bone white, restrained palette, no text no watermark, clean pixel
  boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_forest_bandit.png`):**
  ```
  16-bit pixel art sprite portrait of forest ambusher with bark camouflage, damp leaves, combat
  silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 14. `cave_smuggler`
- **location:** smugglers_cave
- **files:** `enemy_cave_smuggler.png` · `enemy_cut_cave_smuggler.png`
- **portrait (`enemy_cave_smuggler.png`):**
  ```
  16-bit pixel art sprite portrait of underground cave smuggler runner, damp stone walls, rope
  and seal tags, low lantern light, Land of Waves smugglers cave, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633
  fog grey bone white rust, restrained palette, no text no watermark, clean pixel boundaries,
  square 1:1 composition
  ```
- **cutout (`enemy_cut_cave_smuggler.png`):**
  ```
  16-bit pixel art sprite portrait of cave smuggler with rope and seal tags, low lantern,
  combat silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 15. `cove_smuggler`
- **location:** hidden_cove
- **files:** `enemy_cove_smuggler.png` · `enemy_cut_cove_smuggler.png`
- **portrait (`enemy_cove_smuggler.png`):**
  ```
  16-bit pixel art sprite portrait of hidden cove smuggler operative, rare goods satchel, tide
  pool reflections, secret harbor mist, Land of Waves hidden cove, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633
  fog grey bone white rust, restrained palette, no text no watermark, clean pixel boundaries,
  square 1:1 composition
  ```
- **cutout (`enemy_cut_cove_smuggler.png`):**
  ```
  16-bit pixel art sprite portrait of cove smuggler with rare goods satchel, combat silhouette,
  solid flat pure magenta #FF00FF background only, high-contrast cel-shaded lighting, black
  outlines, SNES game asset style, sober terror, clean pixel boundaries, square 1:1,
  chroma key ready
  ```

### 16. `village_thug`
- **location:** fishing_village
- **files:** `enemy_village_thug.png` · `enemy_cut_village_thug.png`
- **portrait (`enemy_village_thug.png`):**
  ```
  16-bit pixel art sprite portrait of village tax thug with crude club, fishing village poverty
  backdrop, empty nets mood, Land of Waves fishing village, high-contrast cel-shaded lighting,
  black outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633 fog grey
  bone white rust, restrained palette, no text no watermark, clean pixel boundaries,
  square 1:1 composition
  ```
- **cutout (`enemy_cut_village_thug.png`):**
  ```
  16-bit pixel art sprite portrait of village tax thug with crude club, combat silhouette,
  solid flat pure magenta #FF00FF background only, high-contrast cel-shaded lighting, black
  outlines, SNES game asset style, sober terror, clean pixel boundaries, square 1:1,
  chroma key ready
  ```

### 17. `corrupt_merchant`
- **location:** fishing_village
- **files:** `enemy_corrupt_merchant.png` · `enemy_cut_corrupt_merchant.png`
- **portrait (`enemy_corrupt_merchant.png`):**
  ```
  16-bit pixel art sprite portrait of soft-faced corrupt merchant with hard cruel eyes, abacus
  and ledger of fear, cold rain on silk, Land of Waves fishing village, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue
  #1a2633 fog grey bone white rust, restrained palette, no text no watermark, clean pixel
  boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_corrupt_merchant.png`):**
  ```
  16-bit pixel art sprite portrait of corrupt merchant with abacus and ledger, hard eyes,
  combat-ready silhouette, solid flat pure magenta #FF00FF background only, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror, clean pixel
  boundaries, square 1:1, chroma key ready
  ```

### 18. `hired_muscle`
- **location:** fishing_village
- **files:** `enemy_hired_muscle.png` · `enemy_cut_hired_muscle.png`
- **portrait (`enemy_hired_muscle.png`):**
  ```
  16-bit pixel art sprite portrait of bare-armed enforcer hired muscle, bruises and scars,
  cheap iron weapon, no honor, Land of Waves fishing village rain, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633
  fog grey bone white rust, restrained palette, no text no watermark, clean pixel boundaries,
  square 1:1 composition
  ```
- **cutout (`enemy_cut_hired_muscle.png`):**
  ```
  16-bit pixel art sprite portrait of bare-armed hired muscle, bruises, cheap iron, combat
  silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 19. `river_bandit`
- **location:** riverside_camp
- **files:** `enemy_river_bandit.png` · `enemy_cut_river_bandit.png`
- **portrait (`enemy_river_bandit.png`):**
  ```
  16-bit pixel art sprite portrait of river raider bandit, skiff silhouette, reeds and heavy
  mist, wet cloak, Land of Waves riverside camp, high-contrast cel-shaded lighting, black
  outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633 fog grey bone white
  rust, restrained palette, no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_river_bandit.png`):**
  ```
  16-bit pixel art sprite portrait of river raider with wet cloak and blade, combat silhouette,
  solid flat pure magenta #FF00FF background only, high-contrast cel-shaded lighting, black
  outlines, SNES game asset style, sober terror, clean pixel boundaries, square 1:1,
  chroma key ready
  ```

### 20. `camp_raider`
- **location:** riverside_camp
- **files:** `enemy_camp_raider.png` · `enemy_cut_camp_raider.png`
- **portrait (`enemy_camp_raider.png`):**
  ```
  16-bit pixel art sprite portrait of camp raider mid-loot, torn packs, dying campfire embers
  in fog, Land of Waves riverside camp, high-contrast cel-shaded lighting, black outlines,
  SNES game asset style, sober terror, muted abyssal blue #1a2633 fog grey bone white rust,
  restrained palette, no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_camp_raider.png`):**
  ```
  16-bit pixel art sprite portrait of camp raider with torn packs and scavenged blade, combat
  silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 21. `desperate_traveler`
- **location:** riverside_camp
- **files:** `enemy_desperate_traveler.png` · `enemy_cut_desperate_traveler.png`
- **portrait (`enemy_desperate_traveler.png`):**
  ```
  16-bit pixel art sprite portrait of hollow-eyed desperate traveler who attacks from
  starvation, tragic threat not comedy, ragged travel clothes, Land of Waves riverside fog,
  high-contrast cel-shaded lighting, black outlines, SNES game asset style, sober terror,
  muted abyssal blue #1a2633 fog grey bone white, restrained palette, no text no watermark,
  clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_desperate_traveler.png`):**
  ```
  16-bit pixel art sprite portrait of hollow-eyed desperate traveler, ragged clothes, tragic
  combat silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 22. `bridge_saboteur`
- **location:** bridge_construction
- **files:** `enemy_bridge_saboteur.png` · `enemy_cut_bridge_saboteur.png`
- **portrait (`enemy_bridge_saboteur.png`):**
  ```
  16-bit pixel art sprite portrait of bridge saboteur on scaffold, rope and explosive tags,
  incomplete great bridge spans lost in fog, Land of Waves bridge construction, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue
  #1a2633 fog grey bone white rust, restrained palette, no text no watermark, clean pixel
  boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_bridge_saboteur.png`):**
  ```
  16-bit pixel art sprite portrait of bridge saboteur with rope and explosive tags, combat
  silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 23. `hired_assassin`
- **location:** bridge_construction
- **files:** `enemy_hired_assassin.png` · `enemy_cut_hired_assassin.png`
- **portrait (`enemy_hired_assassin.png`):**
  ```
  16-bit pixel art sprite portrait of contract hired assassin balanced on bridge beams, lean
  lethal silhouette, rain and mist, Land of Waves great bridge, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633
  fog grey bone white rust, restrained palette, no text no watermark, clean pixel boundaries,
  square 1:1 composition
  ```
- **cutout (`enemy_cut_hired_assassin.png`):**
  ```
  16-bit pixel art sprite portrait of hired assassin on bridge beams, lean lethal combat
  silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 24. `corrupt_foreman`
- **location:** bridge_construction
- **files:** `enemy_corrupt_foreman.png` · `enemy_cut_corrupt_foreman.png`
- **portrait (`enemy_corrupt_foreman.png`):**
  ```
  16-bit pixel art sprite portrait of bridge foreman in Gato's pocket, clipboard and crowbar,
  workers blurred behind in fog, Land of Waves bridge construction, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633
  fog grey bone white rust, restrained palette, no text no watermark, clean pixel boundaries,
  square 1:1 composition
  ```
- **cutout (`enemy_cut_corrupt_foreman.png`):**
  ```
  16-bit pixel art sprite portrait of corrupt bridge foreman with clipboard and crowbar,
  combat silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 25. `hidden_guard`
- **location:** hidden_cove
- **files:** `enemy_hidden_guard.png` · `enemy_cut_hidden_guard.png`
- **portrait (`enemy_hidden_guard.png`):**
  ```
  16-bit pixel art sprite portrait of camouflaged sentry at secret cove, barely visible in
  heavy mist, wet dark gear, Land of Waves hidden cove, high-contrast cel-shaded lighting,
  black outlines, SNES game asset style, sober terror, muted abyssal blue #1a2633 fog grey
  bone white, restrained palette, no text no watermark, clean pixel boundaries,
  square 1:1 composition
  ```
- **cutout (`enemy_cut_hidden_guard.png`):**
  ```
  16-bit pixel art sprite portrait of camouflaged cove sentry, wet dark gear, combat silhouette,
  solid flat pure magenta #FF00FF background only, high-contrast cel-shaded lighting, black
  outlines, SNES game asset style, sober terror, clean pixel boundaries, square 1:1,
  chroma key ready
  ```

### 26. `guard_dog`
- **location:** smugglers_cave
- **files:** `enemy_guard_dog.png` · `enemy_cut_guard_dog.png`
- **portrait (`enemy_guard_dog.png`):**
  ```
  16-bit pixel art sprite portrait of lean war hound of smugglers, wet matted fur, chain
  collar, cave mouth gloom, sober realistic canine threat not cartoon mascot, Land of Waves
  smugglers cave, high-contrast cel-shaded lighting, black outlines, SNES game asset style,
  sober terror, muted abyssal blue #1a2633 fog grey bone white rust, restrained palette,
  no text no watermark, clean pixel boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_guard_dog.png`):**
  ```
  16-bit pixel art sprite portrait of lean smuggler war hound, wet fur, chain collar, combat
  animal silhouette, solid flat pure magenta #FF00FF background only, high-contrast cel-shaded
  lighting, black outlines, SNES game asset style, sober terror, clean pixel boundaries,
  square 1:1, chroma key ready
  ```

### 27. `stranded_ronin`
- **location:** misty_beach (upgrade from shared samurai)
- **files:** `enemy_stranded_ronin.png` · `enemy_cut_stranded_ronin.png`
- **portrait (`enemy_stranded_ronin.png`):**
  ```
  16-bit pixel art sprite portrait of shipwrecked blade-for-hire stranded ronin on misty beach,
  salt-corroded blade, soaked armor, empty horizon fog, Land of Waves misty beach, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror, muted abyssal blue
  #1a2633 fog grey bone white rust, restrained palette, no text no watermark, clean pixel
  boundaries, square 1:1 composition
  ```
- **cutout (`enemy_cut_stranded_ronin.png`):**
  ```
  16-bit pixel art sprite portrait of shipwrecked stranded ronin, salt-corroded blade, soaked
  armor, combat silhouette, solid flat pure magenta #FF00FF background only, high-contrast
  cel-shaded lighting, black outlines, SNES game asset style, sober terror, clean pixel
  boundaries, square 1:1, chroma key ready
  ```

---

## Batch checklist (for lead)

| # | id | Priority | portrait | cutout |
|--:|----|----------|----------|--------|
| 1 | eldritch_guardian | A | enemy_eldritch_guardian.png | enemy_cut_eldritch_guardian.png |
| 2 | assassin | A | enemy_assassin.png | enemy_cut_assassin.png |
| 3 | elite_guard | A | enemy_elite_guard.png | enemy_cut_elite_guard.png |
| 4 | ronin | A | enemy_ronin.png | enemy_cut_ronin.png |
| 5 | bandit_captain | A | enemy_bandit_captain.png | enemy_cut_bandit_captain.png |
| 6 | elite_mercenary | A | enemy_elite_mercenary.png | enemy_cut_elite_mercenary.png |
| 7 | treasure_guardian | A | enemy_treasure_guardian.png | enemy_cut_treasure_guardian.png |
| 8 | manor_guardian | A | enemy_manor_guardian.png | enemy_cut_manor_guardian.png |
| 9 | dock_worker | B | enemy_dock_worker.png | enemy_cut_dock_worker.png |
| 10 | corrupt_guard | B | enemy_corrupt_guard.png | enemy_cut_corrupt_guard.png |
| 11 | smuggler | B | enemy_smuggler.png | enemy_cut_smuggler.png |
| 12 | beach_bandit | B | enemy_beach_bandit.png | enemy_cut_beach_bandit.png |
| 13 | forest_bandit | B | enemy_forest_bandit.png | enemy_cut_forest_bandit.png |
| 14 | cave_smuggler | B | enemy_cave_smuggler.png | enemy_cut_cave_smuggler.png |
| 15 | cove_smuggler | B | enemy_cove_smuggler.png | enemy_cut_cove_smuggler.png |
| 16 | village_thug | B | enemy_village_thug.png | enemy_cut_village_thug.png |
| 17 | corrupt_merchant | B | enemy_corrupt_merchant.png | enemy_cut_corrupt_merchant.png |
| 18 | hired_muscle | B | enemy_hired_muscle.png | enemy_cut_hired_muscle.png |
| 19 | river_bandit | B | enemy_river_bandit.png | enemy_cut_river_bandit.png |
| 20 | camp_raider | B | enemy_camp_raider.png | enemy_cut_camp_raider.png |
| 21 | desperate_traveler | B | enemy_desperate_traveler.png | enemy_cut_desperate_traveler.png |
| 22 | bridge_saboteur | B | enemy_bridge_saboteur.png | enemy_cut_bridge_saboteur.png |
| 23 | hired_assassin | B | enemy_hired_assassin.png | enemy_cut_hired_assassin.png |
| 24 | corrupt_foreman | B | enemy_corrupt_foreman.png | enemy_cut_corrupt_foreman.png |
| 25 | hidden_guard | B | enemy_hidden_guard.png | enemy_cut_hidden_guard.png |
| 26 | guard_dog | B | enemy_guard_dog.png | enemy_cut_guard_dog.png |
| 27 | stranded_ronin | B | enemy_stranded_ronin.png | enemy_cut_stranded_ronin.png |

### Post-generate wire-up
1. Drop PNGs under `public/assets/`.
2. Update `enemyArtManifest.ts` pool entries (`enemy:pool_<id>`) `src` → `/assets/enemy_<id>.png`, `quality: 'painted-png'`.
3. Cutouts resolve via `enemy_cut_<id>.png` naming convention already used by combat stage.

### Out of scope (already dedicated in E5)
sea_spirit, wild_boar, missing_nin, trap_master, drowned_sailor, water_spirit, war_dog,
vengeful_ghost, cursed_servant, sea_creature, shrine_demon, corrupted_priest, gato
