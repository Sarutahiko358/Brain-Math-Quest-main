/**
 * Encounter Adapter - S10 Step2: Thin facade for DQBrain encounter delegation
 * 
 * Purpose:
 * - Provide a cleaner interface for DQBrain's encounter logic
 * - Handle different game modes (normal, boss rush, endless)
 * - Delegate enemy selection and scaling to existing helpers
 * - Reduce duplication in DQBrain's startEncounter
 * 
 * Contract:
 * - Input: Game state (area, mode, floor), tile type, settings
 * - Output: Prepared enemy with stats or null if no encounter
 * - Side effects: None (pure preparation)
 * - Errors: Returns null if no enemy available
 */

import { Enemy, ENEMY_POOL, BOSS_POOL } from '../enemies';
import { Tile, T } from './areas';
import { scaleEnemy, getAvailableEnemies } from './encounter';
import { scaleStats } from './endless';
import type { Difficulty } from '../gameTypes';

/**
 * Context for encounter preparation
 */
export type EncounterContext = {
  currentArea: number;
  gameMode: 'story' | 'endless' | 'library';
  endlessFloor?: number;
  difficulty: Difficulty;
  tile: Tile;
  pickFn: (arr: Enemy[]) => Enemy | undefined; // For random enemy selection
};

/**
 * Result of encounter preparation
 */
export type EncounterResult = {
  enemy: Enemy;
  isBossRush: boolean;
  isEndless: boolean;
} | null;

/**
 * Select enemy for boss rush area (area 9)
 */
function selectBossRushEnemy(pickFn: (pool: Enemy[]) => Enemy | undefined): Enemy | undefined {
  const bossPool = BOSS_POOL.filter(b => b.name !== '九尾の麒麟');
  const picked = pickFn(bossPool);
  return picked ? { ...picked } : undefined;
}

/**
 * Select enemy for endless mode
 */
function selectEndlessEnemy(pickFn: (pool: Enemy[]) => Enemy | undefined): Enemy | undefined {
  const allEnemies = [...ENEMY_POOL, ...BOSS_POOL.filter(b => b.name !== '九尾の麒麟')];
  const picked = pickFn(allEnemies);
  return picked ? { ...picked } : undefined;
}

/**
 * Select enemy with fallback logic
 */
function selectNormalEnemy(
  currentArea: number,
  pickFn: (pool: Enemy[]) => Enemy | undefined
): Enemy | undefined {
  const availableEnemies = getAvailableEnemies(currentArea, false);

  if (availableEnemies.length > 0) {
    const picked = pickFn(availableEnemies);
    return picked ? { ...picked } : undefined;
  }

  // フォールバック: 現在エリアに該当する通常敵がいない場合（ボスは除外）
  const fallbackPool = ENEMY_POOL.filter(e => e.boss !== true);
  const localFallback = fallbackPool.filter(e => e.area === currentArea || !('area' in e) || e.area == null);
  const pickedLocal = localFallback.length > 0 ? pickFn(localFallback) : undefined;
  const pickedAny = !pickedLocal ? (fallbackPool.length > 0 ? pickFn(fallbackPool) : undefined) : undefined;
  const picked = pickedLocal || pickedAny;
  return picked ? { ...picked } : undefined;
}

/**
 * Apply scaling to enemy based on game mode
 */
function applyEnemyScaling(
  enemy: Enemy,
  isEndlessMode: boolean,
  endlessFloor: number | undefined,
  difficulty: Difficulty,
  isCave: boolean
): void {
  if (isEndlessMode) {
    const floor = endlessFloor || 1;
    // 無限の回廊の通常遭遇でボスキャラが雑魚として出現した場合は、フィールドボス補正(×1.4)を適用
    const asFieldBoss = !!enemy.boss;
    const base = scaleStats(floor, 'mob');
    const mul = asFieldBoss ? 1.4 : 1.0;
    const jitter = 0.9 + Math.random() * 0.2; // 0.9〜1.1
    enemy.maxHP = Math.round(base.maxHP * mul * jitter);
    enemy.hp = enemy.maxHP;
    enemy.atk = Math.round(base.atk * mul * jitter);
    // def, spdは内部計算用なのでEnemyオブジェクトには反映しない
  } else {
    // 通常モードでは難易度倍率を適用
    scaleEnemy(enemy, difficulty, isCave);
  }
}

/**
 * Prepare an enemy encounter based on game context
 * Pure function - performs enemy selection and stat scaling
 *
 * @param context - Game context for encounter
 * @returns EncounterResult with prepared enemy or null
 */
export function prepareEncounter(context: EncounterContext): EncounterResult {
  const { currentArea, gameMode, endlessFloor, difficulty, tile, pickFn } = context;

  // エリア9（ボスの間）では、通常エンカウントでボスのみが出現する
  const isBossRushArea = currentArea === 9;
  const isEndlessMode = gameMode === 'endless';
  const isCave = tile === T.Cave || tile === T.Castle;

  // Select enemy based on context
  let enemy: Enemy | undefined;
  if (isBossRushArea) {
    enemy = selectBossRushEnemy(pickFn);
  } else if (isEndlessMode) {
    enemy = selectEndlessEnemy(pickFn);
  } else {
    enemy = selectNormalEnemy(currentArea, pickFn);
  }

  if (!enemy) {
    // それでも選べない場合は遭遇をスキップ（安全策）
    return null;
  }

  // Apply scaling
  applyEnemyScaling(enemy, isEndlessMode, endlessFloor, difficulty, isCave);

  return {
    enemy,
    isBossRush: isBossRushArea,
    isEndless: isEndlessMode
  };
}
