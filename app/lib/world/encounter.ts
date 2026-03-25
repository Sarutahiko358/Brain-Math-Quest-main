/**
 * Encounter logic: pure functions for enemy selection and scaling
 * Extracted from page.tsx for world module refactoring
 */

import { Enemy, ENEMY_POOL, BOSS_POOL } from '../enemies';
import { Difficulty } from '../gameTypes';

/**
 * Check if random encounter should occur in an area
 * @param currentArea - Current area ID
 * @returns true if encounter should be rolled, false if disabled
 */
export function shouldRollEncounter(currentArea: number): boolean {
  // エリア7（四聖獣の試練）とエリア8（裏ボス）は通常エンカウントなし
  return currentArea < 7;
}

/**
 * Pick an enemy for random encounter in a given area
 * @param currentArea - Current area ID
 * @param pickFn - Random picker function (for DI/testing)
 * @returns Enemy or null if no enemy available
 */
export function pickEnemy(
  currentArea: number,
  pickFn: <T>(arr: T[]) => T | undefined
): Enemy | null {
  // Get available enemies for current area (exclude bosses)
  const pool = ENEMY_POOL;
  const available = pool.filter(e => (e.area === currentArea) && e.boss !== true);
  
  let enemy: Enemy | undefined;
  if (available.length > 0) {
    const picked = pickFn(available);
    if (picked) enemy = { ...picked };
  } else {
    // Fallback: if no enemies match current area, try any non-boss enemy
    const fallbackPool = pool.filter(e => e.boss !== true);
    const localFallback = fallbackPool.filter(e => e.area === currentArea || !('area' in e) || e.area == null);
    const pickedLocal = localFallback.length > 0 ? pickFn(localFallback) : undefined;
    const pickedAny = !pickedLocal ? (fallbackPool.length > 0 ? pickFn(fallbackPool) : undefined) : undefined;
    const picked = pickedLocal || pickedAny;
    if (picked) enemy = { ...picked };
  }
  
  return enemy || null;
}

/**
 * Scale enemy stats based on difficulty and location type
 * @param enemy - Enemy to scale (modifies in place)
 * @param difficulty - Difficulty setting
 * @param isCaveOrCastle - Whether encounter is in cave/castle (stronger enemies)
 */
export function scaleEnemy(
  enemy: Enemy,
  difficulty: Difficulty,
  isCaveOrCastle: boolean
): void {
  const dmul = difficulty === "easy" ? 0.9 : difficulty === "hard" ? 1.25 : 1.0;
  enemy.maxHP = Math.round(enemy.maxHP * dmul);
  enemy.hp = enemy.maxHP;
  enemy.atk = Math.round(enemy.atk * dmul + (isCaveOrCastle ? 2 : 0));
}

/**
 * Get available enemies for area (legacy helper for compatibility)
 * @param currentArea - Current area ID
 * @param isBoss - Whether to filter for boss enemies
 * @returns Array of matching enemies
 */
export function getAvailableEnemies(currentArea: number, isBoss: boolean): Enemy[] {
  const pool = isBoss ? BOSS_POOL : ENEMY_POOL;
  return pool.filter(e => (e.area === currentArea) && (isBoss ? e.boss === true : e.boss !== true));
}
