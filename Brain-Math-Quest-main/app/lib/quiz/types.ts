import type { Difficulty } from '../gameTypes';
import type { QuizUI, Chip } from './uiTypes';

// Re-export UI types for convenience
export type { QuizUI, Chip, QuizUIKind } from './uiTypes';
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
} from './uiTypes';

export type QuizType = 'SUM' | 'MISSING' | 'COMPARE' | 'PAIR' | 'ORDER' | 'MAX_MIN' |
                       'PAIR_DIFF' | 'MAX_MIN_EXPR' | 'ORDER_SUM' | 'COMPARE_EXPR' | 'RANGE_DIFF' | 'MULTI_SELECT_MULTIPLES' |
                       'PRIME' | 'SQUARE_ROOT' | 'FACTOR_PAIR' | 'ARITHMETIC_SEQUENCE' | 'DIVISOR_COUNT' | 'COMMON_DIVISOR' | 'PATTERN_NEXT' |
                       'MODULO' | 'EQUATION_BALANCE' | 'FRACTION_COMPARE';

export type Quiz = {
  type: QuizType;
  prompt: string;
  expr?: string;
  ui: QuizUI;
  answer: string;
  note?: string;
  checkFn?: (scratch: Scratch) => boolean;
};
export type Scratch = { val: string; sel: Chip[]; seq: number[]; seqIds: number[] };

export type QuizBundle = {
  quiz: Quiz;
  timeMax: number;
  timeLeft: number;
  timeStart?: number;
  pack: 'attack' | 'fire' | 'heal' | 'run';
  power: number;
  meta?: { moveName?: string; isSkill?: boolean; mpCost?: number; diffBoost?: number };
};

export function quizBaseByDifficulty(diff: Difficulty) {
  if (diff === 'easy') return { base: 18, time: 30 };
  if (diff === 'hard') return { base: 48, time: 18 };
  return { base: 28, time: 24 };
}
