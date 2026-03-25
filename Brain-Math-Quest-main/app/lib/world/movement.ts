/**
 * Movement utilities: pure functions for player movement validation and tile interaction
 * Extracted from DQBrain.tsx for S7 refactoring
 */

import { Tile, T, ROWS, COLS } from './areas';
import { clamp } from '../uiLayout';

/**
 * Calculate new position after movement, clamped to map bounds
 * @param currentPos - Current player position {r, c}
 * @param dr - Row delta (-1 for up, +1 for down)
 * @param dc - Column delta (-1 for left, +1 for right)
 * @returns New position {r, c} clamped to valid map bounds
 */
export function calculateNewPosition(
  currentPos: { r: number; c: number },
  dr: number,
  dc: number
): { r: number; c: number } {
  return {
    r: clamp(currentPos.r + dr, 0, ROWS - 1),
    c: clamp(currentPos.c + dc, 0, COLS - 1),
  };
}

/**
 * Check if a tile is walkable (not wall or water)
 * @param tile - Tile to check
 * @returns true if tile is walkable, false otherwise
 */
export function isWalkable(tile: Tile): boolean {
  return tile !== T.Wall && tile !== T.Water;
}

/**
 * Check if player is at a specific position
 * @param playerPos - Player position {r, c}
 * @param targetPos - Target position {r, c}
 * @returns true if positions match
 */
export function isAtPosition(
  playerPos: { r: number; c: number },
  targetPos: { r: number; c: number }
): boolean {
  return playerPos.r === targetPos.r && playerPos.c === targetPos.c;
}

/**
 * Determine if random encounter should trigger on this tile
 * @param tile - Current tile type
 * @param encounterRate - Encounter rate percentage (0-100)
 * @returns true if encounter should trigger
 */
export function shouldTriggerEncounter(tile: Tile, encounterRate: number): boolean {
  // Towns and castles don't trigger random encounters
  if (tile === T.Town || tile === T.Castle) {
    return false;
  }
  
  // Cave and other tiles use encounter rate
  return Math.random() * 100 < encounterRate;
}

/**
 * Check if tile triggers a special location (town, castle)
 * @param tile - Tile to check
 * @returns Type of special location or null
 */
export function getSpecialLocationType(tile: Tile): 'town' | 'castle' | null {
  if (tile === T.Town) return 'town';
  if (tile === T.Castle) return 'castle';
  return null;
}
