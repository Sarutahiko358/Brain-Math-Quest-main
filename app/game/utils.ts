/**
 * DQBrain Utility Functions
 * 
 * Pure utility functions extracted from DQBrain.tsx.
 * These functions have no side effects and don't depend on React state or JSX.
 */

import { Player, Weapon, Armor, GameMode } from '../lib/gameTypes';
import { Tile, T, AreaInfo } from '../lib/world/areas';
import { LIBRARY_AREAS } from '../lib/world/areasLibrary';
import { INN_PRICE, WEAPONS, ARMORS } from '../lib/equipment';
import { DexData, EquipDexState, BrainOnlyRecord } from './types';
import { ENEMY_POOL, BOSS_POOL } from '../lib/enemies';

/**
 * Calculate the cost to heal at an inn based on player level.
 * Cost increases with level up to a maximum of 60G.
 * 
 * @param p - Player object with level information
 * @returns Cost in gold to stay at the inn
 */
export function healAtInnCost(p: Player): number {
  return Math.min(INN_PRICE + Math.max(0, (p.lv - 1) * 2), 60);
}

/**
 * Convert a tile type to its emoji representation for display.
 * 
 * @param t - Tile type from the game map
 * @returns Emoji string representing the tile
 */
export function tileEmoji(t: Tile): string {
  return t === T.Grass
    ? "🟩"
    : t === T.Wall
      ? "🪨"
      : t === T.Water
        ? "🟦"
        : t === T.Town
          ? "🏘️"
          : t === T.Cave
            ? "🕳️"
            : "🏰";
}

/**
 * Calculate the shop assortment based on player progress.
 * Returns available weapons and armors for purchase.
 * 
 * @param currentArea - The current area/stage number (1-10)
 * @param endlessFloor - The current floor in endless mode (optional)
 * @param _ultimateUnlocked - Whether ultimate equipment is unlocked (currently unused for completion support)
 * @returns Object containing available weapons and armors arrays
 */
export function getShopAssortment(
  currentArea: number,
  endlessFloor: number | undefined,
  _ultimateUnlocked: boolean
): { weapons: Weapon[]; armors: Armor[] } {
  // コンプリート対応: ultimateUnlocked時も全装備を購入可能にする
  if (currentArea === 10) {
    // Endless: 1階層ごとに1つずつ増える
    const floor = endlessFloor || 1;
    const maxIdx = Math.min(WEAPONS.length, Math.max(2, 1 + floor));
    const maxArmorIdx = Math.min(ARMORS.length, Math.max(2, 1 + floor));
    return { weapons: WEAPONS.slice(0, maxIdx), armors: ARMORS.slice(0, maxArmorIdx) };
  }
  // Story: インデックス上限: ステージ番号+1程度をベースに、最大は全アイテム
  const isFull = currentArea >= 6;
  const maxIdx = isFull ? WEAPONS.length : Math.min(WEAPONS.length, Math.max(2, currentArea + 1));
  const maxArmorIdx = isFull ? ARMORS.length : Math.min(ARMORS.length, Math.max(2, currentArea + 1));
  return {
    weapons: WEAPONS.slice(0, maxIdx),
    armors: ARMORS.slice(0, maxArmorIdx),
  };
}

/**
 * Create an updater function that records an enemy as seen in the dex.
 * Pure function that returns a dex updater.
 * 
 * @param name - Enemy name to record
 * @returns Updater function for dex data
 */
export function createSeenUpdater(name: string): (d: DexData) => DexData {
  return (d: DexData) => ({
    ...d,
    [name]: {
      seen: (d[name]?.seen || 0) + 1,
      defeated: d[name]?.defeated || 0
    }
  });
}

/**
 * Create an updater function that records an enemy as defeated in the dex.
 * Pure function that returns a dex updater.
 * 
 * @param name - Enemy name to record
 * @returns Updater function for dex data
 */
export function createDefeatedUpdater(name: string): (d: DexData) => DexData {
  return (d: DexData) => ({
    ...d,
    [name]: {
      seen: d[name]?.seen || 0,
      defeated: (d[name]?.defeated || 0) + 1
    }
  });
}

/**
 * Create an updater function that adds equipment to the equipment dex.
 * Pure function that returns an equip dex updater.
 * 
 * @param kind - Equipment type ('weapon' or 'armor')
 * @param name - Equipment name to add
 * @returns Updater function for equip dex
 */
export function createEquipDexUpdater(
  kind: 'weapon' | 'armor',
  name: string
): (ed: EquipDexState) => EquipDexState {
  if (kind === 'weapon') {
    return (ed: EquipDexState) =>
      ed.weapons.includes(name) ? ed : { ...ed, weapons: [...ed.weapons, name] };
  } else {
    return (ed: EquipDexState) =>
      ed.armors.includes(name) ? ed : { ...ed, armors: [...ed.armors, name] };
  }
}

/**
 * Build CSS background style properties for battle panel.
 * Pure function that constructs layered background with images and gradient.
 * 
 * @param bgImages - Array of background image URLs (empty for gradient-only)
 * @param gradient - CSS gradient string
 * @returns Object with backgroundImage, backgroundSize, backgroundRepeat, backgroundPosition
 */
export function buildBattleBackgroundStyle(
  bgImages: string[],
  gradient: string
): {
  backgroundImage: string;
  backgroundSize: string;
  backgroundRepeat: string;
  backgroundPosition: string;
} {
  if (bgImages.length > 0) {
    const imageUrls = bgImages.map(u => `url(${u})`).join(', ');
    const fills = Array(bgImages.length).fill('cover').join(', ');
    const repeats = Array(bgImages.length).fill('no-repeat').join(', ');
    const positions = Array(bgImages.length).fill('center').join(', ');

    return {
      backgroundImage: `${imageUrls}, ${gradient}`,
      backgroundSize: `${fills}, cover`,
      backgroundRepeat: `${repeats}, no-repeat`,
      backgroundPosition: `${positions}, center`,
    };
  } else {
    return {
      backgroundImage: gradient,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    };
  }
}

/**
 * Calculate enemy statistics from dex data
 */
function calculateEnemyStats(activeDex: DexData, gameMode: GameMode) {
  // モード別の母数を選定
  const isLibrary = gameMode === 'library';
  const libraryBosses = BOSS_POOL.filter(b => b.imageUrl.startsWith('/images/enemies/lib/'));

  const bossesPool = isLibrary ? libraryBosses : BOSS_POOL;
  // フィールド敵は現状ライブラリでも共通プールを使用
  const enemiesPool = ENEMY_POOL;

  const allEnemies = [...enemiesPool, ...bossesPool];
  const totalBosses = bossesPool.length;
  const totalEnemies = allEnemies.length;

  const defeatedBosses = bossesPool.filter(
    b => (activeDex[b.name]?.defeated || 0) > 0
  ).length;

  const encounteredEnemies = allEnemies.filter(
    e => (activeDex[e.name]?.seen || 0) > 0
  ).length;

  const defeatedEnemies = allEnemies.filter(
    e => (activeDex[e.name]?.defeated || 0) > 0
  ).length;

  return {
    totalBosses,
    defeatedBosses,
    totalEnemies,
    encounteredEnemies,
    defeatedEnemies
  };
}

/**
 * Calculate area progression
 */
function calculateAreaProgress(player: Player, gameMode: GameMode) {
  if (gameMode === 'endless') {
    return {
      clearedAreas: (player.endlessFloor || 1) - 1,
      mainlineAreas: '∞' as const
    };
  }

  if (gameMode === 'library') {
    const mainlineCount = LIBRARY_AREAS.filter(a => a.mainline).length;
    return {
      clearedAreas: player.clearedAreas.length,
      mainlineAreas: mainlineCount
    };
  }

  // story
  return {
    clearedAreas: player.clearedAreas.length,
    mainlineAreas: 9
  };
}

/**
 * Calculate completion percentage
 */
function calculateCompletionPercentage(
  stats: {
    defeatedBosses: number;
    totalBosses: number;
    encounteredEnemies: number;
    defeatedEnemies: number;
    totalEnemies: number;
    clearedAreas: number;
    mainlineAreas: number | '∞';
  },
  gameMode: GameMode
): number {
  const { defeatedBosses, totalBosses, encounteredEnemies, defeatedEnemies, totalEnemies, clearedAreas, mainlineAreas } = stats;

  const pctBoss = totalBosses > 0 ? defeatedBosses / totalBosses : 0;
  const pctSeen = totalEnemies > 0 ? encounteredEnemies / totalEnemies : 0;
  const pctDefeated = totalEnemies > 0 ? defeatedEnemies / totalEnemies : 0;

  if (gameMode === 'endless') {
    return Math.min(100, Math.round(((pctBoss + pctSeen + pctDefeated) / 3) * 100));
  }

  const pctAreas = typeof mainlineAreas === 'number' && mainlineAreas > 0
    ? clearedAreas / mainlineAreas
    : 0;

  return Math.min(100, Math.round(((pctBoss + pctAreas + pctSeen + pctDefeated) / 4) * 100));
}

/**
 * Calculate completion flags
 */
function calculateCompletionFlags(
  stats: {
    defeatedBosses: number;
    totalBosses: number;
    encounteredEnemies: number;
    defeatedEnemies: number;
    totalEnemies: number;
    clearedAreas: number;
    mainlineAreas: number | '∞';
  },
  gameMode: GameMode
) {
  const { defeatedBosses, totalBosses, encounteredEnemies, defeatedEnemies, totalEnemies, clearedAreas, mainlineAreas } = stats;

  const bossesDone = defeatedBosses >= totalBosses;
  const areasDone = typeof mainlineAreas === 'number' && clearedAreas >= mainlineAreas;
  const seenDone = encounteredEnemies >= totalEnemies;
  const defeatedDone = defeatedEnemies >= totalEnemies;

  const allDone = gameMode === 'endless'
    ? bossesDone && seenDone && defeatedDone
    : bossesDone && areasDone && seenDone && defeatedDone;

  return { bossesDone, areasDone, seenDone, defeatedDone, allDone };
}

/**
 * Compute completion statistics for the menu achievement status display.
 * Aggregates boss defeats, area clears, dex progress, and overall completion.
 * Handles both story and endless game modes with appropriate calculations.
 *
 * @param params - Object containing player, gameMode, dexStory, and dexEndless
 * @returns Object with completion statistics including percentages and flags
 */
export function computeCompletionStats(params: {
  player: Player;
  gameMode: GameMode;
  dexStory: DexData;
  dexEndless: DexData;
}): {
  defeatedBosses: number;
  totalBosses: number;
  encounteredEnemies: number;
  defeatedEnemies: number;
  totalEnemies: number;
  clearedAreas: number;
  mainlineAreas: number | '∞';
  completion: number;
  bossesDone: boolean;
  areasDone: boolean;
  seenDone: boolean;
  defeatedDone: boolean;
  allDone: boolean;
} {
  const { player, gameMode, dexStory, dexEndless } = params;
  const activeDex = gameMode === 'endless' ? dexEndless : dexStory;

  const enemyStats = calculateEnemyStats(activeDex, gameMode);
  const areaProgress = calculateAreaProgress(player, gameMode);

  const allStats = { ...enemyStats, ...areaProgress };
  const completion = calculateCompletionPercentage(allStats, gameMode);
  const flags = calculateCompletionFlags(allStats, gameMode);

  return {
    ...allStats,
    completion,
    ...flags
  };
}

/**
 * Pick the fastest and slowest records from an array of Brain-only records.
 * Uses stable sort to handle ties consistently (first occurrence wins).
 * 
 * @param records - Array of Brain-only records with time and result data
 * @returns Object with fastest and slowest records, or null if array is empty
 */
export function pickFastestAndSlowest(
  records: BrainOnlyRecord[]
): { fastest: BrainOnlyRecord; slowest: BrainOnlyRecord } | null {
  if (records.length === 0) return null;

  // Sort creates new array, preserves original
  const fastest = [...records].sort((a, b) => a.time - b.time)[0];
  const slowest = [...records].sort((a, b) => b.time - a.time)[0];

  return { fastest, slowest };
}

/**
 * Summarize Brain-only records by quiz type.
 * Groups records and calculates count, correct answers, average time, and success rate per type.
 * 
 * @param records - Array of Brain-only records
 * @returns Array of type summaries with statistics
 */
export function summarizeByType(
  records: BrainOnlyRecord[]
): Array<{ type: string; count: number; correct: number; avgTime: number; rate: number }> {
  if (records.length === 0) return [];

  const types = Array.from(new Set(records.map(r => r.type || '-')));

  return types.map(t => {
    const rows = records.filter(r => (r.type || '-') === t);
    const total = rows.length;
    const ok = rows.filter(r => r.ok).length;
    const avgTime = rows.reduce((s, r) => s + r.time, 0) / total;
    const rate = total > 0 ? Math.round(ok / total * 100) : 0;

    return { type: t, count: total, correct: ok, avgTime, rate };
  });
}

/**
 * Get the area clear banner state for map display.
 * Determines if the player is in a boss room, has cleared the area, or needs to clear it.
 * 
 * @param params - Object containing player, currentAreaInfo, and currentDex
 * @returns Object with banner state and boss name
 */
export function getAreaClearBannerState(params: {
  player: Player;
  currentAreaInfo: AreaInfo;
  currentDex: DexData;
}): { state: 'bossRoom' | 'cleared' | 'target'; bossName: string } {
  const { player, currentAreaInfo, currentDex } = params;
  const bossName = currentAreaInfo.bossName;

  if (player.currentArea === 9) {
    return { state: 'bossRoom', bossName };
  }

  if (currentDex[bossName]?.defeated > 0) {
    return { state: 'cleared', bossName };
  }

  return { state: 'target', bossName };
}
