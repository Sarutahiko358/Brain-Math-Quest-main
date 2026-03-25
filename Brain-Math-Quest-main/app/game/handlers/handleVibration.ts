/**
 * Handle device vibration
 *
 * Pure handler that triggers device vibration if the API is available.
 * Mechanical extraction from DQBrain.tsx - no logic changes.
 */

/**
 * Trigger device vibration if the Vibration API is available
 *
 * @param ms - Duration of vibration in milliseconds
 */
export function handleVibration(ms: number): void {
  if (typeof navigator !== "undefined" && 'vibrate' in navigator) {
    const vibrate = (navigator as { vibrate?: (pattern: number | number[]) => boolean }).vibrate;
    if (vibrate) {
      vibrate.call(navigator, ms);
    }
  }
}
