/**
 * Initial state factory functions for DQBrain component
 *
 * These functions create the initial state for settings and player,
 * making the component cleaner and the initialization logic reusable.
 */

import { Player } from '../lib/gameTypes';
import { Settings } from '../lib/settings';
import { QuizType } from '../lib/quiz/types';
import { WEAPONS, ARMORS, TOOLS } from '../lib/equipment';
import { AREAS } from '../lib/world/areas';
import { ENDLESS_DEV_ENTRY_DEFAULT } from '../lib/world/flags';

/**
 * Create initial settings state
 * Includes pad positioning based on window dimensions (client-side only)
 */
export function createInitialSettings(): Settings {
  // Calculate positions based on window size (with SSR fallback)
  const padY = typeof window !== 'undefined' ? window.innerHeight - 220 : 420;
  const statusX = typeof window !== 'undefined' ? window.innerWidth - 220 : 540;
  const statusY = typeof window !== 'undefined' ? window.innerHeight - 220 : 420;

  return {
    difficulty: "normal",
    encounterRate: 14,
    avatar: "🦸‍♀️",
    tileSize: 32,
    pad: {
      show: true,
      anchor: "bcl",
      size: 56,
      sizePct: 100,
      opacity: 0.9,
      pos: { x: 20, y: padY },
      collapsed: false,
      floating: false
    },
    statusOverlay: {
      show: true,
      anchor: "bcr",
      size: 100,
      opacity: 1.0,
      pos: { x: statusX, y: statusY },
      collapsed: false,
      floating: true
    },
    bottomBar: { auto: true, height: 120 },
    hardQuizRandom: true,
    endlessDevEntry: ENDLESS_DEV_ENTRY_DEFAULT,
    uiScale: { show: true, applyToAll: false },
    quizTypes: [
      'SUM',
      'MISSING',
      'COMPARE',
      'PAIR',
      'ORDER',
      'MAX_MIN',
      'PAIR_DIFF',
      'MAX_MIN_EXPR',
      'ORDER_SUM',
      'COMPARE_EXPR',
      'RANGE_DIFF',
      'MULTI_SELECT_MULTIPLES',
      'PRIME',
      'SQUARE_ROOT',
      'FACTOR_PAIR',
      'ARITHMETIC_SEQUENCE',
      'DIVISOR_COUNT',
      'COMMON_DIVISOR',
      'PATTERN_NEXT',
      'MODULO',
      'EQUATION_BALANCE',
      'FRACTION_COMPARE'
    ] as QuizType[],
    answerReview: {
      showOnCorrect: false,
      showOnWrong: true
    },
    soundEffects: {
      enabled: true,
      volume: 0.5
    },
    brainOnly: {
      battleBg: false,
      difficulty: "normal",
      quizTypes: [
        'SUM',
        'MISSING',
        'COMPARE',
        'PAIR',
        'ORDER',
        'MAX_MIN',
        'PAIR_DIFF',
        'MAX_MIN_EXPR',
        'ORDER_SUM',
        'COMPARE_EXPR',
        'RANGE_DIFF',
        'MULTI_SELECT_MULTIPLES',
        'PRIME',
        'SQUARE_ROOT',
        'FACTOR_PAIR',
        'ARITHMETIC_SEQUENCE',
        'DIVISOR_COUNT',
        'COMMON_DIVISOR',
        'PATTERN_NEXT',
        'MODULO',
        'EQUATION_BALANCE',
        'FRACTION_COMPARE'
      ] as QuizType[]
    }
  };
}

/**
 * Create initial player state
 * @param avatarOverride - Optional avatar to use (from settings)
 */
export function createInitialPlayer(avatarOverride?: string): Player {
  const startArea = AREAS.find(a => a.id === 1);

  return {
    name: "ユウシャ",
    avatar: avatarOverride || "🦸‍♀️",
    lv: 1,
    exp: 0,
    gold: 40,
    maxHP: 40,
    hp: 40,
    maxMP: 12,
    mp: 12,
    baseATK: 3,
    baseDEF: 2,
    equip: {
      weapon: WEAPONS[0],
      armor: ARMORS[0],
      accessory: null
    },
    items: [
      { ...TOOLS[0], qty: 2 },
      { ...TOOLS[1], qty: 1 }
    ],
    keyItems: [],
    // Initial position from area startPos (prevents dojo overlap)
    pos: startArea?.startPos || { r: 2, c: 2 },
    currentArea: 1,
    clearedAreas: [],
    storyShownAreas: [],
    flags: {
      ultimateUnlocked: false,
      ultimateMagicUnlocked: false,
      genbuDefeated: false,
      seiryuDefeated: false,
      suzakuDefeated: false,
      byakkoDefeated: false
    }
  };
}
