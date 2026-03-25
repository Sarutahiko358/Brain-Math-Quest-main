/**
 * Tests for Quiz label utilities
 * 
 * Tests the labelOfType function which provides Japanese labels for quiz types.
 */

import { describe, it, expect } from 'vitest';
import { labelOfType } from '../labels';
import type { QuizType } from '../types';

describe('Quiz Labels module', () => {
  describe('labelOfType', () => {
    it('should return correct Japanese label for SUM', () => {
      expect(labelOfType('SUM')).toBe('合計');
    });

    it('should return correct Japanese label for MISSING', () => {
      expect(labelOfType('MISSING')).toBe('穴埋め');
    });

    it('should return correct Japanese label for COMPARE', () => {
      expect(labelOfType('COMPARE')).toBe('大小比較');
    });

    it('should return correct Japanese label for PAIR', () => {
      expect(labelOfType('PAIR')).toBe('ペア');
    });

    it('should return correct Japanese label for ORDER', () => {
      expect(labelOfType('ORDER')).toBe('並び替え');
    });

    it('should return correct Japanese label for MAX_MIN', () => {
      expect(labelOfType('MAX_MIN')).toBe('最大最小');
    });

    it('should return correct Japanese label for PAIR_DIFF', () => {
      expect(labelOfType('PAIR_DIFF')).toBe('ペア差分');
    });

    it('should return correct Japanese label for MAX_MIN_EXPR', () => {
      expect(labelOfType('MAX_MIN_EXPR')).toBe('式最大最小');
    });

    it('should return correct Japanese label for ORDER_SUM', () => {
      expect(labelOfType('ORDER_SUM')).toBe('合計順');
    });

    it('should return correct Japanese label for COMPARE_EXPR', () => {
      expect(labelOfType('COMPARE_EXPR')).toBe('式比較');
    });

    it('should return correct Japanese label for RANGE_DIFF', () => {
      expect(labelOfType('RANGE_DIFF')).toBe('範囲差');
    });

    it('should return correct Japanese label for MULTI_SELECT_MULTIPLES', () => {
      expect(labelOfType('MULTI_SELECT_MULTIPLES')).toBe('倍数選択');
    });

    it('should return "-" for dash character', () => {
      expect(labelOfType('-')).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(labelOfType('')).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(labelOfType(undefined)).toBe('-');
    });

    it('should return the key itself for unknown quiz types', () => {
      expect(labelOfType('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
      expect(labelOfType('CUSTOM')).toBe('CUSTOM');
    });

    it('should handle typed QuizType values', () => {
      const quizType: QuizType = 'SUM';
      expect(labelOfType(quizType)).toBe('合計');
    });

    it('should handle all known quiz types', () => {
      const knownTypes: QuizType[] = [
        'SUM', 'MISSING', 'COMPARE', 'PAIR', 'ORDER',
        'MAX_MIN', 'PAIR_DIFF', 'MAX_MIN_EXPR', 'ORDER_SUM',
        'COMPARE_EXPR', 'RANGE_DIFF', 'MULTI_SELECT_MULTIPLES',
        'PRIME', 'SQUARE_ROOT', 'FACTOR_PAIR', 'ARITHMETIC_SEQUENCE',
        'DIVISOR_COUNT', 'COMMON_DIVISOR', 'PATTERN_NEXT',
        'MODULO', 'EQUATION_BALANCE', 'FRACTION_COMPARE'
      ];

      knownTypes.forEach(type => {
        const label = labelOfType(type);
        expect(label).toBeTruthy();
        expect(label).not.toBe(type); // Label should be Japanese, not English
      });
    });

    it('should be consistent for same input', () => {
      expect(labelOfType('SUM')).toBe(labelOfType('SUM'));
      expect(labelOfType('COMPARE')).toBe(labelOfType('COMPARE'));
    });

    it('should handle mixed case gracefully (exact match required)', () => {
      // Function does exact key match, so different case returns the key
      expect(labelOfType('sum')).toBe('sum');
      expect(labelOfType('Sum')).toBe('Sum');
    });
  });

  describe('labelOfType - all quiz types coverage', () => {
    const expectedMappings: Record<string, string> = {
      'SUM': '合計',
      'MISSING': '穴埋め',
      'COMPARE': '大小比較',
      'PAIR': 'ペア',
      'ORDER': '並び替え',
      'MAX_MIN': '最大最小',
      'PAIR_DIFF': 'ペア差分',
      'MAX_MIN_EXPR': '式最大最小',
      'ORDER_SUM': '合計順',
      'COMPARE_EXPR': '式比較',
      'RANGE_DIFF': '範囲差',
      'MULTI_SELECT_MULTIPLES': '倍数選択',
      'PRIME': '素数判定',
      'SQUARE_ROOT': '平方数判定',
      'FACTOR_PAIR': '因数ペア',
      'ARITHMETIC_SEQUENCE': '等差数列',
      'DIVISOR_COUNT': '約数の個数',
      'COMMON_DIVISOR': '最大公約数',
      'PATTERN_NEXT': '数列パターン',
      'MODULO': '余りの計算',
      'EQUATION_BALANCE': '等式のバランス',
      'FRACTION_COMPARE': '分数の比較',
    };

    it('should have correct mappings for all quiz types', () => {
      Object.entries(expectedMappings).forEach(([type, expectedLabel]) => {
        expect(labelOfType(type)).toBe(expectedLabel);
      });
    });

    it('should return consistent labels across multiple calls', () => {
      Object.keys(expectedMappings).forEach(type => {
        const firstCall = labelOfType(type);
        const secondCall = labelOfType(type);
        expect(firstCall).toBe(secondCall);
      });
    });
  });
});
