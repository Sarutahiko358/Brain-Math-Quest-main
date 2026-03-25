import {
    isInputUI,
    isChoices2UI,
    isChipsUI,
    isChipsOrderUI,
    isChipsMultiUI,
    hasChips,
    getChips,
    getChoices,
    getChipCount,
    findChipById,
    getChipValues
} from './uiTypes.js';

// Re-export type guards and utilities
export {
    isInputUI,
    isChoices2UI,
    isChipsUI,
    isChipsOrderUI,
    isChipsMultiUI,
    hasChips,
    getChips,
    getChoices,
    getChipCount,
    findChipById,
    getChipValues
};

export function quizBaseByDifficulty(diff) {
    if (diff === 'easy') return { base: 18, time: 30 };
    if (diff === 'hard') return { base: 48, time: 18 };
    return { base: 28, time: 24 };
}
