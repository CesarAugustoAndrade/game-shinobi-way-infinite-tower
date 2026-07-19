/**
 * DEPRECATED (T-028): Do NOT generate SVG game art.
 * Human rule: all production art via Imagine (image_gen) → raster only.
 * This script is kept only as historical reference and will exit non-zero.
 */
console.error(
  '[T-028] generate-icon-set.mjs is deprecated. Generate icons with Imagine and save as .jpg/.png under public/assets/icons/.',
);
process.exit(1);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outBase = path.join(root, 'public', 'assets', 'icons');

const COLORS = {
  components: { bg: '#1a1528', border: '#e8b84a', ink: '#f5e6c8' },
  artifacts: { bg: '#201028', border: '#c44dff', ink: '#f0d0ff' },
  locations: { bg: '#0f1c28', border: '#3ecf8e', ink: '#d0ffe8' },
  activities: { bg: '#1c1420', border: '#5b9dff', ink: '#d6e8ff' },
  clans: { bg: '#1a1020', border: '#ff5a5a', ink: '#ffe0e0' },
};

function svgIcon(emoji, colors, label) {
  // 64×64 hard-edge arcade tile; emoji as center glyph (asset wrapper until painted PNGs)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="${escapeXml(label)}">
  <rect width="64" height="64" fill="${colors.bg}"/>
  <rect x="2" y="2" width="60" height="60" fill="none" stroke="${colors.border}" stroke-width="4"/>
  <rect x="6" y="6" width="52" height="52" fill="none" stroke="${colors.border}" stroke-width="1" opacity="0.45"/>
  <text x="32" y="40" text-anchor="middle" font-size="26" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
</svg>
`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function writeIcon(folder, id, emoji, label, palette) {
  const dir = path.join(outBase, folder);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${id}.svg`);
  fs.writeFileSync(file, svgIcon(emoji, palette, label), 'utf8');
  return file;
}

const components = [
  ['ninja_steel', '⚔️', 'Ninja Steel'],
  ['spirit_tag', '📜', 'Spirit Tag'],
  ['chakra_pill', '💊', 'Chakra Pill'],
  ['iron_sand', '🛡️', 'Iron Sand'],
  ['anbu_mask', '🎭', 'ANBU Mask'],
  ['training_weights', '🏋️', 'Training Weights'],
  ['swift_sandals', '👟', 'Swift Sandals'],
  ['tactical_scroll', '🧠', 'Tactical Scroll'],
  ['hashirama_cell', '🧬', 'Hashirama Cell'],
];

const locations = [
  ['the_docks', '⚓', 'The Docks'],
  ['misty_beach', '🌫️', 'Misty Beach'],
  ['coastal_forest', '🌲', 'Coastal Forest'],
  ['smugglers_cave', '🕳️', "Smuggler's Cave"],
  ['fishing_village', '🏘️', 'Fishing Village'],
  ['riverside_camp', '🔥', 'Riverside Camp'],
  ['sunken_ship', '🚢', 'Sunken Ship'],
  ['bridge_construction', '🌉', 'Bridge Construction'],
  ['bandit_outpost', '⚔️', 'Bandit Outpost'],
  ['abandoned_manor', '🏚️', 'Abandoned Manor'],
  ['hidden_cove', '🏝️', 'Hidden Cove'],
  ['drowned_shrine', '🏛️', 'Drowned Shrine'],
  ['gatos_compound', '👹', "Gato's Compound"],
];

const activities = [
  ['combat', '⚔️', 'Combat'],
  ['elite_challenge', '👹', 'Elite Challenge'],
  ['merchant', '🛒', 'Merchant'],
  ['event', '🎪', 'Event'],
  ['scroll_discovery', '📜', 'Scroll Discovery'],
  ['rest', '💤', 'Rest'],
  ['training', '🎯', 'Training'],
  ['treasure', '💎', 'Treasure'],
  ['info_gathering', '📡', 'Intel'],
];

const clans = [
  ['uzumaki', '🌀', 'Uzumaki'],
  ['uchiha', '🔥', 'Uchiha'],
  ['hyuga', '👁️', 'Hyuga'],
  ['lee', '💪', 'Lee'],
  ['yamanaka', '💠', 'Yamanaka'],
];

const artifacts = [
  ['kubikiribocho', '🗡️', 'Kubikiribocho'],
  ['chakra_flow_blade', '⚡', 'Chakra Flow Blade'],
  ['samehada', '🦈', 'Samehada'],
  ['gunbai_war_fan', '🪭', 'Gunbai War Fan'],
  ['nuibari', '🪡', 'Nuibari'],
  ['kusanagi', '⚔️', 'Kusanagi'],
  ['hiramekarei', '🔱', 'Hiramekarei'],
  ['kabutowari', '🪓', 'Kabutowari'],
  ['sages_scripture', '📖', "Sage's Scripture"],
  ['gourd_of_sand', '🏺', 'Gourd of Sand'],
  ['totsuka_blade', '🌀', 'Totsuka Blade'],
  ['konans_paper_wings', '🦋', "Konan's Paper Wings"],
  ['explosive_tag_array', '💥', 'Explosive Tag Array'],
  ['flying_thunder_god_seal', '⚡', 'Flying Thunder God Seal'],
  ['forbidden_scroll', '📜', 'Forbidden Scroll'],
  ['eight_gates_core', '🔥', 'Eight Gates Core'],
  ['yata_mirror', '🪞', 'Yata Mirror'],
  ['akimichi_food_pills', '💊', 'Akimichi Food Pills'],
  ['curse_mark_essence', '☯️', 'Curse Mark Essence'],
  ['sage_mode_chakra', '🐸', 'Sage Mode Chakra'],
  ['byakugo_seal', '💎', 'Byakugo Seal'],
  ['susanoo_ribcage', '💀', 'Susanoo Ribcage'],
  ['hokages_necklace', '📿', "Hokage's Necklace"],
  ['puppet_armor_core', '🤖', 'Puppet Armor Core'],
  ['jiraiyas_headband', '🐸', "Jiraiya's Headband"],
  ['will_of_fire_charm', '🔥', 'Will of Fire Charm'],
  ['tsukuyomi_lens', '👁️', 'Tsukuyomi Lens'],
  ['shikamarus_earrings', '💍', "Shikamaru's Earrings"],
  ['kakashis_bell', '🔔', "Kakashi's Bell"],
  ['nara_shadow_bind', '🌑', 'Nara Shadow Bind'],
  ['weights_released', '💨', 'Weights Released'],
  ['gentle_fist_wraps', '🥋', 'Gentle Fist Wraps'],
  ['eight_trigrams_map', '☯️', 'Eight Trigrams Map'],
  ['yellow_flash_boots', '⚡', 'Yellow Flash Boots'],
  ['body_flicker_sash', '🌀', 'Body Flicker Sash'],
  ['scroll_of_seals', '📚', 'Scroll of Seals'],
  ['ten_tails_husk', '🌳', 'Ten-Tails Husk'],
  ['curse_mark_heaven', '☯️', 'Curse Mark Heaven'],
  ['rinnegan_fragment', '👁️', 'Rinnegan Fragment'],
  ['infinite_chakra_core', '💫', 'Infinite Chakra Core'],
  ['adamantine_chains', '⛓️', 'Adamantine Chains'],
  ['sharingan_implant', '🔴', 'Sharingan Implant'],
  ['byakugan_awakening', '⚪', 'Byakugan Awakening'],
  ['shadow_mastery', '🌑', 'Shadow Mastery'],
  ['uzumaki_vitality', '🌀', 'Uzumaki Vitality'],
];

let count = 0;
for (const [id, emoji, label] of components) {
  writeIcon('components', id, emoji, label, COLORS.components);
  count++;
}
for (const [id, emoji, label] of artifacts) {
  writeIcon('artifacts', id, emoji, label, COLORS.artifacts);
  count++;
}
for (const [id, emoji, label] of locations) {
  writeIcon('locations', id, emoji, label, COLORS.locations);
  count++;
}
for (const [id, emoji, label] of activities) {
  writeIcon('activities', id, emoji, label, COLORS.activities);
  count++;
}
for (const [id, emoji, label] of clans) {
  writeIcon('clans', id, emoji, label, COLORS.clans);
  count++;
}

console.log(`Generated ${count} SVG icons under public/assets/icons/`);
