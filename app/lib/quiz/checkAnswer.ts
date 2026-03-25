// filepath: /home/runner/work/Brain-Math-Quest/Brain-Math-Quest/app/lib/quiz/checkAnswer.ts
import { Quiz, Scratch } from './types';

/**
 * Check PAIR type answer: sum of two selected values equals answer
 */
function checkPairAnswer(sc: Scratch, answer: string): boolean {
  if (sc.sel.length !== 2) return false;
  const sum = sc.sel[0].value + sc.sel[1].value;
  return String(sum) === answer;
}

/**
 * Check PAIR_DIFF type answer: absolute difference of two selected values equals answer
 */
function checkPairDiffAnswer(sc: Scratch, answer: string): boolean {
  if (sc.sel.length !== 2) return false;
  const diff = Math.abs(sc.sel[0].value - sc.sel[1].value);
  return String(diff) === answer;
}

/**
 * Check MAX_MIN type answer: single selected value equals answer
 */
function checkMaxMinAnswer(sc: Scratch, answer: string): boolean {
  if (sc.sel.length !== 1) return false;
  return String(sc.sel[0].value) === answer;
}

/**
 * Check ORDER type answer: sequence matches JSON array answer
 */
function checkOrderAnswer(sc: Scratch, answer: string): boolean {
  try {
    const expectedArray = JSON.parse(answer || '[]');
    if (!Array.isArray(expectedArray)) return false;
    if (sc.seq.length !== expectedArray.length) return false;
    return sc.seq.every((v, i) => v === expectedArray[i]);
  } catch {
    return false;
  }
}

/**
 * Check choices2 type answer: selected value matches answer
 * For choices2, value 0 = 'L' (left), value 1 = 'R' (right)
 */
function checkChoices2Answer(sc: Scratch, answer: string): boolean {
  if (sc.sel.length !== 1) return false;
  const selectedChoice = sc.sel[0].value === 0 ? 'L' : 'R';
  return selectedChoice === answer;
}

/**
 * Check quiz answer against scratch state
 *
 * @param q - Quiz question
 * @param sc - Scratch state containing user's answer
 * @returns true if answer is correct, false otherwise
 */
export function checkAnswer(q: Quiz, sc: Scratch): boolean {
  // Use custom check function if provided
  if (q.checkFn) return q.checkFn(sc);

  // Check UI type for choices2 (left/right button selection)
  if (q.ui.kind === 'choices2') {
    return checkChoices2Answer(sc, q.answer);
  }

  // Handle each quiz type
  switch (q.type) {
    // Multi-select must use checkFn
    case "MULTI_SELECT_MULTIPLES":
      return false;

    // Pair operations
    case "PAIR":
    case "FACTOR_PAIR":
      return checkPairAnswer(sc, q.answer);

    case "PAIR_DIFF":
      return checkPairDiffAnswer(sc, q.answer);

    // Max/Min selection
    case "MAX_MIN":
    case "MAX_MIN_EXPR":
      return checkMaxMinAnswer(sc, q.answer);

    // Ordering
    case "ORDER":
    case "ORDER_SUM":
      return checkOrderAnswer(sc, q.answer);

    // Default: simple text comparison
    default:
      return String(sc.val).trim() === q.answer.trim();
  }
}
