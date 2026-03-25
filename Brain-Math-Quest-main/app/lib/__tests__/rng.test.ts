/**
 * Tests for RNG (Random Number Generator) module
 * 
 * Tests deterministic seeded RNG behavior and fallback to Math.random.
 * Critical for reproducible tests and game behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setSeed, R, pick, shuffle, __rngDebugState } from '../rng';

describe('RNG module', () => {
  beforeEach(() => {
    // Reset to unseeded state before each test
    setSeed(undefined);
  });

  describe('setSeed', () => {
    it('should enable seeded mode with valid seed', () => {
      setSeed(12345);
      const state = __rngDebugState();
      expect(state.useSeeded).toBe(true);
      expect(state.state).toBeGreaterThan(0);
    });

    it('should disable seeded mode with undefined', () => {
      setSeed(12345);
      setSeed(undefined);
      const state = __rngDebugState();
      expect(state.useSeeded).toBe(false);
    });

    it('should disable seeded mode with null', () => {
      setSeed(12345);
      setSeed(null as any);
      const state = __rngDebugState();
      expect(state.useSeeded).toBe(false);
    });

    it('should handle zero seed by converting to 1', () => {
      setSeed(0);
      const state = __rngDebugState();
      expect(state.useSeeded).toBe(true);
      expect(state.state).toBe(1);
    });

    it('should produce deterministic sequence with same seed', () => {
      setSeed(42);
      const values1 = [R(1, 100), R(1, 100), R(1, 100)];
      
      setSeed(42);
      const values2 = [R(1, 100), R(1, 100), R(1, 100)];
      
      expect(values1).toEqual(values2);
    });

    it('should produce different sequences with different seeds', () => {
      setSeed(42);
      const values1 = [R(1, 100), R(1, 100), R(1, 100)];
      
      setSeed(123);
      const values2 = [R(1, 100), R(1, 100), R(1, 100)];
      
      expect(values1).not.toEqual(values2);
    });
  });

  describe('R (integer random)', () => {
    it('should return values within inclusive range [a, b]', () => {
      setSeed(12345);
      for (let i = 0; i < 100; i++) {
        const value = R(1, 10);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should return single value when a === b', () => {
      setSeed(12345);
      expect(R(5, 5)).toBe(5);
      expect(R(100, 100)).toBe(100);
    });

    it('should handle negative ranges', () => {
      setSeed(12345);
      for (let i = 0; i < 50; i++) {
        const value = R(-10, -5);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThanOrEqual(-5);
      }
    });

    it('should handle ranges spanning negative and positive', () => {
      setSeed(12345);
      for (let i = 0; i < 50; i++) {
        const value = R(-5, 5);
        expect(value).toBeGreaterThanOrEqual(-5);
        expect(value).toBeLessThanOrEqual(5);
      }
    });

    it('should be deterministic with seed', () => {
      setSeed(999);
      const sequence1 = Array.from({ length: 20 }, () => R(1, 100));
      
      setSeed(999);
      const sequence2 = Array.from({ length: 20 }, () => R(1, 100));
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should produce non-deterministic values without seed', () => {
      // Without seed, should use Math.random
      const values = Array.from({ length: 10 }, () => R(1, 1000));
      // All values being the same is extremely unlikely with Math.random
      const allSame = values.every(v => v === values[0]);
      expect(allSame).toBe(false);
    });
  });

  describe('pick', () => {
    it('should return an element from the array', () => {
      setSeed(12345);
      const arr = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 20; i++) {
        const picked = pick(arr);
        expect(arr).toContain(picked);
      }
    });

    it('should return the only element from single-element array', () => {
      setSeed(12345);
      expect(pick(['only'])).toBe('only');
    });

    it('should be deterministic with seed', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      setSeed(555);
      const picks1 = Array.from({ length: 10 }, () => pick(arr));
      
      setSeed(555);
      const picks2 = Array.from({ length: 10 }, () => pick(arr));
      
      expect(picks1).toEqual(picks2);
    });

    it('should eventually pick different elements', () => {
      setSeed(12345);
      const arr = ['a', 'b', 'c', 'd', 'e'];
      const picks = Array.from({ length: 50 }, () => pick(arr));
      const uniquePicks = new Set(picks);
      // With 50 picks from 5 elements, should get at least 3 different ones
      expect(uniquePicks.size).toBeGreaterThanOrEqual(3);
    });

    it('should work with readonly arrays', () => {
      setSeed(12345);
      const arr = ['x', 'y', 'z'] as const;
      const picked = pick(arr);
      expect(arr).toContain(picked);
    });
  });

  describe('shuffle', () => {
    it('should return array with same length', () => {
      setSeed(12345);
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(arr.length);
    });

    it('should contain all original elements', () => {
      setSeed(12345);
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = shuffle(arr);
      expect(shuffled.sort((a, b) => a - b)).toEqual(arr);
    });

    it('should not modify original array', () => {
      setSeed(12345);
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffle(arr);
      expect(arr).toEqual(original);
    });

    it('should be deterministic with seed', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      setSeed(777);
      const shuffled1 = shuffle(arr);
      
      setSeed(777);
      const shuffled2 = shuffle(arr);
      
      expect(shuffled1).toEqual(shuffled2);
    });

    it('should shuffle the array (not always same order)', () => {
      setSeed(12345);
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = shuffle(arr);
      // Extremely unlikely to be in exact same order after shuffle
      expect(shuffled).not.toEqual(arr);
    });

    it('should handle single-element array', () => {
      setSeed(12345);
      const arr = [42];
      const shuffled = shuffle(arr);
      expect(shuffled).toEqual([42]);
    });

    it('should handle empty array', () => {
      setSeed(12345);
      const arr: number[] = [];
      const shuffled = shuffle(arr);
      expect(shuffled).toEqual([]);
    });

    it('should work with readonly arrays', () => {
      setSeed(12345);
      const arr = [1, 2, 3, 4, 5] as const;
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(5);
      expect(shuffled.slice().sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('determinism across multiple functions', () => {
    it('should maintain deterministic sequence across R, pick, and shuffle', () => {
      setSeed(12345);
      const results1 = {
        r: [R(1, 10), R(50, 100)],
        pick: pick([1, 2, 3, 4, 5]),
        shuffle: shuffle([1, 2, 3])
      };

      setSeed(12345);
      const results2 = {
        r: [R(1, 10), R(50, 100)],
        pick: pick([1, 2, 3, 4, 5]),
        shuffle: shuffle([1, 2, 3])
      };

      expect(results1).toEqual(results2);
    });
  });
});
