/**
 * Math Utility Functions Test
 *
 * Unit tests for mathematical helper functions
 */

import { describe, it, expect } from 'vitest';
import { clamp } from '../math';

describe('Math Utilities', () => {
  describe('clamp', () => {
    it('should return the value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should return min when value is below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, 0, 10)).toBe(0);
      expect(clamp(Number.NEGATIVE_INFINITY, 0, 10)).toBe(0);
    });

    it('should return max when value exceeds max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, 0, 10)).toBe(10);
      expect(clamp(Number.POSITIVE_INFINITY, 0, 10)).toBe(10);
    });

    it('should work with negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    it('should work with decimal numbers', () => {
      expect(clamp(5.5, 0.0, 10.0)).toBe(5.5);
      expect(clamp(-0.5, 0.0, 10.0)).toBe(0.0);
      expect(clamp(10.5, 0.0, 10.0)).toBe(10.0);
    });

    it('should work when min equals max', () => {
      expect(clamp(5, 10, 10)).toBe(10);
      expect(clamp(10, 10, 10)).toBe(10);
      expect(clamp(15, 10, 10)).toBe(10);
    });

    it('should work with zero range', () => {
      expect(clamp(5, 0, 0)).toBe(0);
      expect(clamp(-5, 0, 0)).toBe(0);
    });

    it('should handle edge cases', () => {
      // Large numbers
      expect(clamp(1e10, 0, 1e9)).toBe(1e9);

      // Very small positive numbers
      expect(clamp(0.0001, 0, 1)).toBe(0.0001);

      // Zero clamping
      expect(clamp(0, -5, 5)).toBe(0);
    });
  });
});
