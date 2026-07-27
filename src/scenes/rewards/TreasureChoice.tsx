import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  TreasureActivity,
  TreasureHunt,
  TreasureType,
  Player,
  Rarity,
  RegionLootTheme,
  Item,
} from '../../game/types';
import {
  Lock,
  Eye,
  Swords,
  Dices,
  Sparkles,
  MapPin,
  Coins,
  Map,
  X,
  AlertTriangle,
  Package,
  Scroll,
  ShieldAlert,
} from 'lucide-react';
import { PendingBagFullItem } from '../../hooks/useTreasureHandlers';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import { getSellPrice } from '../../game/systems/LootSystem';
import { resolveItemArt } from '../../game/constants/artRegistry';
import {
  itemMatchesEquipmentFocus,
  isFocusStat,
} from '../../game/utils/itemFocusMatch';
import { LaunchProperties } from '../../config/featureFlags';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import ArtIcon from '../../components/shared/ArtIcon';
import { alignItemTileTooltip } from '../../utils/itemTileTooltip';
import './treasure.css';

interface TreasureChoiceProps {
  treasure: TreasureActivity;
  treasureHunt: TreasureHunt | null;
  player: Player;
  huntDeclined: boolean;
  onReveal: () => void;
  onSelectItem: (index: number) => void;
  onFightGuardian: () => void;
  onRollDice: () => void;
  onStartHunt: () => void;
  onDeclineHunt: () => void;
  pendingBagFullItem: PendingBagFullItem | null;
  onBagFullSell: () => void;
  onBagFullLeave: () => void;
  /** Stash pending relic after player frees a bag slot (sidebars stay open on TREASURE). */
  onBagFullStash?: () => void;
  getRarityColor: (rarity: Rarity) => string;
  /** Biome background image — replaces the solid-black backdrop. */
  background?: string;
  /**
   * T-092: region lootTheme already biases treasure drops (T-071); show Focus cues.
   */
  lootTheme?: RegionLootTheme | null;
  /** True while dice result modal is open — blocks another roll/fight. */
  diceRollPending?: boolean;
}

interface TreasureClaimResult {
  index: number;
  item: Item;
  isArtifact: boolean;
  ryoBonus: number;
}

const TreasureChoice: React.FC<TreasureChoiceProps> = ({
  treasure,
  treasureHunt,
  player,
  huntDeclined,
  onReveal,
  onSelectItem,
  onFightGuardian,
  onRollDice,
  onStartHunt,
  onDeclineHunt,
  pendingBagFullItem,
  onBagFullSell,
  onBagFullLeave,
  onBagFullStash,
  getRarityColor,
  background,
  lootTheme = null,
  diceRollPending = false,
}) => {
  const [claimResult, setClaimResult] = useState<TreasureClaimResult | null>(null);
  /**
   * Entrance fade for body (CSS defaults .treasure-scene__body to opacity: 0
   * until --visible). Without this, Sealed Vault showed only the title shell.
   */
  const [showContent, setShowContent] = useState(false);
  /**
   * Sync mutex — claimResult state lags one frame (Claim & Continue click + Enter
   * same tick). Handler also locks; this matches TreasureHuntReward W9 claimLock.
   */
  const claimConfirmLockRef = useRef(false);
  const canAffordReveal = player.currentChakra >= treasure.revealCost;
  const bagHasSpace = player.bag.some((slot) => slot === null);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 50);
    return () => clearTimeout(timer);
  }, [treasure.type, treasure.choices.length, huntDeclined]);

  // Dice odds from launch config (same values the roll uses)
  const diceOdds = LaunchProperties.TREASURE_DICE_ODDS;
  const diceOddsTotal = Math.max(1, diceOdds.trap + diceOdds.nothing + diceOdds.piece);
  const piecePct = Math.round((diceOdds.piece / diceOddsTotal) * 100);
  const nothingPct = Math.round((diceOdds.nothing / diceOddsTotal) * 100);
  const trapPct = Math.round((diceOdds.trap / diceOddsTotal) * 100);

  // One path only: fight or a single dice roll
  const canTakeMapPieceAction =
    treasure.mapPieceAvailable && !diceRollPending && !pendingBagFullItem;

  const requestSelectItem = useCallback(
    (index: number) => {
      if (index < 0 || index >= treasure.choices.length) return;
      if (!bagHasSpace) {
        onSelectItem(index);
        return;
      }
      // New preview → allow Claim & Continue again
      claimConfirmLockRef.current = false;
      const choice = treasure.choices[index];
      setClaimResult({
        index,
        item: choice.item,
        isArtifact: Boolean(choice.isArtifact),
        ryoBonus: treasure.ryoBonus,
      });
    },
    [treasure.choices, treasure.ryoBonus, bagHasSpace, onSelectItem],
  );

  const confirmClaim = useCallback(() => {
    if (!claimResult || claimConfirmLockRef.current) return;
    claimConfirmLockRef.current = true;
    const idx = claimResult.index;
    setClaimResult(null);
    onSelectItem(idx);
  }, [claimResult, onSelectItem]);

  // If hunt was declined, treat all treasures as locked chests
  const effectiveType = huntDeclined ? TreasureType.LOCKED_CHEST : treasure.type;
  const isLockedChest = effectiveType === TreasureType.LOCKED_CHEST;
  const isTreasureHunter = effectiveType === TreasureType.TREASURE_HUNTER;

  // Show initial prompt when: treasure is hunter type, no hunt active yet, and hunt not declined
  const showHuntPrompt = treasure.type === TreasureType.TREASURE_HUNTER && !treasureHunt && !huntDeclined;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.repeat) return;

      if (pendingBagFullItem) {
        if ((e.key === 't' || e.key === 'T') && bagHasSpace && onBagFullStash) {
          onBagFullStash();
          return;
        }
        if (e.key === 's' || e.key === 'S') { onBagFullSell(); return; }
        if (e.key === 'l' || e.key === 'L') { onBagFullLeave(); return; }
        return;
      }

      if (showHuntPrompt) {
        if (e.key === 'y' || e.key === 'Y') { onStartHunt(); return; }
        if (e.key === 'n' || e.key === 'N') { onDeclineHunt(); return; }
        return;
      }

      if (claimResult) {
        // Continue-family: Space / Enter / Escape claim (parity RewardModal / Rest)
        if (e.code === 'Space' || e.code === 'Enter' || e.key === 'Escape') {
          if (e.repeat) return;
          e.preventDefault();
          confirmClaim();
        }
        return;
      }

      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (treasure.isRevealed && idx < treasure.choices.length) {
          requestSelectItem(idx);
        }
      }

      // Gated on isLockedChest like the visible "Unseal All [R]" button and the Space/F/D keys —
      // on a Treasure Hunter chamber there is nothing to reveal, so an ungated R just burned chakra.
      if (e.key === 'r' || e.key === 'R') {
        if (isLockedChest && !treasure.isRevealed && canAffordReveal) {
          onReveal();
        }
      }

      if (e.code === 'Space' && !treasure.isRevealed && isLockedChest) {
        e.preventDefault();
        const randomIdx = Math.floor(Math.random() * treasure.choices.length);
        requestSelectItem(randomIdx);
      }

      if ((e.key === 'f' || e.key === 'F') && isTreasureHunter && canTakeMapPieceAction) {
        onFightGuardian();
      }

      if ((e.key === 'd' || e.key === 'D') && isTreasureHunter && canTakeMapPieceAction) {
        onRollDice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [treasure, canAffordReveal, onReveal, requestSelectItem, confirmClaim, claimResult, onFightGuardian, onRollDice, isLockedChest, isTreasureHunter, showHuntPrompt, onStartHunt, onDeclineHunt, pendingBagFullItem, onBagFullSell, onBagFullLeave, onBagFullStash, bagHasSpace, canTakeMapPieceAction]);

  const handlePickRandom = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * treasure.choices.length);
    requestSelectItem(randomIdx);
  }, [treasure.choices.length, requestSelectItem]);

  // Render a single treasure card
  const renderTreasureCard = (index: number) => {
    const choice = treasure.choices[index];
    const isRevealed = treasure.isRevealed;
    const item = choice.item;

    if (!isRevealed) {
      return (
        <button
          key={index}
          type="button"
          className="treasure-card treasure-card--hidden"
          onClick={() => requestSelectItem(index)}
        >
          <div className="treasure-card__frame" />
          <div className="treasure-card__corner treasure-card__corner--tl" />
          <div className="treasure-card__corner treasure-card__corner--tr" />
          <div className="treasure-card__corner treasure-card__corner--bl" />
          <div className="treasure-card__corner treasure-card__corner--br" />
          <span className="treasure-card__number">{index + 1}</span>
          <div className="treasure-card__mystery">
            <div className="treasure-card__lock-wrapper">
              <Lock className="treasure-card__lock-icon" />
            </div>
            <span className="treasure-card__mystery-symbol">?</span>
            <span className="treasure-card__mystery-label">Sealed Relic</span>
          </div>
        </button>
      );
    }

    const isFocusItem = itemMatchesEquipmentFocus(item, lootTheme?.equipmentFocus);
    return (
      <button
        key={index}
        type="button"
        className="treasure-card treasure-card--revealed item-tile"
        onClick={() => requestSelectItem(index)}
        onMouseEnter={(e) => alignItemTileTooltip(e.currentTarget)}
        onFocus={(e) => alignItemTileTooltip(e.currentTarget)}
      >
        <div className="item-tile__tooltip" role="tooltip">
          <div className={`item-tooltip__name ${getRarityColor(item.rarity)}`}>{item.name}</div>
          <div className="item-tooltip__type">
            {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
            {isFocusItem && <span className="treasure-tooltip__focus"> · Focus</span>}
          </div>
          {item.description && (
            <div className="item-tooltip__desc">{item.description}</div>
          )}
          <div className="item-tooltip__section">
            {Object.entries(item.stats).map(([key, val]) => (
              <div
                key={key}
                className={`item-tooltip__row ${isFocusStat(key, lootTheme?.equipmentFocus) ? 'item-tooltip__row--focus' : ''}`}
              >
                <span className="item-tooltip__label">
                  {formatStatName(key)}
                  {isFocusStat(key, lootTheme?.equipmentFocus) && (
                    <span className="item-tooltip__focus-mark"> ★</span>
                  )}
                </span>
                <span className="item-tooltip__value">+{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="treasure-card__frame" />
        <div className="treasure-card__corner treasure-card__corner--tl" />
        <div className="treasure-card__corner treasure-card__corner--tr" />
        <div className="treasure-card__corner treasure-card__corner--bl" />
        <div className="treasure-card__corner treasure-card__corner--br" />
        <span className="treasure-card__number">{index + 1}</span>

        {choice.isArtifact && (
          <div className="treasure-card__artifact-badge">
            <Sparkles size={20} />
          </div>
        )}
        {isFocusItem && (
          <span className="treasure-card__focus-badge" title="Matches region Focus stats">
            Focus
          </span>
        )}

        <div className="treasure-card__content">
          <span className="item-tile__visual" aria-hidden="true">
            <ArtIcon art={resolveItemArt(item)} size="fill" title={item.name} />
          </span>
          <span className={`treasure-card__item-name ${getRarityColor(item.rarity)}`}>
            {item.name}
          </span>
          <span className={`treasure-card__rarity ${getRarityColor(item.rarity)}`}>
            {item.rarity}
            {choice.isArtifact && <span className="treasure-card__artifact-star">★</span>}
          </span>
        </div>
      </button>
    );
  };

  // Render map progress
  const renderMapProgress = () => {
    if (!treasureHunt) return null;

    return (
      <div className="map-progress">
        <div className="map-progress__header">
          <span className="map-progress__title">
            <Scroll className="map-progress__title-icon" />
            Ninja Map Scroll
          </span>
          <span className="map-progress__count">
            {treasureHunt.collectedPieces}/{treasureHunt.requiredPieces} Seals Collected
          </span>
        </div>
        <div className="map-progress__pieces">
          {Array.from({ length: treasureHunt.requiredPieces }).map((_, i) => (
            <div
              key={i}
              className={`map-progress__piece ${
                i < treasureHunt.collectedPieces
                  ? 'map-progress__piece--collected'
                  : 'map-progress__piece--empty'
              }`}
            >
              <MapPin className="map-progress__piece-icon" />
            </div>
          ))}
        </div>
        {treasureHunt.collectedPieces === treasureHunt.requiredPieces && (
          <div className="map-progress__complete">
            ★ Scroll Complete! Claim Your Master Treasure!
          </div>
        )}
      </div>
    );
  };

  // Hunt initiation prompt — sober, atmospheric framing
  if (showHuntPrompt) {
    return (
      <SceneBackdrop background={background}>
        <div className="treasure-scene">
          <div className="treasure-scene__container">
            <div className="hunt-prompt">
              <div className="hunt-prompt__icon-wrapper">
                <Scroll className="hunt-prompt__icon" />
              </div>

              <h2 className="hunt-prompt__title">Sealed Map Scroll Discovered</h2>

              <p className="hunt-prompt__description">
                You have unearthed an ancient shinobi map scroll. Deciphering the scroll will track hidden relics across the chambers of this region.
              </p>

              <div className="hunt-prompt__card">
                <p className="hunt-prompt__card-text">
                  Decipher the map scroll to begin tracking?
                </p>
                <p className="hunt-prompt__card-hint">
                  Map chambers will appear along your path. Collect all seals through battle or intuition to unseal the master treasure.
                </p>
              </div>

              <div className="hunt-prompt__actions">
                <button
                  type="button"
                  className="treasure-btn treasure-btn--gold"
                  onClick={onStartHunt}
                >
                  <Scroll className="treasure-btn__icon" />
                  <span className="treasure-btn__label">Begin Map Track</span>
                  <span className="treasure-btn__hint">Track hidden relics</span>
                  <span className="treasure-btn__key">[Y]</span>
                </button>

                <button
                  type="button"
                  className="treasure-btn treasure-btn--neutral"
                  onClick={onDeclineHunt}
                >
                  <Package className="treasure-btn__icon" />
                  <span className="treasure-btn__label">Open Vault Now</span>
                  <span className="treasure-btn__hint">Claim immediate chest</span>
                  <span className="treasure-btn__key">[N]</span>
                </button>
              </div>

              <p className="hunt-prompt__note">
                Declining will convert treasure chambers into standard sealed vaults.
              </p>
            </div>
          </div>
        </div>
      </SceneBackdrop>
    );
  }

  // Main treasure UI
  return (
    <SceneBackdrop background={background}>
      <div className="treasure-scene">
        <div className="treasure-scene__container">
          <div className="treasure-scene__header">
            <h2 className="treasure-scene__title">
              {isLockedChest ? 'Sealed Vault' : 'Shinobi Relic Chamber'}
            </h2>
            <p className="treasure-scene__subtitle">
              {isLockedChest
                ? (treasure.isRevealed ? 'Select your claimed relic' : 'Unseal the vault or choose by instinct')
                : 'Collect map seals to unlock the master treasure'
              }
            </p>
            {lootTheme && (
              <div className="treasure-scene__theme" aria-label="Region loot theme">
                {lootTheme.primaryElement && (
                  <span className="treasure-scene__theme-chip treasure-scene__theme-chip--affinity">
                    Affinity {lootTheme.primaryElement}
                  </span>
                )}
                {lootTheme.equipmentFocus?.length > 0 && (
                  <span className="treasure-scene__theme-chip treasure-scene__theme-chip--focus">
                    Focus{' '}
                    {lootTheme.equipmentFocus
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(' · ')}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={`treasure-scene__body ${showContent ? 'treasure-scene__body--visible' : ''}`}>
            {/* Treasure Hunter: Map Progress */}
            {isTreasureHunter && renderMapProgress()}

            {/* Locked Chest: Item Grid */}
            {isLockedChest && (
              <>
                {treasure.choices.length === 0 ? (
                  <div className="treasure-scene__status-note" role="status">
                    The vault seals are blank — no relics generated. Leave and re-enter the chamber.
                  </div>
                ) : (
                <div className="treasure-grid">
                  {treasure.choices.map((_, index) => renderTreasureCard(index))}
                </div>
                )}

                {treasure.choices.length > 0 && !treasure.isRevealed && (
                  <div className="chest-actions">
                    <button
                      type="button"
                      className="treasure-btn treasure-btn--neutral"
                      onClick={handlePickRandom}
                    >
                      <Lock className="treasure-btn__icon" />
                      <span className="treasure-btn__label">Choose by Instinct</span>
                      <span className="treasure-btn__hint">Free · Trust intuition</span>
                      <span className="treasure-btn__key">[SPACE]</span>
                    </button>

                    <button
                      type="button"
                      className="treasure-btn treasure-btn--gold"
                      onClick={onReveal}
                      disabled={!canAffordReveal}
                    >
                      <Eye className="treasure-btn__icon" />
                      <span className="treasure-btn__label">Unseal All</span>
                      <span className="treasure-btn__hint">{treasure.revealCost} Chakra</span>
                      <span className="treasure-btn__key">[R]</span>
                    </button>
                  </div>
                )}

                {treasure.choices.length > 0 && !treasure.isRevealed && (
                  <div className="chest-actions__chakra-display">
                    Chakra Level:{' '}
                    <span className={`chest-actions__chakra-value${!canAffordReveal ? '--low' : ''}`}>
                      {player.currentChakra}
                    </span>
                    {!canAffordReveal && (
                      <span className="chest-actions__chakra-needed">
                        (Need {treasure.revealCost - player.currentChakra} more)
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Treasure Hunter: Guardian vs Dice Choice */}
            {isTreasureHunter && canTakeMapPieceAction && (
              <div className="guardian-choice">
                <div className="guardian-choice__header">
                  <h3 className="guardian-choice__title">Select Approach</h3>
                  <p className="guardian-choice__subtitle">
                    Confront the guardian directly or rely on shinobi intuition
                  </p>
                </div>

                <div className="guardian-choice__split">
                  <button
                    type="button"
                    className="guardian-choice__option guardian-choice__option--fight"
                    onClick={onFightGuardian}
                  >
                    <div className="guardian-choice__icon-wrapper">
                      <Swords className="guardian-choice__icon" />
                    </div>
                    <span className="guardian-choice__option-title">Confront Guardian</span>
                    <div className="guardian-choice__odds">
                      <span className="guardian-choice__odds-item guardian-choice__odds-item--success">
                        ✓ Guaranteed map seal
                      </span>
                    </div>
                    <span className="guardian-choice__key-hint">[F] key</span>
                  </button>

                  <button
                    type="button"
                    className="guardian-choice__option guardian-choice__option--dice"
                    onClick={onRollDice}
                  >
                    <div className="guardian-choice__icon-wrapper">
                      <Dices className="guardian-choice__icon" />
                    </div>
                    <span className="guardian-choice__option-title">Shinobi Intuition (Dice)</span>
                    <div className="guardian-choice__odds">
                      <span className="guardian-choice__odds-item guardian-choice__odds-item--success">
                        Map Seal ({piecePct}%)
                      </span>
                      <span className="guardian-choice__odds-item guardian-choice__odds-item--neutral">
                        Passage ({nothingPct}%)
                      </span>
                      <span className="guardian-choice__odds-item guardian-choice__odds-item--danger">
                        Trap ({trapPct}%)
                      </span>
                    </div>
                    <span className="guardian-choice__key-hint">[D] key</span>
                  </button>
                </div>
              </div>
            )}

            {isTreasureHunter && !canTakeMapPieceAction && (
              <div className="treasure-scene__status-note">
                {diceRollPending
                  ? 'Roll result pending…'
                  : treasure.mapPieceAvailable
                    ? 'Resolve bag full first…'
                    : 'Relic seal attempt used for this chamber.'}
              </div>
            )}

            {/* ryoBonus is granted with locked-chest item claim only — never show on hunter path */}

            {isLockedChest && treasure.isRevealed && !pendingBagFullItem && (
              <div className="keyboard-hints">
                [1-{treasure.choices.length}] Select relic
              </div>
            )}

            {pendingBagFullItem && (
              <div className="bag-full-panel">
                <div className="bag-full-panel__header">
                  <AlertTriangle className="bag-full-panel__warning-icon" />
                  <h3 className="bag-full-panel__title">Inventory Limit Reached</h3>
                </div>

                <div className="bag-full-panel__item">
                  <span className="item-tile__visual item-tile__visual--sm bag-full-panel__item-icon" aria-hidden="true">
                    <ArtIcon art={resolveItemArt(pendingBagFullItem.item)} size="fill" title={pendingBagFullItem.item.name} />
                  </span>
                  <span className={`bag-full-panel__item-name ${getRarityColor(pendingBagFullItem.item.rarity)}`}>
                    {pendingBagFullItem.item.name}
                  </span>
                </div>

                <p className="bag-full-panel__description">
                  {bagHasSpace
                    ? 'A pocket opened. Stash the relic — or sell it, or leave it behind.'
                    : 'Your ninja bag is full. Free a pocket in the bag, then stash — or sell / leave.'}
                </p>

                <div className="bag-full-panel__actions">
                  {bagHasSpace && onBagFullStash && (
                    <button
                      type="button"
                      className="treasure-btn treasure-btn--gold"
                      onClick={onBagFullStash}
                    >
                      <Package className="treasure-btn__icon" />
                      <span className="treasure-btn__label">Stash in Bag</span>
                      <span className="treasure-btn__hint">Take the relic</span>
                      <span className="treasure-btn__key">[T]</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`treasure-btn ${bagHasSpace ? 'treasure-btn--neutral' : 'treasure-btn--gold'}`}
                    onClick={onBagFullSell}
                  >
                    <Coins className="treasure-btn__icon" />
                    <span className="treasure-btn__label">Fence the Relic</span>
                    <span className="treasure-btn__hint">+{getSellPrice(pendingBagFullItem.item)} Ryo</span>
                    <span className="treasure-btn__key">[S]</span>
                  </button>

                  <button
                    type="button"
                    className="treasure-btn treasure-btn--neutral"
                    onClick={onBagFullLeave}
                  >
                    <Package className="treasure-btn__icon" />
                    <span className="treasure-btn__label">Leave Behind</span>
                    <span className="treasure-btn__hint">Discard relic</span>
                    <span className="treasure-btn__key">[L]</span>
                  </button>
                </div>
              </div>
            )}

            {claimResult && (
              <div className="treasure-claim" role="dialog" aria-modal="true" aria-label="Relic claimed">
                <div className="treasure-claim__panel">
                  <div className="treasure-claim__art item-tile__visual">
                    <ArtIcon art={resolveItemArt(claimResult.item)} size="fill" title={claimResult.item.name} />
                  </div>
                  <h3 className="treasure-claim__title">
                    {claimResult.isArtifact ? 'Artifact Unsealed' : 'Relic Acquired'}
                  </h3>
                  <p className={`treasure-claim__name ${getRarityColor(claimResult.item.rarity)}`}>
                    {claimResult.item.name}
                  </p>
                  <p className="treasure-claim__rarity">{claimResult.item.rarity}</p>
                  {claimResult.ryoBonus > 0 && (
                    <p className="treasure-claim__ryo">+{claimResult.ryoBonus} Ryō found in chamber</p>
                  )}
                  <button
                    type="button"
                    className="treasure-claim__continue"
                    onClick={confirmClaim}
                  >
                    Claim & Continue
                    <span className="treasure-btn__key">[Enter]</span>
                    <span className="treasure-btn__key">[Esc]</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SceneBackdrop>
  );
};

export default TreasureChoice;
