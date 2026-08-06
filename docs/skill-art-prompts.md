# Skill Art Generation Prompts

Ready-to-use image-generation prompts for every skill in SHINOBI WAY.

## Header / structural specs

| Spec | Value |
|------|--------|
| **Order rule** | `skillArtManifest.ts` registration order, then remaining ids from `skills.ts` (sorted) not in the manifest |
| **Coverage** | All unique skill definition ids (`skills.ts` + manifest) |
| **Entry count** | 116 |
| **Aspect ratio** | **16:9** cinematic (PC skill card first) |
| **Recommended gen size** | **1280×720** (alt: 1024×576 · premium 1920×1080) |
| **In-card display** | `object-fit: cover` · `object-position: center 30%` · card height ~8.5rem (~136px) on desktop |
| **Style lock** | painted digital illustration, high quality, cel-shaded, hard black outlines, neo-retro seinen, cinematic combat keyframe |
| **Atmosphere lock** | badass battlefield plate — depth layers, smoke/embers/weather/debris, ink motion energy (NOT flat void gradient) |
| **Install path** | `public/assets/skills/skill_<id>.png` |

### Abstract template

**North-star quality:** spinning shuriken over a ruined battlefield at dusk — smoke pillars, fire glow, mud and debris in the foreground, violent ink-slash motion trails, painted brush texture, subject hero-lit. The technique lives **in a world**, not on a product-shot void.

```
{SKILL_NAME} skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: {ONE_CLEAR_TECHNIQUE_SUBJECT — the jutsu effect, weapon, seal, or kinetic moment as the star}.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground debris or weather particles, mid-ground technique energy, distant environment
(battlefield, mist forest, rain village street, rocky gorge, storm sky, sand waste, flooded ruins —
pick what fits the technique). Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, chakra vapor, sparks, dust, embers, or elemental wake
reading horizontally across the 16:9 frame. Subject feels mid-impact, mid-throw, mid-cast — a freeze-frame
from a seinen fight scene.

LIGHTING: dramatic key light + rim on the subject; warm fire / cool moon / elemental glow vs cooler shadows.
Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines,
neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark,
no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space,
photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen,
transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```

### Catalog index (order)

1. `basic_atk` — Taijutsu: Strike
2. `shuriken` — Ninja Tool: Shuriken
3. `mud_wall` — Mud Wall
4. `phoenix_flower` — Phoenix Flower
5. `kawarimi` — Body Replacement
6. `bunshin` — Clone Technique
7. `henge` — Transformation
8. `shunshin` — Body Flicker
9. `kai` — Release
10. `leaf_whirlwind` — Leaf Whirlwind
11. `dynamic_entry` — Dynamic Entry
12. `rising_wind` — Leaf Rising Wind
13. `strong_fist` — Strong Fist Combo
14. `sweeping_kick` — Sweeping Kick
15. `elbow_strike` — Elbow Strike
16. `feint_strike` — Feint Strike
17. `counter_stance` — Counter Stance
18. `dancing_leaf` — Shadow of Dancing Leaf
19. `focused_breathing` — Focused Breathing
20. `kunai_slash` — Kunai Slash
21. `kunai_throw` — Kunai Throw
22. `shuriken_barrage` — Shuriken Barrage
23. `windmill_shuriken` — Windmill Shuriken
24. `senbon` — Senbon Needle
25. `senbon_rain` — Senbon Rain
26. `explosive_tag` — Explosive Tag
27. `explosive_barrage` — Explosive Barrage
28. `sword_slash` — Sword Slash
29. `iaido` — Iaido
30. `wire_setup` — Ninja Tool: Wire Trap
31. `poison_coat` — Poison Coat
32. `smoke_bomb` — Smoke Bomb
33. `flash_bomb` — Flash Bomb
34. `analyze` — Analyze Enemy
35. `brace` — Brace
36. `cloak_invis` — Cloak of Invisibility
37. `basic_medical` — Basic Medical Jutsu
38. `focused_stance` — Focused Stance
39. `defensive_posture` — Defensive Posture
40. `aggressive_stance` — Aggressive Stance
41. `weapon_proficiency` — Weapon Proficiency
42. `taijutsu_training` — Taijutsu Training
43. `quick_reflexes` — Quick Reflexes
44. `iron_body` — Iron Body
45. `chakra_reserves` — Chakra Reserves
46. `mental_fortitude` — Mental Fortitude
47. `precision` — Precision
48. `fire_affinity` — Fire Affinity
49. `air_palm` — Air Palm
50. `rasengan` — Rasengan
51. `fireball` — Katon: Great Fireball
52. `kaiten` — 8 Trigrams Rotation
53. `byakugan` — Byakugan
54. `gentle_fist` — Gentle Fist
55. `sharingan_2` — Sharingan (2-Tomoe)
56. `water_prison` — Water Prison
57. `suijinheki` — Water Wall
58. `hell_viewing` — Hell Viewing Technique
59. `mind_destruction` — Mind Body Disturbance
60. `dragon_flame` — Dragon Flame Bomb
61. `hidden_mist` — Hidden Mist Jutsu
62. `water_clone` — Water Clone Jutsu
63. `lightning_ball` — Lightning Ball
64. `earth_decapitation` — Inner Decapitation
65. `great_breakthrough` — Great Breakthrough
66. `air_bullet` — Air Bullet
67. `fang_over_fang` — Fang Over Fang
68. `mind_transfer` — Mind Transfer Jutsu
69. `shadow_possession` — Shadow Possession
70. `bug_swarm` — Parasitic Insects
71. `expansion` — Expansion Jutsu
72. `64_palms` — 8 Trigrams 64 Palms
73. `sand_burial` — Sand Burial
74. `curse_mark_1` — Curse Mark Stage 1
75. `sand_shield` — Sand Shield
76. `sharingan_predict` — Sharingan: Predict
77. `byakugan_scan` — Tenketsu Scan
78. `summon_gamabunta` — Summoning: Gamabunta
79. `summon_manda` — Summoning: Manda
80. `puppet_crow` — Puppet: Crow
81. `shadow_clone` — Shadow Clone Jutsu
82. `primary_lotus` — Primary Lotus
83. `chidori` — Chidori
84. `chidori_stream` — Chidori Stream
85. `sand_coffin` — Sand Coffin
86. `water_dragon` — Water Dragon Jutsu
87. `ice_mirrors` — Demonic Ice Mirrors
88. `false_surroundings` — False Surroundings
89. `temple_nirvana` — Temple of Nirvana
90. `hidden_lotus` — Hidden Lotus
91. `water_vortex` — Giant Water Vortex
92. `clone_explosion` — Clone Great Explosion
93. `1000_years` — 1000 Years of Death
94. `gate_of_life` — Gate of Life (3rd Gate)
95. `curse_mark_2` — Curse Mark Stage 2
96. `curse_surge` — Curse Mark Surge
97. `gate_prep` — Gate Release Prep
98. `killing_intent` — Killing Intent
99. `demon_slash` — Demon Slash
100. `bone_drill` — Dance of Clematis
101. `poison_fog` — Ibuse Poison Fog
102. `tsukuyomi` — Tsukuyomi
103. `reaper_death_seal` — Reaper Death Seal
104. `edo_tensei` — Edo Tensei
105. `gate_of_limit` — Gate of Limit (5th Gate)
106. `shukaku_arm` — Shukaku Arm
107. `copy_jutsu` — Sharingan: Copy
108. `c4_karura` — C4 Karura
109. `rasenshuriken` — Rasenshuriken
110. `amaterasu` — Amaterasu
111. `kirin` — Kirin
112. `shinra_tensei` — Shinra Tensei
113. `kamui_impact` — Kamui
114. `tengai_shinsei` — Tengai Shinsei
115. `adamantine_chains` — Adamantine Attacking Chains
116. `heavy_kick` — Taijutsu: Heavy Kick

---

## Prompts by skill

### 1. `basic_atk`

- **Name:** Taijutsu: Strike
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A disciplined martial arts strike using raw physical power. Reliable and effective.
- **File:** `public/assets/skills/skill_basic_atk.png`

```
Taijutsu: Strike skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a clenched fist and forearm mid-impact, knuckles white, shockwave rings and cracked air bursting from the strike point as if a steel plate just shattered.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud clods, splintered wood, and grit kicked up toward the lens; mid-ground the punch shockwave and flying debris; distant ruined dusk battlefield with smoke pillars, broken barricades, and fire glow along a scorched ridge. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and impact radial bursts reading horizontally across the 16:9 frame; dust and grit streaking past; subject frozen mid-impact from a seinen fight scene.

LIGHTING: hard warm key from battlefield fire on the knuckles and forearm, cool blue dusk shadows in the ruins; sharp rim light on the fist edge. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 2. `shuriken`

- **Name:** Ninja Tool: Shuriken
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A swift throw of sharpened steel stars. Targets weak points for high critical chance.
- **File:** `public/assets/skills/skill_shuriken.png`

```
Ninja Tool: Shuriken skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a spinning four-point steel shuriken mid-flight, blade edges catching firelight, motion-blur rings and ink-slash trails whipping behind it like a predator's path.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, broken tiles, and smoke wisps near the lens; mid-ground the shuriken cutting through drifting ash; distant ruined dusk battlefield with burning wreckage, leaning towers, and ember-lit smoke columns. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and curved spin trails reading horizontally across the 16:9 frame; sparks and steel glints; freeze-frame mid-throw from a seinen fight scene.

LIGHTING: warm fire key on the leading blade edges, cool moon-blue rim on the trailing points; hard contrast between polished steel and smoky ruin. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 3. `mud_wall`

- **Name:** Mud Wall
- **Element:** EARTH
- **Action:** ACTIVE
- **Description:** Spits mud that hardens into a barricade. Creates a Shield.
- **File:** `public/assets/skills/skill_mud_wall.png`

```
Mud Wall skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a massive earthen barricade erupting upward mid-formation — wet clay plates locking into a fortress wall, crude dog-head silhouette rising, dirt sheets and rock chunks still flying.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flung mud splatters, pebbles, and wet clay particles toward the camera; mid-ground the rising wall and dust bloom; distant rocky gorge battlefield under bruised dusk sky, cracked ground, and smoke from distant fires. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent upward earth-burst energy, horizontal ink-slash dust sheets, grit and debris streaks across the 16:9 frame; freeze-frame mid-cast as the wall hardens.

LIGHTING: warm low sun raking across wet clay ridges, cool shadow in the wall's lee; ember glow on distant smoke. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 4. `phoenix_flower`

- **Name:** Phoenix Flower
- **Element:** FIRE
- **Action:** ACTIVE
- **Description:** Volleys of small fireballs. Chance to burn.
- **File:** `public/assets/skills/skill_phoenix_flower.png`

```
Phoenix Flower skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a volley of blooming fireballs like fiery flower buds streaking in staggered arcs, each core white-hot with petal-shaped flame fringes and trailing ember sparks.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground ash flakes, floating cinders, and heat shimmer near the lens; mid-ground the fireball volley in staggered depth; distant scorched village street at dusk, charred rooftops, smoke pillars, and a horizon line of burning wreckage. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash flame trails and horizontal speed streaks across the 16:9 frame; sparks, soot, and chakra vapor; freeze-frame mid-volley from a seinen fight scene.

LIGHTING: intense warm orange-yellow key from the fireballs themselves, cool purple-blue dusk shadows in the ruins; hard rim on each flaming bloom. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 5. `kawarimi`

- **Name:** Body Replacement
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Switch places with a log. The log absorbs damage while you reposition.
- **File:** `public/assets/skills/skill_kawarimi.png`

```
Body Replacement skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a splintering decoy log mid-substitution, cracked open by a missed strike, wood chips exploding outward while a afterimage blur streaks away — the kinetic moment of the swap.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flying splinters, bark shards, and dust toward the camera; mid-ground the broken log and substitution smoke puff; distant mist forest battlefield edge with broken fencing, hanging leaves, and distant fire glow through trees at dusk. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash substitution trails, horizontal afterimage streaks, wood-burst radial debris across the 16:9 frame; freeze-frame mid-escape from a seinen fight scene.

LIGHTING: cool moon-silver rim on the log grain and splinters, warm fire spill from the distant woods; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 6. `bunshin`

- **Name:** Clone Technique
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Creates illusory copies to distract the enemy. Slight Evasion boost.
- **File:** `public/assets/skills/skill_bunshin.png`

```
Clone Technique skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: three overlapping ninja silhouettes mid-split, the center solid while outer copies dissolve into translucent smoke-ink doubles with glitching edge fray — illusion peeling from reality.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground drifting paper tags, dust motes, and smoke wisps near the lens; mid-ground the multiplying clones and chakra vapor; distant rain-slick village street at dusk, lantern glow, wet cobbles, and smoke rising from ruined rooftops. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash clone-split trails, horizontal afterimage streaks and dissolving particle wake across the 16:9 frame; freeze-frame mid-cast distraction from a seinen fight scene.

LIGHTING: cool moonlight on solid silhouette, pale genjutsu cyan glow on the dissolving copies, warm lantern spill in the street depth. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 7. `henge`

- **Name:** Transformation
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Transform into an object or person for a surprise attack.
- **File:** `public/assets/skills/skill_henge.png`

```
Transformation skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a half-complete henge mid-morph — a barrel-and-cloth disguise shell cracking open, smoke-ink ribbons and mask fragments peeling away to reveal a coiled striking stance silhouette underneath.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cloth scraps, mask shards, and swirling smoke particles toward the camera; mid-ground the transforming shell and chakra shimmer; distant flooded ruins at dusk, broken bridges, reflecting water, and distant fire on the horizon. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash peel trails, horizontal morph-streak energy and smoke ribbons across the 16:9 frame; freeze-frame mid-reveal ambush from a seinen fight scene.

LIGHTING: dramatic cool moon key on the cracking disguise, warm fire rim on the emerging silhouette edges; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 8. `shunshin`

- **Name:** Body Flicker
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** High-speed movement to close gaps. Greatly boosts Initiative.
- **File:** `public/assets/skills/skill_shunshin.png`

```
Body Flicker skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a blur of motion mid-shunshin — trailing body afterimages collapsing into a single forward spear of speed, leaves and dust sucked into the vacuum wake of the dash.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground leaves, grit, and torn paper tags whipping past the lens; mid-ground the body-flicker streak and vacuum dust cone; distant storm-sky battlefield ridge with broken trees, smoke pillars, and fire glow under racing clouds. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent horizontal ink-slash speed lines dominating the 16:9 frame, afterimage ghosts, debris vortex, and chakra vapor wake; freeze-frame mid-dash from a seinen fight scene.

LIGHTING: cool storm-blue ambient with a hard warm rim catching the leading edge of the blur; sparks of grit lit like meteor trails. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 9. `kai`

- **Name:** Release
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Disrupts chakra flow to break illusions. Boosts Genjutsu Resistance.
- **File:** `public/assets/skills/skill_kai.png`

```
Release skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a radiant hand-seal burst of pure white-gold kai light shattering a cracked genjutsu mirror into flying glass shards, chakra threads snapping midair like cut puppet strings.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered illusion glass and drifting paper ofuda scraps, mid-ground the exploding seal flash, distant mist-choked ruined village street under a bruised dusk sky with smoke pillars and dying lanterns. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines ripping outward from the seal, chakra vapor and prismatic glass trails reading horizontally across the 16:9 frame. Subject feels mid-cast, mid-shatter — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic key light from the white-gold kai burst + cool rim on the shards; warm fireglow from distant wreckage vs cooler indigo shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 10. `leaf_whirlwind`

- **Name:** Leaf Whirlwind
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A spinning kick that disrupts enemy accuracy.
- **File:** `public/assets/skills/skill_leaf_whirlwind.png`

```
Leaf Whirlwind skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a blurred spinning heel kick mid-whirlwind, leg wrapped in a cyclone of green leaf scraps and dust, shock-ring expanding from the sole like a spinning shuriken of wind.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground kicked-up mud clods, torn leaves, and grit streaking past the lens, mid-ground the whirlwind kick impact, distant ruined training-ground battlefield at dusk with broken fence posts, smoke pillars, and ember sparks. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash spin trails and horizontal speed lines, leaf-and-dust spiral wake reading across the 16:9 frame. Subject feels mid-spin, mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm dusk key light raking the spinning leg + cool rim on dust edges; fire glow from distant debris vs cooler shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 11. `dynamic_entry`

- **Name:** Dynamic Entry
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A powerful flying kick! Guaranteed first strike with high crit chance.
- **File:** `public/assets/skills/skill_dynamic_entry.png`

```
Dynamic Entry skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a thunderous flying drop-kick silhouette streaking in from above, boot heel leading with a golden-green impact flare, green scarf and leaf-shaped motion trail whipping behind like a comet.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flying splinters, mud spray, and broken roof tiles, mid-ground the mid-air kick crash, distant ruined courtyard battlefield at dusk with smoke pillars, fire glow, and collapsed wooden walls. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash dive lines, chakra vapor, sparks and debris wake reading diagonally then horizontally across the 16:9 frame. Subject feels mid-flight, mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic golden impact key light on the boot + hard rim on the flying body mass; warm firelight from wreckage vs cooler storm-dusk shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 12. `rising_wind`

- **Name:** Leaf Rising Wind
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** An upward kick that sets up a follow-up attack.
- **File:** `public/assets/skills/skill_rising_wind.png`

```
Leaf Rising Wind skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a rising uppercut kick launching upward, sole driving a vertical green-leaf wind column that lifts shattered weapons and dust into the air like a launching shuriken vortex.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground grit, uprooted grass, and floating debris, mid-ground the ascending kick and wind pillar, distant rocky gorge battlefield at dusk with smoke plumes, fire glow, and storm-split sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash vertical-to-horizontal speed lines, leaf tornado trails, dust and embers spiraling across the 16:9 frame. Subject feels mid-launch, mid-rise — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic cool-green wind glow on the rising leg + warm dusk rim from the horizon fire; hard contrast against cooler gorge shadows. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 13. `strong_fist`

- **Name:** Strong Fist Combo
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A rapid two-hit combo at 75% damage each.
- **File:** `public/assets/skills/skill_strong_fist.png`

```
Strong Fist Combo skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: two overlapping knuckled fists frozen mid double-strike, twin shock rings and afterimage punches stacked like a stutter-frame combo, raw force crackling off the knuckles.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cracked stone chips and sweat-dust particles, mid-ground the dual-fist impact flares, distant ruined street battlefield at dusk with smoke pillars, fire barrels, and broken walls. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash double punch trails, horizontal speed lines, sparks and pressure-wave rings reading across the 16:9 frame. Subject feels mid-combo, mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm impact key light on both fists + cool rim on knuckles and dust; fire glow vs cooler shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 14. `sweeping_kick`

- **Name:** Sweeping Kick
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A low sweep with a chance to stun.
- **File:** `public/assets/skills/skill_sweeping_kick.png`

```
Sweeping Kick skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a low horizontal leg sweep cutting across the frame like a scythe, boot scything through mud with a crescent dirt-and-chakra shock arc that knocks weapons flying.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud spray, kicked gravel, and a tumbling kunai, mid-ground the sweeping arc and stun-spark flash, distant rain-slick ruined village street at dusk with smoke, fire glow, and flooded ruts. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash horizontal sweep trails, mud droplets and dust wake streaking across the 16:9 frame. Subject feels mid-sweep, mid-trip — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic low-angle warm fire key light raking the sweep + cool wet-ground reflections; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 15. `elbow_strike`

- **Name:** Elbow Strike
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A close-range elbow strike that ignores flat defense.
- **File:** `public/assets/skills/skill_elbow_strike.png`

```
Elbow Strike skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a crushing close-range elbow smash mid-drive, forearm and elbow as the star, armor-piercing impact star bursting from the point of contact as if punching through steel plate.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground metal plate shards, sparks, and grit, mid-ground the elbow impact flare, distant rocky battlefield at dusk with smoke pillars, fire, and debris-strewn mud. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash thrust lines, armor-piercing sparks and dust rings reading horizontally across the 16:9 frame. Subject feels mid-smash, mid-break — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic white-hot impact key on the elbow + warm fire rim vs cooler storm shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 16. `feint_strike`

- **Name:** Feint Strike
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A deceptive attack that cannot be evaded.
- **File:** `public/assets/skills/skill_feint_strike.png`

```
Feint Strike skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a ghosted afterimage blade-hand strike with three layered decoy silhouettes peeling away, the true strike locked on target while false trails mislead, ink-slash mirage trails spinning like a deceptive shuriken.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground smoke wisps and floating ash, mid-ground the multi-afterimage feint and real strike, distant mist forest edge of a ruined dusk battlefield with fire glow, debris, and low fog banks. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash deceptive speed lines, chakra vapor and ghost-trail afterimages reading horizontally across the 16:9 frame. Subject feels mid-feint, mid-true-hit — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic cool-blue decoy glows vs warm true-strike key light; fire rim from distant wreckage against cooler mist shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 17. `counter_stance`

- **Name:** Counter Stance
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Prepare to counter-attack if hit this turn.
- **File:** `public/assets/skills/skill_counter_stance.png`

```
Counter Stance skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a coiled combat stance frozen mid-counter — crossed forearms and a readied kunai blade catching the first spark of an incoming strike, tension lines locked like a spring about to snap.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud clumps, cracked cobblestone shards, and drifting ash particles; mid-ground the braced counter stance under a shower of rival weapon sparks; distant ruined village street at dusk with collapsed eaves, smoke pillars, and orange firelight bleeding through broken walls. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines radiating from the impact-ready guard, chakra vapor coiling along the arms, dust kicked sideways, sparks and embers streaking horizontally across the 16:9 frame. Subject feels mid-impact, mid-block-to-riposte — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm fire key light from the burning ruins + cool rim on the braced silhouette; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 18. `dancing_leaf`

- **Name:** Shadow of Dancing Leaf
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Position behind target for devastating follow-up.
- **File:** `public/assets/skills/skill_dancing_leaf.png`

```
Shadow of Dancing Leaf skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a blurred afterimage trail of a shinobi body mid-dash, leaf-shaped shadow silhouettes peeling off like dancing ghosts, one solid heel and fist already planted behind an unseen foe for the killing angle.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground whipping grass blades, torn leaves, and dust swirls; mid-ground the ghosting dash arc and shadow clones of motion; distant mist forest battlefield with broken tree trunks, hanging fog banks, and cold dusk light filtering through canopy gaps. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and leaf-shaped motion ghosts streaking horizontally, chakra vapor in the wake of the dash, debris and dirt kicked up in a curved trail. Subject feels mid-reposition, mid-blink step — a freeze-frame from a seinen fight scene.

LIGHTING: cool moon-silver key light cutting through mist + warm rim from distant campfire embers; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 19. `focused_breathing`

- **Name:** Focused Breathing
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Regulate breathing to recover chakra.
- **File:** `public/assets/skills/skill_focused_breathing.png`

```
Focused Breathing skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a pair of cupped hands and rising chest mid-breath, luminous cyan-white chakra vapor streaming from mouth and nostrils in controlled spirals that condense into a glowing lung-shaped seal of restored energy.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground rain-slick stone, spent shell casings of broken kunai, and soft mist particles; mid-ground the breathing figure’s upper torso and spiraling chakra vapor; distant rain-soaked village street after a skirmish — lantern glow, wet rooftops, smoke thinning under storm clouds. Painted environmental storytelling, not empty void.

MOTION & ENERGY: gentle-but-visible ink-brush vapor trails and concentric breath rings expanding outward, chakra motes drifting horizontally, rain streaks and steam reading across the 16:9 frame. Subject feels mid-cast recovery, mid-focus — a freeze-frame from a seinen fight scene.

LIGHTING: soft cool cyan chakra glow as key light + warm distant lantern rim; hard contrast on the vapor spirals, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 20. `kunai_slash`

- **Name:** Kunai Slash
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A quick slash with a kunai. Chance to cause bleeding.
- **File:** `public/assets/skills/skill_kunai_slash.png`

```
Kunai Slash skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a steel kunai mid-slash in a savage diagonal arc, blade edge trailing a thick crimson ink-slash of blood spray and metal glint, tip already carving the air open.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud splatters, torn cloth scraps, and flying gravel; mid-ground the slashing kunai and its bloody motion ribbon; distant ruined dusk battlefield with shattered barricades, smoke pillars, and fire glow on the horizon. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and a horizontal blood-mist wake, sparks off the blade edge, dust and debris streaking across the 16:9 frame. Subject feels mid-cut, mid-bleed-open — a freeze-frame from a seinen fight scene.

LIGHTING: hard warm fire key light catching the wet blade + cool shadow rim; crimson highlights on the slash trail, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 21. `kunai_throw`

- **Name:** Kunai Throw
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Throw a kunai at the enemy. Basic ranged attack.
- **File:** `public/assets/skills/skill_kunai_throw.png`

```
Kunai Throw skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a single kunai frozen mid-flight, point-first, spinning slightly with a taut leather wrap and metal ring trailing a sharp ink-slash wake of air pressure.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground loose dirt clods and spinning pebbles kicked by the throw; mid-ground the hurtling kunai slicing the frame; distant rocky gorge battlefield at dusk — cliff faces, smoke from campfires, and distant enemy silhouettes under storm-lit sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and horizontal wind ribbons, dust spiral in the weapon’s wake, sparks if it grazed stone, debris reading across the 16:9 frame. Subject feels mid-throw, mid-flight — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic cool dusk key light on the steel + warm fire rim from distant flames; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 22. `shuriken_barrage`

- **Name:** Shuriken Barrage
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Throw three shuriken at 40% damage each.
- **File:** `public/assets/skills/skill_shuriken_barrage.png`

```
Shuriken Barrage skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: three steel shuriken in staggered mid-flight formation, spinning at different angles, each trailing its own ink-slash motion ribbon like a deadly constellation of blades.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, splintered wood, and whirling dust motes; mid-ground the triple shuriken volley cutting through smoke; distant ruined dusk battlefield with fire pillars, collapsed towers, and ash-choked sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent multi-layered ink-slash speed lines, overlapping spin blurs, chakra-thin vapor trails, sparks and debris streaking horizontally across the 16:9 frame. Subject feels mid-barrage, mid-volley impact about to land — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm fire key light glinting off all three blades + cool storm-shadow rim; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 23. `windmill_shuriken`

- **Name:** Windmill Shuriken
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A large shuriken that ignores shields with armor penetration.
- **File:** `public/assets/skills/skill_windmill_shuriken.png`

```
Windmill Shuriken skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a massive four-bladed windmill shuriken spinning dead-center, oversized steel edges shredding the air, one tip already punching through a cracked iron shield plate as armor fragments explode outward.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flying shield shards, mud spray, and heavy debris; mid-ground the giant spinning shuriken mid-penetration; distant scorched battlefield at dusk with smoke columns, fire glow, and broken fortifications. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent circular ink-slash spin trails and horizontal shock rings, armor scrap and sparks blasting sideways, dust and embers reading across the 16:9 frame. Subject feels mid-impact, mid-armor-break — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm fire key light + cold steel rim on the blades; hard contrast on the penetration burst, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 24. `senbon`

- **Name:** Senbon Needle
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A precise needle throw. High chance to silence.
- **File:** `public/assets/skills/skill_senbon.png`

```
Senbon Needle skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a cluster of slender silver senbon needles mid-throw, one lead needle razor-sharp in focus with a thin black sealing thread trailing from its eye, aimed at a throat-height silencing strike.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground rain droplets and fine metal glints; mid-ground the precise needle volley cutting a clean path; distant rain village street at night — wet cobbles, lantern haze, alley smoke, and storm-dark rooftops. Painted environmental storytelling, not empty void.

MOTION & ENERGY: thin violent ink-slash needle trails, thread whip-lines, mist particles and rain streaks reading horizontally across the 16:9 frame. Subject feels mid-throw, mid-silence-seal — a freeze-frame from a seinen fight scene.

LIGHTING: cool moon and wet-street reflections as key light + warm lantern rim; hard contrast on the silver needles, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 25. `senbon_rain`

- **Name:** Senbon Rain
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A barrage of poisoned needles. Five hits with poison chance.
- **File:** `public/assets/skills/skill_senbon_rain.png`

```
SENBON RAIN skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a lethal storm of silver senbon needles streaking downward in a dense diagonal fan, tips glinting with violet poison sheen, motion-blurred shafts and ink-slash trails, a few needles embedded in shattered wood and mud below.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): ruined dusk battlefield with clear depth layers —
foreground: broken roof tiles, splintered shuriken stands, mud clods and poison-green droplets splash; mid-ground: the needle barrage cutting through hanging mist; distant: collapsed wooden watchtowers, smoke pillars, orange fire glow under a bruised purple-orange sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines following each needle path, metallic sparks where tips kiss debris, thin toxic vapor ribbons reading horizontally across the 16:9 frame. Freeze-frame mid-barrage, mid-impact.

LIGHTING: cold steel rim light on the needles vs warm fire glow from distant ruins; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 26. `explosive_tag`

- **Name:** Explosive Tag
- **Element:** FIRE
- **Action:** ACTIVE
- **Description:** Throw an explosive tag. Fire element damage.
- **File:** `public/assets/skills/skill_explosive_tag.png`

```
EXPLOSIVE TAG skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a single paper explosive tag mid-flight, black ink seals blazing crimson, edges already curling into white-hot fire as the talisman spins toward impact, explosive bloom just beginning at the seal center.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): scorched ruined village street at dusk with clear depth layers —
foreground: charred debris, loose stones, embers and ash motes; mid-ground: the burning tag and first shockwave ring of flame; distant: half-collapsed houses, smoke pillars, distant fire glow under a storm-dust sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines trailing the thrown tag, chakra vapor and sparks, dust kicked by the blast wake reading horizontally across the 16:9 frame. Freeze-frame mid-throw, mid-detonation start.

LIGHTING: searing orange-red key light from the exploding seal + rim on the paper; cooler blue-gray shadows in the ruins. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 27. `explosive_barrage`

- **Name:** Explosive Barrage
- **Element:** FIRE
- **Action:** ACTIVE
- **Description:** Multiple explosive tags that reduce enemy evasion.
- **File:** `public/assets/skills/skill_explosive_barrage.png`

```
EXPLOSIVE BARRAGE skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a fan of multiple burning explosive tags cascading through the air, staggered at different depths, each seal erupting into staggered firebursts and overlapping shock rings, paper scraps and seal fragments mid-scatter.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): cratered dusk battlefield with clear depth layers —
foreground: mud, scorched planks, flying gravel and ember rain; mid-ground: the multi-tag barrage and chained fire blooms; distant: ruined ramparts, thick smoke pillars, orange hell-glow under a darkening sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines stitching the tags together, chakra vapor, sparks, dust and fire wakes reading horizontally across the 16:9 frame. Freeze-frame mid-barrage, chained mid-impact.

LIGHTING: multiple warm fire keys from each tag vs cooler shadow voids between blasts; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 28. `sword_slash`

- **Name:** Sword Slash
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A powerful sword strike with bleeding chance.
- **File:** `public/assets/skills/skill_sword_slash.png`

```
SWORD SLASH skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a single decisive katana arc mid-cut — the blade a hard white-silver slash, trailing a thick black-ink blood crescent and red ribbon of kinetic force, edge catching light like a guillotine freeze-frame.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): muddy ruined battlefield at dusk with clear depth layers —
foreground: broken spears, torn cloth, blood-dark puddles and grit; mid-ground: the blade arc and ink-blood slash; distant: splintered palisades, smoke pillars, low fire glow under a bruised orange-gray sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines along the cut path, sparks off the edge, dust and fabric scraps torn sideways across the 16:9 frame. Freeze-frame mid-slash, mid-impact.

LIGHTING: cold steel rim on the blade vs warm fire backglow; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 29. `iaido`

- **Name:** Iaido
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A lightning-fast quick draw attack. +40% crit if first action.
- **File:** `public/assets/skills/skill_iaido.png`

```
IAIDO skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a lightning-fast iaido draw — sheathed scabbard still half-visible, the blade already free in a blinding horizontal cut, pure white-gold afterimage and razor ink-slash trail, air itself split by the first-strike critical moment.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): rain-slick rocky gorge path at dusk with clear depth layers —
foreground: wet stones, mud splash, falling rain needles and torn bamboo; mid-ground: the flash-cut blade and afterimage arc; distant: cliff walls, drifting mist, faint firelight from a ruined outpost under storm clouds. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines compressed into one decisive horizontal streak, sparks, water droplets frozen mid-scatter, dust wake reading across the 16:9 frame. Freeze-frame mid-draw, mid-first-strike.

LIGHTING: cold white-gold flash on the edge vs cool moon-blue shadows and wet stone reflections; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 30. `wire_setup`

- **Name:** Ninja Tool: Wire Trap
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Set up wire traps. Next attack deals +20% damage and causes bleed.
- **File:** `public/assets/skills/skill_wire_setup.png`

```
NINJA TOOL: WIRE TRAP skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a deadly web of ultra-thin piano wire strung under lethal tension, glinting silver lines forming a geometric kill-zone, blood-ready barbs and taut knots mid-setup, one strand catching light like a razor.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): misty forest ambush trail at dusk with clear depth layers —
foreground: roots, fallen leaves, mud and coiled spare wire; mid-ground: the taut wire lattice catching moon and firelight; distant: dark tree trunks, hanging fog, ruined fence posts and a low fire glow through the woods. Painted environmental storytelling, not empty void.

MOTION & ENERGY: subtle ink-slash tension lines along each wire, faint chakra vapor at the knots, dust motes and leaf fragments drifting horizontally across the 16:9 frame. Freeze-frame mid-setup, trap about to spring.

LIGHTING: cold steel glints on the wires vs warm distant fire and cool blue mist shadows; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 31. `poison_coat`

- **Name:** Poison Coat
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Coat weapon with poison. Next attack applies poison.
- **File:** `public/assets/skills/skill_poison_coat.png`

```
POISON COAT skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a kunai blade mid-coating, viscous toxic green-violet poison dripping along the edge in thick ropes, coating brush or vial nearby, poison sheen crawling like living oil with toxic vapor rising from the steel.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): abandoned apothecary alley on a ruined battlefield fringe at dusk with clear depth layers —
foreground: cracked bottles, spilled powder, mud and poison droplets; mid-ground: the coated blade and toxic vapor; distant: broken walls, smoke pillars, low fire glow and sickly green mist under a bruised sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: ink-slash drip trails of poison, chakra vapor coils, tiny toxic sparks and dust motes reading across the 16:9 frame. Freeze-frame mid-coat, weapon about to strike.

LIGHTING: sickly green-violet poison glow as key light vs cooler shadow and distant warm fire; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 32. `smoke_bomb`

- **Name:** Smoke Bomb
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Create a smoke screen for evasion boost and enemy accuracy reduction.
- **File:** `public/assets/skills/skill_smoke_bomb.png`

```
SMOKE BOMB skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a ceramic smoke bomb mid-burst at ground level, dense white-gray smoke billowing in a violent expanding sphere, cracked shell fragments flying outward, inner core still sparking as the screen erupts.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): crowded ruined street battlefield at dusk with clear depth layers —
foreground: gravel, broken tiles, flying pot shards and curling smoke tendrils; mid-ground: the bursting bomb and thick smoke bloom; distant: half-seen rooftops, lantern fire glow swallowed by haze, smoke pillars merging with the screen under a dark orange sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash smoke plumes, dust and ash particles, chakra vapor streaks reading horizontally across the 16:9 frame. Freeze-frame mid-burst, screen still expanding.

LIGHTING: warm fire glow filtered through smoke as soft key vs cooler blue-gray shadow depths inside the cloud; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 33. `flash_bomb`

- **Name:** Flash Bomb
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Blind the enemy with a flash. Chance to reduce their accuracy.
- **File:** `public/assets/skills/skill_flash_bomb.png`

```
Flash Bomb skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a paper-wrapped flash bomb mid-detonation, white-hot magnesium burst ripping outward in a star-shaped shockwave of blinding light and shredded paper scraps, ink-slash trails radiating from the blast core.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, cracked paving stones, and flying debris; mid-ground the exploding bomb and searing white flash cone; distant ruined village street at dusk, silhouetted rooftops, smoke pillars, and stunned enemy outlines recoiling from the glare. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, chakra vapor, sparks, dust, embers, and paper confetti reading horizontally across the 16:9 frame. Subject feels mid-impact, mid-throw, mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic key light from the white-hot detonation + cool dusk rim on debris; blinding core vs deep blue-orange battlefield shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 34. `analyze`

- **Name:** Analyze Enemy
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Study the enemy for weaknesses. Increases damage dealt.
- **File:** `public/assets/skills/skill_analyze.png`

```
Analyze Enemy skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a translucent tactical overlay seal — glowing geometric chakra diagram locking onto a fractured enemy silhouette, weakness points marked with sharp red ink circles and thin targeting vectors, mid-scan pulse expanding from a focused hand-seal gesture.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground rain-slick rubble, scattered kunai, and drifting ash; mid-ground the luminous analysis lattice and tagged pressure points; distant storm-lit rocky gorge battlefield with smoke, fire glow, and a half-seen foe mid-stagger. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, chakra vapor, sparks, dust, and scanning ring ripples reading horizontally across the 16:9 frame. Subject feels mid-impact, mid-throw, mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: cool cyan-white analytical key light + warm fire rim from distant battle; hard contrast between glowing diagram lines and cooler mud-shadow terrain. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 35. `brace`

- **Name:** Brace
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Prepare for impact. Gain +30% defense until next turn.
- **File:** `public/assets/skills/skill_brace.png`

```
Brace skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: crossed forearms and a heavy guard stance mid-impact, impact shockwave cracking the air, chakra-hardened muscle tension and a hexagonal defense aura flaring at the moment a heavy strike lands — kinetic freeze of pure fortitude.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud splashes, broken timber, and flying stone chips; mid-ground the braced limbs and exploding defensive aura; distant ruined dusk battlefield with smoke pillars, fire glow, and debris rain. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, chakra vapor, sparks, dust, and radial impact rings reading horizontally across the 16:9 frame. Subject feels mid-impact, mid-throw, mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm key from battlefield fire + cool rim on the guard silhouette; hard contrast of glowing defense plate vs cooler ash-shadow ground. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 36. `cloak_invis`

- **Name:** Cloak of Invisibility
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Become nearly invisible. +60% evasion and next hit auto-crits.
- **File:** `public/assets/skills/skill_cloak_invis.png`

```
Cloak of Invisibility skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a half-dissolving cloak of warped air and chakra mirage mid-fade — edges of a ninja silhouette scattering into translucent heat-shimmer ribbons and ink-slash afterimages, one gloved hand and a kunai still sharp in the distortion.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground wet leaves, drifting pollen, and low fog; mid-ground the refracting invisibility cloak and residual motion trails; distant mist forest at dusk with broken fence posts, lantern-fire glow, and smoke columns beyond the trees. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, chakra vapor, dust motes, and refractive wake reading horizontally across the 16:9 frame. Subject feels mid-impact, mid-throw, mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: cool moon-silver key through mist + warm distant fire rim catching the cloak edges; hard contrast of ghostly translucent form vs darker forest shadows. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 37. `basic_medical`

- **Name:** Basic Medical Jutsu
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Heal wounds with medical chakra. Removes poison and bleeding.
- **File:** `public/assets/skills/skill_basic_medical.png`

```
Basic Medical Jutsu skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: glowing jade-green medical chakra spiraling from open palms over a torn battlefield bandage, luminous healing threads knitting a wound mid-seal, soft green vapor pushing back dark poison wisps and blood-mist.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, discarded wrappings, and spent syringes of wartime triage; mid-ground the green medical chakra helix and sealing hands; distant ruined dusk battlefield triage zone with smoke, fire glow, and broken carts. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, chakra vapor, sparks of green light, dust, and purifying embers reading horizontally across the 16:9 frame. Subject feels mid-impact, mid-throw, mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: soft but dramatic jade medical key light + warm fire rim from the war zone; cool green healing glow vs warmer ash-shadow ground. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 38. `focused_stance`

- **Name:** Focused Stance
- **Element:** PHYSICAL
- **Action:** TOGGLE
- **Description:** A stance focused on precision. +20% ACC, +15% Crit.
- **File:** `public/assets/skills/skill_focused_stance.png`

```
Focused Stance skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a precision ready-stance freeze — one eye reflected in a kunai blade edge, taut bowstring-like chakra lines locking onto a distant weak point, razor-thin targeting ink trails and a single critical-intent spark at the tip of a blade or finger.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground grit, spent shuriken, and wind-blown dust; mid-ground the focused stance limbs and glowing accuracy lattice; distant rocky gorge battlefield at dusk with smoke pillars, fire glow, and a far enemy silhouette. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, chakra vapor, sparks, dust, and horizontal focus beams reading across the 16:9 frame. Subject feels mid-impact, mid-throw, mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: sharp cool moonlight key on the aiming edge + warm fire rim from the battlefield; hard contrast of precision glow vs cooler gorge shadows. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 39. `defensive_posture`

- **Name:** Defensive Posture
- **Element:** PHYSICAL
- **Action:** TOGGLE
- **Description:** A defensive stance. +25% Defense, -15% Speed.
- **File:** `public/assets/skills/skill_defensive_posture.png`

```
Defensive Posture skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a low rooted guard mid-hold — heavy stance feet planted in cracked earth, arms raised in a solid shield shape, thick hexagonal chakra plating blooming like armored scales around the torso and bracers, immovable weight frozen against incoming force.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground churned mud, splintered stakes, and rolling debris; mid-ground the fortified defensive posture and chakra plate armor; distant ruined dusk battlefield with smoke pillars, fire glow, and storm sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, chakra vapor, sparks, dust, and heavy impact-pressure rings reading horizontally across the 16:9 frame. Subject feels mid-impact, mid-throw, mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm fire key + cool steel rim on the defensive plates; hard contrast of glowing armor facets vs cooler battlefield shadows. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 40. `aggressive_stance`

- **Name:** Aggressive Stance
- **Element:** PHYSICAL
- **Action:** TOGGLE
- **Description:** An offensive stance. +30% STR, -20% Defense.
- **File:** `public/assets/skills/skill_aggressive_stance.png`

```
Aggressive Stance skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a forward-leaning combat stance frozen mid-lunge — bare fists clenched, knuckles white, shoulders squared like a battering ram, raw muscle tension and sharp forward kinetic lines as the star of the frame.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cracked mud and scattered broken weapons, mid-ground dust kicked up by the charge, distant ruined battlefield at dusk with smoke pillars and fire glow along the horizon.
Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines thrusting forward, impact shockwaves radiating from the lead foot, chakra vapor and grit streaking horizontally across the 16:9 frame. Subject feels mid-impact, mid-charge — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm fire key light raking the stance from the left, cool blue dusk shadows on the far side; hard rim light on shoulders and fists. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 41. `weapon_proficiency`

- **Name:** Weapon Proficiency
- **Element:** PHYSICAL
- **Action:** PASSIVE
- **Description:** +10% weapon damage.
- **File:** `public/assets/skills/skill_weapon_proficiency.png`

```
Weapon Proficiency skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a master-forged kunai and short blade crossed mid-spin above a kill zone, steel edges catching firelight, motion-blurred weapon arcs reading as lethal mastery — the weapons themselves are the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground splintered wood and spent shell casings of shuriken in the mud, mid-ground weapon-trail afterimages, distant ruined village street under storm-dusk sky with smoke and distant torches.
Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines following the blade arcs, metal sparks and dust wake streaking horizontally across the 16:9 frame. Subject feels mid-throw, mid-parry — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic cold steel rim light on the blades plus warm ember glow from battlefield fires; deep cool shadows under the debris. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 42. `taijutsu_training`

- **Name:** Taijutsu Training
- **Element:** PHYSICAL
- **Action:** PASSIVE
- **Description:** +10% taijutsu damage.
- **File:** `public/assets/skills/skill_taijutsu_training.png`

```
Taijutsu Training skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a devastating mid-air spinning kick frozen at peak extension — one leg a blur of impact force, the other coiled, shockwave rings bursting from the heel as pure body-weapon power.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground churned dirt and training posts shattered into splinters, mid-ground dust clouds from the strike, distant rocky training gorge under bruised evening sky with wind-torn banners.
Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines wrapping the kick arc, impact dust and sweat-mist streaking horizontally across the 16:9 frame. Subject feels mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic side key light from a low sun, hard rim on the striking limb, cooler shadow mass in the gorge behind. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 43. `quick_reflexes`

- **Name:** Quick Reflexes
- **Element:** PHYSICAL
- **Action:** PASSIVE
- **Description:** +5% Evasion.
- **File:** `public/assets/skills/skill_quick_reflexes.png`

```
Quick Reflexes skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a ghosted afterimage weave mid-dodge — three motion-smeared silhouettes peeling away from a killing strike path, the lead afterimage barely clearing a spinning shuriken, pure evasion as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flying debris and a near-miss shuriken slicing past, mid-ground streaked afterimages, distant rain-slick battlefield under storm dusk with smoke and distant lightning.
Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and horizontal motion blur, rain streaks and dust wake reading across the 16:9 frame. Subject feels mid-dodge, mid-weave — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic lightning flash as key, cool blue rim on the afterimages, warm fire glints in the distance. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 44. `iron_body`

- **Name:** Iron Body
- **Element:** PHYSICAL
- **Action:** PASSIVE
- **Description:** +5% Defense (all types).
- **File:** `public/assets/skills/skill_iron_body.png`

```
Iron Body skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a torso and crossed forearms locked in an immovable guard, skin and muscle sheened with iron-hard chakra plating, sparks exploding off the surface where blades and arrows shatter uselessly.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground broken kunai and arrow shafts bouncing into mud, mid-ground impact sparks and metal fragments, distant scorched battlefield at dusk with smoke pillars and fire glow.
Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash impact bursts, ricochet sparks and dust rings expanding outward across the 16:9 frame. Subject feels mid-tank, mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm fire key from below and side, cool steel rim along the armored arms; deep shadowed battlefield behind. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 45. `chakra_reserves`

- **Name:** Chakra Reserves
- **Element:** PHYSICAL
- **Action:** PASSIVE
- **Description:** +3 CP regen/turn.
- **File:** `public/assets/skills/skill_chakra_reserves.png`

```
Chakra Reserves skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a deep well of blue-white chakra coalescing into a rising reservoir sphere above open palms, veins of energy spiraling inward as if the body itself is a living cistern refilling mid-battle.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground ash and spent tags drifting in the mud, mid-ground chakra vapor coils, distant mist forest battlefield under cool moonlight with distant campfire embers and smoke.
Painted environmental storytelling, not empty void.

MOTION & ENERGY: gentle but insistent ink-slash chakra streams and vapor trails feeding the reservoir, particles orbiting and rising across the 16:9 frame. Subject feels mid-regen, mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic cool moon key on the chakra sphere, warm distant fire glow contrasting cooler forest shadows; soft rim on the hands. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 46. `mental_fortitude`

- **Name:** Mental Fortitude
- **Element:** MENTAL
- **Action:** PASSIVE
- **Description:** +10% Genjutsu Resistance.
- **File:** `public/assets/skills/skill_mental_fortitude.png`

```
Mental Fortitude skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a cracked mind-fortress sigil — a luminous geometric barrier of interlocking seals and iron will, shattering purple genjutsu illusions on contact like glass against a shield, pure mental armor as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground fractured illusion shards and ink-black nightmare tendrils dissolving into dust, mid-ground the glowing fortitude barrier, distant ruined temple courtyard under storm dusk with smoke and broken lanterns.
Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash cracks where illusions break, psychic shockwaves and dissolving rune particles streaking across the 16:9 frame. Subject feels mid-resist, mid-shatter — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic cool lunar key on the barrier core, toxic purple genjutsu glow dying at the edges, warm distant fire through temple ruins. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 47. `precision`

- **Name:** Precision
- **Element:** PHYSICAL
- **Action:** PASSIVE
- **Description:** +5% Critical Chance.
- **File:** `public/assets/skills/skill_precision.png`

```
Precision skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a single shuriken frozen mid-spin on a lethal trajectory, edge catching a razor of cold light as it cleaves a hair-thin path toward an unseen vital point. Place the hero slightly above center for UI crop (object-position center 30%). Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers — foreground mud, cracked stone shards, and drifting ash; mid-ground the spinning steel and ink-slash wake; distant ruined village street at dusk, broken rooftops and smoke pillars against a bruised orange sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines streaking horizontally behind the shuriken, sparks off the blade edge, dust kicked up along the flight path — freeze-frame of a perfect critical-hit moment from a seinen fight scene.

LIGHTING: hard cool steel rim light on the weapon edge; warm fire-glow from distant burning debris vs deep blue-shadow mud. High contrast, painterly volume.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 48. `fire_affinity`

- **Name:** Fire Affinity
- **Element:** FIRE
- **Action:** PASSIVE
- **Description:** +15% Fire damage.
- **File:** `public/assets/skills/skill_fire_affinity.png`

```
Fire Affinity skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a clenched fist wreathed in living katon flame, chakra-fire coiling up the forearm like a serpent of pure heat, heat-haze warping the air around the knuckles. Place the hero slightly above center for UI crop (object-position center 30%). Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers — foreground scorched earth, glowing embers, and blackened weapon scraps; mid-ground the flaming fist and rising fire tongues; distant war-torn battlefield at dusk, charred trees and smoke columns under a blood-orange sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash trails of flame and soot streaking across the frame, drifting sparks and ash, heat shimmer — freeze-frame of elemental power locked and ready from a seinen combat plate.

LIGHTING: fierce warm key light from the katon fire itself; cool indigo shadows in the ruins; rim of molten orange on debris edges. Hard contrast, painterly volume.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 49. `air_palm`

- **Name:** Air Palm
- **Element:** WIND
- **Action:** ACTIVE
- **Description:** Hyuga ranged technique. Fires a burst of chakra.
- **File:** `public/assets/skills/skill_air_palm.png`

```
Air Palm skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: an open palm thrust forward mid-strike, a compressed cone of pale blue-white chakra blasting from the heel of the hand like a silent cannon shot. Place the hero slightly above center for UI crop (object-position center 30%). Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers — foreground leaves and gravel torn up by the pressure wave; mid-ground the palm and expanding chakra burst; distant misty forest gorge and rocky cliffs under a storm-grey dusk sky, fog shredded by the shockwave. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and concentric pressure rings racing horizontally from the palm, chakra vapor ribbons, dust and leaf debris blown aside — freeze-frame of Hyuga ranged impact from a seinen fight scene.

LIGHTING: cool cyan-white key light from the chakra blast; cooler moon-rim on the palm and tree silhouettes; deep shadow in the gorge. Hard contrast, painterly volume.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 50. `rasengan`

- **Name:** Rasengan
- **Element:** WIND
- **Action:** ACTIVE
- **Description:** A swirling sphere of pure wind chakra that grinds into the target. PIERCING damage ignores flat defense.
- **File:** `public/assets/skills/skill_rasengan.png`

```
Rasengan skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a dense swirling sphere of pure wind chakra locked in a palm, spiral layers grinding with violent rotation, cyan-white core and razor wind threads peeling off the surface. Place the hero slightly above center for UI crop (object-position center 30%). Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers — foreground splintered wood, torn earth, and wind-whipped grit; mid-ground the rasengan and forearm braced for impact; distant rocky battlefield and ruined outpost under a turbulent dusk sky, clouds twisted by the sphere’s pull. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash spiral trails and horizontal wind shear lines, dust orbiting the sphere, debris sucked into the rotation — freeze-frame mid-grind, piercing impact moment from a seinen combat plate.

LIGHTING: brilliant cool cyan-white key from the rasengan core; warm distant fire-glow on wreckage vs cold storm shadows. Hard contrast, painterly volume.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 51. `fireball`

- **Name:** Katon: Great Fireball
- **Element:** FIRE
- **Action:** ACTIVE
- **Description:** A massive, searing projectile of flame. Leaves the target burning.
- **File:** `public/assets/skills/skill_fireball.png`

```
Katon: Great Fireball skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a massive roaring fireball mid-flight, a searing sphere of katon flame with a white-hot core and rolling orange-crimson shell, trailing a comet wake of fire and black smoke. Place the hero slightly above center for UI crop (object-position center 30%). Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers — foreground scorched mud, glowing coals, and flung debris; mid-ground the great fireball dominating the frame; distant war-ruined street and collapsed walls at dusk, buildings lit by the projectile’s approach, smoke pillars clawing the sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash flame trails and horizontal smoke streaks, embers and ash blown sideways, heat-warped air — freeze-frame of the jutsu a heartbeat before impact from a seinen fight scene.

LIGHTING: overwhelming warm key light from the fireball itself; cool blue-violet dusk shadows in the ruins; hard rim of molten gold on broken stone. Hard contrast, painterly volume.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 52. `kaiten`

- **Name:** 8 Trigrams Rotation
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Expels chakra while spinning to repel attacks. Reflects damage.
- **File:** `public/assets/skills/skill_kaiten.png`

```
8 Trigrams Rotation skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a perfect spherical dome of rotating pale chakra, spun into a defensive vortex that flings incoming weapons outward, surface etched with faint eight-trigram arcs and shearing wind. Place the hero slightly above center for UI crop (object-position center 30%). Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers — foreground weapons, shuriken, and rubble mid-repulsion; mid-ground the glowing kaiten sphere and spiral wake; distant rocky gorge battlefield under stormy dusk, dust rings expanding across the ground. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash circular spin trails and radial shock lines, deflected steel sparking off the dome, dust and chakra vapor whipping sideways — freeze-frame of absolute defense mid-spin from a seinen combat plate.

LIGHTING: cool white-cyan key light from the chakra sphere; warm fire-glow from distant battle vs deep cool shadows in the gorge. Hard contrast, painterly volume.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 53. `byakugan`

- **Name:** Byakugan
- **Element:** PHYSICAL
- **Action:** TOGGLE
- **Description:** The All-Seeing White Eye. Drastically improves Accuracy and Crit Chance.
- **File:** `public/assets/skills/skill_byakugan.png`

```
Byakugan skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a single pale Byakugan eye mid-activation, iris whitened and veins of pure white chakra branching across the sclera, with geometric sight-lines and targeting reticle arcs of soft light radiating outward. Place the hero slightly above center for UI crop (object-position center 30%). Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers — foreground drifting mist and shattered stone; mid-ground the eye and luminous perception beams cutting the air; distant rain-soaked village rooftops and ruined walls at dusk, half-seen through the all-seeing sight cone, smoke and lantern glow far below. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash perception rays and horizontal focus lines, faint chakra vapor, rain streaking across the sight field — freeze-frame of absolute awareness locking onto a vital point from a seinen combat plate.

LIGHTING: cold pearl-white key light from the Byakugan itself; cooler blue-grey rain dusk in the village; subtle warm lantern pinpoints in the distance. Hard contrast, painterly volume.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 54. `gentle_fist`

- **Name:** Gentle Fist
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Precise strikes to chakra points. True damage + Chakra Drain.
- **File:** `public/assets/skills/skill_gentle_fist.png`

```
Gentle Fist skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a pair of open palms mid-thrust, fingertips glowing with pale blue chakra needles punching through a ghostly human meridian diagram — tenketsu points bursting as bright white sparks along ink-black energy lines.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered roof tiles and torn paper seals floating in dust; mid-ground the glowing tenketsu strike and drifting chakra vapor; distant Hyūga-style courtyard ruins under a cold dusk sky, paper lanterns burning low, smoke pillars rising beyond broken wooden pillars. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines streaking from the fingertips, pale blue chakra vapor, white tenketsu sparks, dust and debris reading horizontally across the 16:9 frame. Subject feels mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: cool moon-white key light + sharp blue rim on the palms; warm orange lantern glow vs cooler indigo shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 55. `sharingan_2`

- **Name:** Sharingan (2-Tomoe)
- **Element:** FIRE
- **Action:** TOGGLE
- **Description:** Visual prowess that perceives attack trajectories. Toggle: Increases Speed and Dexterity.
- **File:** `public/assets/skills/skill_sharingan_2.png`

```
Sharingan (2-Tomoe) skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a single fierce Sharingan eye with two black tomoe spinning in a blood-crimson iris, surrounded by layered ghost-afterimages of spinning shuriken and kunai trajectories drawn as red prediction arcs.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, broken kunai, and smoking shuriken half-buried in dirt; mid-ground the glowing two-tomoe eye and crimson trajectory lines cutting the air; distant ruined dusk battlefield with fire glow, smoke pillars, and silhouetted ruined towers under a storm-bruised sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, spinning tomoe motion blur, red prediction arcs, embers and dust reading horizontally across the 16:9 frame. Subject feels mid-perception, mid-dodge read — a freeze-frame from a seinen fight scene.

LIGHTING: deep crimson key light from the iris + cool ash-gray rim; warm fire glow on distant ruins vs cooler blue-black shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 56. `water_prison`

- **Name:** Water Prison
- **Element:** WATER
- **Action:** ACTIVE
- **Description:** Traps the enemy in a sphere of heavy water. High stun chance.
- **File:** `public/assets/skills/skill_water_prison.png`

```
Water Prison skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a massive pressurized sphere of heavy water mid-formation, a thrashing enemy silhouette locked inside as bubbles and crushing current spiral around them — surface tension cracking with bright cyan highlights.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground rain-slick stones, floating debris, and spray droplets; mid-ground the crushing water sphere and spiraling current; distant flooded ruins and broken bridge pillars under a storm-gray sky, sheets of rain and mist. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash water trails, spiral current lines, bursting spray, mist and rain streaks reading horizontally across the 16:9 frame. Subject feels mid-trap, mid-crush — a freeze-frame from a seinen fight scene.

LIGHTING: cold cyan key light through the water sphere + deep teal rim; distant lightning flash vs cooler slate shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 57. `suijinheki`

- **Name:** Water Wall
- **Element:** WATER
- **Action:** ACTIVE
- **Description:** Expels water to form a defensive barrier. Creates a Shield.
- **File:** `public/assets/skills/skill_suijinheki.png`

```
Water Wall skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a towering vertical surge of water erupting into a defensive barrier wall, kunai and fireballs shattering against its crest while translucent blue plates of liquid armor stack like overlapping shields.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud splashes, broken spears, and rain-pocked ground; mid-ground the roaring water wall and impact spray; distant rain-soaked village street with torii gate half-submerged, storm sky and fogged rooftops beyond. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash water wake lines, vertical spray columns, ricocheting sparks from blocked weapons, rain and mist reading horizontally across the 16:9 frame. Subject feels mid-cast, mid-block — a freeze-frame from a seinen fight scene.

LIGHTING: cool blue-white key light through the water crest + silver rim highlights; warm distant lantern fire vs cooler storm shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 58. `hell_viewing`

- **Name:** Hell Viewing Technique
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** A Genjutsu that reveals the target's worst fears. MENTAL damage bypasses physical defense, resisted by Calmness.
- **File:** `public/assets/skills/skill_hell_viewing.png`

```
Hell Viewing Technique skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a cracked genjutsu mirror-sphere exploding outward into nightmare geometry — twisted hands, screaming silhouettes, and inverted staircases of black ink pouring from a single blood-red seal at the core.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground torn ground, floating shards of broken reality glass, and curling black ink smoke; mid-ground the shattering hell-vision sphere and nightmare silhouettes; distant battlefield dusk warped by impossible architecture, fire glow bleeding through cracks in the sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash trails, shattering glass shards, spiraling black vapor, red seal flare and fear-wisps reading horizontally across the 16:9 frame. Subject feels mid-cast, mid-reveal — a freeze-frame from a seinen fight scene.

LIGHTING: sickly crimson key light from the seal + cold bone-white rim; warm fire leaking through sky-cracks vs deep violet-black shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 59. `mind_destruction`

- **Name:** Mind Body Disturbance
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Sends chakra into the opponent's nervous system to confuse their movement. MENTAL damage, causes confusion.
- **File:** `public/assets/skills/skill_mind_destruction.png`

```
Mind Body Disturbance skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: luminous chakra threads like neon puppet strings plunging into a floating nervous-system diagram — limbs jerked into wrong angles, afterimage limbs overlapping in confused double-exposure, purple-white sparks jumping along synaptic paths.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cracked earth, discarded weapons mid-tumble as if bodies lost control; mid-ground the thrashing nervous-system silhouette and electric chakra threads; distant misty forest battlefield with broken trees and low fog under a storm-violet dusk sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash motion trails, stuttering afterimage limbs, synaptic lightning sparks, chakra vapor and dust reading horizontally across the 16:9 frame. Subject feels mid-hijack, mid-confusion — a freeze-frame from a seinen fight scene.

LIGHTING: electric violet-white key light along the nerve threads + cool teal rim; distant storm flash vs deep indigo shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 60. `dragon_flame`

- **Name:** Dragon Flame Bomb
- **Element:** FIRE
- **Action:** ACTIVE
- **Description:** A dragon-shaped fireball that causes severe burns.
- **File:** `public/assets/skills/skill_dragon_flame.png`

```
Dragon Flame Bomb skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a roaring dragon-shaped fireball mid-flight, jaws open in a maw of white-hot core and orange-red scales of flame, horns and serpentine body sculpted from living fire and black smoke.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground scorched mud, glowing embers, and flying debris; mid-ground the dragon fireball and trailing flame wake; distant ruined dusk battlefield with smoke pillars, burning wreckage, and a sky split by heat haze and ash. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash flame trails, ember storms, smoke coils, sparks and heat-warp lines reading horizontally across the 16:9 frame. Subject feels mid-blast, mid-charge — a freeze-frame from a seinen fight scene.

LIGHTING: intense white-hot core key light + orange fire rim; cool ash-blue shadows on the ruined ground. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 61. `hidden_mist`

- **Name:** Hidden Mist Jutsu
- **Element:** WATER
- **Action:** ACTIVE
- **Description:** Creates a dense mist for evasion and enemy accuracy reduction.
- **File:** `public/assets/skills/skill_hidden_mist.png`

```
Hidden Mist Jutsu skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a roaring wall of pale-blue chakra mist erupting from the ground, half-formed hand seals dissolving into vapor at its core, silhouettes of shattered kunai and wet armor fragments suspended mid-air inside the fog.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground rain-slick mud, broken planks, and drifting water droplets; mid-ground the dense rolling mist bank swallowing a ruined village street; distant collapsed rooftops and torch-glow smeared into grey-blue fog under a storm dusk sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines of pale vapor streaking horizontally, chakra mist coils spinning off the wall, cold water spray and wet debris reading across the 16:9 frame. Subject feels mid-cast — a freeze-frame from a seinen fight scene as the battlefield vanishes into whiteout.

LIGHTING: cold moon-rim and soft cyan chakra glow inside the mist vs deep cool shadows in the ruins; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 62. `water_clone`

- **Name:** Water Clone Jutsu
- **Element:** WATER
- **Action:** ACTIVE
- **Description:** Creates a water clone for a strength buff.
- **File:** `public/assets/skills/skill_water_clone.png`

```
Water Clone Jutsu skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a half-formed water clone mid-materialization — translucent blue humanoid torso and raised fist of liquid chakra, surface rippling with hard reflections, twin streams of water still feeding into its spine from a ruptured ground pool.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flooded mud, broken spears, and floating debris; mid-ground the rising clone standing in a crater of surging water; distant rain-soaked battlefield ruins and smoke pillars under a slate storm sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash water trails whipping off the clone's arm, chakra vapor and upward water jets, spray sheets and droplets streaking horizontally across the 16:9 frame. Subject feels mid-summon, mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: cool cyan rim light through translucent water volume, warm fire glow from distant wreckage punching through rain; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 63. `lightning_ball`

- **Name:** Lightning Ball
- **Element:** LIGHTNING
- **Action:** ACTIVE
- **Description:** A ball of lightning with stun chance.
- **File:** `public/assets/skills/skill_lightning_ball.png`

```
Lightning Ball skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a dense sphere of white-violet lightning clenched mid-air, arcs lashing outward like a living storm core, crackling filaments coiling around a blackened focal point about to detonate.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground scorched mud, shattered stone shards, and sparks skittering off wet ground; mid-ground the lightning ball hanging above a ruined ridge; distant storm-torn battlefield with broken trees, smoke pillars, and purple-white thunder splitting a dusk sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash electric trails whipping off the sphere, jagged speed lines of pure voltage, ozone vapor and flying embers reading horizontally across the 16:9 frame. Subject feels mid-cast, mid-throw — a freeze-frame from a seinen fight scene at the instant before impact.

LIGHTING: searing white-violet key light from the ball, hard electric rims on debris, deep blue-black storm shadows; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 64. `earth_decapitation`

- **Name:** Inner Decapitation
- **Element:** EARTH
- **Action:** ACTIVE
- **Description:** Pull enemy underground with high stun chance.
- **File:** `public/assets/skills/skill_earth_decapitation.png`

```
Inner Decapitation skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a violent earthen maw tearing open mid-battlefield — cracked stone plates slamming shut like jaws, a trapped armored silhouette yanked waist-deep into the rift, dirt and rock fists erupting upward around the sinkhole.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flying mud clods, snapped roots, and gravel spray; mid-ground the crushing earth trap mid-close; distant rocky gorge battlefield under a dusty amber dusk sky with smoke and fallen banners. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash dirt trails and radial shock cracks racing outward, dust plumes, rock chips and chakra-brown vapor streaking across the 16:9 frame. Subject feels mid-pull, mid-crush — a freeze-frame from a seinen fight scene.

LIGHTING: warm low sun raking across broken stone, cool shadow inside the sinkhole, dust-lit volume; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 65. `great_breakthrough`

- **Name:** Great Breakthrough
- **Element:** WIND
- **Action:** ACTIVE
- **Description:** A powerful gust of wind that reduces enemy accuracy.
- **File:** `public/assets/skills/skill_great_breakthrough.png`

```
Great Breakthrough skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a colossal horizontal blast of cutting wind shaped like a roaring cyclone blade, green-white pressure waves stacked in layers, trees and debris already mid-shatter inside the gale's throat.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground leaves, sand, and broken spears whipping toward the camera; mid-ground the massive wind wall tearing across a mud battlefield; distant ruined fortifications and smoke pillars bent sideways under a torn dusk sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash wind trails and spiral speed lines blasting left-to-right, chakra vapor ribbons, dust sheets and flying embers reading across the 16:9 frame. Subject feels mid-release — a freeze-frame from a seinen fight scene as the gust flattens the field.

LIGHTING: cool green-white rim along the wind front, warm fire glow from distant wreckage in the shadows; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 66. `air_bullet`

- **Name:** Air Bullet
- **Element:** WIND
- **Action:** ACTIVE
- **Description:** Compressed air projectile that reduces enemy defense.
- **File:** `public/assets/skills/skill_air_bullet.png`

```
Air Bullet skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a hyper-compressed sphere of invisible-edged air mid-flight, visible only as a hard refractive lens of warped space with razor wind rings spinning off its surface, punching a clean tunnel through smoke.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shredded paper seals, dust grit, and flying wood splinters; mid-ground the air bullet streaking over cracked earth; distant canyon battlefield and fire-lit ruins under a wind-torn dusk sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash vacuum trails and concentric shock rings behind the projectile, chakra-green vapor wake, debris sucked into the slipstream reading horizontally across the 16:9 frame. Subject feels mid-shot — a freeze-frame from a seinen fight scene at terminal velocity.

LIGHTING: sharp cool key light catching the refractive bullet edge, warm ember glow in the background wreckage; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 67. `fang_over_fang`

- **Name:** Fang Over Fang
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Inuzuka dual rotation attack. Hits twice at 50% each.
- **File:** `public/assets/skills/skill_fang_over_fang.png`

```
Fang Over Fang skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: twin spinning drill-tornadoes of interlocking fang silhouettes mid-clash — two horizontal vortex cones of clawed kinetic force and torn earth, teeth-and-fur motion blurs fused into a double helix of pure impact.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flying mud, shredded grass, and broken bone tags; mid-ground the dual rotation drills gouging a trench through the field; distant ruined forest edge and smoke under a bloody dusk sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash spiral trails and crossed speed lines, dust rings, debris and faint red impact sparks whipping horizontally across the 16:9 frame. Subject feels mid-double-hit — a freeze-frame from a seinen fight scene at the moment both drills connect.

LIGHTING: hard warm rim from low sun, cool shadow in the trench, dust-lit volume and spark highlights; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 68. `mind_transfer`

- **Name:** Mind Transfer Jutsu
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Yamanaka mind control. 70% stun for 2 turns. Miss = self stun.
- **File:** `public/assets/skills/skill_mind_transfer.png`

```
Mind Transfer Jutsu skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a translucent spirit-projection silhouette ripping free from a kneeling body, head snapped back as a glowing psychic tether of pale violet chakra lances forward into a distant enemy outline — the mind-leap frozen mid-hijack.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered wooden posts and drifting ash, mid-ground the spirit form and taut psychic cord cutting the frame, distant dusk battlefield of ruined clan compounds under bruised purple-orange sky with smoke pillars and torch fire. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines along the mind-tether, chakra vapor spiraling off the spirit head, residual afterimages of the leap, dust kicked from the host body — freeze-frame mid-possession from a seinen fight scene.

LIGHTING: cold spectral rim light on the spirit form vs warm fire glow on the ruined village; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines,
neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark,
no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space,
photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen,
transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 69. `shadow_possession`

- **Name:** Shadow Possession
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Nara shadow binding. High stun chance with reflect.
- **File:** `public/assets/skills/skill_shadow_possession.png`

```
Shadow Possession skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a living black shadow tendril stretching across cracked earth like a spear, forking into clawed hands that pin an enemy silhouette mid-stride — the Nara shadow technique locked at the moment of total bind.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, broken kunai, and low fog curling over the shadow's edge; mid-ground the ink-black tendril and captured figure; distant ruined forest battlefield at dusk with long tree shadows, smoke plumes, and a dying orange horizon. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash trails where the shadow surged, liquid black ripples, dust and leaf debris exploding outward from the grab point — freeze-frame mid-bind from a seinen fight scene.

LIGHTING: harsh low-angle sunset key light casting the elongated shadow; cool blue ambient in the shade vs warm rim on debris; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines,
neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark,
no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space,
photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen,
transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 70. `bug_swarm`

- **Name:** Parasitic Insects
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Aburame insect attack. Drains chakra and poisons.
- **File:** `public/assets/skills/skill_bug_swarm.png`

```
Parasitic Insects skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a dense corkscrew swarm of glossy black kikaichū beetles erupting from a torn sleeve and coat cuff, forming a living spear of insects that spiral toward a recoiling enemy outline — chakra-drain mid-assault.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground crawling beetles on mud and splintered wood, mid-ground the roaring insect column, distant mist-choked forest path with broken fencing, hanging lanterns, and smoke drifting under a greenish dusk canopy. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash motion trails around the swarm's spiral, chakra vapor siphoned as pale green wisps from the target, dust and leaf particles whirling — freeze-frame mid-devour from a seinen fight scene.

LIGHTING: sickly green chakra glow from within the swarm vs cooler forest shadows and warm distant firelight; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines,
neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark,
no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space,
photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen,
transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 71. `expansion`

- **Name:** Expansion Jutsu
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Akimichi body expansion. Big damage with strength buff.
- **File:** `public/assets/skills/skill_expansion.png`

```
Expansion Jutsu skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a colossal clenched fist and forearm mid-growth, knuckles the size of boulders, flesh crackling with calorie-burn chakra steam as the smash descends — pure mass and power as the technique star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flying rubble, upturned earth, and shattered armor plates; mid-ground the giant fist impacting; distant ruined outpost battlefield at dusk with collapsing watchtowers, smoke pillars, and fire glow along the ridge. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash shockwaves radiating from the impact zone, dust rings, sparks off crushed stone, steam plumes — freeze-frame mid-crush from a seinen fight scene.

LIGHTING: warm fire and sunset key light rimming the massive fist vs cooler blue smoke shadows; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines,
neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark,
no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space,
photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen,
transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 72. `64_palms`

- **Name:** 8 Trigrams 64 Palms
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Hyuga ultimate technique. TRUE damage that drains chakra and debuffs all stats.
- **File:** `public/assets/skills/skill_64_palms.png`

```
8 Trigrams 64 Palms skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a barrage of open-palm strikes frozen as a radial constellation of afterimage hands, each hit sparking blue-white tenketsu points on a ghostly chakra network diagram — the 64-hit assault mid-cascade.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground spinning leaves and broken tile debris, mid-ground the palm-strike constellation and glowing tenketsu web, distant misty rocky gorge and torii gate ruins under a storm-dusk sky with distant lightning. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines in a spinning bagua wheel, chakra vapor threads, white-blue impact sparks at each palm point — freeze-frame mid-barrage from a seinen fight scene.

LIGHTING: cool Byakugan-blue key glow on the hands and tenketsu vs warmer distant storm rim light; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines,
neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark,
no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space,
photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen,
transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 73. `sand_burial`

- **Name:** Sand Burial
- **Element:** EARTH
- **Action:** ACTIVE
- **Description:** Execute attack. +100% damage if target below 25% HP.
- **File:** `public/assets/skills/skill_sand_burial.png`

```
Sand Burial skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a crushing sphere of golden desert sand mid-collapse, grinding shut like a giant fist around a trapped silhouette — grains spiraling inward as the burial seals the execute.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground scattered bone fragments, cracked gourds, and low sand dunes; mid-ground the compressing sand tomb; distant scorched sand-waste battlefield under a blood-orange dusk sky with dust storms, ruined sandstone pillars, and heat haze. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash sand-wake trails, grit and debris whipping horizontally, embers mixed into the golden spiral — freeze-frame mid-crush execute from a seinen fight scene.

LIGHTING: warm amber sand-glow and harsh desert key light vs deep cool shadows inside the burial sphere; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines,
neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark,
no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space,
photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen,
transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 74. `curse_mark_1`

- **Name:** Curse Mark Stage 1
- **Element:** PHYSICAL
- **Action:** TOGGLE
- **Description:** Toggle: +40% STR, +30% SPD. Costs HP to activate and upkeep.
- **File:** `public/assets/skills/skill_curse_mark_1.png`

```
Curse Mark Stage 1 skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a shoulder and upper back erupting with black curse-seal patterns that bloom into jagged dark glyphs, blood-red chakra vapor boiling off the marks as power surges — the Stage 1 awakening as pure emblematic energy, not a full portrait.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, blood droplets, and torn cloth; mid-ground the cursed flesh and rising dark chakra; distant ruined dusk battlefield with fire, smoke pillars, fallen weapons, and a storm-bruised sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash trails of black seal energy racing across skin, red-black chakra vapor, sparks and dust kicked by the power spike — freeze-frame mid-activation from a seinen fight scene.

LIGHTING: sickly red-violet curse glow as key light on the seals vs cool smoke-blue shadows and warm distant fire rim; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines,
neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark,
no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space,
photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen,
transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 75. `sand_shield`

- **Name:** Sand Shield
- **Element:** EARTH
- **Action:** ACTIVE
- **Description:** Automatic sand defense. Creates 80 shield.
- **File:** `public/assets/skills/skill_sand_shield.png`

```
Sand Shield skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a colossal roaring spiral of golden desert sand locking into a dense hexagonal shield wall mid-form, grains still whipping outward like a living storm, faint chakra glyphs glowing in the packed sand face.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cracked mud, scattered kunai, and drifting sand grit; mid-ground the sand shield erupting from scorched earth; distant ruined canyon battlefield at amber dusk with smoke pillars, collapsed stone pillars, and wind-blown dust haze. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and spiraling sand trails reading horizontally across the 16:9 frame; grain streams, dust bursts, and chakra vapor freeze-framed mid-impact as the wall seals shut — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm desert-sun key light raking the sand wall; hot orange rim on raised grains vs cooler purple-blue canyon shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 76. `sharingan_predict`

- **Name:** Sharingan: Predict
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** See enemy's next move. +25% Evasion.
- **File:** `public/assets/skills/skill_sharingan_predict.png`

```
Sharingan: Predict skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a single blazing crimson Sharingan iris suspended in cracked air, tomoe spinning into afterimage rings that fracture into ghost-outline attack paths — phantom blades, kicks, and kunai arcs mapped a heartbeat before they land.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered roof tiles, torn banners, and floating ash; mid-ground the predictive eye and its spectral motion-ghosts over blood-stained wooden planks; distant rain-slick village street at violet dusk, smoke rising from burning eaves, silhouettes clashing in the far haze. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and red genjutsu streak trails cutting horizontally across the 16:9 frame; broken time-rings, chakra vapor, and black-red sparks freeze-framed mid-read — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic blood-red ocular key light blasting from the iris; cool moonlit rim on debris vs deep indigo war-street shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 77. `byakugan_scan`

- **Name:** Tenketsu Scan
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Scan chakra points. Next attack ignores 30% defense.
- **File:** `public/assets/skills/skill_byakugan_scan.png`

```
Tenketsu Scan skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a pale near-white Byakugan glare projected as a geometric chakra-network overlay — glowing tenketsu nodes and meridian lines mapping a half-seen enemy outline like a surgical targeting diagram mid-scan.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground broken lattice wood, fallen shuriken, and mist beads catching light; mid-ground the luminous tenketsu web and scanning beams; distant fog-choked rocky gorge at cold dawn, cliff temples half-lost in low cloud, distant battle dust. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and razor-thin white scan-lines sweeping horizontally across the 16:9 frame; node pulses, chakra vapor threads, and pinpoint sparks freeze-framed mid-lock — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic icy-white ocular key light from the scan; cool blue-silver rim on mist and stone vs deep slate canyon shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 78. `summon_gamabunta`

- **Name:** Summoning: Gamabunta
- **Element:** WATER
- **Action:** ACTIVE
- **Description:** Summon the great toad. Big water damage + shield.
- **File:** `public/assets/skills/skill_summon_gamabunta.png`

```
Summoning: Gamabunta skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a massive scarred toad war-lord silhouette crashing down mid-landing — giant webbed claw and pipe-smoke plume dominating the frame, tidal water sheet exploding outward from the impact crater, summoning-seal rings still burning under the splash.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground churning flood water, uprooted timber, and flying mud clods; mid-ground the great toad and erupting water wall; distant storm-lashed flooded ruins at bruised dusk, lightning-lit watchtowers and rain curtains. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and horizontal water-slash wakes across the 16:9 frame; spray sheets, rain needles, steam, and summoning-seal embers freeze-framed mid-crash — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic storm-lightning key light bleaching the toad's shoulder; warm pipe-glow and cool cyan water rims vs deep rain-black shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 79. `summon_manda`

- **Name:** Summoning: Manda
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Summon the great snake. High damage + TRUE poison.
- **File:** `public/assets/skills/skill_summon_manda.png`

```
Summoning: Manda skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a colossal purple-scaled serpent head lunging through torn space — fangs bared, venom strands whipping like liquid knives, massive coils crushing shattered stone, summoning contract seals still smoking along its neck.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground broken boulders, venom puddles eating into dirt, and flying rock shards; mid-ground the great snake strike and thrashing coils; distant scorched rocky gorge at blood-orange dusk with smoke pillars, dead trees, and dust storms. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and venom-ribbon trails slicing horizontally across the 16:9 frame; scale glints, dust bursts, green-black poison mist, and seal-sparks freeze-framed mid-bite — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic low sun key light catching wet purple scales; toxic green venom glow vs cooler charcoal canyon shadows and fire-orange sky. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 80. `puppet_crow`

- **Name:** Puppet: Crow
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Deploy puppet with poison and bleed.
- **File:** `public/assets/skills/skill_puppet_crow.png`

```
Puppet: Crow skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a black-lacquer assassin puppet mid-deploy — hinged wings unfurling into a fan of poisoned blades and bloody shuriken, chakra strings taut like harp wires, crow-mask face and joint seams leaking green venom mist.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground torn scroll scraps, blood droplets, and broken puppet parts; mid-ground the Crow puppet in lethal open-wing pose; distant rain-slick village rooftops at indigo dusk, paper lanterns guttering, smoke from distant fires. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and black-feather blade trails streaking horizontally across the 16:9 frame; chakra-string shimmer, poison droplets, sparks from metal joints, and ash freeze-framed mid-strike — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic cold moonlight key on lacquered wood and steel; sickly green poison rim vs warm distant fire glow in the alleys. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 81. `shadow_clone`

- **Name:** Shadow Clone Jutsu
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Creates solid clones to overwhelm the enemy. Massive stat buffs but deals NO direct damage.
- **File:** `public/assets/skills/skill_shadow_clone.png`

```
Shadow Clone Jutsu skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a hard-edged explosion of identical shinobi silhouettes bursting outward from a central smoke-and-seal flash — partial limbs, fists, and kunai mirrored in a radial wave, each clone solid enough to kick up real dust, not ghostly.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud clods, kicked gravel, and swirling smoke rings; mid-ground the multiplying clone burst and hand-seal afterimage; distant ruined dusk battlefield with fire glow, broken banners, and smoke pillars under a storm-bruised sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and white-gray clone-pop trails racing horizontally across the 16:9 frame; chakra vapor, paper-seal scraps, sparks, and debris freeze-framed mid-multiply — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic warm fire-key light from the battlefield edge; cool blue-white chakra flash rim on each silhouette vs deep smoke-shadow valleys. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 82. `primary_lotus`

- **Name:** Primary Lotus
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A forbidden technique unlocking the body's limits. Devastating PIERCING physical damage at the cost of HP.
- **File:** `public/assets/skills/skill_primary_lotus.png`

```
Primary Lotus skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a spinning heel-drop freeze-frame — blurred legs locked in a devastating inverted axis kick, green chakra bands whipping like torn bandages around the limbs, bone-shock impact lines exploding from the point of contact.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered roof tiles, splintered wooden beams, and sweat-mist particles; mid-ground the lotus kick mid-impact with green life-force vapor and dust rings; distant ruined training grounds at dusk, smoke pillars and orange fire glow bleeding through broken walls. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, green chakra vapor, sparks of bone-force, dust and debris reading horizontally across the 16:9 frame. Subject feels mid-impact — a freeze-frame from a seinen fight scene where flesh pays for power.

LIGHTING: dramatic key light from the kick's green chakra flare + warm fire rim from distant blaze vs cooler blue dusk shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 83. `chidori`

- **Name:** Chidori
- **Element:** LIGHTNING
- **Action:** ACTIVE
- **Description:** A crackling assassination technique. High speed thrust that deals PIERCING elemental damage.
- **File:** `public/assets/skills/skill_chidori.png`

```
Chidori skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a crackling spear of white-blue lightning clenched in a thrusting fist — a thousand chirping birds of pure voltage compressed into a piercing point, plasma feathers and arcing forks tearing the air.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud ruts, torn earth, and rain-slick gravel catching electric reflections; mid-ground the lightning thrust mid-lunge with afterimage speed trails; distant forest battlefield under a storm-broken dusk sky, smoke columns and tree silhouettes lit by blue-white flash. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, crackling plasma feathers, ozone vapor, sparks and rain streaks reading horizontally across the 16:9 frame. Subject feels mid-thrust — a freeze-frame from a seinen assassination charge.

LIGHTING: searing white-blue key light from the chidori core + cool rim lightning vs warm amber dusk fire glow in the far smoke. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 84. `chidori_stream`

- **Name:** Chidori Stream
- **Element:** LIGHTNING
- **Action:** ACTIVE
- **Description:** Releases lightning chakra in all directions, paralyzing nearby foes.
- **File:** `public/assets/skills/skill_chidori_stream.png`

```
Chidori Stream skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a radial explosion of forking white-blue lightning bursting outward from a central crouching core — a storm halo of electrified chakra streams whipping in every direction like living serpents of voltage.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground scorched grass, sparking metal scraps, and rain droplets frozen mid-air; mid-ground the lightning radius expanding in violent arcs; distant rocky gorge battlefield under bruised storm clouds, smoke pillars and fire glow reflected in wet stone. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent radial ink-slash trails, chakra vapor, ozone sparks, dust rings and rain scatter reading across the 16:9 frame. Subject feels mid-burst — a freeze-frame from a seinen area-denial surge.

LIGHTING: cold electric key light flooding from the center burst + warm distant fire rim on wet rock vs deep storm shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 85. `sand_coffin`

- **Name:** Sand Coffin
- **Element:** EARTH
- **Action:** ACTIVE
- **Description:** Encases the enemy in crushing waves of sand. ARMOR_BREAK ignores % defense.
- **File:** `public/assets/skills/skill_sand_coffin.png`

```
Sand Coffin skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a towering spiral coffin of golden-brown sand crushing inward — dense granular walls closing like a fist, dust veins and pressure cracks glowing with buried earth chakra as the form seals shut.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground loose grit, cracked skull fragments, and wind-blown sand ribbons; mid-ground the coffin spiral mid-crush with cascading sand curtains; distant sun-bleached desert waste at dusk, ruined watchtowers and smoke pillars under a copper sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent sand-slash motion trails, grit storms, dust plumes, and pressure-shock rings reading horizontally across the 16:9 frame. Subject feels mid-crush — a freeze-frame from a seinen burial execution.

LIGHTING: warm amber key light from low desert sun + cool blue shadow in sand crevices; rim of golden dust catching fire glow from distant ruin blazes. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 86. `water_dragon`

- **Name:** Water Dragon Jutsu
- **Element:** WATER
- **Action:** ACTIVE
- **Description:** Manifests a majestic dragon of water to crash down upon the foe.
- **File:** `public/assets/skills/skill_water_dragon.png`

```
Water Dragon Jutsu skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a massive coiling water dragon mid-crash — translucent scales of roaring current, jaws open in a tidal bite, foam crest and spray mane exploding as it plunges down from above.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flooded mud, broken planks, and rain-lashed debris; mid-ground the dragon body slamming with water-shock rings; distant misty riverside battlefield under a storm dusk, ruined bridges and smoke pillars half-swallowed by fog. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent water-slash trails, chakra-charged spray, foam sheets, rain streaks and mist vapor reading horizontally across the 16:9 frame. Subject feels mid-crash — a freeze-frame from a seinen tidal strike.

LIGHTING: cool cyan-white key light through the dragon's translucent body + warm orange fire glow on wet ruins in the distance vs deep steel-blue shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 87. `ice_mirrors`

- **Name:** Demonic Ice Mirrors
- **Element:** WATER
- **Action:** ACTIVE
- **Description:** Creates a dome of ice mirrors. Traps the target and deals multiple strikes.
- **File:** `public/assets/skills/skill_ice_mirrors.png`

```
Demonic Ice Mirrors skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a fractured dome of razor ice mirrors mid-formation — hexagonal crystalline panes locking into a prison cage, each surface reflecting a blur of high-speed slash afterimages, frost shards exploding outward.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground ice splinters, frozen mud crust, and drifting snow grit; mid-ground the mirror dome closing with cold vapor and slash trails bouncing between panes; distant snow-choked mountain pass battlefield at dusk, pine silhouettes and smoke pillars under a pale moon. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines ricocheting between mirrors, frost vapor, crystal shards, and cold breath plumes reading across the 16:9 frame. Subject feels mid-trap — a freeze-frame from a seinen multi-strike prison.

LIGHTING: cold moon-blue key light through translucent ice + sharp white speculars on mirror edges vs warm distant fire glow in the snow smoke. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 88. `false_surroundings`

- **Name:** False Surroundings
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Alters the perception of the environment. MENTAL damage with high confusion chance.
- **File:** `public/assets/skills/skill_false_surroundings.png`

```
False Surroundings skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a shattering illusion landscape mid-rip — layered false villages and forests peeling away like torn paper screens, revealing nightmare geometry underneath: inverted rooftops, floating lanterns, and a spiral eye-seal of genjutsu script burning at the core.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cracked cobblestones, fallen paper charms, and drifting ash petals; mid-ground the illusion layers ripping with ink-smoke and warped perspective lines; distant real battlefield seeping through — ruined dusk streets, smoke pillars, and fire glow bleeding past the false world. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash trails, reality-tear cracks, floating kanji-smoke, dust and ember particles reading horizontally across the 16:9 frame. Subject feels mid-break — a freeze-frame from a seinen genjutsu collapse.

LIGHTING: eerie violet-magenta key from the genjutsu seal + warm fire rim from the true battlefield vs cool moon-gray shadows in the false layers. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 89. `temple_nirvana`

- **Name:** Temple of Nirvana
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Descending feathers induce a deep, magical slumber. Guaranteed MENTAL stun.
- **File:** `public/assets/skills/skill_temple_nirvana.png`

```
Temple of Nirvana skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a cascade of enormous white-gold spirit feathers mid-descent, each feather trailing soft violet hypnosis ink-trails that bloom into dream-runes as they fall, the lead feather cracking open like a lotus of sleep-light.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground: drifting ash, broken shingles, and soft feather-down caught in mud; mid-ground: the feather storm and curling purple dream-mist; distant: a ruined temple courtyard at dusk, collapsed torii, oil-lamp fire glow, smoke pillars rising into a bruised indigo sky. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines mixed with gentle falling arcs, chakra vapor spirals, luminous dream-dust reading horizontally across the 16:9 frame. Subject feels mid-cast, mid-descent — a freeze-frame from a seinen fight scene as consciousness collapses.

LIGHTING: cool moon-silver key on the feathers + warm temple-fire rim from below; soft violet hypnosis glow vs cooler charcoal shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 90. `hidden_lotus`

- **Name:** Hidden Lotus
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Ultimate taijutsu. TRUE damage at massive HP cost. Self-stuns after use.
- **File:** `public/assets/skills/skill_hidden_lotus.png`

```
Hidden Lotus skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a spinning reverse-kick impact core — green youth chakra exploding into a blooming lotus of shockwaves, bandaged fists and spinning legs reduced to motion-blur silhouettes around a crushing true-damage starburst.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground: cracked earth, torn training weights, flying gravel and sweat-mist; mid-ground: the lotus-shaped impact bloom and green chakra vapor; distant: ruined dusk battlefield with smoke pillars, distant fire, splintered trees, and debris hanging in the air. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, rotating kick trails, green chakra sparks and dust rings reading horizontally across the 16:9 frame. Subject feels mid-impact, mid-spin — a freeze-frame from a seinen fight scene at the cost of everything.

LIGHTING: hard green chakra key light on the lotus core + warm fire rim from the battlefield; cool night shadows in the craters. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 91. `water_vortex`

- **Name:** Giant Water Vortex
- **Element:** WATER
- **Action:** ACTIVE
- **Description:** Massive water attack that severely slows the enemy.
- **File:** `public/assets/skills/skill_water_vortex.png`

```
Giant Water Vortex skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a towering spiral water vortex roaring mid-frame, blue-white torrents twisting into a crushing funnel with foam teeth and trapped debris, pressure rings crushing outward like liquid shuriken.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground: flooded mud, floating rubble, spray sheets and rain needles; mid-ground: the giant vortex and horizontal water-slash wakes; distant: a rain-soaked village street and broken bridge at storm dusk, lantern light smeared through mist, black clouds low over flooded ruins. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash water trails, spinning foam ribbons, chakra vapor and driving rain reading horizontally across the 16:9 frame. Subject feels mid-surge, mid-swallow — a freeze-frame from a seinen fight scene.

LIGHTING: cold cyan key from the vortex core + warm distant lantern/fire rim; deep teal shadows in the flood. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 92. `clone_explosion`

- **Name:** Clone Great Explosion
- **Element:** FIRE
- **Action:** ACTIVE
- **Description:** Exploding clone. Cannot be evaded.
- **File:** `public/assets/skills/skill_clone_explosion.png`

```
Clone Great Explosion skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a humanoid shadow-clone silhouette mid-detonation — body cracking into white-hot fire cores, orange blast petals and black smoke rings exploding outward, impossible to dodge, shockwave rings stacking like a kill stamp.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground: scorched mud, flying shrapnel, ember rain and torn cloth; mid-ground: the clone blast flower and ink-black smoke pillars; distant: a ruined dusk battlefield, burning timber frames, ash sky, secondary fires glowing along a cratered path. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash blast trails, radial fire petals, sparks and debris reading horizontally across the 16:9 frame. Subject feels mid-explosion, mid-kill — a freeze-frame from a seinen fight scene.

LIGHTING: searing orange-white key from the detonation core + deep red fire rim; cool blue smoke shadows for contrast. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 93. `1000_years`

- **Name:** 1000 Years of Death
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** The forbidden poke. 100% stun, 60% confusion.
- **File:** `public/assets/skills/skill_1000_years.png`

```
1000 Years of Death skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a pair of fingers thrusting forward in a forbidden kinetic spear of pure humiliation-force — comic-violence impact star exploding at the tip, swirling confusion birds and stun rings bursting from the hit, motion trails like a dirty secret made legendary.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground: kicked-up dust, fallen weapons, spinning leaves and grit; mid-ground: the finger-thrust impact bloom and yellow confusion spirals; distant: a dusk training-ground battlefield gone wrong — broken fence posts, smoke from campfires, ruined trees, distant silhouettes of chaos. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, radial stun rings, spinning bird-spirals and dust wake reading horizontally across the 16:9 frame. Subject feels mid-poke, mid-impact — a freeze-frame from a seinen fight scene with mean comedy edge.

LIGHTING: hard warm sunset key on the impact star + cool blue shadow rim; bright yellow confusion glow vs muddy earth tones. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 94. `gate_of_life`

- **Name:** Gate of Life (3rd Gate)
- **Element:** PHYSICAL
- **Action:** TOGGLE
- **Description:** Open the 3rd gate. +80% STR, +60% SPD. Heavy HP cost.
- **File:** `public/assets/skills/skill_gate_of_life.png`

```
Gate of Life (3rd Gate) skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a green-aura gate seal shattering open mid-chest height — a glowing third chakra gate portal erupting with raw life-force vapor, speed-streak ribbons and muscle-heat distortion ripping the air, power bought with blood-mist.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground: cracked stone, blood-tinged sweat droplets, torn bandages and flying grit; mid-ground: the open gate sigil and violent green chakra storm; distant: a dusk rocky gorge battlefield, smoke pillars, fire glow on far ridges, storm clouds torn by speed-wakes. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, green vapor jets, sparks and dust sheets reading horizontally across the 16:9 frame. Subject feels mid-opening, mid-surge — a freeze-frame from a seinen fight scene at the edge of self-destruction.

LIGHTING: toxic-green key light from the gate core + warm battlefield fire rim; deep indigo shadows in the gorge. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 95. `curse_mark_2`

- **Name:** Curse Mark Stage 2
- **Element:** PHYSICAL
- **Action:** TOGGLE
- **Description:** Full transformation. +80% STR/SPD/SPI. Heavy HP cost.
- **File:** `public/assets/skills/skill_curse_mark_2.png`

```
Curse Mark Stage 2 skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a full curse-mark transformation core — black seal patterns crawling into winged armor plates of dark chakra, crimson vein-light pulsing through cracked skin-energy, a monstrous power silhouette mid-metamorphosis with horned shadow wings unfurling.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground: shattered rock, black ichor drips, ash and torn earth; mid-ground: the transforming seal-armor form and swirling dark-red chakra storm; distant: a ruined dusk battlefield under blood-orange sky, smoke pillars, fire-gutted ruins, distant lightning over broken walls. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash transformation trails, black seal script streaks, crimson sparks and dust reading horizontally across the 16:9 frame. Subject feels mid-transformation, mid-ascension — a freeze-frame from a seinen fight scene at the cost of the body.

LIGHTING: deep crimson key from the curse seals + cool moon-white rim on the wings; hot fire glow in the far ruins vs cold black voids in the cracks. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 96. `curse_surge`

- **Name:** Curse Mark Surge
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** +30% damage on next attack. HP cost.
- **File:** `public/assets/skills/skill_curse_surge.png`

```
CURSE MARK SURGE skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a jagged black curse-mark sigil exploding across a clenched forearm mid-surge — dark ink-veins spidering outward, violet-black chakra spikes ripping from the skin, blood droplets hanging frozen in the blast radius.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cracked mud and broken shuriken half-buried in ash, mid-ground curse-mark energy thrashing like living smoke, distant ruined village rooftops at dusk with fire pillars and orange smoke banks. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and dark chakra vapor ripping horizontally across the 16:9 frame; sparks of corrupted energy and dust kicked up by the surge. Subject feels mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: harsh violet-black curse glow as key light + hot rim from battlefield fires; cool dusk shadows under debris. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 97. `gate_prep`

- **Name:** Gate Release Prep
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Prepare for gate opening. Next gate activation: -50% HP cost.
- **File:** `public/assets/skills/skill_gate_prep.png`

```
GATE RELEASE PREP skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a pair of scarred hands locked in a final seal over a glowing chakra gate coil in the abdomen — green-gold inner-gate light bleeding through the ribs like a furnace about to blow, sweat and chakra vapor sheeting off the core.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground torn training wraps and mud-caked boots in grit, mid-ground rising steam and compressed chakra rings, distant rocky training gorge under a bruised storm sky with distant watchfires. Painted environmental storytelling, not empty void.

MOTION & ENERGY: compressed chakra pressure waves and ink-slash speed lines radiating from the core; dust, sweat beads, and embers reading horizontally across the 16:9 frame. Subject feels mid-cast — a freeze-frame from a seinen fight scene.

LIGHTING: searing green-gold gate light as primary key + cool storm rim on the silhouette; warm fire glow on distant rocks vs cooler shadow. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 98. `killing_intent`

- **Name:** Killing Intent
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Release murderous aura. 30% chance enemy skips turn.
- **File:** `public/assets/skills/skill_killing_intent.png`

```
KILLING INTENT skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a crushing murderous aura given form — a towering black pressure-wave of screaming faces and ink-blade silhouettes erupting from a shadowed stance, the air itself warping into a predatory silhouette of pure bloodlust.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered weapons and mud slick with rain, mid-ground the aura wall of killing pressure, distant ruined dusk battlefield with smoke pillars, dead trees, and a blood-red horizon. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash trails and pressure distortion lines ripping horizontally; crows of black chakra smoke, dust, and rain streaks. Subject feels mid-release — a freeze-frame from a seinen fight scene.

LIGHTING: cold moon-silver rim cutting the black aura + warm dying-fire glow on wet mud; hard contrast between the dark intent mass and battlefield embers. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 99. `demon_slash`

- **Name:** Demon Slash
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A brutal, sweeping cleave with the Executioner Blade. Causes BLEED.
- **File:** `public/assets/skills/skill_demon_slash.png`

```
DEMON SLASH skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: the massive Executioner Blade mid-sweep — a brutal horizontal cleave, the huge bandaged cleaver frozen at the apex of the cut, a roaring red-black slash arc and blood mist trailing the edge.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, torn cloth, and debris kicked up by the swing, mid-ground the blade and ink-slash blood trail, distant ruined fortress walls at dusk with fire glow and smoke columns. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and blood-spray arcs reading hard across the 16:9 frame; sparks off the blade, dust, and embers. Subject feels mid-cleave impact — a freeze-frame from a seinen fight scene.

LIGHTING: hot fire-orange key from battlefield blaze + cold steel rim on the Executioner Blade; deep crimson blood highlights vs cooler smoke shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 100. `bone_drill`

- **Name:** Dance of Clematis
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A macabre dance manipulating bone density into a piercing spear. TRUE damage.
- **File:** `public/assets/skills/skill_bone_drill.png`

```
DANCE OF CLEMATIS skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a dense white bone spear mid-thrust — spiral-drilled like a living drill-bit, macabre flower-petal bone plates blooming at the base, tip punching through the air with bone-dust and marrow sparks.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered stone and pale bone shards in wet mud, mid-ground the spinning bone spear and ink-slash wake, distant rocky gorge and dead forest under a cold dusk sky with smoke from distant fires. Painted environmental storytelling, not empty void.

MOTION & ENERGY: spiral drill speed lines, bone-dust trails, and violent ink-slash streaks reading horizontally across the 16:9 frame; debris and chakra vapor. Subject feels mid-pierce — a freeze-frame from a seinen fight scene.

LIGHTING: cold bone-white key light along the spear + warm distant fire rim on the gorge walls; hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 101. `poison_fog`

- **Name:** Ibuse Poison Fog
- **Element:** FIRE
- **Action:** ACTIVE
- **Description:** Exhales a cloud of toxic gas. POISON ignores 50% of defense.
- **File:** `public/assets/skills/skill_poison_fog.png`

```
IBUSE POISON FOG skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a roiling toxic fog-cloud mid-exhale — sickly green-yellow gas billowing in a predatory front, skull-shaped vapor coils and acid-drip particles hanging in the murk, a salamander-scale heat shimmer at the source.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground dead grass and corroded kunai half-sunk in poisoned mud, mid-ground the advancing poison cloud with ink-slash vapor trails, distant scorched battlefield at dusk with dying fires and black smoke pillars behind the green haze. Painted environmental storytelling, not empty void.

MOTION & ENERGY: horizontal fog-surge waves, toxic sparks, and violent ink-slash gas trails across the 16:9 frame; ash and embers mixing into the poison front. Subject feels mid-release — a freeze-frame from a seinen fight scene.

LIGHTING: sickly green-yellow poison glow as key light + warm fire glow bleeding through the fog from behind; cooler toxic shadows under the cloud. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 102. `tsukuyomi`

- **Name:** Tsukuyomi
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Traps the target in an illusion of torture. Massive TRUE MENTAL damage.
- **File:** `public/assets/skills/skill_tsukuyomi.png`

```
TSUKUYOMI skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a blood-red moon-eye sigil dominating the sky of a nightmare realm — inverted crimson lunar disk cracked with black tomoe, chains of dark red light lashing downward through a suspended torture-world of shattered clocks and floating blades.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground floating debris and broken hourglass sand drifting in void-wind, mid-ground the red moon-eye and thrashing ink-slash illusion chains, distant inverted nightmare battlefield — ruined temple pillars under a black sky bleeding crimson light. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash trails of red-black genjutsu energy ripping horizontally; shattered time shards, dust, and blood-light sparks. Subject feels mid-cast trap — a freeze-frame from a seinen fight scene.

LIGHTING: searing crimson moon-eye as primary key light + cold black-silver rims on chains and debris; hard contrast between the red lunar core and deep nightmare shadows. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 103. `reaper_death_seal`

- **Name:** Reaper Death Seal
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Sacrifice your life to instantly kill the target. Both die.
- **File:** `public/assets/skills/skill_reaper_death_seal.png`

```
Reaper Death Seal skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a colossal spectral shinigami mask and skeletal claw erupting from a blood-ink death seal array, dragging twin soul-threads into its maw — the seal's final closing snap as the hero of the frame.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cracked prayer tags and black-blood puddles, mid-ground the reaper claw and seal mandala mid-collapse, distant ruined temple battlefield under a bruised dusk sky with smoke pillars and scattered corpses. Painted environmental storytelling of a death ritual on a war-torn field, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, soul vapor ribbons, blood-black chakra wake reading horizontally across the 16:9 frame. Subject feels mid-sacrifice, mid-soul-rip — a freeze-frame from a seinen death-seal climax.

LIGHTING: cold bone-white key on the reaper mask + hellish crimson rim from the seal; warm fire glow on distant wreckage vs deep indigo shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 104. `edo_tensei`

- **Name:** Edo Tensei
- **Element:** MENTAL
- **Action:** ACTIVE
- **Description:** Summon an ally at 50% stats for 5 turns.
- **File:** `public/assets/skills/skill_edo_tensei.png`

```
Edo Tensei skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a coffin lid blasting open mid-air, gray ash-flesh arm and bind-paper seals unfurling as a reanimated warrior half-rises in a storm of dirt and sacrificial blood smoke — the forbidden summon as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered grave markers, bone fragments, and wind-whipped dust, mid-ground the rising coffin and ash-body, distant scorched battlefield at dusk with smoke columns, broken banners, and distant firelines. Painted necromantic war-ritual storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, dirt-burst particles, curse-seal ribbons and gray chakra vapor reading horizontally across the 16:9 frame. Subject feels mid-resurrection, mid-eruption from the earth — a freeze-frame from a seinen forbidden-jutsu reveal.

LIGHTING: sickly green-white key light from the coffin seals + warm ember rim from battlefield fires against cooler ash-gray shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 105. `gate_of_limit`

- **Name:** Gate of Limit (5th Gate)
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Open the 5th gate. +150% STR/SPD but bleed 20/turn.
- **File:** `public/assets/skills/skill_gate_of_limit.png`

```
Gate of Limit skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a roaring emerald chakra aura detonating off a clenched fist and open chest stance — skin cracking with green vapor veins, blood mist exploding outward as the fifth gate rips open — pure kinetic limit-break as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground mud, cracked stone, and flung debris from the shockwave, mid-ground the gate-aura fist and blood-spray bloom, distant ruined dusk battlefield with smoke pillars, fire glow, and shattered walls. Painted all-out taijutsu war-zone storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, emerald chakra vapor jets, blood droplets and dust rings reading horizontally across the 16:9 frame. Subject feels mid-gate-open, mid-power-spike — a freeze-frame from a seinen self-destruction climax.

LIGHTING: searing green key light from the gate aura + warm orange fire rim from the battlefield; cooler storm-shadow edges. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 106. `shukaku_arm`

- **Name:** Shukaku Arm
- **Element:** EARTH
- **Action:** ACTIVE
- **Description:** Partial Bijuu transformation. ARMOR_BREAK + shield, double damage if <30% HP.
- **File:** `public/assets/skills/skill_shukaku_arm.png`

```
Shukaku Arm skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a massive tanuki-sand arm armored in cursed sealing glyphs, claws mid-swipe as sand spirals into living muscle and a shield-dome of compressed grit — partial bijuu limb as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground sand dunes, broken armor plates, and flying grit, mid-ground the colossal sand arm and seal-shield, distant sun-blasted waste and ruined fortress walls under a dust-choked dusk sky with smoke and heat haze. Painted desert-war storytelling, not empty void.

MOTION & ENERGY: violent sand-slash speed lines, grit vortex, seal-script sparks and dust wake reading horizontally across the 16:9 frame. Subject feels mid-swipe, mid-transformation surge — a freeze-frame from a seinen tailed-beast partial release.

LIGHTING: harsh amber desert key + cool indigo shadow under the arm; faint cursed-seal cyan rim. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 107. `copy_jutsu`

- **Name:** Sharingan: Copy
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Copy enemy's last skill at 80% power.
- **File:** `public/assets/skills/skill_copy_jutsu.png`

```
Sharingan: Copy skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a single spinning tomoe-patterned Sharingan iris reflected in a mirror-blade of chakra, red genjutsu rings shattering into mirrored after-images of an enemy technique mid-replay — the copy moment as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground shattered kunai and glass-like chakra shards, mid-ground the Sharingan reflection and mirrored technique echo, distant rain-slick village street battlefield at dusk with smoke, lantern fire, and ruined rooftops. Painted copy-war storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, red tomoe trails, mirrored after-image blur and rain streaks reading horizontally across the 16:9 frame. Subject feels mid-copy, mid-technique-theft — a freeze-frame from a seinen eye-power duel.

LIGHTING: blood-red Sharingan key light + cool rain-blue rim; warm lantern fire glow in the deep background. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 108. `c4_karura`

- **Name:** C4 Karura
- **Element:** EARTH
- **Action:** ACTIVE
- **Description:** Microscopic clay spiders that disintegrate the target on a cellular level. TRUE damage.
- **File:** `public/assets/skills/skill_c4_karura.png`

```
C4 Karura skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a swarm of microscopic clay spiders erupting from a detonation bloom, each body a tiny explosive glyph, cellular disintegration dust and ash-silhouette of a target mid-collapse — the karura swarm as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground clay dust, cracked stone, and microscopic spider silhouettes catching light, mid-ground the disintegration swarm bloom, distant ruined dusk battlefield with smoke pillars, fire, and debris rain. Painted nightmare-bomb artistry on a war field, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, clay-particle explosion, spider-trail filaments and ash wake reading horizontally across the 16:9 frame. Subject feels mid-detonation, mid-cellular shred — a freeze-frame from a seinen terror-bomb keyframe.

LIGHTING: sickly clay-tan key + toxic yellow-green explosion rim; cooler smoke-shadow edges and distant fire orange. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 109. `rasenshuriken`

- **Name:** Rasenshuriken
- **Element:** WIND
- **Action:** ACTIVE
- **Description:** A microscopic wind blade vortex that severs chakra channels. PIERCING + TRUE damage hybrid.
- **File:** `public/assets/skills/skill_rasenshuriken.png`

```
Rasenshuriken skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a massive spinning wind shuriken of razor air blades and nested vortex rings, microscopic cutting edges flaring as chakra-channel sever trails whip outward — the rasenshuriken mid-throw as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground torn earth, leaves, and flying debris in the wind wake, mid-ground the glowing cyan-white wind shuriken, distant ruined dusk battlefield with smoke pillars, fire glow, mud, and shattered trees bent by the gale. Painted elemental war-plate storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines, wind-blade rings, chakra vapor spirals, sparks and dust corkscrews reading horizontally across the 16:9 frame. Subject feels mid-throw, mid-impact spiral — a freeze-frame from a seinen ultimate wind technique.

LIGHTING: searing cyan-white key on the vortex core + warm fire rim from the battlefield against cooler storm-blue shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 110. `amaterasu`

- **Name:** Amaterasu
- **Element:** FIRE
- **Action:** ACTIVE
- **Description:** Inextinguishable black flames. Deals initial PIERCING damage + massive TRUE DoT.
- **File:** `public/assets/skills/skill_amaterasu.png`

```
Amaterasu skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a roaring column of absolute-black fire clawing upward from a cracked battlefield scar, edges bleeding white-hot cinder, devouring a shattered kunai mid-air — the black flames themselves as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground scorched mud, broken armor plates and drifting ash flakes; mid-ground the black-fire column and heat-warped air; distant ruined village silhouette under a bruised dusk sky, smoke pillars and distant orange fire glow. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and upward-spiraling black flame tongues, white sparks and embers reading horizontally across the 16:9 frame. Subject feels mid-ignition, mid-devour — a freeze-frame from a seinen fight scene.

LIGHTING: dramatic white-hot core key light inside the black fire + cool dusk rim; warm distant fire glow vs cooler ash-grey shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 111. `kirin`

- **Name:** Kirin
- **Element:** LIGHTNING
- **Action:** ACTIVE
- **Description:** Harnesses natural lightning from the heavens. Unavoidable ARMOR_BREAK strike.
- **File:** `public/assets/skills/skill_kirin.png`

```
Kirin skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a colossal lightning beast forged of pure natural thunder — horned serpentine silhouette crashing down as a single unavoidable bolt, claws of white-blue electricity splitting the sky.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground rain-slick rocks, shattered tree trunks and flying mud; mid-ground the descending lightning kirin and branching arc forks; distant storm-torn gorge and black thunderheads lit by continuous sheet lightning. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash speed lines and jagged electric veins, rain streaks and ozone vapor reading horizontally across the 16:9 frame. Subject feels mid-strike from heaven — a freeze-frame from a seinen fight scene.

LIGHTING: blinding white-blue key from the bolt itself + cold storm rim; warm ground-impact flash vs deep indigo cloud shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 112. `shinra_tensei`

- **Name:** Shinra Tensei
- **Element:** WIND
- **Action:** ACTIVE
- **Description:** Almighty Push. Repels everything with crushing gravitational force. TRUE damage.
- **File:** `public/assets/skills/skill_shinra_tensei.png`

```
Shinra Tensei skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a violent spherical shockwave of crushing gravity expanding outward — concentric force rings and debris halo frozen at peak repulsion, the almighty push itself as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground hurled rubble, snapped weapons and dirt sheets peeling outward; mid-ground the expanding gravity sphere and warped air; distant ruined fortress walls collapsing under the blast, dust storms rolling across a dusk battlefield. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash radial speed lines, compressed wind rings and flying debris wake reading across the 16:9 frame. Subject feels mid-repulsion, mid-shatter — a freeze-frame from a seinen fight scene.

LIGHTING: cold white-violet core key at the push origin + warm dusk rim on blasted stone; hard contrast between luminous force rings and cooler shadow wreckage. Painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 113. `kamui_impact`

- **Name:** Kamui
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Space-Time Ninjutsu that warps reality. TRUE damage that cannot miss.
- **File:** `public/assets/skills/skill_kamui_impact.png`

```
Kamui skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a spiraling space-time vortex punch impact — reality tearing into a black-red spiral eye, warped geometry and dimensional shards exploding outward from the hit point.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground cracked stone plates and fragments dissolving into spiral dust; mid-ground the kamui vortex and ink-black space rifts; distant battlefield warped and stretched toward the singularity under a storm-bruised dusk sky with smoke pillars. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash spiral trails, dimensional tear sparks and suction dust streams reading across the 16:9 frame. Subject feels mid-warp, mid-impact — a freeze-frame from a seinen fight scene.

LIGHTING: deep crimson-black core key inside the spiral + cool moon rim on torn edges; warm fire glow in distant ruins vs colder void shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 114. `tengai_shinsei`

- **Name:** Tengai Shinsei
- **Element:** EARTH
- **Action:** ACTIVE
- **Description:** Summons a massive meteorite from the atmosphere. Catastrophic TRUE damage.
- **File:** `public/assets/skills/skill_tengai_shinsei.png`

```
Tengai Shinsei skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a catastrophic meteorite mid-descent — colossal flaming rock with molten veins and a trailing fire corona, about to smash the earth, the falling mountain itself as the star.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground broken siege debris, heat-blasted mud and flying gravel; mid-ground the descending meteor and shock-heated air; distant scorched wasteland and ruined fortifications under a dusk sky split by the impact trail and smoke pillars. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash descent trails, embers, atmospheric fire wake and dust rings reading across the 16:9 frame. Subject feels mid-fall, pre-impact — a freeze-frame from a seinen fight scene.

LIGHTING: blinding molten-orange key from the meteor underbelly + cool dusk rim on the rock mass; warm ground fire glow vs cooler storm-shadow sky. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 115. `adamantine_chains`

- **Name:** Adamantine Attacking Chains
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** Uzumaki sealing chains lash the target — physical damage plus a chance to bind and suppress chakra.
- **File:** `public/assets/skills/skill_adamantine_chains.png`

```
Adamantine Attacking Chains skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: massive golden-adamantine sealing chains bursting from the earth and mid-air, barbed links coiling and lashing like living serpents, chakra-suppression seals glowing along the metal.
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground snapped weapons, churned mud and chain-link gouges; mid-ground the whipping adamantine chains and golden seal light; distant mist forest battlefield and ruined shrine gates under dusk smoke and ember drift. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash whip trails, chain-link blur arcs, golden seal sparks and dust wakes reading horizontally across the 16:9 frame. Subject feels mid-lash, mid-bind — a freeze-frame from a seinen fight scene.

LIGHTING: warm golden seal key light along the chains + cool dusk rim; fire glow in distant ruins vs cooler forest shadows. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```



### 116. `heavy_kick`

- **Name:** Taijutsu: Heavy Kick
- **Element:** PHYSICAL
- **Action:** ACTIVE
- **Description:** A committed rising kick. Hits harder when you lean Aggressive.
- **File:** `public/assets/skills/skill_heavy_kick.png`

```
Taijutsu: Heavy Kick skill art, cinematic wide 16:9 combat keyframe.

HERO SUBJECT: a committed rising kick mid-impact — a powerful lower leg and boot heel driving upward through a shockwave of dust and shattered debris, kinetic force rings bursting from the contact point (no full-body portrait).
Place the hero slightly above center for UI crop (object-position center 30%).
Readable silhouette at small skill-card size (~200-280×136 px).

WORLD / DEPTH (mandatory): staged combat atmosphere with clear depth layers —
foreground flying mud clods, broken stone chips and grit spray; mid-ground the rising kick and impact shock cone; distant ruined dusk battlefield with smoke pillars, fire glow and scattered wreckage. Painted environmental storytelling, not empty void.

MOTION & ENERGY: violent ink-slash upward speed lines, dust sheets, sweat/chakra vapor and debris wake reading across the 16:9 frame. Subject feels mid-kick, mid-crush — a freeze-frame from a seinen fight scene.

LIGHTING: hard side key catching the kicking limb + warm fire rim vs cooler mud-shadow ground. Hard contrast, painterly volume — not flat UI gradient.

STYLE: painted digital illustration, high quality, cel-shaded edges, hard black outlines, neo-retro seinen anime, brush texture, cinematic combat plate.

NO full-body character portrait as main subject, no face close-up hero, no UI text, no watermark, no logo, no skill-name lettering.

NOT: monochrome void background, flat purple/blue gradient, floating sticker prop on empty space, photorealistic, 3D CGI, soft oil painting, pixel art, 16-bit sprite, checkerboard, green screen, transparent background, UI chrome, busy unreadable clutter that kills silhouette.
```


