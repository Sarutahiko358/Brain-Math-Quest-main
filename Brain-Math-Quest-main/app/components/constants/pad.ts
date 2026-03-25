/**
 * D-Pad Overlay Constants
 *
 * Extracted from PadOverlay.tsx to improve code maintainability
 * All values are unchanged from original implementation
 */

/**
 * Layout and positioning
 */
export const PAD_LAYOUT = {
  /** Z-index for pad overlay */
  Z_INDEX: 12,

  /** Margin from screen edges (in pixels) */
  EDGE_MARGIN: 10,

  /** Center position offset (as percentage string) */
  CENTER_OFFSET: "50%",

  /** Off-center position offset (as percentage string) */
  OFF_CENTER_OFFSET: "35%",
} as const;
