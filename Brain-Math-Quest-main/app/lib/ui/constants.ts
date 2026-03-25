/**
 * UI constants - colors, backgrounds, and display values
 * Mechanical aggregation - values preserved exactly as they were
 */

/**
 * Color constants
 */
export const UI_COLORS = {
  /** Gold color used for combo indicators, highlights, and achievements */
  GOLD: '#ffd700',
  /** Alternative gold (uppercase) */
  GOLD_UPPER: '#FFD700',
  /** Dark blue background with opacity */
  DARK_BLUE_BG: '#0c1330cc',
  /** Dark blue background (rgba format) */
  DARK_BLUE_BG_RGBA: 'rgba(12,19,48,0.96)',
  /** Blue border color */
  BLUE_BORDER: '#2a3a7a',
  /** Light blue text color */
  LIGHT_BLUE_TEXT: '#e6e9ff',
  /** Purple color for special areas */
  PURPLE: '#6A1B9A',
  /** Green color for success/completion */
  GREEN: '#4CAF50',
  /** Orange color for warnings/incomplete */
  ORANGE: '#FF9800',
  /** Semi-transparent background */
  SEMI_TRANSPARENT_BG: '#2226',
  /** Gray color for placeholders */
  GRAY: '#888',
} as const;

/**
 * Battle background gradients by area number
 */
export const BATTLE_BG_GRADIENTS: Record<number, string> = {
  1: 'linear-gradient(180deg, #c8f7c5 0%, #9be7a3 100%)',
  2: 'linear-gradient(180deg, #98c379 0%, #2e7d32 100%)',
  3: 'linear-gradient(180deg, #616161 0%, #212121 100%)',
  4: 'linear-gradient(180deg, #ff7043 0%, #bf360c 100%)',
  5: 'linear-gradient(180deg, #e3f2fd 0%, #90caf9 100%)',
  6: 'linear-gradient(180deg, #b39ddb 0%, #4527a0 100%)',
  7: 'linear-gradient(180deg, #f0e68c 0%, #c5b358 100%)',
  8: 'linear-gradient(180deg, #2d2d2d 0%, #000000 100%)',
};

/**
 * Default gradient fallback
 */
export const DEFAULT_GRADIENT = 'linear-gradient(180deg, #eceff1 0%, #cfd8dc 100%)';

/**
 * UI timing constants (in milliseconds)
 */
export const UI_TIMINGS = {
  /** Overlay animation delay before arming close */
  OVERLAY_ARM_DELAY: 250,
  /** Auto-repeat interval for pad controls */
  PAD_REPEAT_INTERVAL: 90,
  /** Long-press detection delay for pad controls */
  PAD_LONG_PRESS_DELAY: 250,
  /** Quiz timer polling interval */
  QUIZ_TIMER_POLL: 100,
  /** Toast notification display duration */
  TOAST_DURATION: 1800,
  /** Save popup display duration */
  SAVE_POPUP_DURATION: 1500,
  /** Battle animation scroll delay */
  BATTLE_SCROLL_DELAY: 420,
  /** Battle animation extra pause */
  BATTLE_EXTRA_PAUSE: 260,
} as const;

/**
 * UI size constants (in pixels)
 */
export const UI_SIZES = {
  /** Base pad size before scaling */
  PAD_BASE_SIZE: 56,
  /** Minimum pad size percentage */
  PAD_SIZE_MIN: 60,
  /** Maximum pad size percentage */
  PAD_SIZE_MAX: 160,
  /** Pad size adjustment step */
  PAD_SIZE_STEP: 5,
} as const;
