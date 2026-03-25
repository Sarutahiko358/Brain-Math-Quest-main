import { describe, it, expect } from 'vitest';
import { genSUM, genMISSING, genCOMPARE, genPAIR, genORDER, genMAX_MIN, makeQuizPack } from '../generators';
import { isHardQuiz } from '../difficulty';
import { isChoices2UI, isChipsOrderUI, isChipsUI, getChipValues } from '../types';

const RANGE = 30;

describe('quiz generators basic shape', () => {
  it('genSUM returns SUM quiz with expr and answer', () => {
    const q = genSUM(RANGE);
    expect(q.type).toBe('SUM');
    expect(q.expr).toMatch(/=/);
    expect(q.answer).toMatch(/\d+/);
  });
  it('genMISSING returns MISSING quiz with ? placeholder', () => {
    const q = genMISSING(RANGE, true);
    expect(q.type).toBe('MISSING');
    expect(q.expr).toMatch(/？/);
  });
  it('genCOMPARE returns left/right choices', () => {
    const q = genCOMPARE(RANGE, true);
    expect(q.ui.kind).toBe('choices2');
    if (isChoices2UI(q.ui)) {
      expect(q.ui.left).toBeTruthy();
      expect(q.ui.right).toBeTruthy();
    }
  });
  it('genPAIR returns chips with checkFn', () => {
    const q = genPAIR(RANGE);
    expect(q.ui.kind).toBe('chips');
    expect(typeof q.checkFn).toBe('function');
  });
  it('genORDER returns chips-order with JSON answer', () => {
    const q = genORDER(RANGE, { order: 'asc' });
    expect(q.ui.kind).toBe('chips-order');
    expect(() => JSON.parse(q.answer)).not.toThrow();

    if (isChipsOrderUI(q.ui)) {
      const vals = getChipValues(q.ui);
      // 重複がないこと
      expect(new Set(vals).size).toBe(vals.length);
      // 昇順の正解
      const parsed = JSON.parse(q.answer);
      expect(parsed).toEqual([...vals].sort((a, b) => a - b));
    }
  });

  it('genORDER supports desc mode', () => {
    const q = genORDER(RANGE, { order: 'desc' });
    expect(q.ui.kind).toBe('chips-order');

    if (isChipsOrderUI(q.ui)) {
      const vals = getChipValues(q.ui);
      const parsed = JSON.parse(q.answer);
      expect(parsed).toEqual([...vals].sort((a, b) => b - a));
    }
  });
  it('genMAX_MIN returns chips quiz', () => {
    const q = genMAX_MIN(RANGE);
    expect(q.type).toBe('MAX_MIN');
    expect(q.ui.kind).toBe('chips');

    if (isChipsUI(q.ui)) {
      const vals = getChipValues(q.ui);
      // 重複がないこと
      expect(new Set(vals).size).toBe(vals.length);
    }
  });
});

describe('makeQuizPack integration', () => {
  it('respects hardQuizRandom=false (rarely hard)', () => {
    let hard = 0;
    for (let i = 0; i < 40; i++) {
      const { quiz } = makeQuizPack('normal', 'attack', { hardQuizRandom: false });
      if (isHardQuiz(quiz)) hard++;
    }
    expect(hard).toBeLessThan(8);
  });
});
