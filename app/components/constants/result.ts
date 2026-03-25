/**
 * Result View Style Constants
 *
 * Extracted from ResultView.tsx to improve code maintainability
 * All values are unchanged from original implementation
 */

import React from 'react';

/**
 * Game Over message styles
 */
export const GAME_OVER_MESSAGE_STYLE: React.CSSProperties = {
  padding: '10px',
  fontSize: '14px',
  lineHeight: '1.6',
} as const;

/**
 * Reward item container styles
 */
export const REWARD_ITEM_STYLE: React.CSSProperties = {
  marginTop: '8px',
  padding: '8px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '4px',
} as const;

/**
 * Reward item title styles
 */
export const REWARD_ITEM_TITLE_STYLE: React.CSSProperties = {
  marginBottom: '4px',
  fontWeight: 'bold',
} as const;

/**
 * Individual reward item text styles
 */
export const REWARD_ITEM_TEXT_STYLE: React.CSSProperties = {
  fontSize: '13px',
  marginLeft: '8px',
  lineHeight: '1.6',
} as const;
