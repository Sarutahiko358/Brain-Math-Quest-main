/**
 * Settings module
 *
 * Contains settings-related types, constants, and utility functions.
 * These functions are critical for save compatibility - handle with care.
 */

import { clamp } from './uiLayout.js';
import { ENDLESS_DEV_ENTRY_DEFAULT } from './world/flags.js';

/* -------------------- Constants -------------------- */

// Valid anchors helper for robust defaulting/validation when merging older saves
export const PAD_ANCHORS = [
    "tl", "tr", "bl", "br", "tc", "bc", "tcl", "tcr", "bcl", "bcr"
];

const DEFAULT_QUIZ_TYPES = [
    'SUM', 'MISSING', 'COMPARE', 'PAIR', 'ORDER', 'MAX_MIN',
    'PAIR_DIFF', 'MAX_MIN_EXPR', 'ORDER_SUM', 'COMPARE_EXPR',
    'RANGE_DIFF', 'MULTI_SELECT_MULTIPLES',
    'PRIME', 'SQUARE_ROOT', 'FACTOR_PAIR', 'ARITHMETIC_SEQUENCE',
    'DIVISOR_COUNT', 'COMMON_DIVISOR', 'PATTERN_NEXT',
    'MODULO', 'EQUATION_BALANCE', 'FRACTION_COMPARE'
];

/* -------------------- Utilities -------------------- */

export const isPadAnchor = (x) => PAD_ANCHORS.includes(x);

/**
 * Helper: Parse position object from raw data
 */
function parsePosition(posRaw) {
    const pos = posRaw;
    const x = Number(pos?.x);
    const y = Number(pos?.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
        return { x, y };
    }
    return undefined;
}

/**
 * Parse and validate size percentage value
 */
function parseSizePct(rawSizePct, fallbackPct) {
    if (typeof rawSizePct === "number" && isFinite(rawSizePct)) {
        return Math.max(40, Math.min(200, Math.round(rawSizePct)));
    }
    return Math.max(40, Math.min(200, fallbackPct || 100));
}

/**
 * Parse and validate opacity value
 */
function parseOpacity(rawOpacity, defaultValue) {
    if (typeof rawOpacity === "number") {
        return rawOpacity;
    }
    return defaultValue;
}

/**
 * Parse boolean value with default
 */
function parseBoolean(value, defaultValue) {
    return typeof value === "boolean" ? value : defaultValue;
}

/**
 * Helper: Merge pad settings
 */
function mergePadSettings(raw) {
    const padRaw = raw ?? {};
    const padAnchor = isPadAnchor(padRaw.anchor) ? padRaw.anchor : "bcl";
    const padBaseSize = typeof padRaw.size === "number" && isFinite(padRaw.size) ? padRaw.size : 56;
    const padSizePctFromPx = Math.round((padBaseSize / 56) * 100);

    return {
        show: parseBoolean(padRaw.show, true),
        anchor: padAnchor,
        size: padBaseSize,
        sizePct: parseSizePct(padRaw.sizePct, padSizePctFromPx),
        opacity: parseOpacity(padRaw.opacity, 0.9),
        pos: parsePosition(padRaw?.pos),
        collapsed: parseBoolean(padRaw?.collapsed, false),
        floating: parseBoolean(padRaw?.floating, true),
    };
}

/**
 * Parse and validate status size value
 */
function parseStatusSize(rawSize) {
    if (typeof rawSize === "number" && isFinite(rawSize)) {
        return Math.max(50, Math.min(150, rawSize));
    }
    return 100;
}

/**
 * Parse and validate status opacity value
 */
function parseStatusOpacity(rawOpacity) {
    if (typeof rawOpacity === "number" && isFinite(rawOpacity)) {
        return Math.max(0.4, Math.min(1.0, rawOpacity));
    }
    return 1.0;
}

/**
 * Helper: Merge status overlay settings
 */
function mergeStatusOverlaySettings(raw) {
    const stRaw = raw ?? {};
    const stAnchor = isPadAnchor(stRaw.anchor) ? stRaw.anchor : "bcr";

    return {
        show: parseBoolean(stRaw.show, true),
        anchor: stAnchor,
        size: parseStatusSize(stRaw.size),
        opacity: parseStatusOpacity(stRaw.opacity),
        pos: parsePosition(stRaw?.pos),
        collapsed: parseBoolean(stRaw?.collapsed, false),
        floating: parseBoolean(stRaw?.floating, true),
    };
}

/**
 * Helper: Merge bottom bar settings
 */
function mergeBottomBarSettings(raw) {
    const bottomBarRaw = raw;
    const height = Number(bottomBarRaw?.height);

    return {
        auto: typeof bottomBarRaw?.auto === "boolean" ? bottomBarRaw.auto : true,
        height: Number.isFinite(height) ? clamp(Math.round(height), 80, 260) : 120
    };
}

/**
 * Helper: Merge UI scale settings
 */
function mergeUIScaleSettings(raw) {
    const uiScaleRaw = raw;

    return {
        show: typeof uiScaleRaw?.show === "boolean" ? uiScaleRaw.show : true,
        applyToAll: typeof uiScaleRaw?.applyToAll === "boolean" ? uiScaleRaw.applyToAll : false,
    };
}

/**
 * Helper: Merge quiz types settings
 */
function mergeQuizTypesSettings(raw) {
    const quizTypes = raw;

    if (Array.isArray(quizTypes) && quizTypes.length > 0) {
        return quizTypes;
    }

    return DEFAULT_QUIZ_TYPES;
}

/**
 * Helper: Merge answer review settings
 */
function mergeAnswerReviewSettings(raw) {
    const answerReviewRaw = raw;

    return {
        showOnCorrect: typeof answerReviewRaw?.showOnCorrect === "boolean" ? answerReviewRaw.showOnCorrect : false,
        showOnWrong: typeof answerReviewRaw?.showOnWrong === "boolean" ? answerReviewRaw.showOnWrong : true,
    };
}

/**
 * Helper: Merge sound effects settings
 */
function mergeSoundEffectsSettings(raw) {
    const soundEffectsRaw = raw;

    let volume = 0.5; // デフォルト音量
    if (typeof soundEffectsRaw?.volume === "number" && soundEffectsRaw.volume >= 0 && soundEffectsRaw.volume <= 1) {
        volume = soundEffectsRaw.volume;
    }

    return {
        enabled: typeof soundEffectsRaw?.enabled === "boolean" ? soundEffectsRaw.enabled : true,
        volume
    };
}

/**
 * Helper: Merge brain only settings
 */
function mergeBrainOnlySettings(raw, difficulty) {
    const brainOnlyRaw = raw;

    return {
        battleBg: typeof brainOnlyRaw?.battleBg === "boolean" ? brainOnlyRaw.battleBg : false,
        difficulty: brainOnlyRaw?.difficulty || difficulty,
        quizTypes: mergeQuizTypesSettings(brainOnlyRaw?.quizTypes)
    };
}

/**
 * Parse difficulty setting
 */
function parseDifficulty(raw) {
    return raw ?? "normal";
}

/**
 * Parse encounter rate
 */
function parseEncounterRate(raw) {
    return (typeof raw === "number" ? raw : undefined) ?? 14;
}

/**
 * Parse avatar
 */
function parseAvatar(raw) {
    return raw ?? "🦸‍♀️";
}

/**
 * Parse tile size with safe range guard
 */
function parseTileSize(raw) {
    const rawTs = Number(raw);
    return Number.isFinite(rawTs) ? Math.max(20, Math.min(64, rawTs)) : 32;
}

/**
 * Parse basic settings (simple scalar values)
 */
function parseBasicSettings(r) {
    return {
        difficulty: parseDifficulty(r?.difficulty),
        encounterRate: parseEncounterRate(r?.encounterRate),
        avatar: parseAvatar(r?.avatar),
        tileSize: parseTileSize(r?.tileSize),
        hardQuizRandom: parseBoolean(r?.hardQuizRandom, true),
        endlessDevEntry: parseBoolean(r?.endlessDevEntry, ENDLESS_DEV_ENTRY_DEFAULT),
    };
}

/**
 * Parse complex settings (objects via helper functions)
 */
function parseComplexSettings(r, difficulty) {
    return {
        pad: mergePadSettings(r?.pad),
        statusOverlay: mergeStatusOverlaySettings(r?.statusOverlay),
        bottomBar: mergeBottomBarSettings(r?.bottomBar),
        uiScale: mergeUIScaleSettings(r?.uiScale),
        quizTypes: mergeQuizTypesSettings(r?.quizTypes),
        answerReview: mergeAnswerReviewSettings(r?.answerReview),
        soundEffects: mergeSoundEffectsSettings(r?.soundEffects),
        brainOnly: mergeBrainOnlySettings(r?.brainOnly, difficulty),
    };
}

/**
 * 既存/旧バージョンのセーブから安全に設定を組み立てる
 */
export function mergeSettings(raw) {
    const r = raw;
    const basic = parseBasicSettings(r);
    const complex = parseComplexSettings(r, basic.difficulty);

    return { ...basic, ...complex };
}
