/**
 * Quiz Component Constants
 *
 * Extracted from BrainQuizPane.tsx to improve code maintainability
 * All values are unchanged from original implementation
 */

import React from 'react';

/**
 * Input constraints
 */
export const QUIZ_INPUT = {
  /** Maximum number of digits for numeric input */
  MAX_DIGITS: 6,
} as const;

/**
 * Chip selection constraints
 */
export const QUIZ_CHIPS = {
  /** Maximum number of chips that can be selected (for chips mode) */
  MAX_SELECTION: 2,
} as const;

/**
 * Timer and speed bonus thresholds
 */
export const QUIZ_TIMING = {
  /** Speed bonus threshold as fraction of time limit (0.5 = 50%) */
  SPEED_BONUS_THRESHOLD: 0.5,

  /** Decimal places for elapsed time display */
  TIME_ELAPSED_DECIMALS: 1,

  /** Decimal places for speed target display */
  TIME_TARGET_DECIMALS: 0,

  /** Decimal places for time left display */
  TIME_LEFT_DECIMALS: 1,
} as const;

/**
 * Layout spacing
 */
export const QUIZ_LAYOUT = {
  /** Margin for chip selection groups (in pixels) */
  CHIP_GROUP_MARGIN_TOP: 8,
} as const;

/**
 * Keypad button layout (standard calculator layout)
 */
export const KEYPAD_BUTTONS = [
  "7", "8", "9",
  "4", "5", "6",
  "1", "2", "3",
  "←", "0", "OK"
] as const;

/**
 * Keypad button labels for accessibility
 */
export const KEYPAD_ARIA_LABELS: Record<string, string> = {
  "←": "一文字削除",
  "OK": "決定",
} as const;

/**
 * Style constants for quiz components
 */
export const QUIZ_STYLES = {
  CHIP_GROUP: {
    marginTop: 8,
  } as React.CSSProperties,
} as const;
