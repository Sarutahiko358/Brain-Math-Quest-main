/**
 * Combo Manager
 *
 * Handles combo guard consumption and combo reset logic.
 * Extracted from handleQuizResult.ts to reduce complexity.
 */

import { Player } from '../../lib/gameTypes';

export interface ComboGuardResult {
  shouldResetCombo: boolean;
  comboGuardConsumed: boolean;
  remainingGuards: number;
  toastMessage: string | null;
}

/**
 * Check if combo should be reset or protected by combo guard
 *
 * @param player - Current player state
 * @returns Result indicating whether combo should reset and guard status
 */
export function checkComboGuard(player: Player): ComboGuardResult {
  const comboGuardCount = player.flags?.comboGuard || 0;
  const hasGuard = comboGuardCount > 0;

  if (hasGuard) {
    const remainingGuards = Math.max(0, comboGuardCount - 1);
    return {
      shouldResetCombo: false,
      comboGuardConsumed: true,
      remainingGuards,
      toastMessage: `🛡 コンボは守られた！（残り${remainingGuards}）`
    };
  } else {
    return {
      shouldResetCombo: true,
      comboGuardConsumed: false,
      remainingGuards: 0,
      toastMessage: null
    };
  }
}

/**
 * Apply combo guard consumption to player state
 *
 * @param player - Current player state
 * @param setPlayer - Function to update player state
 * @param setQuizCombo - Function to update combo count
 * @param addToast - Function to show toast message
 */
export function applyComboGuardOrReset(
  player: Player,
  setPlayer: (updater: (p: Player) => Player) => void,
  setQuizCombo: (updater: ((c: number) => number) | number) => void,
  addToast: (msg: string) => void
): void {
  const result = checkComboGuard(player);

  if (result.comboGuardConsumed) {
    // Consume combo guard
    setPlayer((p) => ({
      ...p,
      flags: { ...(p.flags || {}), comboGuard: result.remainingGuards }
    }));
    if (result.toastMessage) {
      addToast(result.toastMessage);
    }
  } else if (result.shouldResetCombo) {
    // Reset combo
    setQuizCombo(0);
  }
}

/**
 * Update combo count (for successful actions)
 *
 * @param comboChange - Amount to change combo by
 * @param setQuizCombo - Function to update combo count
 */
export function updateCombo(
  comboChange: number,
  setQuizCombo: (updater: ((c: number) => number) | number) => void
): void {
  setQuizCombo((c) => c + comboChange);
}

/**
 * Process combo change from quiz outcome
 * Handles both numeric changes (increment) and reset requests
 *
 * @param comboChange - Combo change from outcome ('reset' or number)
 * @param player - Current player state
 * @param setPlayer - Function to update player state
 * @param setQuizCombo - Function to update combo count
 * @param addToast - Function to show toast message
 */
export function processComboChange(
  comboChange: 'reset' | number | undefined,
  player: Player,
  setPlayer: (updater: (p: Player) => Player) => void,
  setQuizCombo: (updater: ((c: number) => number) | number) => void,
  addToast: (msg: string) => void
): void {
  if (comboChange === 'reset') {
    applyComboGuardOrReset(player, setPlayer, setQuizCombo, addToast);
  } else if (typeof comboChange === 'number') {
    updateCombo(comboChange, setQuizCombo);
  }
  // If undefined, no combo change
}
