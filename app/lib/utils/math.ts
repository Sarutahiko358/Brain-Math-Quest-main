/**
 * Math Utility Functions
 *
 * Pure mathematical helper functions
 * Extracted for reusability and testability
 */

/**
 * Clamp a number between minimum and maximum values
 * @param n - The number to clamp
 * @param lo - Minimum value
 * @param hi - Maximum value
 * @returns Clamped value between lo and hi
 *
 * @example
 * clamp(5, 0, 10)  // 5
 * clamp(-5, 0, 10) // 0
 * clamp(15, 0, 10) // 10
 */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
