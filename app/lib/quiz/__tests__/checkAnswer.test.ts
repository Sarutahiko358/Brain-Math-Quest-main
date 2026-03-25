import { describe, it, expect } from 'vitest';
import { checkAnswer } from '../checkAnswer';
import { Quiz, Scratch } from '../types';

describe('checkAnswer', () => {
  it('checks SUM type correctly', () => {
    const quiz: Quiz = {
      type: 'SUM',
      prompt: '5 + 5 = ?',
      answer: '10',
      ui: { kind: 'input' },
    };
    const scratch: Scratch = { val: '10', sel: [], seq: [], seqIds: [] };
    expect(checkAnswer(quiz, scratch)).toBe(true);
  });

  it('rejects incorrect SUM answer', () => {
    const quiz: Quiz = {
      type: 'SUM',
      prompt: '5 + 5 = ?',
      answer: '10',
      ui: { kind: 'input' },
    };
    const scratch: Scratch = { val: '11', sel: [], seq: [], seqIds: [] };
    expect(checkAnswer(quiz, scratch)).toBe(false);
  });

  it('checks PAIR type correctly', () => {
    const quiz: Quiz = {
      type: 'PAIR',
      prompt: 'Find pair that sums to 10',
      answer: '10',
      ui: { kind: 'chips', chips: [] },
    };
    const scratch: Scratch = {
      val: '',
      sel: [
        { id: 1, value: 3, text: '3' },
        { id: 2, value: 7, text: '7' },
      ],
      seq: [],
      seqIds: [],
    };
    expect(checkAnswer(quiz, scratch)).toBe(true);
  });

  it('uses custom checkFn when provided', () => {
    const quiz: Quiz = {
      type: 'SUM',
      prompt: 'Custom check',
      answer: '10',
      ui: { kind: 'input' },
      checkFn: (sc: Scratch) => sc.val === 'custom',
    };
    const scratch: Scratch = { val: 'custom', sel: [], seq: [], seqIds: [] };
    expect(checkAnswer(quiz, scratch)).toBe(true);
  });
});
