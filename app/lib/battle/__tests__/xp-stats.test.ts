import { describe, it, expect } from 'vitest';
import { nextExpFor } from '../xp';
import { effATK, effDEF } from '../stats';

// Minimal mock Player matching required fields
const mockPlayer = (over: Partial<any> = {}) => ({
  baseATK: 5,
  baseDEF: 4,
  equip: { weapon: { name: 'w', atk: 3, price: 0 }, armor: { name: 'a', def: 2, price: 0 } },
  ...over
});

describe('nextExpFor progression', () => {
  it('is strictly increasing for first 10 levels', () => {
    const seq = Array.from({ length: 10 }, (_, i) => nextExpFor(i + 1));
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]).toBeGreaterThan(seq[i - 1]);
    }
  });
});

describe('effATK / effDEF', () => {
  it('adds equipment stats', () => {
    const p = mockPlayer();
    expect(effATK(p as any)).toBe(5 + 3);
    expect(effDEF(p as any)).toBe(4 + 2);
  });
});
