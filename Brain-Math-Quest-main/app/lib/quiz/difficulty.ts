import { Quiz, hasChips, isChoices2UI } from './types';

/**
 * Individual quiz type difficulty checkers
 */
const quizDifficultyCheckers = {
  SUM: (q: Quiz): boolean => {
    const plusCount = (q.expr?.match(/\+/g) || []).length;
    const nums = (q.expr?.match(/\d+/g) || []).map(Number);
    const maxv = nums.length ? Math.max(...nums) : 0;
    return (plusCount + 1) >= 5 && maxv >= 30 || (plusCount + 1) >= 4 && maxv >= 40;
  },

  MISSING: (q: Quiz): boolean => {
    if (q.expr?.includes('×')) {
      const nums = (q.expr.match(/\d+/g) || []).map(Number);
      const a = nums[0] ?? 0;
      const b = nums[1] ?? 0;
      const prod = a * b;
      return a >= 8 && b >= 8 || prod >= 64;
    }
    const nums = (q.expr?.match(/\d+/g) || []).map(Number);
    const maxv = nums.length ? Math.max(...nums) : 0;
    return maxv >= 40;
  },

  COMPARE: (q: Quiz): boolean => {
    if (!isChoices2UI(q.ui)) return false;
    const l: string = q.ui.left ?? '';
    const r: string = q.ui.right ?? '';
    const hasMul = (s: string) => s.includes('×');
    const bigNums = (s: string) => (s.match(/\d+/g) || []).map(Number).some(v => v >= 12);
    return (hasMul(l) && hasMul(r)) || ((hasMul(l) || hasMul(r)) && (bigNums(l) || bigNums(r)));
  },

  PAIR: (q: Quiz): boolean => {
    if (!hasChips(q.ui)) return false;
    const chips = q.ui.chips;
    const n = chips.length;
    const maxv = chips.reduce((m, c) => Math.max(m, c.value), 0);
    return n >= 6 && maxv >= 24;
  },

  ORDER: (q: Quiz): boolean => {
    if (!hasChips(q.ui)) return false;
    const chips = q.ui.chips;
    const n = chips.length;
    const setSize = new Set(chips.map(c => c.value)).size;
    return n >= 6 || setSize < n;
  },

  EVEN_ODD: (q: Quiz): boolean => {
    const nums = (q.prompt?.match(/\d+/g) || []).map(Number);
    const maxv = nums.length ? Math.max(...nums) : 0;
    return maxv >= 50;
  },

  MAX_MIN: (q: Quiz): boolean => {
    if (!hasChips(q.ui)) return false;
    const chips = q.ui.chips;
    const n = chips.length;
    const maxv = chips.reduce((m, c) => Math.max(m, c.value), 0);
    return n >= 6 && maxv >= 30;
  },

  PAIR_DIFF: (q: Quiz): boolean => {
    if (!hasChips(q.ui)) return false;
    const chips = q.ui.chips;
    const n = chips.length;
    const maxv = chips.reduce((m, c) => Math.max(m, c.value), 0);
    return n >= 6 && maxv >= 28;
  },

  MAX_MIN_EXPR: (q: Quiz): boolean => {
    if (!hasChips(q.ui)) return false;
    const chips = q.ui.chips;
    const hasMul = chips.some(c => c.text.includes('×'));
    const maxv = chips.reduce((m, c) => Math.max(m, c.value), 0);
    return hasMul && maxv >= 30;
  },

  ORDER_SUM: (q: Quiz): boolean => {
    if (!hasChips(q.ui)) return false;
    const chips = q.ui.chips;
    const n = chips.length;
    return n >= 4;
  },

  COMPARE_EXPR: (q: Quiz): boolean => {
    if (!isChoices2UI(q.ui)) return false;
    const l: string = q.ui.left ?? '';
    const r: string = q.ui.right ?? '';
    const hasMul = (s: string) => s.includes('×');
    return hasMul(l) && hasMul(r);
  },

  MEDIAN: (q: Quiz): boolean => {
    if (!hasChips(q.ui)) return false;
    const chips = q.ui.chips;
    const n = chips.length;
    const maxv = chips.reduce((m, c) => Math.max(m, c.value), 0);
    return n >= 7 || maxv >= 40;
  },

  RANGE_DIFF: (q: Quiz): boolean => {
    const nums = (q.expr?.match(/\d+/g) || []).map(Number);
    const maxv = nums.length ? Math.max(...nums) : 0;
    return maxv >= 40;
  },

  MULTI_SELECT_MULTIPLES: (q: Quiz): boolean => {
    if (!hasChips(q.ui)) return false;
    const chips = q.ui.chips;
    const n = chips.length;
    const maxv = chips.reduce((m, c) => Math.max(m, c.value), 0);
    return n >= 8 && maxv >= 40;
  },
};

// 難問判定（生成ロジックから分離して純粋化）
export function isHardQuiz(q: Quiz): boolean {
  try {
    const checker = quizDifficultyCheckers[q.type as keyof typeof quizDifficultyCheckers];
    if (checker) {
      return checker(q);
    }
    return false;
  } catch (error) {
    console.error('Error in isHardQuiz:', error, q);
    return false;
  }
}
