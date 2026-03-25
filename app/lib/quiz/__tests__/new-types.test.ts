import { describe, it, expect } from 'vitest';
import {
  genPAIR_DIFF,
  genMAX_MIN_EXPR,
  genORDER_SUM,
  genCOMPARE_EXPR,
  genRANGE_DIFF,
  genMULTI_SELECT_MULTIPLES
} from '../generators';
import {
  isChipsUI,
  isChipsOrderUI,
  isChipsMultiUI,
  isChoices2UI,
  getChips,
  getChipCount
} from '../types';

const RANGE = 30;

describe('New quiz types', () => {
  it('genPAIR_DIFF returns PAIR_DIFF quiz with difference target', () => {
    const q = genPAIR_DIFF(RANGE);
    expect(q.type).toBe('PAIR_DIFF');
    expect(q.ui.kind).toBe('chips');
    expect(typeof q.checkFn).toBe('function');

    if (isChipsUI(q.ui)) {
      const chipCount = getChipCount(q.ui);
      expect(chipCount).toBeGreaterThanOrEqual(4);
      expect(chipCount).toBeLessThanOrEqual(6);
    }
  });

  it('genMAX_MIN_EXPR returns expression-based MAX_MIN', () => {
    const q = genMAX_MIN_EXPR(RANGE, true);
    expect(q.type).toBe('MAX_MIN_EXPR');
    expect(q.ui.kind).toBe('chips');

    if (isChipsUI(q.ui)) {
      const chips = getChips(q.ui);
      expect(chips).toBeDefined();
      if (chips) {
        expect(chips.length).toBeGreaterThanOrEqual(4);
        // Check that chips contain expressions
        const hasExpression = chips.some(chip =>
          String(chip.text).includes('+') ||
          String(chip.text).includes('-') ||
          String(chip.text).includes('×')
        );
        expect(hasExpression).toBe(true);
      }
    }
  });

  it('genORDER_SUM returns sum-based ordering quiz', () => {
    const q = genORDER_SUM(RANGE, false);
    expect(q.type).toBe('ORDER_SUM');
    expect(q.ui.kind).toBe('chips-order');

    if (isChipsOrderUI(q.ui)) {
      const chipCount = getChipCount(q.ui);
      expect(chipCount).toBeGreaterThanOrEqual(3);
      expect(chipCount).toBeLessThanOrEqual(4);
    }
  });

  it('genCOMPARE_EXPR returns expression comparison quiz', () => {
    const q = genCOMPARE_EXPR(RANGE, true);
    expect(q.type).toBe('COMPARE_EXPR');
    expect(q.ui.kind).toBe('choices2');

    if (isChoices2UI(q.ui)) {
      expect(q.ui.left).toBeTruthy();
      expect(q.ui.right).toBeTruthy();
    }
  });

  it('genRANGE_DIFF returns range difference quiz', () => {
    const q = genRANGE_DIFF(RANGE);
    expect(q.type).toBe('RANGE_DIFF');
    expect(q.ui.kind).toBe('input');
    expect(q.expr).toContain('[');
    expect(q.answer).toMatch(/^\d+$/);
  });

  it('genMULTI_SELECT_MULTIPLES returns multiple selection quiz', () => {
    const q = genMULTI_SELECT_MULTIPLES(RANGE);
    expect(q.type).toBe('MULTI_SELECT_MULTIPLES');
    expect(q.ui.kind).toBe('chips-multi');
    expect(typeof q.checkFn).toBe('function');

    if (isChipsMultiUI(q.ui)) {
      const chipCount = getChipCount(q.ui);
      expect(chipCount).toBeGreaterThanOrEqual(6);
      expect(chipCount).toBeLessThanOrEqual(8);
    }
  });

  it('genCOMPARE_EXPR does not produce negative results', () => {
    for (let i = 0; i < 20; i++) {
      const q = genCOMPARE_EXPR(RANGE, true);

      if (isChoices2UI(q.ui)) {
        const { left, right } = q.ui;

        // Parse and evaluate each side
        const evalExpr = (expr: string): number => {
          const parts = expr.match(/(\d+)\s*([+\-×])\s*(\d+)/);
          if (!parts) return 0;
          const a = parseInt(parts[1]);
          const b = parseInt(parts[3]);
          const op = parts[2];
          if (op === '+') return a + b;
          if (op === '-') return a - b;
          if (op === '×') return a * b;
          return 0;
        };

        const leftVal = evalExpr(left);
        const rightVal = evalExpr(right);

        expect(leftVal).toBeGreaterThanOrEqual(0);
        expect(rightVal).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('genMAX_MIN_EXPR does not produce negative results', () => {
    for (let i = 0; i < 20; i++) {
      const q = genMAX_MIN_EXPR(RANGE, true);

      if (isChipsUI(q.ui)) {
        const chips = getChips(q.ui);
        expect(chips).toBeDefined();
        if (chips) {
          chips.forEach(chip => {
            expect(chip.value).toBeGreaterThanOrEqual(0);
          });
        }
      }
    }
  });
});
