/**
 * Initial state factory functions
 */

import { WEAPONS, ARMORS, TOOLS } from './equipment.js';
import { AREAS } from './world/areas.js';
import { ENDLESS_DEV_ENTRY_DEFAULT } from './world/flags.js';

/**
 * Create initial settings state
 * Includes pad positioning based on window dimensions (client-side only)
 */
export function createInitialSettings() {
    // Calculate positions based on window size
    // Note: in vanilla JS we assume window exists, as we are in browser
    const padY = window.innerHeight - 220;
    const statusX = window.innerWidth - 220;
    const statusY = window.innerHeight - 220;

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
        ],
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
            ]
        }
    };
}

/**
 * Creates the initial player state
 */
export function createInitialPlayer(avatarOverride) {
    return {
        name: "勇者",
        avatar: avatarOverride || "🦸‍♀️",
        lv: 1,
        exp: 0,
        gold: 50,
        maxHP: 30,
        hp: 30,
        maxMP: 10,
        mp: 10,
        baseATK: 5,
        baseDEF: 2,
        equip: {
            weapon: WEAPONS[0], // 木の杖 (ATK+2)
            armor: ARMORS[0],   // 布の服 (DEF+1)
            accessory: null
        },
        items: [
            TOOLS[0], // やくそう x3 (初期所持)
            TOOLS[0],
            TOOLS[0]
        ],
        keyItems: [],
        pos: AREAS[0].startPos, // エリア1の開始地点
        currentArea: 1, // エリア1からスタート
        clearedAreas: [],
        storyShownAreas: [],
        flags: {
            // 初期状態ではフラグなし
        }
    };
}
