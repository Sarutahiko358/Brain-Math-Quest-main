/**
 * Dojo Training System for Library Mode
 *
 * Provides area-specific training modes where players can practice
 * calculation types related to each area's theme.
 */

import { QuizType } from './quiz/types';

/**
 * Training mode configuration for an area
 */
export type AreaTrainingMode = {
  name: string;
  description: string;
  quizTypes: QuizType[];
  difficulty?: 'easy' | 'normal' | 'hard';
};

/**
 * Get training modes available for a specific area in library mode
 */
export function getAreaTrainingModes(area: number): AreaTrainingMode[] {
  switch (area) {
    case 1: // 数の門 - Basic arithmetic
      return [
        {
          name: "基礎計算",
          description: "足し算と引き算の基本を練習",
          quizTypes: ['SUM', 'MISSING', 'COMPARE'],
          difficulty: 'easy'
        },
        {
          name: "数の大小",
          description: "数の比較や順序を学ぶ",
          quizTypes: ['COMPARE', 'ORDER', 'MAX_MIN'],
          difficulty: 'easy'
        }
      ];

    case 2: // 足し算の平原 - Addition focused
      return [
        {
          name: "足し算特訓",
          description: "様々な足し算の問題を練習",
          quizTypes: ['SUM', 'MISSING', 'PAIR'],
          difficulty: 'normal'
        },
        {
          name: "10の補数",
          description: "10を作る組み合わせを見つける",
          quizTypes: ['PAIR', 'MISSING'],
          difficulty: 'easy'
        },
        {
          name: "合計順序",
          description: "複数の数の和を比較",
          quizTypes: ['ORDER_SUM', 'COMPARE_EXPR'],
          difficulty: 'normal'
        }
      ];

    case 3: // 引き算の森 - Subtraction focused
      return [
        {
          name: "引き算特訓",
          description: "様々な引き算の問題を練習",
          quizTypes: ['MISSING', 'COMPARE', 'PAIR_DIFF'],
          difficulty: 'normal'
        },
        {
          name: "差を求める",
          description: "数の差を計算する練習",
          quizTypes: ['PAIR_DIFF', 'RANGE_DIFF'],
          difficulty: 'normal'
        }
      ];

    case 4: // 掛け算の山 - Multiplication focused
      return [
        {
          name: "掛け算特訓",
          description: "掛け算の九九と応用を練習",
          quizTypes: ['MISSING', 'COMPARE', 'MULTI_SELECT_MULTIPLES'],
          difficulty: 'normal'
        },
        {
          name: "倍数の判定",
          description: "倍数を見つける練習",
          quizTypes: ['MULTI_SELECT_MULTIPLES'],
          difficulty: 'normal'
        },
        {
          name: "因数分解",
          description: "数を因数に分解",
          quizTypes: ['FACTOR_PAIR', 'DIVISOR_COUNT'],
          difficulty: 'hard'
        }
      ];

    case 5: // 割り算の谷 - Division focused
      return [
        {
          name: "割り算特訓",
          description: "割り算の基本と応用を練習",
          quizTypes: ['MISSING', 'COMPARE'],
          difficulty: 'normal'
        },
        {
          name: "約数と倍数",
          description: "約数や公約数を求める",
          quizTypes: ['DIVISOR_COUNT', 'COMMON_DIVISOR'],
          difficulty: 'hard'
        },
        {
          name: "余りの計算",
          description: "割り算の余りを理解",
          quizTypes: ['MODULO'],
          difficulty: 'hard'
        }
      ];

    case 6: // 四聖獣の神殿 - All operations
      return [
        {
          name: "四則演算総合",
          description: "全ての計算を組み合わせた問題",
          quizTypes: ['COMPARE_EXPR', 'MAX_MIN_EXPR', 'ORDER_SUM'],
          difficulty: 'hard'
        },
        {
          name: "数列と規則性",
          description: "数のパターンを見つける",
          quizTypes: ['ARITHMETIC_SEQUENCE', 'PATTERN_NEXT'],
          difficulty: 'hard'
        }
      ];

    case 7: // 分数の迷宮 - Fractions
      return [
        {
          name: "分数の比較",
          description: "分数の大小を判定",
          quizTypes: ['FRACTION_COMPARE'],
          difficulty: 'hard'
        },
        {
          name: "分数と小数",
          description: "分数と小数の変換",
          quizTypes: ['FRACTION_COMPARE', 'COMPARE'],
          difficulty: 'hard'
        }
      ];

    case 8: // 方程式の塔 - Equations
      return [
        {
          name: "方程式の解法",
          description: "一次方程式を解く",
          quizTypes: ['EQUATION_BALANCE', 'MISSING'],
          difficulty: 'hard'
        },
        {
          name: "等式の性質",
          description: "等式を保ったまま変形",
          quizTypes: ['EQUATION_BALANCE'],
          difficulty: 'hard'
        }
      ];

    case 9: // 数の玉座 - All types
      return [
        {
          name: "総合問題",
          description: "全ての問題タイプをランダムに出題",
          quizTypes: ['SUM', 'MISSING', 'COMPARE', 'PAIR', 'ORDER', 'MAX_MIN', 'COMPARE_EXPR', 'EQUATION_BALANCE', 'FRACTION_COMPARE'],
          difficulty: 'hard'
        },
        {
          name: "高難度挑戦",
          description: "最も難しい問題に挑戦",
          quizTypes: ['EQUATION_BALANCE', 'FRACTION_COMPARE', 'MODULO', 'ARITHMETIC_SEQUENCE'],
          difficulty: 'hard'
        },
        {
          name: "素数と平方根",
          description: "数の性質を深く理解",
          quizTypes: ['PRIME', 'SQUARE_ROOT', 'FACTOR_PAIR'],
          difficulty: 'hard'
        }
      ];

    default:
      // Fallback: basic training
      return [
        {
          name: "基本練習",
          description: "基礎的な計算問題",
          quizTypes: ['SUM', 'MISSING', 'COMPARE'],
          difficulty: 'normal'
        }
      ];
  }
}

/**
 * Get a random quiz type from a training mode
 */
export function getRandomQuizTypeFromMode(mode: AreaTrainingMode): QuizType {
  const types = mode.quizTypes;
  return types[Math.floor(Math.random() * types.length)];
}
