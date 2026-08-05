import React, { useEffect, useState, useMemo } from 'react';
import {
  TreasureActivity,
  TreasureHunt,
  Player,
  Rarity,
  RegionLootTheme,
  VaultRewardOption,
  CharacterStats,
} from '../../game/types';
import {
  Lock,
  Coins,
  Heart,
  Scroll,
  Map,
  Sparkles,
  AlertTriangle,
  Eye,
  DoorOpen,
} from 'lucide-react';
import { PendingBagFullItem } from '../../hooks/useTreasureHandlers';
import { resolveItemArt, getSkillArt } from '../../game/constants/artRegistry';
import { itemMatchesEquipmentFocus } from '../../game/utils/itemFocusMatch';
import { SceneBackdrop } from '../../components/layout/SceneBackdrop';
import ArtIcon from '../../components/shared/ArtIcon';
import './treasure.css';

interface TreasureChoiceProps {
  treasure: TreasureActivity;
  treasureHunt: TreasureHunt | null;
  player: Player;
  playerStats?: CharacterStats | null;
  onOpenVault: () => void;
  onRevealFace: (index: number) => void;
  onPickOption: (index: number) => void;
  onTakeMapPiece: () => void;
  pendingBagFullItem: PendingBagFullItem | null;
  onBagFullSell: () => void;
  onBagFullLeave: () => void;
  onBagFullStash?: () => void;
  getRarityColor: (rarity: Rarity) => string;
  background?: string;
  lootTheme?: RegionLootTheme | null;
}

const VAULT_POSTER = {
  src: '/assets/posters/treasure_vault_poster.jpg',
  emoji: '🗝️',
  label: 'Sealed Vault',
};

function ensureVaultOptions(treasure: TreasureActivity): VaultRewardOption[] {
  if (treasure.vaultOptions?.length) return treasure.vaultOptions;
  return (treasure.choices ?? []).map((c) => ({
    kind: 'item' as const,
    revealed: treasure.isRevealed || treasure.phase === 'vault',
    item: c.item,
    isArtifact: c.isArtifact,
  }));
}

const faceLabel = (opt: VaultRewardOption): string => {
  switch (opt.kind) {
    case 'item':
      return opt.item?.name ?? 'Relic';
    case 'hp':
      return `Restore ${opt.hpAmount ?? 0} HP`;
    case 'ryo':
      return `${opt.ryoAmount ?? 0} Ryo`;
    case 'scroll':
      return opt.skill?.name ?? 'Scroll';
    default:
      return 'Unknown';
  }
};

const faceSub = (opt: VaultRewardOption): string => {
  switch (opt.kind) {
    case 'item':
      return opt.isArtifact ? 'Artifact' : (opt.item?.rarity ?? 'Gear');
    case 'hp':
      return 'Vital recovery';
    case 'ryo':
      return 'Purse fill';
    case 'scroll':
      return 'Jutsu scroll';
    default:
      return '';
  }
};

const TreasureChoice: React.FC<TreasureChoiceProps> = ({
  treasure,
  treasureHunt,
  player,
  playerStats = null,
  onOpenVault,
  onRevealFace,
  onPickOption,
  onTakeMapPiece,
  pendingBagFullItem,
  onBagFullSell,
  onBagFullLeave,
  onBagFullStash,
  background,
  lootTheme = null,
}) => {
  const [enter, setEnter] = useState(false);
  const bagHasSpace = player.bag.some((s) => s === null);
  const phase = treasure.phase ?? (treasure.isRevealed ? 'vault' : 'entry');
  const options = useMemo(() => ensureVaultOptions(treasure), [treasure]);
  const openCost = treasure.openCost ?? treasure.revealCost ?? 0;
  const revealCost = treasure.revealCost ?? 0;
  const canOpen = player.currentChakra >= openCost;
  const canReveal = player.currentChakra >= revealCost;
  const showMap = treasure.mapPieceAvailable && !treasure.collected;

  useEffect(() => {
    setEnter(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEnter(true));
    });
    return () => cancelAnimationFrame(id);
  }, [treasure.phase, treasure.isRevealed, treasure.collected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (pendingBagFullItem) {
        if ((e.key === 't' || e.key === 'T') && bagHasSpace && onBagFullStash) {
          onBagFullStash();
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          onBagFullLeave();
          return;
        }
        return;
      }

      if (phase === 'entry') {
        if (e.key === '1') {
          e.preventDefault();
          if (canOpen) onOpenVault();
        }
        if (e.key === '2' && showMap) {
          e.preventDefault();
          onTakeMapPiece();
        }
        return;
      }

      if (phase === 'vault') {
        if (e.key >= '1' && e.key <= '3') {
          const idx = parseInt(e.key, 10) - 1;
          if (idx >= options.length) return;
          e.preventDefault();
          const face = options[idx];
          if (!face.revealed) {
            if (canReveal) onRevealFace(idx);
          } else {
            onPickOption(idx);
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    phase, canOpen, canReveal, showMap, options, pendingBagFullItem, bagHasSpace,
    onOpenVault, onTakeMapPiece, onRevealFace, onPickOption, onBagFullSell,
    onBagFullLeave, onBagFullStash,
  ]);

  const posterTitle =
    phase === 'vault' ? 'Vault Open' : 'Sealed Vault';
  const posterBody =
    phase === 'vault'
      ? 'Unseal a face with chakra, then claim one reward.'
      : showMap
        ? 'Break the seals for mixed loot — or take a map fragment and walk.'
        : 'Break the seals. Three faces wait. Only one is yours.';

  return (
    <SceneBackdrop background={background} dim={0.22}>
      <div className="treasure-scene" role="region" aria-label="Treasure vault">
        {pendingBagFullItem && (
          <div className="treasure-bagfull" role="alertdialog" aria-label="Bag full">
            <div className="treasure-bagfull__panel">
              <AlertTriangle size={22} />
              <h3>Bag is full</h3>
              <p>
                No room for <strong>{pendingBagFullItem.item.name}</strong>.
              </p>
              <div className="treasure-bagfull__actions">
                {bagHasSpace && onBagFullStash && (
                  <button type="button" onClick={onBagFullStash}>
                    Stash [T]
                  </button>
                )}
                <button type="button" onClick={onBagFullLeave}>
                  Leave it [L]
                </button>
                <p className="treasure-bagfull__hint">
                  Free a bag slot (equip/discard) or leave the relic. Sell only at the merchant.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="treasure-scene__split">
          <aside className="treasure-scene__poster">
            <div className="treasure-scene__poster-frame">
              <div className="treasure-scene__poster-art">
                <ArtIcon art={VAULT_POSTER} size="fill" title="Sealed Vault" />
              </div>
              <div className="treasure-scene__poster-scrim" aria-hidden />
              <div className="treasure-scene__poster-copy">
                <span className="treasure-scene__plate-tag">Relic Chamber</span>
                <h1 className="treasure-scene__title">{posterTitle}</h1>
                <p className="treasure-scene__description">{posterBody}</p>
                {treasureHunt && treasureHunt.isActive && (
                  <p className="treasure-scene__hunt-meta">
                    Map {treasureHunt.collectedPieces}/{treasureHunt.requiredPieces}
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div className={`treasure-scene__decision ${enter ? 'treasure-scene__decision--enter' : ''}`}>
            <div className="treasure-scene__path-bar">
              <span className="treasure-scene__divider">
                {phase === 'entry' ? 'Choose path' : 'Choose reward'}
              </span>
              <span className="treasure-scene__cp">
                CP {Math.floor(player.currentChakra)}
                {playerStats ? `/${playerStats.derived.maxChakra}` : ''}
              </span>
            </div>

            {phase === 'entry' && (
              <div className="treasure-scene__choices" role="list">
                <button
                  type="button"
                  className={`treasure-choice treasure-choice--vault ${
                    !canOpen ? 'treasure-choice--locked' : ''
                  }`}
                  onClick={() => canOpen && onOpenVault()}
                  disabled={!canOpen}
                  role="listitem"
                >
                  <span className="treasure-choice__index">1</span>
                  <span className="treasure-choice__icon" aria-hidden>
                    <DoorOpen size={20} />
                  </span>
                  <span className="treasure-choice__body">
                    <span className="treasure-choice__label">Open the Vault</span>
                    <span className="treasure-choice__desc">
                      {openCost > 0
                        ? `Spend ${openCost} chakra · 3 sealed rewards · pick one`
                        : 'Free open · 3 rewards · pick one'}
                    </span>
                  </span>
                  {openCost > 0 && (
                    <span className={`treasure-choice__cost ${canOpen ? '' : 'is-short'}`}>
                      {openCost} CP
                    </span>
                  )}
                </button>

                {showMap && (
                  <button
                    type="button"
                    className="treasure-choice treasure-choice--map"
                    onClick={onTakeMapPiece}
                    role="listitem"
                  >
                    <span className="treasure-choice__index">2</span>
                    <span className="treasure-choice__icon" aria-hidden>
                      <Map size={20} />
                    </span>
                    <span className="treasure-choice__body">
                      <span className="treasure-choice__label">Take Map Piece</span>
                      <span className="treasure-choice__desc">
                        Free · skip vault loot · advances the map hunt
                      </span>
                    </span>
                    <span className="treasure-choice__cost treasure-choice__cost--free">Free</span>
                  </button>
                )}
              </div>
            )}

            {phase === 'vault' && (
              <div className="treasure-scene__faces" role="list">
                {options.map((opt, idx) => {
                  const isFocus =
                    opt.kind === 'item' &&
                    opt.item &&
                    itemMatchesEquipmentFocus(opt.item, lootTheme?.equipmentFocus);
                  return (
                    <div
                      key={idx}
                      className={`treasure-face ${
                        opt.revealed ? 'treasure-face--open' : 'treasure-face--sealed'
                      }`}
                      role="listitem"
                      style={{ ['--face-stagger' as string]: String(idx) }}
                    >
                      <span className="treasure-face__index">{idx + 1}</span>
                      {!opt.revealed ? (
                        <button
                          type="button"
                          className="treasure-face__card treasure-face__card--sealed"
                          onClick={() => canReveal && onRevealFace(idx)}
                          disabled={!canReveal}
                        >
                          <Lock size={28} />
                          <span className="treasure-face__sealed-label">Sealed</span>
                          <span className={`treasure-face__reveal ${canReveal ? '' : 'is-short'}`}>
                            <Eye size={14} /> Unseal · {revealCost} CP
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="treasure-face__card treasure-face__card--open"
                          onClick={() => onPickOption(idx)}
                        >
                          <span className="treasure-face__art" aria-hidden>
                            {opt.kind === 'item' && opt.item && (
                              <ArtIcon art={resolveItemArt(opt.item)} size="fill" title={opt.item.name} />
                            )}
                            {opt.kind === 'hp' && <Heart size={32} />}
                            {opt.kind === 'ryo' && <Coins size={32} />}
                            {opt.kind === 'scroll' && opt.skill && (
                              <ArtIcon art={getSkillArt(opt.skill)} size="fill" title={opt.skill.name} />
                            )}
                            {opt.kind === 'scroll' && !opt.skill && <Scroll size={32} />}
                          </span>
                          <span className="treasure-face__name">{faceLabel(opt)}</span>
                          <span className="treasure-face__sub">
                            {faceSub(opt)}
                            {isFocus ? ' · Focus' : ''}
                          </span>
                          <span className="treasure-face__claim">
                            <Sparkles size={14} /> Claim
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {phase === 'vault' && (
              <p className="treasure-scene__hint">
                Unseal a face [{revealCost} CP] · Claim with 1–3 · only one reward
              </p>
            )}
            {phase === 'entry' && (
              <p className="treasure-scene__hint">
                [1] Open vault{showMap ? ' · [2] Map piece' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </SceneBackdrop>
  );
};

export default TreasureChoice;
