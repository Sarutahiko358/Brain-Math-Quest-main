import { describe, it, expect } from 'vitest';
import {
  genMODULO,
  genEQUATION_BALANCE,
  genFRACTION_COMPARE
} from '../generators';
import {
  isInputUI,
  isChoices2UI
} from '../types';

const RANGE = 30;

describe('Additional quiz types - Wave 2', () => {
  describe('genMODULO', () => {
    it('returns MODULO quiz with modulo calculation', () => {
      const q = genMODULO(RANGE);
      expect(q.type).toBe('MODULO');
      expect(q.ui.kind).toBe('input');
      expect(q.prompt).toContain('余り');

      if (isInputUI(q.ui)) {
        const remainder = parseInt(q.answer);
        expect(remainder).toBeGreaterThanOrEqual(0);
      }
    });

    it('generates valid modulo problems', () => {
      for (let i = 0; i < 20; i++) {
        const q = genMODULO(RANGE);

        // Extract dividend and divisor from prompt
        const match = q.prompt.match(/(\d+)\s*÷\s*(\d+)/);
        expect(match).toBeTruthy();

        if (match) {
          const dividend = parseInt(match[1]);
          const divisor = parseInt(match[2]);
          const remainder = parseInt(q.answer);

          // Verify: dividend = divisor * quotient + remainder
          expect(remainder).toBeLessThan(divisor);
          expect(remainder).toBeGreaterThanOrEqual(0);
          expect(dividend % divisor).toBe(remainder);
        }
      }
    });

    it('divisor is always at least 2', () => {
      for (let i = 0; i < 20; i++) {
        const q = genMODULO(RANGE);
        const match = q.prompt.match(/÷\s*(\d+)/);

        if (match) {
          const divisor = parseInt(match[1]);
          expect(divisor).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });

  describe('genEQUATION_BALANCE', () => {
    it('returns EQUATION_BALANCE quiz with equation', () => {
      const q = genEQUATION_BALANCE(RANGE);
      expect(q.type).toBe('EQUATION_BALANCE');
      expect(q.ui.kind).toBe('input');
      expect(q.expr).toContain('?');
      expect(q.expr).toContain('=');

      if (isInputUI(q.ui)) {
        const answer = parseInt(q.answer);
        expect(answer).toBeGreaterThan(0);
      }
    });

    it('generates valid simple equations', () => {
      for (let i = 0; i < 20; i++) {
        const q = genEQUATION_BALANCE(15); // Use smaller range to force simple equations

        if (q.expr) {
          const answer = parseInt(q.answer);
          expect(answer).toBeGreaterThanOrEqual(0);

          // Test simple format: "a + ? = b"
          const simpleMatch = q.expr.match(/^(\d+)\s*\+\s*\?\s*=\s*(\d+)$/);
          if (simpleMatch) {
            const a = parseInt(simpleMatch[1]);
            const b = parseInt(simpleMatch[2]);
            expect(a + answer).toBe(b);
          }

          // Test reverse format: "? + a = b"
          const reverseMatch = q.expr.match(/^\?\s*\+\s*(\d+)\s*=\s*(\d+)$/);
          if (reverseMatch) {
            const a = parseInt(reverseMatch[1]);
            const b = parseInt(reverseMatch[2]);
            expect(answer + a).toBe(b);
          }
        }
      }
    });

    it('generates valid two-step equations', () => {
      for (let i = 0; i < 20; i++) {
        const q = genEQUATION_BALANCE(30);

        if (q.expr) {
          const answer = parseInt(q.answer);

          // Test two-step format: "a + ? = b × c"
          const twoStepMatch = q.expr.match(/^(\d+)\s*\+\s*\?\s*=\s*(\d+)\s*×\s*(\d+)$/);
          if (twoStepMatch) {
            const a = parseInt(twoStepMatch[1]);
            const b = parseInt(twoStepMatch[2]);
            const c = parseInt(twoStepMatch[3]);
            expect(a + answer).toBe(b * c);
          }
        }
      }
    });

    it('answer is always positive', () => {
      for (let i = 0; i < 20; i++) {
        const q = genEQUATION_BALANCE(RANGE);
        const answer = parseInt(q.answer);
        expect(answer).toBeGreaterThan(0);
      }
    });
  });

  describe('genFRACTION_COMPARE', () => {
    it('returns FRACTION_COMPARE quiz with two fractions', () => {
      const q = genFRACTION_COMPARE(RANGE);
      expect(q.type).toBe('FRACTION_COMPARE');
      expect(q.ui.kind).toBe('choices2');
      expect(['L', 'R']).toContain(q.answer);

      if (isChoices2UI(q.ui)) {
        expect(q.ui.left).toContain('/');
        expect(q.ui.right).toContain('/');
      }
    });

    it('generates valid fractions', () => {
      for (let i = 0; i < 20; i++) {
        const q = genFRACTION_COMPARE(RANGE);

        if (isChoices2UI(q.ui)) {
          const leftMatch = q.ui.left.match(/^(\d+)\/(\d+)$/);
          const rightMatch = q.ui.right.match(/^(\d+)\/(\d+)$/);

          expect(leftMatch).toBeTruthy();
          expect(rightMatch).toBeTruthy();

          if (leftMatch && rightMatch) {
            const numer1 = parseInt(leftMatch[1]);
            const denom1 = parseInt(leftMatch[2]);
            const numer2 = parseInt(rightMatch[1]);
            const denom2 = parseInt(rightMatch[2]);

            // Denominators should be at least 2
            expect(denom1).toBeGreaterThanOrEqual(2);
            expect(denom2).toBeGreaterThanOrEqual(2);

            // Numerators should be less than denominators (proper fractions)
            expect(numer1).toBeLessThan(denom1);
            expect(numer2).toBeLessThan(denom2);

            // Numerators should be at least 1
            expect(numer1).toBeGreaterThanOrEqual(1);
            expect(numer2).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    it('answer is correct based on fraction comparison', () => {
      for (let i = 0; i < 20; i++) {
        const q = genFRACTION_COMPARE(RANGE);

        if (isChoices2UI(q.ui)) {
          const leftMatch = q.ui.left.match(/^(\d+)\/(\d+)$/);
          const rightMatch = q.ui.right.match(/^(\d+)\/(\d+)$/);

          if (leftMatch && rightMatch) {
            const numer1 = parseInt(leftMatch[1]);
            const denom1 = parseInt(leftMatch[2]);
            const numer2 = parseInt(rightMatch[1]);
            const denom2 = parseInt(rightMatch[2]);

            // Cross multiply to compare
            const val1 = numer1 * denom2;
            const val2 = numer2 * denom1;

            if (val1 > val2) {
              expect(q.answer).toBe('L');
            } else {
              expect(q.answer).toBe('R');
            }
          }
        }
      }
    });

    it('generates different fractions (not equal)', () => {
      for (let i = 0; i < 20; i++) {
        const q = genFRACTION_COMPARE(RANGE);

        if (isChoices2UI(q.ui)) {
          const leftMatch = q.ui.left.match(/^(\d+)\/(\d+)$/);
          const rightMatch = q.ui.right.match(/^(\d+)\/(\d+)$/);

          if (leftMatch && rightMatch) {
            const numer1 = parseInt(leftMatch[1]);
            const denom1 = parseInt(leftMatch[2]);
            const numer2 = parseInt(rightMatch[1]);
            const denom2 = parseInt(rightMatch[2]);

            // Cross multiply - should not be equal
            const val1 = numer1 * denom2;
            const val2 = numer2 * denom1;

            expect(val1).not.toBe(val2);
          }
        }
      }
    });

    it('denominators are within reasonable range', () => {
      for (let i = 0; i < 20; i++) {
        const q = genFRACTION_COMPARE(RANGE);

        if (isChoices2UI(q.ui)) {
          const leftMatch = q.ui.left.match(/^(\d+)\/(\d+)$/);
          const rightMatch = q.ui.right.match(/^(\d+)\/(\d+)$/);

          if (leftMatch && rightMatch) {
            const denom1 = parseInt(leftMatch[2]);
            const denom2 = parseInt(rightMatch[2]);

            // Denominators should be reasonable (not too large)
            const maxDenom = Math.max(3, Math.min(8, Math.floor(RANGE / 3)));
            expect(denom1).toBeLessThanOrEqual(maxDenom);
            expect(denom2).toBeLessThanOrEqual(maxDenom);
          }
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('MODULO works with small range', () => {
      const q = genMODULO(10);
      expect(q.type).toBe('MODULO');
      expect(q.ui.kind).toBe('input');
    });

    it('EQUATION_BALANCE works with small range', () => {
      const q = genEQUATION_BALANCE(10);
      expect(q.type).toBe('EQUATION_BALANCE');
      expect(q.ui.kind).toBe('input');
    });

    it('FRACTION_COMPARE works with small range', () => {
      const q = genFRACTION_COMPARE(12);
      expect(q.type).toBe('FRACTION_COMPARE');
      expect(q.ui.kind).toBe('choices2');
    });
  });
});
