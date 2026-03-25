/**
 * Battle Animations
 *
 * Handles battle animation scheduling and management.
 * Extracted from handleQuizResult.ts to reduce complexity.
 */

import { BattleAnimState } from '../types';
import { TimerManager } from '../../lib/timerManager';
import { UI_TIMINGS } from '../../lib/ui/constants';

export interface AnimationDeps {
  setBattleAnim: (anim: BattleAnimState | null) => void;
  timerManager: TimerManager;
  vibrate: (ms: number) => void;
}

/**
 * Generic animation player
 * Consolidates common animation pattern: show animation -> wait -> clear
 *
 * @param type - Animation type
 * @param duration - Duration in milliseconds
 * @param deps - Animation dependencies
 * @param value - Optional animation value
 * @param vibrateMs - Optional vibration duration
 */
export function playAnimation(
  type: string,
  duration: number,
  deps: AnimationDeps,
  value?: number,
  vibrateMs?: number
): void {
  const { setBattleAnim, timerManager, vibrate } = deps;

  setBattleAnim({ type, value });
  timerManager.setTimeout(() => setBattleAnim(null), duration);

  if (vibrateMs !== undefined) {
    vibrate(vibrateMs);
  }
}

/**
 * Show heal animation
 *
 * @param healAmount - Amount of HP healed
 * @param deps - Animation dependencies
 */
export function showHealAnimation(healAmount: number, deps: AnimationDeps): void {
  playAnimation('heal', 1400, deps, healAmount, 20);
}

/**
 * Show speed bonus animation
 *
 * @param deps - Animation dependencies
 */
export function showSpeedBonusAnimation(deps: AnimationDeps): void {
  playAnimation('bonusSpeed', 900, deps);
}

/**
 * Show hard quiz bonus animation
 *
 * @param deps - Animation dependencies
 */
export function showHardBonusAnimation(deps: AnimationDeps): void {
  playAnimation('bonusHard', 900, deps);
}

/**
 * Show damage animation with optional combo bonus and scroll
 *
 * @param damage - Damage amount
 * @param isComboBonus - Whether this is a combo bonus attack
 * @param enemyPanelRef - Reference to enemy panel for scrolling
 * @param deps - Animation dependencies
 */
export function showDamageAnimation(
  damage: number,
  isComboBonus: boolean,
  enemyPanelRef: React.RefObject<HTMLDivElement | null>,
  deps: AnimationDeps
): void {
  const { setBattleAnim, timerManager, vibrate } = deps;

  // Scroll to enemy panel
  try {
    enemyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {
    // scrollIntoView may fail in some browsers or environments - safe to ignore
  }

  const scrollDelay = UI_TIMINGS.BATTLE_SCROLL_DELAY;
  const extraPause = UI_TIMINGS.BATTLE_EXTRA_PAUSE;

  // Schedule damage animation after scroll
  timerManager.setTimeout(() => {
    const animType = isComboBonus ? 'bonusCombo' : 'damage';
    setBattleAnim({ type: animType, value: damage });
    timerManager.setTimeout(() => setBattleAnim(null), 1400);
  }, scrollDelay + extraPause);

  vibrate(10);
}

/**
 * Show weak damage animation (for failed attacks)
 *
 * @param damage - Damage amount
 * @param deps - Animation dependencies
 */
export function showWeakDamageAnimation(damage: number, deps: AnimationDeps): void {
  playAnimation('damage', 1400, deps, damage);
}

/**
 * Show bonus animations based on quiz outcome
 *
 * @param speedBonus - Whether speed bonus was achieved
 * @param hardBonus - Whether hard quiz bonus was achieved
 * @param deps - Animation dependencies
 */
export function showBonusAnimations(
  speedBonus: boolean,
  hardBonus: boolean,
  deps: AnimationDeps
): void {
  if (speedBonus) {
    showSpeedBonusAnimation(deps);
  }
  if (hardBonus) {
    showHardBonusAnimation(deps);
  }
}
