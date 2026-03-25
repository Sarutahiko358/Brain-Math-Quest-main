import { describe, it, expect } from 'vitest';
import { isHardQuiz } from '../difficulty';
import type { Quiz } from '../types';

describe('isHardQuiz heuristics', () => {
  it('SUM with many terms and big value is hard', () => {
    // 現行ロジック: (plusCount+1)>=5 かつ 最大値>=30 など
    const q: Quiz = {
      type: 'SUM',
      prompt: '',
      expr: '30 + 1 + 2 + 3 + 4 = ?',
      ui: { kind: 'input' },
      answer: '40'
    };
    expect(isHardQuiz(q)).toBe(true);
  });

  it('short small SUM is not hard', () => {
    const q: Quiz = {
      type: 'SUM',
      prompt: '',
      expr: '1 + 2 = ?',
      ui: { kind: 'input' },
      answer: '3'
    };
    expect(isHardQuiz(q)).toBe(false);
  });

  it('multiplication MISSING with large operands is hard', () => {
    const q: Quiz = {
      type: 'MISSING',
      prompt: '',
      expr: '？ × 8 = 64',
      ui: { kind: 'input' },
      answer: '8'
    };
    expect(isHardQuiz(q)).toBe(true);
  });
});
