import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HELP_TEXT } from '../../game/constants/helpText';
import { ArrowLeft, Flame, Wind, Zap, Mountain, Droplet, Sword, Brain, Sparkles, Shield, Map, MapPin, Box, Hammer, Target, TreePine, Workflow, Swords, Compass, Coins, ScrollText, Crown, ChartNoAxesCombined, type LucideIcon } from 'lucide-react';
import './GameGuide.css';

interface GameGuideProps {
  onBack: () => void;
}

type Tab = 'STATS' | 'ELEMENTS' | 'EFFECTS' | 'COMBAT' | 'CLANS' | 'PROGRESSION' | 'EQUIPMENT' | 'EXPLORATION' | 'CRAFTING' | 'SYSTEMS';

const TABS: Tab[] = ['STATS', 'ELEMENTS', 'EFFECTS', 'COMBAT', 'CLANS', 'PROGRESSION', 'EQUIPMENT', 'EXPLORATION', 'CRAFTING', 'SYSTEMS'];

type SystemArea = 'CORE' | 'EXPLORATION' | 'COMBAT' | 'PROGRESSION' | 'ECONOMY';

interface SystemCatalogEntry {
  name: string;
  area: SystemArea;
  title: string;
  summary: string;
  responsibilities: string[];
  icon: LucideIcon;
  mode: 'PURE' | 'FLOW' | 'SERVICE';
}

const SYSTEM_FILTERS: Array<SystemArea | 'ALL'> = ['ALL', 'CORE', 'EXPLORATION', 'COMBAT', 'PROGRESSION', 'ECONOMY'];

/** The atlas mirrors the real modules in src/game/systems/. Keep names in sync when adding a system. */
const SYSTEM_CATALOG: SystemCatalogEntry[] = [
  {
    name: 'StatSystem', area: 'CORE', icon: ChartNoAxesCombined, mode: 'PURE',
    title: 'Triad of the shinobi',
    summary: 'Converts Body, Mind and Technique attributes into the derived combat sheet.',
    responsibilities: ['Primary → derived stats', 'Skill requirements', 'Equipment-aware totals'],
  },
  {
    name: 'LevelSystem', area: 'PROGRESSION', icon: Crown, mode: 'PURE',
    title: 'Growth by experience',
    summary: 'Applies level-ups, rewards and the stat choices that shape a run.',
    responsibilities: ['XP thresholds', 'Level-up application', 'Progression rewards'],
  },
  {
    name: 'ScalingSystem', area: 'PROGRESSION', icon: ChartNoAxesCombined, mode: 'PURE',
    title: 'Pressure curve',
    summary: 'Keeps danger, floors, merchant prices and the campaign difficulty readable.',
    responsibilities: ['Danger → floor scaling', 'Merchant discounts', 'Ryo adjustments'],
  },
  {
    name: 'CampaignSystem', area: 'PROGRESSION', icon: ScrollText, mode: 'FLOW',
    title: 'Between-region cadence',
    summary: 'Resolves the interlude after a regional boss and carries the campaign forward.',
    responsibilities: ['Full heal', 'Boons', 'Region hand-off'],
  },
  {
    name: 'InfiniteTowerSystem', area: 'PROGRESSION', icon: Crown, mode: 'FLOW',
    title: 'Endless ascent',
    summary: 'Unlocks post-campaign tower runs and turns floor height into a score.',
    responsibilities: ['Unlock state', 'Procedural region config', 'Height calculation'],
  },
  {
    name: 'RegionSystem', area: 'EXPLORATION', icon: Compass, mode: 'FLOW',
    title: 'The world map',
    summary: 'Builds regions, location cards and the intel layer that reveals the next route.',
    responsibilities: ['Region generation', 'Location deck', 'Intel reveal'],
  },
  {
    name: 'LocationSystem', area: 'EXPLORATION', icon: Map, mode: 'FLOW',
    title: 'Room-by-room traversal',
    summary: 'Controls the diamond branch, activities, completion state and treasure pieces.',
    responsibilities: ['Room movement', 'Activity completion', 'Location payoff'],
  },
  {
    name: 'LocationTerrainSystem', area: 'EXPLORATION', icon: TreePine, mode: 'PURE',
    title: 'Terrain has teeth',
    summary: 'Translates location and room terrain into stealth, initiative and elemental modifiers.',
    responsibilities: ['Terrain effects', 'Stealth bonus', 'Combat modifier lines'],
  },
  {
    name: 'RoomCombatModifierSystem', area: 'COMBAT', icon: Target, mode: 'PURE',
    title: 'Room conditions',
    summary: 'Applies the local rule twists that make one room play differently from the next.',
    responsibilities: ['Modifier selection', 'Condition descriptions', 'Room combat hooks'],
  },
  {
    name: 'ApproachSystem', area: 'COMBAT', icon: Compass, mode: 'PURE',
    title: 'Choose the opening',
    summary: 'Resolves the pre-fight approach before cards and turns take over.',
    responsibilities: ['Approach checks', 'Entry costs', 'Opening HP pressure'],
  },
  {
    name: 'CombatWorkflowSystem', area: 'COMBAT', icon: Workflow, mode: 'FLOW',
    title: 'Battle state machine',
    summary: 'Owns the turn order, combat state and the transitions that make a fight finish cleanly.',
    responsibilities: ['Turn state', 'Status lifecycle', 'Victory / defeat flow'],
  },
  {
    name: 'CombatCalculationSystem', area: 'COMBAT', icon: Swords, mode: 'PURE',
    title: 'Damage engine',
    summary: 'Calculates hit chance, damage, defense, elements, crits and true damage.',
    responsibilities: ['Damage formula', 'Defense properties', 'Element cycle'],
  },
  {
    name: 'PlayerTurnSystem', area: 'COMBAT', icon: Swords, mode: 'PURE',
    title: 'Player action window',
    summary: 'Validates AP, chakra, cards and the player-facing action economy.',
    responsibilities: ['Action costs', 'Skill validation', 'End-turn resolution'],
  },
  {
    name: 'EnemyTurnSystem', area: 'COMBAT', icon: Swords, mode: 'PURE',
    title: 'Enemy response',
    summary: 'Executes the enemy intent after the player commits to a turn.',
    responsibilities: ['Intent execution', 'Counter windows', 'Enemy status effects'],
  },
  {
    name: 'EnemyAISystem', area: 'COMBAT', icon: Brain, mode: 'PURE',
    title: 'Readable opposition',
    summary: 'Chooses enemy actions from archetype behavior and current battle context.',
    responsibilities: ['Intent choice', 'Archetype logic', 'Telegraph data'],
  },
  {
    name: 'EnemySystem', area: 'COMBAT', icon: Target, mode: 'PURE',
    title: 'Enemy identity',
    summary: 'Generates enemies with scaled stats, kits, art identity and loot hooks.',
    responsibilities: ['Archetype generation', 'Floor scaling', 'Enemy loadout'],
  },
  {
    name: 'PostureSystem', area: 'COMBAT', icon: Shield, mode: 'PURE',
    title: 'Stance is a resource',
    summary: 'Resolves posture changes, card bias and the damage trade-offs of each stance.',
    responsibilities: ['Posture changes', 'Damage bias', 'Draw synergy'],
  },
  {
    name: 'DeckSystem', area: 'COMBAT', icon: ScrollText, mode: 'PURE',
    title: 'The hand you built',
    summary: 'Maintains playable skill decks, card limits and the combat hand economy.',
    responsibilities: ['Deck validation', 'Hand size', 'Playable skill count'],
  },
  {
    name: 'EliteChallengeSystem', area: 'COMBAT', icon: Crown, mode: 'FLOW',
    title: 'Risk for relics',
    summary: 'Stages the elite choice: take the fight for an artifact or walk away.',
    responsibilities: ['Elite preview', 'Fight / escape branch', 'Artifact reward'],
  },
  {
    name: 'EventSystem', area: 'EXPLORATION', icon: ScrollText, mode: 'FLOW',
    title: 'Choice with consequence',
    summary: 'Rolls event outcomes, applies changes and chains narrative beats.',
    responsibilities: ['Choice resolution', 'Seeded RNG', 'Outcome changes'],
  },
  {
    name: 'LootSystem', area: 'ECONOMY', icon: Sparkles, mode: 'PURE',
    title: 'Rewards that make a build',
    summary: 'Generates drops, synthesizes components and turns combat wins into decisions.',
    responsibilities: ['Drop generation', 'TFT synthesis', 'Loot themes'],
  },
  {
    name: 'EquipmentPassiveSystem', area: 'ECONOMY', icon: Sparkles, mode: 'PURE',
    title: 'Build identity',
    summary: 'Aggregates artifact passives and applies them to live combat calculations.',
    responsibilities: ['Passive triggers', 'Bonus damage', 'Defense / regen effects'],
  },
  {
    name: 'CombatSimulationService', area: 'CORE', icon: ChartNoAxesCombined, mode: 'SERVICE',
    title: 'Balance laboratory',
    summary: 'Runs deterministic combat scenarios so balance changes can be checked outside the UI.',
    responsibilities: ['Battle simulation', 'Regression data', 'Balance feedback'],
  },
];

// Get rank color class
const getRankColorClass = (color: string): { card: string; label: string } => {
  switch (color) {
    case 'green-500':
      return { card: 'game-guide__rank-card--green', label: 'game-guide__rank-label--green' };
    case 'yellow-500':
      return { card: 'game-guide__rank-card--yellow', label: 'game-guide__rank-label--yellow' };
    case 'orange-500':
      return { card: 'game-guide__rank-card--orange', label: 'game-guide__rank-label--orange' };
    case 'red-500':
      return { card: 'game-guide__rank-card--red-light', label: 'game-guide__rank-label--red-light' };
    case 'red-600':
      return { card: 'game-guide__rank-card--red', label: 'game-guide__rank-label--red' };
    default:
      return { card: '', label: '' };
  }
};

// Get effect indicator class
const getEffectIndicatorClass = (label: string): string => {
  if (['Bleed', 'Burn', 'Poison', 'Curse'].some(s => label.includes(s))) {
    return 'game-guide__effect-indicator--damage';
  }
  if (['Stun', 'Confusion', 'Silence'].some(s => label.includes(s))) {
    return 'game-guide__effect-indicator--control';
  }
  if (['Shield', 'Invulnerability', 'Regen', 'Reflection'].some(s => label.includes(s))) {
    return 'game-guide__effect-indicator--defense';
  }
  return 'game-guide__effect-indicator--other';
};

// Get approach color classes
const getApproachClasses = (color: string): { card: string; name: string } => {
  switch (color) {
    case 'red':
      return { card: 'game-guide__approach-card--red', name: 'game-guide__approach-name--red' };
    case 'blue':
      return { card: 'game-guide__approach-card--blue', name: 'game-guide__approach-name--blue' };
    case 'green':
      return { card: 'game-guide__approach-card--green', name: 'game-guide__approach-name--green' };
    default:
      return { card: 'game-guide__approach-card--default', name: 'game-guide__approach-name--default' };
  }
};

// Get rarity name class
const getRarityNameClass = (rarity: string): string => {
  const lower = rarity.toLowerCase();
  if (lower.includes('common')) return 'game-guide__rarity-name--common';
  if (lower.includes('rare')) return 'game-guide__rarity-name--rare';
  if (lower.includes('epic')) return 'game-guide__rarity-name--epic';
  if (lower.includes('legendary')) return 'game-guide__rarity-name--legendary';
  if (lower.includes('cursed')) return 'game-guide__rarity-name--cursed';
  return '';
};

const GameGuide: React.FC<GameGuideProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('STATS');
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset scroll when tab changes (1-9 or click) — residual: long EXPLORATION stayed scrolled mid-page
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);

  // Keyboard shortcuts: 1-9 for tabs, ←/→ cycle, Escape to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // Escape to go back (ignore key-repeat thrash)
    if (e.key === 'Escape') {
      if (e.repeat) return;
      e.preventDefault();
      onBack();
      return;
    }

    // Arrow Left/Right cycle tabs (roving tabindex focus follows selection)
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab((prev) => {
        const i = TABS.indexOf(prev);
        const nextIdx =
          e.key === 'ArrowRight'
            ? (i + 1) % TABS.length
            : (i - 1 + TABS.length) % TABS.length;
        const next = TABS[nextIdx];
        window.requestAnimationFrame(() => {
          document.getElementById(`game-guide-tab-${next}`)?.focus({ preventScroll: true });
        });
        return next;
      });
      return;
    }

    // Number keys 1-9 plus 0 for the tenth tab (ignore other digits).
    if ((e.key >= '1' && e.key <= '9') || e.key === '0') {
      const num = e.key === '0' ? 10 : parseInt(e.key, 10);
      const next = TABS[num - 1];
      e.preventDefault();
      setActiveTab(next);
      window.requestAnimationFrame(() => {
        document.getElementById(`game-guide-tab-${next}`)?.focus({ preventScroll: true });
      });
    }
  }, [onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="game-guide">
      <div className="game-guide__container">

        {/* Header */}
        <div className="game-guide__header">
          <div className="game-guide__header-left">
            <div className="game-guide__icon-wrapper">
              <ScrollIcon />
            </div>
            <h2 className="game-guide__title" id="game-guide-title">Shinobi Handbook</h2>
          </div>
          <button type="button" onClick={onBack} className="game-guide__back-btn">
            <ArrowLeft size={14} /> Return to the Gate
          </button>
        </div>

        {/* Keyboard Hints */}
        <div className="game-guide__hints">
          <span className="game-guide__hint">
            <span className="sw-shortcut">1-9 / 0</span> Switch Tabs
          </span>
          <span className="game-guide__hint">
            <span className="sw-shortcut">←→</span> Cycle
          </span>
          <span className="game-guide__hint">
            <span className="sw-shortcut">Esc</span> Close
          </span>
        </div>

        {/* Tabs */}
        <div className="game-guide__tabs" role="tablist" aria-label="Handbook sections">
          {TABS.map((tab, idx) => {
            const selected = activeTab === tab;
            return (
              <button
                type="button"
                key={tab}
                role="tab"
                id={`game-guide-tab-${tab}`}
                aria-selected={selected}
                aria-controls="game-guide-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                className={`game-guide__tab ${selected ? 'game-guide__tab--active' : ''}`}
              >
                <span className="game-guide__tab-number">{idx + 1}</span>
                {tab}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div
          ref={contentRef}
          className="game-guide__content"
          role="tabpanel"
          id="game-guide-panel"
          aria-labelledby={`game-guide-tab-${activeTab}`}
        >

          {/* --- STATS TAB --- */}
          {activeTab === 'STATS' && (
            <div className="game-guide__section game-guide__section-space">
              <div className="game-guide__stats-grid">
                {/* Body */}
                <div className="game-guide__stat-category">
                  <div className="game-guide__stat-header game-guide__stat-header--body">
                    <Sword size={18} /> <h3>The Body</h3>
                  </div>
                  {HELP_TEXT.STATS.BODY.map(stat => (
                    <div key={stat.id} className="game-guide__stat-card game-guide__stat-card--body">
                      <div className="game-guide__stat-name">{stat.name}</div>
                      <div className="game-guide__stat-desc">{stat.desc}</div>
                      <div className="game-guide__stat-effect">{stat.effect}</div>
                    </div>
                  ))}
                </div>

                {/* Mind */}
                <div className="game-guide__stat-category">
                  <div className="game-guide__stat-header game-guide__stat-header--mind">
                    <Brain size={18} /> <h3>The Mind</h3>
                  </div>
                  {HELP_TEXT.STATS.MIND.map(stat => (
                    <div key={stat.id} className="game-guide__stat-card game-guide__stat-card--mind">
                      <div className="game-guide__stat-name">{stat.name}</div>
                      <div className="game-guide__stat-desc">{stat.desc}</div>
                      <div className="game-guide__stat-effect">{stat.effect}</div>
                    </div>
                  ))}
                </div>

                {/* Technique */}
                <div className="game-guide__stat-category">
                  <div className="game-guide__stat-header game-guide__stat-header--technique">
                    <Sparkles size={18} /> <h3>Technique</h3>
                  </div>
                  {HELP_TEXT.STATS.TECHNIQUE.map(stat => (
                    <div key={stat.id} className="game-guide__stat-card game-guide__stat-card--technique">
                      <div className="game-guide__stat-name">{stat.name}</div>
                      <div className="game-guide__stat-desc">{stat.desc}</div>
                      <div className="game-guide__stat-effect">{stat.effect}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Derived Stats Section */}
              <div className="game-guide__derived-section">
                <h3 className="game-guide__derived-title">Derived Stats</h3>
                <div className="game-guide__derived-grid">
                  {HELP_TEXT.DERIVED.map((stat, idx) => (
                    <div key={idx} className="game-guide__derived-card">
                      <div className="game-guide__derived-name">{stat.name}</div>
                      <div className="game-guide__derived-desc">{stat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- ELEMENTS TAB --- */}
          {activeTab === 'ELEMENTS' && (
            <div className="game-guide__elements-container">
              <div className="game-guide__cycle-panel">
                <h3 className="game-guide__cycle-title">The Cycle of Chakra</h3>

                <div className="game-guide__cycle-flow">
                  <ElementNode element="fire" icon={<Flame size={32} />} label="FIRE" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="wind" icon={<Wind size={32} />} label="WIND" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="lightning" icon={<Zap size={32} />} label="LIGHTNING" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="earth" icon={<Mountain size={32} />} label="EARTH" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="water" icon={<Droplet size={32} />} label="WATER" />
                  <span className="game-guide__cycle-arrow">&gt;</span>
                  <ElementNode element="fire" icon={<Flame size={32} />} label="FIRE" />
                </div>
              </div>

              <div className="game-guide__effectiveness-grid">
                <div className="game-guide__effectiveness-card game-guide__effectiveness-card--super">
                  <div className="game-guide__effectiveness-title">Super Effective</div>
                  <ul className="game-guide__effectiveness-list">
                    <li>Deals <strong>1.2× Base Damage</strong></li>
                    <li>Grants <strong>+10% Critical Chance</strong></li>
                    <li>Full defense still applies (no armor ignore)</li>
                  </ul>
                </div>
                <div className="game-guide__effectiveness-card game-guide__effectiveness-card--resist">
                  <div className="game-guide__effectiveness-title">Resisted</div>
                  <ul className="game-guide__effectiveness-list">
                    <li>Deals <strong>0.8× Base Damage</strong></li>
                    <li>Standard Critical Chance</li>
                    <li>Physical &amp; Mental attacks are always neutral</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* --- EFFECTS TAB --- */}
          {activeTab === 'EFFECTS' && (
            <div className="game-guide__effects-grid">
              {HELP_TEXT.EFFECTS.map(effect => (
                <div key={effect.type} className="game-guide__effect-card">
                  <div className={`game-guide__effect-indicator ${getEffectIndicatorClass(effect.label)}`}></div>
                  <div className="game-guide__effect-content">
                    <div className="game-guide__effect-label">{effect.label}</div>
                    <div className="game-guide__effect-desc">{effect.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- COMBAT TAB --- */}
          {activeTab === 'COMBAT' && (
            <div className="game-guide__section game-guide__section-space">
              {/* Deck / Hand / AP */}
              <section className="game-guide__combat-section">
                <h3 className="game-guide__combat-title">
                  {HELP_TEXT.COMBAT_MECHANICS.DECK_ECONOMY.title}
                </h3>
                <p className="game-guide__approaches-intro">
                  {HELP_TEXT.COMBAT_MECHANICS.DECK_ECONOMY.overview}
                </p>
                <div className="game-guide__approaches-grid">
                  {HELP_TEXT.COMBAT_MECHANICS.DECK_ECONOMY.points.map((point, idx) => (
                    <div key={idx} className="game-guide__approach-card game-guide__approach-card--default">
                      <div className="game-guide__approach-name game-guide__approach-name--default">{point.label}</div>
                      <div className="game-guide__approach-desc">{point.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Postures (in-combat stance) */}
              <section className="game-guide__combat-section game-guide__combat-section--small">
                <h3 className="game-guide__combat-title">
                  <Shield size={18} /> Combat Posture
                </h3>
                <p className="game-guide__approaches-intro">
                  Switch posture during your turn (costs 1 AP). Some skills shift posture for free on play; others deal bonus damage when posture matches. Posture also biases card draws and lightly scales damage dealt/taken.
                </p>
                <div className="game-guide__approaches-grid">
                  {HELP_TEXT.COMBAT_MECHANICS.POSTURES.map((posture, idx) => {
                    const classes = getApproachClasses(posture.color);
                    return (
                      <div key={idx} className={`game-guide__approach-card ${classes.card}`}>
                        <div className={`game-guide__approach-name ${classes.name}`}>{posture.type}</div>
                        <div className="game-guide__approach-desc">{posture.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Pre-fight Approaches */}
              <section className="game-guide__combat-section game-guide__combat-section--small">
                <h3 className="game-guide__combat-title">
                  <Target size={18} /> Pre-Fight Approaches
                </h3>
                <p className="game-guide__approaches-intro">
                  Choose how you engage before combat starts. Requirements and success chance depend on your stats and terrain — not the same as in-combat posture.
                </p>
                <div className="game-guide__approaches-grid">
                  {HELP_TEXT.COMBAT_MECHANICS.APPROACHES.map((approach, idx) => {
                    const classes = getApproachClasses(approach.color);
                    return (
                      <div key={idx} className={`game-guide__approach-card ${classes.card}`}>
                        <div className={`game-guide__approach-name ${classes.name}`}>{approach.type}</div>
                        <div className="game-guide__approach-desc">{approach.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="game-guide__combat-section">
                <h3 className="game-guide__combat-title">Damage Formula</h3>
                <div className="game-guide__formula-box">
                  Final = (Base × Mult) - Flat_Def × (1 - %_Def)
                </div>
                <div className="game-guide__formula-desc">
                  <p><span>1. Flat Defense:</span> Directly subtracts from incoming damage. Great against multi-hit weak attacks.</p>
                  <p><span>2. Percent Defense:</span> Reduces remaining damage by a percentage (capped at 75%). Great against heavy hits.</p>
                  <p><span className="game-guide__formula-desc--true-damage">3. True Damage:</span> Ignores ALL defense.</p>
                </div>
              </section>

              {/* Terrain — T-076: location terrainEffects (live systems), not fluff biomes */}
              <section className="game-guide__combat-section game-guide__combat-section--small">
                <h3 className="game-guide__combat-title">
                  <TreePine size={18} /> Location Terrain Effects
                </h3>
                <p className="game-guide__approaches-intro">
                  Each location lists active effects on the map header and combat open banner.
                  Room terrain (forest, water, etc.) still tweaks stealth/init/element amp on top.
                </p>
                <div className="game-guide__terrain-grid">
                  {HELP_TEXT.COMBAT_MECHANICS.TERRAIN.map((terrain, idx) => (
                    <div key={idx} className="game-guide__terrain-card">
                      <div className="game-guide__terrain-name">{terrain.type}</div>
                      <div className="game-guide__terrain-desc">{terrain.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="game-guide__mechanics-grid">
                <div className="game-guide__mechanic-card game-guide__mechanic-card--guts">
                  <div className="game-guide__mechanic-title game-guide__mechanic-title--guts">
                    <Flame size={16} /> GUTS Mechanic
                  </div>
                  <p className="game-guide__mechanic-desc">
                    If you take lethal damage while above 1 HP, you have a chance based on your <strong>Willpower</strong> to survive with exactly 1 HP. High Willpower is essential for survival.
                  </p>
                </div>
                <div className="game-guide__mechanic-card game-guide__mechanic-card--shields">
                  <div className="game-guide__mechanic-title game-guide__mechanic-title--shields">
                    <Shield size={16} /> SHIELDS
                  </div>
                  <p className="game-guide__mechanic-desc">
                    Shields (Temporary HP) take damage before your actual Health. However, <strong>Shields do not benefit from your Defense stats</strong>. They take raw damage.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* --- CLANS TAB --- */}
          {activeTab === 'CLANS' && (
            <div className="game-guide__clans-section">
              {HELP_TEXT.CLANS.map(clan => (
                <div key={clan.id} className="game-guide__clan-card">
                  <div className="game-guide__clan-header">
                    <h3 className="game-guide__clan-name">{clan.name}</h3>
                    <span className="game-guide__clan-role">{clan.role}</span>
                  </div>
                  <p className="game-guide__clan-desc">{clan.desc}</p>
                  <div className="game-guide__clan-details">
                    <div>
                      <div className="game-guide__clan-strengths-title">Strengths</div>
                      <ul className="game-guide__clan-strengths-list">
                        {clan.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="game-guide__clan-weakness-title">Weakness</div>
                      <p className="game-guide__clan-weakness">{clan.weakness}</p>
                    </div>
                  </div>
                  <p className="game-guide__clan-strategy"><span>Strategy:</span> {clan.strategy}</p>
                </div>
              ))}
            </div>
          )}

          {/* --- PROGRESSION TAB --- */}
          {activeTab === 'PROGRESSION' && (
            <div className="game-guide__progression-section">
              <section className="game-guide__scaling-section">
                <h3 className="game-guide__scaling-title">Enemy Scaling Formula</h3>
                <div className="game-guide__scaling-formula">
                  {HELP_TEXT.PROGRESSION.SCALING.formula}
                </div>
                <div className="game-guide__scaling-breakdown">
                  {HELP_TEXT.PROGRESSION.SCALING.breakdown.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <h4 className="game-guide__examples-title">Examples:</h4>
                <div className="game-guide__examples-list">
                  {HELP_TEXT.PROGRESSION.SCALING.examples.map((ex, idx) => (
                    <div key={idx} className="game-guide__example-item">{ex.text}</div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="game-guide__ranks-title">Difficulty Ranks</h3>
                <div className="game-guide__ranks-grid">
                  {HELP_TEXT.PROGRESSION.DIFFICULTY_RANKS.map((rank, idx) => {
                    const colorClasses = getRankColorClass(rank.color);
                    return (
                      <div key={idx} className={`game-guide__rank-card ${colorClasses.card}`}>
                        <div className={`game-guide__rank-label ${colorClasses.label}`}>Rank {rank.rank}</div>
                        <div className="game-guide__rank-range">Range: {rank.range}</div>
                        <p className="game-guide__rank-desc">{rank.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="game-guide__resources-section">
                <h3 className="game-guide__resources-title">Resources & Formulas</h3>
                {HELP_TEXT.PROGRESSION.RESOURCES.map((res, idx) => (
                  <div key={idx} className="game-guide__resource-card">
                    <div className="game-guide__resource-label">{res.label}</div>
                    <div className="game-guide__resource-formula">{res.formula}</div>
                  </div>
                ))}
                {HELP_TEXT.PROGRESSION.PROGRESSION_DETAILS.map((detail, idx) => (
                  <div key={idx} className="game-guide__resource-card">
                    <div className="game-guide__resource-label">{detail.label}</div>
                    <div className="game-guide__resource-formula">{detail.formula}</div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* --- SYSTEMS TAB --- */}
          {activeTab === 'SYSTEMS' && <SystemsAtlas />}

          {/* --- EQUIPMENT TAB --- */}
          {activeTab === 'EQUIPMENT' && (
            <div className="game-guide__equipment-section">
              <section className="game-guide__rarities-section">
                <h3 className="game-guide__rarities-title">Rarity Tiers</h3>
                {HELP_TEXT.EQUIPMENT.RARITIES.map((rarity, idx) => (
                  <div key={idx} className="game-guide__rarity-card">
                    <div className="game-guide__rarity-header">
                      <div className={`game-guide__rarity-name ${getRarityNameClass(rarity.rarity)}`}>{rarity.rarity}</div>
                      <span className="game-guide__rarity-drop">{rarity.dropRate}</span>
                    </div>
                    <p className="game-guide__rarity-desc">{rarity.desc}</p>
                    <div className="game-guide__rarity-stats">{rarity.statBonus}</div>
                  </div>
                ))}
              </section>

              <section>
                <h3 className="game-guide__slots-title">Equipment Slots</h3>
                <div className="game-guide__slots-grid">
                  {HELP_TEXT.EQUIPMENT.SLOTS.map((slot, idx) => (
                    <div key={idx} className="game-guide__slot-card">
                      <div className="game-guide__slot-name">{slot.slot}</div>
                      <div className="game-guide__slot-primary">Primary: <span>{slot.primary}</span></div>
                      <p className="game-guide__slot-desc">{slot.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="game-guide__scaling-info">
                <h3 className="game-guide__scaling-info-title">Item Scaling</h3>
                <p className="game-guide__scaling-info-desc">{HELP_TEXT.EQUIPMENT.SCALING}</p>
              </section>
            </div>
          )}

          {/* --- EXPLORATION TAB --- */}
          {activeTab === 'EXPLORATION' && (
            <div className="game-guide__exploration-section">
              {/* First-run steps (Region 1) */}
              {HELP_TEXT.EXPLORATION.FIRST_RUN && (
                <section className="game-guide__hierarchy-section">
                  <h3 className="game-guide__hierarchy-title">
                    <MapPin size={20} /> First Steps
                  </h3>
                  <p className="game-guide__activities-intro">
                    How to leave the menu and clear your first location.
                  </p>
                  <div className="game-guide__activities-grid">
                    {HELP_TEXT.EXPLORATION.FIRST_RUN.map((item) => (
                      <div key={item.step} className="game-guide__activity-card">
                        <div className="game-guide__activity-number">{item.step}</div>
                        <div>
                          <div className="game-guide__activity-name">{item.title}</div>
                          <div className="game-guide__activity-desc">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Region Hierarchy */}
              <section className="game-guide__hierarchy-section">
                <h3 className="game-guide__hierarchy-title">
                  <Map size={20} /> Region Hierarchy
                </h3>
                <div className="game-guide__hierarchy-flow">
                  {HELP_TEXT.EXPLORATION.HIERARCHY.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <div className="game-guide__hierarchy-item">
                        <div className="game-guide__hierarchy-term">{item.term}</div>
                        <div className="game-guide__hierarchy-desc">{item.desc}</div>
                      </div>
                      {idx < HELP_TEXT.EXPLORATION.HIERARCHY.length - 1 && (
                        <span className="game-guide__hierarchy-arrow">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </section>

              {/* T-076: Region lootTheme identity (Affinity / Focus / Ryo) */}
              <section className="game-guide__hierarchy-section">
                <h3 className="game-guide__hierarchy-title">
                  <Sparkles size={20} /> Region Identity
                </h3>
                <p className="game-guide__activities-intro">
                  Shown on the region map. These bias enemies, shops, and component drops.
                </p>
                <div className="game-guide__hierarchy-flow">
                  {HELP_TEXT.EXPLORATION.REGION_IDENTITY.map((item, idx) => (
                    <div key={idx} className="game-guide__hierarchy-item">
                      <div className="game-guide__hierarchy-term">{item.term}</div>
                      <div className="game-guide__hierarchy-desc">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Danger Levels */}
              <section className="game-guide__danger-section">
                <h3 className="game-guide__danger-title">
                  <Target size={18} /> Danger Levels
                </h3>
                <p className="game-guide__danger-desc">{HELP_TEXT.EXPLORATION.DANGER_LEVELS.desc}</p>
                <div className="game-guide__danger-formula">
                  {HELP_TEXT.EXPLORATION.DANGER_LEVELS.formula}
                </div>
                <p className="game-guide__danger-note">{HELP_TEXT.EXPLORATION.DANGER_LEVELS.note}</p>
              </section>

              {/* Room Activities */}
              <section>
                <h3 className="game-guide__activities-title">Room Activities</h3>
                <p className="game-guide__activities-intro">Activities are processed in this order within each room:</p>
                <div className="game-guide__activities-grid">
                  {HELP_TEXT.EXPLORATION.ACTIVITIES.map((act) => (
                    <div key={act.order} className="game-guide__activity-card">
                      <div className="game-guide__activity-number">{act.order}</div>
                      <div>
                        <div className="game-guide__activity-name">{act.activity}</div>
                        <div className="game-guide__activity-desc">{act.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Room States & Location Boss */}
              <div className="game-guide__states-row">
                <section className="game-guide__states-section">
                  <h3 className="game-guide__states-title">Room States</h3>
                  <div className="game-guide__states-list">
                    {HELP_TEXT.EXPLORATION.ROOM_STATES.map((rs, idx) => (
                      <div key={idx} className="game-guide__state-item">
                        <div className={`game-guide__state-dot ${idx === 0 ? 'game-guide__state-dot--available' : idx === 1 ? 'game-guide__state-dot--current' : 'game-guide__state-dot--cleared'}`}></div>
                        <span className="game-guide__state-name">{rs.state}:</span>
                        <span className="game-guide__state-desc">{rs.desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="game-guide__boss-section">
                  <h3 className="game-guide__boss-title">
                    <MapPin size={14} /> {HELP_TEXT.EXPLORATION.LOCATION_BOSS.title}
                  </h3>
                  <p className="game-guide__boss-desc">{HELP_TEXT.EXPLORATION.LOCATION_BOSS.desc}</p>
                </section>
              </div>

              {/* Enemy Archetypes */}
              <section>
                <h3 className="game-guide__archetypes-title">Enemy Archetypes</h3>
                <div className="game-guide__archetypes-list">
                  {HELP_TEXT.EXPLORATION.ARCHETYPES.map((arch, idx) => (
                    <div key={idx} className="game-guide__archetype-card">
                      <div className="game-guide__archetype-name">{arch.archetype}</div>
                      <div className="game-guide__archetype-details">
                        <div><span>Stats:</span> {arch.stats}</div>
                        <div><span>Playstyle:</span> {arch.playstyle}</div>
                        <div><span>Skills:</span> {arch.skills}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Story Arcs */}
              <section>
                <h3 className="game-guide__arcs-title">Story Arcs</h3>
                <div className="game-guide__arcs-list">
                  {HELP_TEXT.EXPLORATION.STORY_ARCS.map((arc, idx) => (
                    <div key={idx} className="game-guide__arc-card">
                      <div className="game-guide__arc-header">
                        <div className="game-guide__arc-name">Arc {arc.arc}: {arc.name}</div>
                        <span className="game-guide__arc-danger">Danger {arc.danger}</span>
                      </div>
                      <p className="game-guide__arc-desc">{arc.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* --- CRAFTING TAB --- */}
          {activeTab === 'CRAFTING' && (
            <div className="game-guide__crafting-section">
              {/* Overview */}
              <section className="game-guide__crafting-overview">
                <h3 className="game-guide__crafting-overview-title">
                  <Hammer size={20} /> {HELP_TEXT.CRAFTING.OVERVIEW.title}
                </h3>
                <p className="game-guide__crafting-overview-desc">{HELP_TEXT.CRAFTING.OVERVIEW.desc}</p>
              </section>

              {/* Components */}
              <section className="game-guide__components-section">
                <h3 className="game-guide__components-title">
                  <Box size={18} /> Components
                </h3>
                <p className="game-guide__components-desc">{HELP_TEXT.CRAFTING.COMPONENTS.desc}</p>
                <div className="game-guide__components-grid">
                  {HELP_TEXT.CRAFTING.COMPONENTS.examples.map((comp, idx) => (
                    <div key={idx} className="game-guide__component-card">
                      <div className="game-guide__component-name">{comp.name}</div>
                      <div className="game-guide__component-use">{comp.use}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Artifacts */}
              <section className="game-guide__artifacts-section">
                <h3 className="game-guide__artifacts-title">
                  <Sparkles size={18} /> Artifacts
                </h3>
                <p className="game-guide__artifacts-desc">{HELP_TEXT.CRAFTING.ARTIFACTS.desc}</p>
                <div className="game-guide__triggers-grid">
                  {HELP_TEXT.CRAFTING.ARTIFACTS.triggers.map((t, idx) => (
                    <div key={idx} className="game-guide__trigger-card">
                      <div className="game-guide__trigger-name">{t.trigger}</div>
                      <div className="game-guide__trigger-desc">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bag Capacity */}
              <section className="game-guide__bag-section">
                <div className="game-guide__bag-content">
                  <div className="game-guide__bag-number">
                    {HELP_TEXT.CRAFTING.BAG.capacity}
                  </div>
                  <div>
                    <div className="game-guide__bag-label">Bag Capacity</div>
                    <div className="game-guide__bag-desc">{HELP_TEXT.CRAFTING.BAG.desc}</div>
                  </div>
                </div>
              </section>

              {/* Synthesis */}
              <section className="game-guide__synthesis-section">
                <h3 className="game-guide__synthesis-title">Synthesis Mechanics</h3>
                <div className="game-guide__synthesis-list">
                  <div className="game-guide__synthesis-item game-guide__synthesis-item--combine">
                    <div className="game-guide__synthesis-icon game-guide__synthesis-icon--combine">+</div>
                    <div>
                      <div className="game-guide__synthesis-name game-guide__synthesis-name--combine">Combine</div>
                      <div className="game-guide__synthesis-desc game-guide__synthesis-desc--combine">{HELP_TEXT.CRAFTING.SYNTHESIS.combine}</div>
                    </div>
                  </div>
                  <div className="game-guide__synthesis-item game-guide__synthesis-item--disassemble">
                    <div className="game-guide__synthesis-icon game-guide__synthesis-icon--disassemble">-</div>
                    <div>
                      <div className="game-guide__synthesis-name game-guide__synthesis-name--disassemble">Disassemble</div>
                      <div className="game-guide__synthesis-desc game-guide__synthesis-desc--disassemble">{HELP_TEXT.CRAFTING.SYNTHESIS.disassemble}</div>
                    </div>
                  </div>
                </div>
                <p className="game-guide__synthesis-tip">{HELP_TEXT.CRAFTING.SYNTHESIS.tip}</p>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const SystemsAtlas: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<SystemArea | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const visibleSystems = SYSTEM_CATALOG.filter((system) => {
    const matchesArea = activeFilter === 'ALL' || system.area === activeFilter;
    const searchable = [system.name, system.title, system.summary, ...system.responsibilities]
      .join(' ')
      .toLowerCase();
    return matchesArea && (!normalizedQuery || searchable.includes(normalizedQuery));
  });

  return (
    <div className="game-guide__systems-section">
      <section className="game-guide__systems-hero">
        <div className="game-guide__systems-hero-copy">
          <div className="game-guide__systems-kicker"><Workflow size={14} /> Runtime architecture</div>
          <h3>Every system. One climb.</h3>
          <p>
            This atlas is the HTML surface for the real game modules. Pure rules calculate the world;
            flow systems move the run through it; services keep the numbers honest.
          </p>
        </div>
        <div className="game-guide__systems-metrics" aria-label="System totals">
          <div className="game-guide__systems-metric">
            <strong>{SYSTEM_CATALOG.length}</strong>
            <span>game systems</span>
          </div>
          <div className="game-guide__systems-metric">
            <strong>5</strong>
            <span>subsystems</span>
          </div>
          <div className="game-guide__systems-metric">
            <strong>1</strong>
            <span>infinite loop</span>
          </div>
        </div>
      </section>

      <section className="game-guide__systems-flow" aria-label="Game system flow">
        <div className="game-guide__systems-flow-node game-guide__systems-flow-node--exploration">
          <Compass size={18} />
          <span>Explore</span>
          <small>Region → Location → Room</small>
        </div>
        <span className="game-guide__systems-flow-arrow">→</span>
        <div className="game-guide__systems-flow-node game-guide__systems-flow-node--combat">
          <Swords size={18} />
          <span>Resolve</span>
          <small>Approach → Cards → Turn</small>
        </div>
        <span className="game-guide__systems-flow-arrow">→</span>
        <div className="game-guide__systems-flow-node game-guide__systems-flow-node--economy">
          <Coins size={18} />
          <span>Rebuild</span>
          <small>Loot → Equip → Synthesize</small>
        </div>
        <span className="game-guide__systems-flow-arrow">↺</span>
        <div className="game-guide__systems-flow-node game-guide__systems-flow-node--progression">
          <Crown size={18} />
          <span>Ascend</span>
          <small>Level → Region → Tower</small>
        </div>
      </section>

      <section className="game-guide__systems-browser" aria-label="Browse game systems">
        <div className="game-guide__systems-toolbar">
          <label className="game-guide__systems-search">
            <span>Find a module</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. loot, posture, region..."
            />
          </label>
          <div className="game-guide__systems-filters" role="group" aria-label="Filter system area">
            {SYSTEM_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`game-guide__systems-filter ${activeFilter === filter ? 'game-guide__systems-filter--active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="game-guide__systems-result-line">
          <span>{visibleSystems.length} modules visible</span>
          <span className="game-guide__systems-result-line--hint">Pure rules stay React/DOM-free.</span>
        </div>

        {visibleSystems.length > 0 ? (
          <div className="game-guide__systems-grid">
            {visibleSystems.map((system) => {
              const Icon = system.icon;
              return (
                <article key={system.name} className={`game-guide__system-card game-guide__system-card--${system.area.toLowerCase()}`}>
                  <div className="game-guide__system-card-header">
                    <div className="game-guide__system-icon"><Icon size={18} /></div>
                    <span className="game-guide__system-area">{system.area}</span>
                    <span className={`game-guide__system-mode game-guide__system-mode--${system.mode.toLowerCase()}`}>{system.mode}</span>
                  </div>
                  <div className="game-guide__system-name">{system.name}</div>
                  <h4>{system.title}</h4>
                  <p>{system.summary}</p>
                  <ul>
                    {system.responsibilities.map((responsibility) => (
                      <li key={responsibility}>{responsibility}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="game-guide__systems-empty">
            <Workflow size={22} />
            <strong>No module matches that signal.</strong>
            <span>Try a system name, responsibility or another area.</span>
          </div>
        )}
      </section>
    </div>
  );
};

interface ElementNodeProps {
  icon: React.ReactNode;
  element: 'fire' | 'wind' | 'lightning' | 'earth' | 'water';
  label: string;
}

const ElementNode: React.FC<ElementNodeProps> = ({ icon, element, label }) => (
  <div className={`game-guide__element-node game-guide__element-node--${element}`}>
    {icon}
    <span className="game-guide__element-label">{label}</span>
  </div>
);

const ScrollIcon = () => (
  <svg className="game-guide__scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

export default GameGuide;
