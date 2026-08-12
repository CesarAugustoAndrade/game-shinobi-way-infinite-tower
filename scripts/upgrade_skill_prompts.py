"""Upgrade all 116 skill prompts in docs/skill-art-prompts.md from generic templates to high-impact Naruto-canon prompts."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
md_path = ROOT / "docs" / "skill-art-prompts.md"

UPGRADES = {
    "basic_atk": "EXTREME FORESHORTENING: a bandaged shinobi fist punching directly toward the camera, breaking a circular white sonic boom air-pressure ring. Black cel-shaded speed lines, impact dust flying outward.",
    "shuriken": "spinning steel shuriken star cutting through air with metallic blur trails, crisp bone-white rim light and sharp shadow contrast.",
    "mud_wall": "a formidable earthen rampart of hardened mud and stone erupting upward, carved with fierce bulldog jutsu gargoyle faces, flying mud splatters against dark sky.",
    "phoenix_flower": "a horizontal fan-shaped volley of five small fiery embers flying forward, inside each glowing orange fireball a red-hot senbon needle tip, fiery spark trails.",
    "kawarimi": "a heavy wooden shinobi substitution log split in half by an unseen slash, a sharp kunai stuck in the wood, bursting with thick white jutsu smoke and spinning green leaves.",
    "bunshin": "multiple ethereal chakra afterimage clones fading into indigo smoke, glowing cyan eyes flickering through illusionary silhouettes.",
    "henge": "a dramatic poof explosion of dense white ninja smoke swirling horizontally, a single glowing amber shinobi eye piercing through the cloud mid-transformation.",
    "shunshin": "sonic boom displacement effect: a violent horizontal vortex of swirling autumn leaves and dust left behind by instant high-speed teleportation.",
    "kai": "close-up on shinobi hands forming the Ram hand seal, a crimson genjutsu illusion glass shattering into dark floating shards around a sharp blue chakra pulse burst.",
    "leaf_whirlwind": "a roaring green wind tornado of sharp spinning oak leaves whipped into a horizontal hurricane by a high spinning martial arts kick.",
    "dynamic_entry": "an explosive flying martial arts kick in sharp foreshortening, ninja sandal cutting air pressure with red motivation aura and impact flash.",
    "rising_wind": "an upward sweeping martial arts kick releasing violent wind blades cutting vertically and horizontally across the frame.",
    "strong_fist": "double impact shockwaves from a rapid two-punch combo, white air distortion rings exploding outward in rapid succession.",
    "sweeping_kick": "a low sweeping leg arc scattering dust, ground cracks, and an ankle-height shockwave tearing through terrain.",
    "elbow_strike": "a sharp heavy elbow thrust breaking armor plate with yellow energy impact sparks and crackling air pressure.",
    "feint_strike": "double visual blur of a weapon slash shifting angle mid-strike, leaving optical refraction trails and phantom blade edges.",
    "counter_stance": "defensive crossed arms aura glowing with golden reactive chakra ready to deflect incoming strikes.",
    "dancing_leaf": "shadow speed lines behind target silhouette, preparing airborne taijutsu launch with rising wind currents.",
    "focused_breathing": "steady green chakra mist rising from lungs and chest in rhythmic breathing waves, restoring internal energy.",
    "kunai_slash": "gleaming curved steel slash arc of a kunai blade leaving a bloody red-tinted crescent trail in the air.",
    "kunai_throw": "a flying kunai blade mid-air with motion trail, steel gleam, and sharp speed lines cutting horizontally.",
    "shuriken_barrage": "trio of spinning steel shurikens flying in staggered formation with metallic motion blur lines and sparks.",
    "windmill_shuriken": "massive four-bladed Fuma shuriken spinning like a giant razor wheel cutting through iron shields.",
    "senbon": "a volley of thin silver senbon needles streaking horizontally across the frame with precise metallic glints.",
    "senbon_rain": "shower of deadly senbon needles dipped in glowing purple venom falling in a dense diagonal array.",
    "explosive_tag": "a paper explosive seal tag mid-detonation, kanji flare and bright orange blast ring exploding outward.",
    "explosive_barrage": "chain explosion of multiple paper tags detonating across the frame in a fiery sequence with flying paper shards.",
    "sword_slash": "broad katana blade slash releasing a silver razor wind arc cutting cleanly through dark air.",
    "iaido": "blinding flash of a katana quick-draw from sheath, single horizontal light line splitting darkness.",
    "wire_setup": "razor-thin crisscrossing steel ninja wires glinting under moonlight in a deadly web.",
    "poison_coat": "kunai blade coated in dripping glowing green and purple venom glistening under dark lighting.",
    "smoke_bomb": "dense grey-black smoke bomb cloud expanding outward, blinding fog with ember sparks.",
    "flash_bomb": "blinding white light explosion bursting from a spherical flash grenade, starburst glare rays.",
    "analyze": "glowing blue analytical chakra grid lines and target reticles highlighting anatomical pressure points.",
    "brace": "heavy golden barrier aura surrounding a grounded stance, absorbing impact shockwaves.",
    "cloak_invis": "semi-transparent cloaking refraction field distorting background light into camouflage waves.",
    "basic_medical": "gentle palm glowing with luminous emerald-green healing chakra emitting soothing light particles.",
    "focused_stance": "sharp pinpoint aura of golden chakra concentrating at the eyes and fingertips for extreme accuracy.",
    "defensive_posture": "solid blue chakra shield wall forming a heavy tortoise-shell barrier matrix.",
    "aggressive_stance": "fiery crimson strength aura radiating outward like roaring heat waves.",
    "weapon_proficiency": "crossed katana and kunai surrounded by sharp white weapon mastery runes and steel gleam.",
    "taijutsu_training": "heavy training weights crashing onto stone floor, releasing impact dust and muscle aura.",
    "quick_reflexes": "lightning-fast motion blur trails evading incoming kunai with millimeters to spare.",
    "iron_body": "metallic steel sheen skin aura deflecting incoming blade sparks like an anviled shield.",
    "chakra_reserves": "deep blue swirling vortex of internal chakra condensing into a brilliant CP core.",
    "mental_fortitude": "glowing indigo mind barrier deflecting dark genjutsu eye needles.",
    "precision": "precise crosshair target reticle locking onto a vital tenketsu point with crimson needle laser.",
    "fire_affinity": "intense swirling flames encircling hands, blazing fire kanji rune glowing red-hot.",
    "air_palm": "vacuum palm thrust blasting a visible white air pressure palm-print through the air.",
    "rasengan": "a spinning sphere of blue-white spiraling chakra, dense rotating rings of energy held as a pure orb.",
    "fireball": "a massive pure fireball projectile of searing orange-red flame, white-hot core, outer flames in hard cel-shaded shapes, embers and sparks flying.",
    "kaiten": "domed spinning hemisphere of pale blue chakra expelling attacks outward in 360-degree rotation.",
    "byakugan": "pale white Byakugan eyes with bulging veins near the temples, near-360 vision aura of pale chakra.",
    "gentle_fist": "open-palm gentle fist strike with pale chakra needles piercing tenketsu points, soft white-blue sparks.",
    "sharingan_2": "glowing red Sharingan eye with 2 tomoe, ocular power radiating crimson light.",
    "water_prison": "dense sphere of swirling blue water trapping a figure inside, water ripples and bubbles.",
    "suijinheki": "erupting wall of rushing blue water torrents forming a protective liquid barricade.",
    "hell_viewing": "dark Genjutsu nightmare vision showing terrifying shadowy hands reaching out from crimson fog.",
    "mind_destruction": "purple chakra nerve threads invading opponent's head, disrupting brain wave signals.",
    "dragon_flame": "roaring dragon-headed flame stream rushing forward along ninja wire lines.",
    "hidden_mist": "thick white killing mist blanketing the frame, ghostly silhouettes barely visible.",
    "water_clone": "human figure coalescing out of liquid water droplets and splashing waves.",
    "lightning_ball": "crackling orb of yellow-blue electrical plasma shooting jagged lightning bolts sideways.",
    "earth_decapitation": "hands reaching up from underground soil pulling target downward into earth.",
    "great_breakthrough": "massive gale-force wind gust blowing away trees and dust in a horizontal blast.",
    "air_bullet": "compressed sphere of dense wind spinning at high pressure launched like a cannonball.",
    "fang_over_fang": "twin spinning drill tornadoes of chakra and claws ripping horizontally through terrain.",
    "mind_transfer": "spirit energy beam of pale blue chakra extending forward from forehead toward target.",
    "shadow_possession": "dark elongated shadow tendril crawling along ground, splitting to bind enemy feet.",
    "bug_swarm": "dense cloud of black parasitic Kikaichu beetles swarming outward like a dark hurricane.",
    "expansion": "giant enlarged boulder-sized fist slamming down onto ground with crushing impact.",
    "64_palms": "8 Trigrams Bagua field on ground with high-speed 64 palm strike blur marks hitting tenketsu.",
    "sand_burial": "crushing wave of heavy golden sand compressing inward with explosive pressure.",
    "curse_mark_1": "black flame-like Curse Mark patterns spreading across pale skin with dark purple aura.",
    "sand_shield": "dense wall of floating sand automatically rising to block incoming sharp blades.",
    "sharingan_predict": "crimson Sharingan vision overlay predicting enemy movement arc with red ghost trails.",
    "byakugan_scan": "X-ray vision of human chakra circulatory system highlighting 361 glowing tenketsu points.",
    "summon_gamabunta": "giant toad Gamabunta's massive eye and short sword emerging through summon smoke.",
    "summon_manda": "gigantic purple venomous serpent Manda coiling through purple summoning fog with fangs.",
    "puppet_crow": "Karasu three-eyed puppet opening chest to launch poison needles and blades.",
    "shadow_clone": "multiple solid Kage Bunshin clones bursting out of explosive white smoke clouds in battle stances.",
    "primary_lotus": "high-speed piledriver spinning drop wrapped in bandages crashing into earth with crater blast.",
    "chidori": "roaring electric lightning blade held in hand, thousands of chirping birds lightning arcs.",
    "chidori_stream": "360-degree omnidirectional electric discharge of blue lightning surging from entire body.",
    "sand_coffin": "swirling sand wrapping tightly around target, trapping them in a dense sarcophagus of earth.",
    "water_dragon": "majestic dragon head formed of rushing blue water roaring forward with foaming jaws.",
    "ice_mirrors": "crystal ice mirrors surrounding the frame in a hexagonal dome, reflecting masked hunter nin.",
    "false_surroundings": "shifting maze of illusory distorted corridor walls warping reality.",
    "temple_nirvana": "fluttering white feather rain falling from dark sky, lulling minds into deep sleep.",
    "hidden_lotus": "fiery red skin 5th Gate aura, ultra high speed red kinetic strike trails in mid-air.",
    "water_vortex": "colossal tidal wave vortex of crushing ocean water sweeping across the battlefield.",
    "clone_explosion": "clone bursting into a massive fiery orange explosion with flying shrapnel.",
    "1000_years": "secret taijutsu tiger seal fingers thrusting upward with comedic speed lines and shockwave.",
    "gate_of_life": "green Eight Gates chakra aura erupting from body, veins pulsing with intense life energy.",
    "curse_mark_2": "dark grey demonic wing-hands and horned head of Curse Mark Stage 2 radiating dark chakra.",
    "curse_surge": "violent pulse of pitch-black curse mark chakra exploding outward like dark lightning.",
    "gate_prep": "intense inner focus as green chakra veins ignite around heart and chakra gates.",
    "killing_intent": "terrifying spectral demon visage looming behind, paralyzing air with blood-red aura.",
    "demon_slash": "Executioner's Kubikiribōchō broadsword sweeping in a decapitating arc through red mist.",
    "bone_drill": "bone drill lance extending from forearm, spinning with white ivory armor plating.",
    "poison_fog": "dense toxic purple salamander gas cloud spreading along ground, corroding rock.",
    "tsukuyomi": "inverted monochrome black-and-white world with blood-red sky, giant crimson moon and cross bound target.",
    "reaper_death_seal": "translucent terrifying Shinigami Reaper with prayer beads and tanto floating behind summoner.",
    "edo_tensei": "wooden coffin rising from dirt with lid falling open, crackling paper talisman on forehead.",
    "gate_of_limit": "5th Gate release, crimson skin and green-yellow roaring chakra tearing up ground terrain.",
    "shukaku_arm": "massive monstrous sand arm with blue Curse patterns reaching out with clawed fingers.",
    "copy_jutsu": "Sharingan eye reflecting opponent's hand seals in real-time mirror image.",
    "c4_karura": "giant microscopic explosive clay figure dissolving into golden dust of invisible nano-bombs.",
    "rasenshuriken": "giant spinning wind shuriken blade surrounding a brilliant white Rasengan core, roaring wind noise.",
    "amaterasu": "inextinguishable black flames burning on target, dark smoke and black fire consuming everything.",
    "kirin": "colossal mythical lightning beast Kirin descending from dark storm clouds in a blinding thunderbolt.",
    "shinra_tensei": "invisible repulsive force wave flattening ground in a massive 360-degree crater explosion.",
    "kamui_impact": "space-time distortion spiral warping background into a central vortex singularity.",
    "tengai_shinsei": "colossal apocalyptic meteoroid falling from dark red sky, looming overhead in epic scale.",
    "adamantine_chains": "golden chakra chains with spiked tips erupting from back, binding everything in gold metal.",
    "heavy_kick": "ground-shattering downward axe kick smashing boulders into flying rubble with brown impact wave."
}

content = md_path.read_text(encoding="utf-8")
blocks = content.split("### ")
new_blocks = [blocks[0]]

count = 0
for b in blocks[1:]:
    lines = b.strip().split("\n")
    header = lines[0]
    m_id = re.search(r'`([^`]+)`', header)
    if not m_id:
        new_blocks.append(b)
        continue
    
    skill_id = m_id.group(1)
    if skill_id in UPGRADES:
        subject_desc = UPGRADES[skill_id]
        
        # Replace SUBJECT: ... line in prompt block
        def repl_subject(m):
            indent = m.group(1)
            return f"{indent}SUBJECT: {subject_desc}"
        
        b_new = re.sub(r'(\n|\r\n)SUBJECT:.*?(?=\n|\r\n)', f'\\1SUBJECT: {subject_desc}', b, flags=re.DOTALL)
        new_blocks.append(b_new + "\n\n")
        count += 1
    else:
        new_blocks.append(b + "\n\n")

new_content = "### ".join(new_blocks)
md_path.write_text(new_content, encoding="utf-8")
print(f"Successfully upgraded {count} skill prompts in {md_path}!")
