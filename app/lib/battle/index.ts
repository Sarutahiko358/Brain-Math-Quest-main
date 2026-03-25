/**
 * Battle Module - Barrel Export
 *
 * Re-exports all battle-related functionality for convenient imports.
 *
 * Usage:
 *   import { effATK, effDEF, applyExpGold } from '@/lib/battle';
 *
 * Instead of:
 *   import { effATK, effDEF } from '@/lib/battle/stats';
 *   import { applyExpGold } from '@/lib/battle/flow';
 */

// Stats calculations
export { effATK, effDEF } from './stats';

// Experience and leveling
export { nextExpFor } from './xp';

// Battle flow
export { applyExpGold } from './flow';
export type { LevelUpInfo, LevelUpDetail, ExpGoldResult } from './flow';
