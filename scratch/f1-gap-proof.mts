/**
 * One-shot F1 gap proof — run from repo root:
 *   npx tsx scratch/f1-gap-proof.mts <outpath>
 */
import { SKILLS } from "../src/game/constants/skills.ts";
import { ComponentId, Rarity, Clan } from "../src/game/types.ts";
import {
  generateBrokenComponent,
  generateComponent,
  grantHashiramaCell,
  upgradeComponent,
  disassemble,
  generateRandomArtifact,
} from "../src/game/systems/LootSystem.ts";
import { BALANCE } from "../src/game/config.ts";
import { SYNTHESIS_RECIPES } from "../src/game/constants/synthesis.ts";
import { generateInterludeBoons } from "../src/game/systems/CampaignSystem.ts";
import { createPlayer } from "../src/game/entities/Player.ts";
import { HELP_TEXT } from "../src/game/constants/helpText.ts";
import fs from "fs";

const out: string[] = [];
let badReqs = 0;
for (const sk of Object.values(SKILLS)) {
  const stats = sk.requirements?.stats as Record<string, number> | undefined;
  if (!stats) continue;
  for (const v of Object.values(stats)) {
    if (typeof v === "number" && (v < 1 || v > 7)) badReqs++;
  }
}
out.push("skill_reqs_outside_1_7=" + badReqs);

const broken = generateBrokenComponent(50, 80);
const common = generateComponent(50, 80);
const hash = grantHashiramaCell(50);
out.push("broken_stats=" + JSON.stringify(broken.stats));
out.push("common_stats=" + JSON.stringify(common.stats));
out.push("hashirama_stats=" + JSON.stringify(hash.stats));
out.push("PRIMARY_SLOT_MULTIPLIER=" + BALANCE.PRIMARY_SLOT_MULTIPLIER);

const a = { ...broken, rarity: Rarity.BROKEN };
const b = { ...broken, id: "b2", rarity: Rarity.BROKEN };
const up = upgradeComponent(a, b, 10);
out.push("upgrade_common_stats=" + JSON.stringify(up.item?.stats));

// High-value artifact disassemble must still yield +1 primary (not value/15)
const fatArtifact = generateRandomArtifact(50, 80);
fatArtifact.value = 750;
const fromDis = disassemble(fatArtifact);
const disPrim = fromDis ? Object.values(fromDis.stats)[0] : null;
out.push("disassemble_primary=" + disPrim);
out.push("disassemble_value=" + fromDis?.value);
out.push(
  "disassemble_ok=" +
    (disPrim === 1 && fromDis != null && fromDis.value === Math.floor(750 * 0.5))
);

const primKeys = new Set([
  "willpower",
  "chakra",
  "strength",
  "spirit",
  "intelligence",
  "calmness",
  "speed",
  "accuracy",
  "dexterity",
]);
let synthBad = 0;
for (const r of SYNTHESIS_RECIPES) {
  if (!r.bonusStats) continue;
  let primCount = 0;
  for (const [k, v] of Object.entries(r.bonusStats)) {
    if (primKeys.has(k)) {
      primCount++;
      if ((v as number) > 1) synthBad++;
    }
  }
  if (primCount > 1) synthBad++;
}
out.push("synthesis_primary_violations=" + synthBad);

const boons = generateInterludeBoons(createPlayer(Clan.LEE));
const statBoon = boons.find((x) => x.kind === "stat");
const itemBoon = boons.find((x) => x.kind === "item");
out.push("stat_boon_amount=" + statBoon?.statAmount);
out.push("item_boon_stats=" + JSON.stringify(itemBoon?.item?.stats));

const help = JSON.stringify(HELP_TEXT);
out.push("help_old_hp_formula=" + help.includes("80 + (Willpower"));
out.push("help_f1_hp_formula=" + help.includes("100 + (Willpower"));
out.push("help_old_ap_per10=" + help.includes("per 10 Speed"));
out.push("help_old_dex16=" + help.includes("Dexterity 16"));
out.push("help_f1_ap=" + help.includes("min(9"));

const path = process.argv[2] || "scratch/f1-gap-fix-proof.log";
fs.writeFileSync(path, out.join("\n") + "\n");
console.log(out.join("\n"));
