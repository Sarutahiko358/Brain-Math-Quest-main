import React from 'react';
import { Player } from '../../lib/gameTypes';
import { Tile, COLS, GUARDIANS_A7 } from '../../lib/world/areas';
import { BOSS_POOL } from '../../lib/enemies';
import { DexData } from '../types';
import { tileEmoji } from '../utils';

interface MapGridProps {
  currentMap: Tile[][];
  player: Player;
  settings: { tileSize: number };
  currentAreaInfo: {
    bossPos: { r: number; c: number };
    bossName: string;
    dojoPos?: { r: number; c: number } | null;
  };
  currentDex: DexData;
}

/**
 * Checks if all four sacred beasts are defeated
 */
function areAllBeastsDefeated(flags: Player['flags']): boolean {
  const f = flags || {};
  return !!f.genbuDefeated && !!f.seiryuDefeated && !!f.suzakuDefeated && !!f.byakkoDefeated;
}

/**
 * Determines if boss should be displayed at given position
 */
function shouldShowBoss(
  r: number,
  c: number,
  player: Player,
  currentAreaInfo: MapGridProps['currentAreaInfo'],
  currentDex: DexData,
  allBeastsDefeated: boolean
): boolean {
  const atBossPos = currentAreaInfo.bossPos.r === r && currentAreaInfo.bossPos.c === c;

  if (player.currentArea === 7 || player.currentArea === 9) {
    return atBossPos && allBeastsDefeated;
  }

  return atBossPos && !(currentDex[currentAreaInfo.bossName]?.defeated > 0);
}

/**
 * Guardian definitions for Area 7
 */
const GUARDIAN_DEFINITIONS = [
  { name: 'genbu' as keyof typeof GUARDIANS_A7, emoji: "🐢", flag: 'genbuDefeated' as const },
  { name: 'seiryu' as keyof typeof GUARDIANS_A7, emoji: "🐉", flag: 'seiryuDefeated' as const },
  { name: 'suzaku' as keyof typeof GUARDIANS_A7, emoji: "🕊️", flag: 'suzakuDefeated' as const },
  { name: 'byakko' as keyof typeof GUARDIANS_A7, emoji: "🐯", flag: 'byakkoDefeated' as const },
];

/**
 * Checks if position matches guardian location and is not defeated
 */
function matchesGuardian(
  r: number,
  c: number,
  guardian: typeof GUARDIAN_DEFINITIONS[0],
  flags: Player['flags']
): boolean {
  const pos = GUARDIANS_A7[guardian.name];
  const isDefeated = flags?.[guardian.flag] || false;
  return r === pos.r && c === pos.c && !isDefeated;
}

/**
 * Gets guardian emoji for Area 7 positions
 */
function getGuardianEmoji(
  r: number,
  c: number,
  currentArea: number,
  flags: Player['flags']
): string | null {
  if (currentArea !== 7) return null;

  for (const guardian of GUARDIAN_DEFINITIONS) {
    if (matchesGuardian(r, c, guardian, flags)) {
      return guardian.emoji;
    }
  }

  return null;
}

/**
 * Checks if position is the dojo
 */
function isDojoPosition(
  r: number,
  c: number,
  dojoPos: { r: number; c: number } | null | undefined
): boolean {
  return !!dojoPos && r === dojoPos.r && c === dojoPos.c;
}

/**
 * Renders a single map cell
 */
function renderMapCell(
  r: number,
  c: number,
  tile: Tile,
  props: {
    player: Player;
    currentAreaInfo: MapGridProps['currentAreaInfo'];
    currentDex: DexData;
    allBeastsDefeated: boolean;
  }
): JSX.Element {
  const { player, currentAreaInfo, currentDex, allBeastsDefeated } = props;
  const isPlayerPos = player.pos.r === r && player.pos.c === c;
  const isBoss = shouldShowBoss(r, c, player, currentAreaInfo, currentDex, allBeastsDefeated);
  const bossEmoji = BOSS_POOL.find(b => b.name === currentAreaInfo.bossName)?.emoji || "👑";
  const guardianEmoji = getGuardianEmoji(r, c, player.currentArea, player.flags);
  const isDojo = isDojoPosition(r, c, currentAreaInfo.dojoPos);

  return (
    <div className="cell" key={`${r}-${c}`}>
      <div className="tile">{tileEmoji(tile)}</div>
      {guardianEmoji && (
        <div className="ply" title="四聖獣の試練地点" style={{ fontSize: '18px', filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.7))', animation: 'pulse 2s infinite' }}>
          {guardianEmoji}
        </div>
      )}
      {isDojo && (
        <div className="ply" title="道場（コンボ練習）" style={{ fontSize: '18px', filter: 'drop-shadow(0 0 2px rgba(255,215,0,0.7))', animation: 'pulse 2s infinite' }}>
          🥋
        </div>
      )}
      {isBoss && <div className="ply" title="祝福の間" style={{ fontSize: '24px', animation: 'pulse 2s infinite' }}>{bossEmoji}</div>}
      {isPlayerPos && <div className="ply">{player.avatar}</div>}
    </div>
  );
}

export default function MapGrid({ currentMap, player, settings, currentAreaInfo, currentDex }: MapGridProps) {
  const allBeastsDefeated = areAllBeastsDefeated(player.flags);

  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, ${settings.tileSize}px)` }}>
      {currentMap.flatMap((row, r) =>
        row.map((tile, c) =>
          renderMapCell(r, c, tile, { player, currentAreaInfo, currentDex, allBeastsDefeated })
        )
      )}
    </div>
  );
}
