/**
 * UI color utilities
 */

/**
 * Calculate color based on time elapsed (green → yellow → red)
 * Uses 20 seconds as the upper limit for normalization
 * @param sec Time in seconds
 * @returns HSL color string
 */
export function timeColor(sec: number): string {
  const t = Math.max(0, Math.min(20, sec));
  const pct = t / 20; // 0..1
  // 120 (緑) → 60 (黄) → 0 (赤) のHを線形補間
  const hue = 120 * (1 - pct);
  return `hsl(${Math.round(hue)}, 80%, 45%)`;
}
