/**
 * Enemy image filter utilities
 * Extracts complex conditional filter logic for better maintainability
 */

import { Enemy } from '../../lib/enemies';

/**
 * Get CSS filter style for specific enemy types
 * Reduces inline conditional complexity in EncounterView
 */
export function getEnemyImageFilter(enemyName: string): React.CSSProperties {
  // Guardian enemies (玄武, 青龍, 朱雀, 白虎)
  if (enemyName === '玄武' || enemyName === '青龍' || enemyName === '朱雀' || enemyName === '白虎') {
    return {
      filter: 'drop-shadow(0 0 6px rgba(255,255,220,0.6)) saturate(1.06) brightness(1.05)'
    };
  }

  // Void King (虚空の王)
  if (enemyName === '虚空の王') {
    return {
      filter: 'drop-shadow(0 0 6px rgba(60,60,100,0.6)) brightness(0.88) saturate(0.92) contrast(1.06)'
    };
  }

  // Nine-tailed Kirin (九尾の麒麟)
  if (enemyName === '九尾の麒麟') {
    return {
      filter: 'drop-shadow(0 0 10px rgba(255, 209, 102, 0.7)) saturate(1.08) brightness(1.06) contrast(1.04)'
    };
  }

  // Default: no filter
  return {};
}

/**
 * Calculate enemy image dimensions with multiplier
 */
export function getEnemyImageSize(enemy: Enemy, multiplier = 1.6) {
  const baseSize = enemy.renderSize || 160;
  return {
    width: Math.round(baseSize * multiplier),
    height: Math.round(baseSize * multiplier),
  };
}

/**
 * Calculate emoji size based on render size
 */
export function getEnemyEmojiSize(enemy: Enemy, multiplier = 1.6) {
  const baseSize = enemy.renderSize ? enemy.renderSize * multiplier : 160 * multiplier;
  return Math.round(baseSize * 0.53);
}
