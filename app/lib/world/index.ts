/**
 * World Module - Barrel Export
 *
 * Re-exports all world-related functionality for convenient imports.
 *
 * Usage:
 *   import { AREAS, pickEnemy, prepareEncounter } from '@/lib/world';
 *
 * Instead of:
 *   import { AREAS } from '@/lib/world/areas';
 *   import { pickEnemy } from '@/lib/world/encounter';
 *   import { prepareEncounter } from '@/lib/world/encounterAdapter';
 */

// Area definitions
export { AREAS, createMap, createRandomMap, isPassable, hasPath } from './areas';
export type { AreaInfo, Tile, Vec } from './areas';

// Encounter system
export { shouldRollEncounter, pickEnemy, scaleEnemy, getAvailableEnemies } from './encounter';

// Encounter adapter
export { prepareEncounter } from './encounterAdapter';
export type { EncounterContext, EncounterResult } from './encounterAdapter';

// Boss encounters
export { getBossIntroLines, getGuardianIntroLines, getEncounterIntroLines } from './bossEncounter';

// Endless mode
export { pickBackground, pickBackgroundForFloor, pickEndlessRunTheme } from './endless';
export type { EndlessFloorData, EndlessUnit, EndlessRunTheme } from './endless';
