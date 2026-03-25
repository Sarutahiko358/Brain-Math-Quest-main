/**
 * UI constants - colors, backgrounds, and display values
 */

/**
 * Color constants
 */
export const UI_COLORS = {
    GOLD: '#ffd700',
    GOLD_UPPER: '#FFD700',
    DARK_BLUE_BG: '#0c1330cc',
    DARK_BLUE_BG_RGBA: 'rgba(12,19,48,0.96)',
    BLUE_BORDER: '#2a3a7a',
    LIGHT_BLUE_TEXT: '#e6e9ff',
    PURPLE: '#6A1B9A',
    GREEN: '#4CAF50',
    ORANGE: '#FF9800',
    SEMI_TRANSPARENT_BG: '#2226',
    GRAY: '#888',
};

/**
 * Battle background gradients by area number
 */
export const BATTLE_BG_GRADIENTS = {
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
    OVERLAY_ARM_DELAY: 250,
    PAD_REPEAT_INTERVAL: 90,
    PAD_LONG_PRESS_DELAY: 250,
    QUIZ_TIMER_POLL: 100,
    TOAST_DURATION: 1800,
    SAVE_POPUP_DURATION: 1500,
    BATTLE_SCROLL_DELAY: 420,
    BATTLE_EXTRA_PAUSE: 260,
};

/**
 * UI size constants (in pixels)
 */
export const UI_SIZES = {
    PAD_BASE_SIZE: 56,
    PAD_SIZE_MIN: 60,
    PAD_SIZE_MAX: 160,
    PAD_SIZE_STEP: 5,
};
