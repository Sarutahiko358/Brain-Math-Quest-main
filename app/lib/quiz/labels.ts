/**
 * Quiz type label utilities
 */
import { QuizType } from './types';

/**
 * Get Japanese label for a quiz type
 * @param t Quiz type or string representation
 * @returns Japanese label string
 */
export function labelOfType(t?: QuizType | string): string {
  const m: Record<string, string> = {
    SUM: '合計',
    MISSING: '穴埋め',
    COMPARE: '大小比較',
    PAIR: 'ペア',
    ORDER: '並び替え',
    MAX_MIN: '最大最小',
    PAIR_DIFF: 'ペア差分',
    MAX_MIN_EXPR: '式最大最小',
    ORDER_SUM: '合計順',
    COMPARE_EXPR: '式比較',
    RANGE_DIFF: '範囲差',
    MULTI_SELECT_MULTIPLES: '倍数選択',
    PRIME: '素数判定',
    SQUARE_ROOT: '平方数判定',
    FACTOR_PAIR: '因数ペア',
    ARITHMETIC_SEQUENCE: '等差数列',
    DIVISOR_COUNT: '約数の個数',
    COMMON_DIVISOR: '最大公約数',
    PATTERN_NEXT: '数列パターン',
    MODULO: '余りの計算',
    EQUATION_BALANCE: '等式のバランス',
    FRACTION_COMPARE: '分数の比較',
    '-': '-',
    '': '-',
  };
  const key = (t ?? '').toString();
  return m[key] ?? key;
}
