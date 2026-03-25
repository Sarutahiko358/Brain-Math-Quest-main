/**
 * Action Handlers - Re-export Module
 *
 * This file re-exports action handlers from specialized modules.
 * Each action type now has its own dedicated file for better maintainability.
 *
 * Module structure:
 * - healActionHandler.ts: Heal action processing
 * - runActionHandler.ts: Run/escape action processing
 * - attackActionHandler.ts: Attack and fire magic processing
 */

// Re-export types and functions
export type {
  HealActionDeps
} from './actions/healActionHandler';
export { handleHealAction } from './actions/healActionHandler';

export type {
  RunActionDeps
} from './actions/runActionHandler';
export { handleRunAction } from './actions/runActionHandler';

export type {
  AttackActionDeps
} from './actions/attackActionHandler';
export {
  handleSuccessfulAttack,
  handleFailedAttack
} from './actions/attackActionHandler';

// Legacy unified interface for backward compatibility
import type { HealActionDeps } from './actions/healActionHandler';
import type { RunActionDeps } from './actions/runActionHandler';
import type { AttackActionDeps } from './actions/attackActionHandler';

/**
 * Unified ActionHandlerDeps interface
 * Combines all action dependencies for convenience
 * @deprecated Use specific action deps (HealActionDeps, RunActionDeps, AttackActionDeps) instead
 */
export type ActionHandlerDeps = HealActionDeps & RunActionDeps & AttackActionDeps;
