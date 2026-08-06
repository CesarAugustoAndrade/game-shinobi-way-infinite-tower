# Item art regen log (components + artifacts)

Canon: `public/assets/enemies/ART-CANON.md` — painted HQ cel-shade, hard black outlines, neo-retro seinen.
Gen bg: green `#00FF00` default; magenta `#FF00FF` if subject is green-heavy.
Pipeline: prompt → image_gen plate → chroma_key_enemy.py → RGBA PNG cutout → install under registry path.

Install note: game registry uses `/assets/icons/{components|artifacts}/<id>.jpg`. Regenerated assets install as:
- plate: `todos/item-plates/<id>_plate.png`
- cutout PNG: `public/assets/icons/{folder}/<id>.png` (true alpha)
- composited game plate JPG (subject on near-black for drop-in): same path as current registry `.jpg`

| item_id | path | chroma | prompt_path | status |
|---------|------|--------|-------------|--------|
| ninja_steel | public/assets/icons/components/ninja_steel.jpg | green | todos/item-prompts/ninja_steel.txt | done |
| spirit_tag | public/assets/icons/components/spirit_tag.jpg | green | todos/item-prompts/spirit_tag.txt | done |
| chakra_pill | public/assets/icons/components/chakra_pill.jpg | green | todos/item-prompts/chakra_pill.txt | done |
| iron_sand | public/assets/icons/components/iron_sand.jpg | green | todos/item-prompts/iron_sand.txt | done |
| anbu_mask | public/assets/icons/components/anbu_mask.jpg | green | todos/item-prompts/anbu_mask.txt | done |
| training_weights | public/assets/icons/components/training_weights.jpg | green | todos/item-prompts/training_weights.txt | done |
| swift_sandals | public/assets/icons/components/swift_sandals.jpg | green | todos/item-prompts/swift_sandals.txt | done |
| tactical_scroll | public/assets/icons/components/tactical_scroll.jpg | green | todos/item-prompts/tactical_scroll.txt | done |
| hashirama_cell | public/assets/icons/components/hashirama_cell.jpg | magenta | todos/item-prompts/hashirama_cell.txt | done |
| kubikiribocho | public/assets/icons/artifacts/kubikiribocho.jpg | green | todos/item-prompts/kubikiribocho.txt | done |
| chakra_flow_blade | public/assets/icons/artifacts/chakra_flow_blade.jpg | green | todos/item-prompts/chakra_flow_blade.txt | done |
| samehada | public/assets/icons/artifacts/samehada.jpg | green | todos/item-prompts/samehada.txt | done |
| gunbai_war_fan | public/assets/icons/artifacts/gunbai_war_fan.jpg | green | todos/item-prompts/gunbai_war_fan.txt | done |
| nuibari | public/assets/icons/artifacts/nuibari.jpg | green | todos/item-prompts/nuibari.txt | done |
| kusanagi | public/assets/icons/artifacts/kusanagi.jpg | green | todos/item-prompts/kusanagi.txt | done |
| hiramekarei | public/assets/icons/artifacts/hiramekarei.jpg | green | todos/item-prompts/hiramekarei.txt | done |
| kabutowari | public/assets/icons/artifacts/kabutowari.jpg | green | todos/item-prompts/kabutowari.txt | done |
| sages_scripture | public/assets/icons/artifacts/sages_scripture.jpg | green | todos/item-prompts/sages_scripture.txt | done |
| gourd_of_sand | public/assets/icons/artifacts/gourd_of_sand.jpg | green | todos/item-prompts/gourd_of_sand.txt | done |
| totsuka_blade | public/assets/icons/artifacts/totsuka_blade.jpg | green | todos/item-prompts/totsuka_blade.txt | done |
| konans_paper_wings | public/assets/icons/artifacts/konans_paper_wings.jpg | green | todos/item-prompts/konans_paper_wings.txt | done |
| explosive_tag_array | public/assets/icons/artifacts/explosive_tag_array.jpg | green | todos/item-prompts/explosive_tag_array.txt | done |
| flying_thunder_god_seal | public/assets/icons/artifacts/flying_thunder_god_seal.jpg | green | todos/item-prompts/flying_thunder_god_seal.txt | done |
| forbidden_scroll | public/assets/icons/artifacts/forbidden_scroll.jpg | green | todos/item-prompts/forbidden_scroll.txt | done |
| eight_gates_core | public/assets/icons/artifacts/eight_gates_core.jpg | green | todos/item-prompts/eight_gates_core.txt | done |
| yata_mirror | public/assets/icons/artifacts/yata_mirror.jpg | green | todos/item-prompts/yata_mirror.txt | done |
| akimichi_food_pills | public/assets/icons/artifacts/akimichi_food_pills.jpg | green | todos/item-prompts/akimichi_food_pills.txt | done |
| curse_mark_essence | public/assets/icons/artifacts/curse_mark_essence.jpg | green | todos/item-prompts/curse_mark_essence.txt | done |
| sage_mode_chakra | public/assets/icons/artifacts/sage_mode_chakra.jpg | magenta | todos/item-prompts/sage_mode_chakra.txt | done |
| byakugo_seal | public/assets/icons/artifacts/byakugo_seal.jpg | green | todos/item-prompts/byakugo_seal.txt | done |
| susanoo_ribcage | public/assets/icons/artifacts/susanoo_ribcage.jpg | green | todos/item-prompts/susanoo_ribcage.txt | done |
| hokages_necklace | public/assets/icons/artifacts/hokages_necklace.jpg | green | todos/item-prompts/hokages_necklace.txt | done |
| puppet_armor_core | public/assets/icons/artifacts/puppet_armor_core.jpg | green | todos/item-prompts/puppet_armor_core.txt | done |
| jiraiyas_headband | public/assets/icons/artifacts/jiraiyas_headband.jpg | green | todos/item-prompts/jiraiyas_headband.txt | done |
| will_of_fire_charm | public/assets/icons/artifacts/will_of_fire_charm.jpg | green | todos/item-prompts/will_of_fire_charm.txt | done |
| tsukuyomi_lens | public/assets/icons/artifacts/tsukuyomi_lens.jpg | green | todos/item-prompts/tsukuyomi_lens.txt | done |
| shikamarus_earrings | public/assets/icons/artifacts/shikamarus_earrings.jpg | green | todos/item-prompts/shikamarus_earrings.txt | done |
| kakashis_bell | public/assets/icons/artifacts/kakashis_bell.jpg | green | todos/item-prompts/kakashis_bell.txt | done |
| nara_shadow_bind | public/assets/icons/artifacts/nara_shadow_bind.jpg | green | todos/item-prompts/nara_shadow_bind.txt | done |
| weights_released | public/assets/icons/artifacts/weights_released.jpg | green | todos/item-prompts/weights_released.txt | done |
| gentle_fist_wraps | public/assets/icons/artifacts/gentle_fist_wraps.jpg | green | todos/item-prompts/gentle_fist_wraps.txt | done |
| eight_trigrams_map | public/assets/icons/artifacts/eight_trigrams_map.jpg | green | todos/item-prompts/eight_trigrams_map.txt | done |
| yellow_flash_boots | public/assets/icons/artifacts/yellow_flash_boots.jpg | green | todos/item-prompts/yellow_flash_boots.txt | done |
| body_flicker_sash | public/assets/icons/artifacts/body_flicker_sash.jpg | green | todos/item-prompts/body_flicker_sash.txt | done |
| scroll_of_seals | public/assets/icons/artifacts/scroll_of_seals.jpg | green | todos/item-prompts/scroll_of_seals.txt | done |
| ten_tails_husk | public/assets/icons/artifacts/ten_tails_husk.jpg | magenta | todos/item-prompts/ten_tails_husk.txt | done |
| curse_mark_heaven | public/assets/icons/artifacts/curse_mark_heaven.jpg | green | todos/item-prompts/curse_mark_heaven.txt | done |
| rinnegan_fragment | public/assets/icons/artifacts/rinnegan_fragment.jpg | green | todos/item-prompts/rinnegan_fragment.txt | done |
| infinite_chakra_core | public/assets/icons/artifacts/infinite_chakra_core.jpg | green | todos/item-prompts/infinite_chakra_core.txt | done |
| adamantine_chains | public/assets/icons/artifacts/adamantine_chains.jpg | green | todos/item-prompts/adamantine_chains.txt | done |
| sharingan_implant | public/assets/icons/artifacts/sharingan_implant.jpg | green | todos/item-prompts/sharingan_implant.txt | done |
| byakugan_awakening | public/assets/icons/artifacts/byakugan_awakening.jpg | green | todos/item-prompts/byakugan_awakening.txt | done |
| shadow_mastery | public/assets/icons/artifacts/shadow_mastery.jpg | green | todos/item-prompts/shadow_mastery.txt | done |
| uzumaki_vitality | public/assets/icons/artifacts/uzumaki_vitality.jpg | green | todos/item-prompts/uzumaki_vitality.txt | done |

## Fire log

| fire | date | ids | notes |
|------|------|-----|-------|
| (bootstrap) | 2026-08-06 | — | Discovered 54 item art targets (9 components + 45 artifacts). All plates exist as old black-bg JPG; full regen pending. |
| fire-1 | 2026-08-06 | ninja_steel, spirit_tag, chakra_pill, iron_sand, anbu_mask, training_weights | Gen on #00FF00; plates in todos/item-plates/*_plate.png; RGBA cutouts + composite JPG install; residual_green=0 all six. |
| fire-2 | 2026-08-06 | swift_sandals, tactical_scroll, hashirama_cell, kubikiribocho, chakra_flow_blade, samehada | 9/9 components done. First 3 artifacts. hashirama magenta #FF00FF; rest green. chakra_flow_blade needed softer prompt (1st pass moderated). residual_key=0 all six. |
| fire-3 | 2026-08-06 | gunbai_war_fan, nuibari, kusanagi, hiramekarei, kabutowari, sages_scripture | All green #00FF00. residual_key=0 all six. Artifacts 9/45 done (12 total with prior). |
| fire-4 | 2026-08-06 | gourd_of_sand, totsuka_blade, konans_paper_wings, explosive_tag_array, flying_thunder_god_seal, forbidden_scroll | All green #00FF00. residual_key=0 all six. Artifacts 15/45; total 24/54 done. |
| fire-5 | 2026-08-06 | eight_gates_core, yata_mirror, akimichi_food_pills, curse_mark_essence, sage_mode_chakra, byakugo_seal | sage_mode magenta #FF00FF; rest green. residual_key=0 all six. Artifacts 21/45; total 30/54 done. |
| fire-6 | 2026-08-06 | susanoo_ribcage, hokages_necklace, puppet_armor_core, jiraiyas_headband, will_of_fire_charm, tsukuyomi_lens | All green #00FF00. residual_key=0 all six. Artifacts 27/45; total 36/54 done. |
| fire-7 | 2026-08-06 | shikamarus_earrings, kakashis_bell, nara_shadow_bind, weights_released, gentle_fist_wraps, eight_trigrams_map | All green #00FF00. residual_key=0 all six. Artifacts 33/45; total 42/54 done. |
| fire-8 | 2026-08-06 | yellow_flash_boots, body_flicker_sash, scroll_of_seals, ten_tails_husk, curse_mark_heaven, rinnegan_fragment | ten_tails magenta #FF00FF; rest green. residual_key=0 all six. Artifacts 39/45; total 48/54 done. |
| fire-9 | 2026-08-06 | infinite_chakra_core, adamantine_chains, sharingan_implant, byakugan_awakening, shadow_mastery, uzumaki_vitality | FINAL batch. All green #00FF00. residual_key=0 all six. **54/54 done** — all item art regenerated on green/magenta chroma + cutouts. |
