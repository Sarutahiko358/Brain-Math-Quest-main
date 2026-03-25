/**
 * Battle Condition Checkers
 *
 * Pure functions for checking battle-related conditions
 * Extracted to improve code clarity and testability
 */

import { Player, BattleState } from '../gameTypes';

/**
 * Check if player is defeated (game over condition)
 * @param player - Player state
 * @returns true if player HP is 0 or less
 */
export function isGameOver(player: Player): boolean {
  return player.hp <= 0;
}

/**
 * Check if battle has rewards
 * @param battle - Battle state (can be null)
 * @returns true if battle exists and has rewards
 */
export function hasRewards(battle: BattleState | null): boolean {
  return !!(battle?.rewards);
}

/**
 * Check if rewards include items
 * @param battle - Battle state (can be null)
 * @returns true if battle has items in rewards
 */
export function hasRewardItems(battle: BattleState | null): boolean {
  return !!(battle?.rewards?.items && battle.rewards.items.length > 0);
}

/**
 * Check if rewards include time bonus
 * @param battle - Battle state (can be null)
 * @returns true if battle has positive time bonus
 */
export function hasTimeBonus(battle: BattleState | null): boolean {
  return !!(battle?.rewards?.timeBonus && battle.rewards.timeBonus > 0);
}

/**
 * Check if rewards include level up
 * @param battle - Battle state (can be null)
 * @returns true if battle has level up in rewards
 */
export function hasLevelUp(battle: BattleState | null): boolean {
  return !!(battle?.rewards?.levelUp);
}
