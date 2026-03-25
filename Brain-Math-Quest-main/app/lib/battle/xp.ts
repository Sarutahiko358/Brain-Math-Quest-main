export function nextExpFor(lv: number) {
  return 20 + Math.floor(lv * 18 * (1 + lv * 0.15));
}
