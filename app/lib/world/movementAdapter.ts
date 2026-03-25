/**
 * Movement Adapter - S10 Step1: Thin facade for DQBrain movement delegation
 * 
 * Purpose:
 * - Provide a cleaner interface for DQBrain's tryMove logic
 * - Delegate to existing movement helpers
 * - Keep DQBrain-specific logic (guardians, bosses, etc.) in DQBrain
 * - Reduce duplication and line count in DQBrain
 * 
 * Contract:
 * - Input: Movement delta (dr, dc), current game state
 * - Output: Whether movement is allowed, new position, and special triggers
 * - Side effects: None (pure validation/calculation)
 * - Errors: Returns validation result, never throws
 */

import { Tile, Vec } from './areas';
import { calculateNewPosition, isWalkable, shouldTriggerEncounter, getSpecialLocationType } from './movement';

/**
 * Result of movement validation
 */
export type MovementValidation = {
  allowed: boolean;
  newPos: Vec;
  tile: Tile;
  specialLocation: 'town' | 'castle' | null;
  shouldEncounter: boolean;
};

/**
 * Validate and calculate movement result
 * Pure function - no side effects
 * 
 * @param currentPos - Current player position
 * @param dr - Row delta (-1 up, +1 down)
 * @param dc - Column delta (-1 left, +1 right)
 * @param map - Current area map
 * @param encounterRate - Encounter rate from settings
 * @returns MovementValidation result
 */
export function validateMovement(
  currentPos: Vec,
  dr: number,
  dc: number,
  map: Tile[][],
  encounterRate: number
): MovementValidation {
  const newPos = calculateNewPosition(currentPos, dr, dc);
  const tile = map[newPos.r]?.[newPos.c];
  
  if (tile === undefined) {
    // Out of bounds - should not happen with calculateNewPosition, but safe fallback
    return {
      allowed: false,
      newPos,
      tile: 0, // Default to grass for type safety
      specialLocation: null,
      shouldEncounter: false
    };
  }
  
  const allowed = isWalkable(tile);
  const specialLocation = getSpecialLocationType(tile);
  const shouldEncounter = allowed && shouldTriggerEncounter(tile, encounterRate);
  
  return {
    allowed,
    newPos,
    tile,
    specialLocation,
    shouldEncounter
  };
}
