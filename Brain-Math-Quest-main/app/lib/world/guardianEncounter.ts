/**
 * Guardian encounter utilities: functions for setting up four guardians battles
 * Extracted from DQBrain.tsx for S7 refactoring
 */

import { Enemy, BOSS_POOL } from '../enemies';
import { Difficulty } from '../gameTypes';

/**
 * Guardian names in the game
 */
export const GUARDIAN_NAMES = {
  GENBU: '玄武',
  SEIRYU: '青龍',
  SUZAKU: '朱雀',
  BYAKKO: '白虎',
} as const;

/**
 * Guardian rewards (key items)
 */
export const GUARDIAN_REWARDS = {
  GENBU: '守護の黒水鉱',
  SEIRYU: '繁盛の青木宝',
  SUZAKU: '隆盛の朱火玉',
  BYAKKO: '繁栄の白金石',
} as const;

/**
 * Scale guardian stats based on difficulty
 * @param enemy - Guardian enemy to scale
 * @param difficulty - Difficulty setting
 * @returns Scaled enemy stats
 */
export function scaleGuardianStats(
  enemy: Enemy,
  difficulty: Difficulty
): { maxHP: number; hp: number; atk: number; renderSize: number } {
  const dmul = difficulty === "easy" ? 0.9 : difficulty === "hard" ? 1.25 : 1.0;
  const maxHP = Math.round(enemy.maxHP * dmul);
  const hp = maxHP;
  const atk = Math.round(enemy.atk * dmul);
  const baseSize = enemy.renderSize || 160;
  const renderSize = Math.round(baseSize * 1.5);
  
  return { maxHP, hp, atk, renderSize };
}

/**
 * Prepare guardian enemy for battle
 * @param guardianName - Name of the guardian (玄武, 青龍, etc.)
 * @param difficulty - Difficulty setting
 * @returns Prepared enemy or null if not found
 */
export function prepareGuardianEnemy(
  guardianName: string,
  difficulty: Difficulty
): Enemy | null {
  const boss = BOSS_POOL.find(b => b.name === guardianName);
  if (!boss) return null;
  
  const enemy = { ...boss };
  const scaled = scaleGuardianStats(enemy, difficulty);
  
  enemy.maxHP = scaled.maxHP;
  enemy.hp = scaled.hp;
  enemy.atk = scaled.atk;
  enemy.renderSize = scaled.renderSize;
  
  return enemy;
}

/**
 * Get guardian reward name by guardian name
 * @param guardianName - Name of the guardian
 * @returns Reward name or null if not found
 */
export function getGuardianReward(guardianName: string): string | null {
  switch (guardianName) {
    case GUARDIAN_NAMES.GENBU:
      return GUARDIAN_REWARDS.GENBU;
    case GUARDIAN_NAMES.SEIRYU:
      return GUARDIAN_REWARDS.SEIRYU;
    case GUARDIAN_NAMES.SUZAKU:
      return GUARDIAN_REWARDS.SUZAKU;
    case GUARDIAN_NAMES.BYAKKO:
      return GUARDIAN_REWARDS.BYAKKO;
    default:
      return null;
  }
}

/**
 * Check if all four guardians have been defeated
 * @param flags - Player flags
 * @returns true if all four guardians are defeated
 */
export function allGuardiansDefeated(flags: {
  genbuDefeated?: boolean;
  seiryuDefeated?: boolean;
  suzakuDefeated?: boolean;
  byakkoDefeated?: boolean;
}): boolean {
  return !!(
    flags.genbuDefeated &&
    flags.seiryuDefeated &&
    flags.suzakuDefeated &&
    flags.byakkoDefeated
  );
}
