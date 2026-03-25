/**
 * Quiz Module - Barrel Export
 *
 * Re-exports all quiz-related functionality for convenient imports.
 *
 * Usage:
 *   import { makeQuizPack, checkAnswer, isHardQuiz } from '@/lib/quiz';
 *
 * Instead of:
 *   import { makeQuizPack } from '@/lib/quiz/generators';
 *   import { checkAnswer } from '@/lib/quiz/checkAnswer';
 *   import { isHardQuiz } from '@/lib/quiz/difficulty';
 */

// Quiz engine and generation
export { makeQuizPack } from './generators';
export { calculateEnemyDamage } from './engine';

// Quiz types
export type { Quiz, QuizType, QuizBundle } from './types';

// Answer validation
export { checkAnswer } from './checkAnswer';

// Difficulty system
export { isHardQuiz } from './difficulty';

// Quiz generators (for custom quiz generation)
export {
  genSUM,
  genMISSING,
  genCOMPARE,
  genPAIR,
  genORDER,
  genMAX_MIN,
  genPAIR_DIFF,
  genMAX_MIN_EXPR,
  genORDER_SUM,
  genCOMPARE_EXPR,
  genRANGE_DIFF,
  genMULTI_SELECT_MULTIPLES
} from './generators';
