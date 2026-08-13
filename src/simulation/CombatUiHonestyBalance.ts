import { buildHonestyPreview } from '../game/systems/combatSkillViewModel';

export function printCombatUiHonestyProbe(): void {
  const bare = buildHonestyPreview(12, []);
  const mode = buildHonestyPreview(12, [{ name: 'Byakugan', bonus: 6 }]);
  console.log('\n── T-010 UI honesty preview probe ──');
  console.log(`  no-source enhanced: ${bare.enhanced === null}`);
  console.log(`  mode-source enhanced: ${mode.enhanced} (sources: ${mode.sources.map((s) => s.name).join(',')})`);
}
