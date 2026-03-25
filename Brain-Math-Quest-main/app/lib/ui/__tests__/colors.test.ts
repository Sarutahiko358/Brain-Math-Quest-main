/**
 * Tests for UI color utilities
 * 
 * Tests the timeColor function which provides visual feedback based on elapsed time.
 */

import { describe, it, expect } from 'vitest';
import { timeColor } from '../colors';

describe('UI Colors module', () => {
  describe('timeColor', () => {
    it('should return green (hue 120) for 0 seconds', () => {
      const color = timeColor(0);
      expect(color).toBe('hsl(120, 80%, 45%)');
    });

    it('should return red (hue 0) for 20 seconds or more', () => {
      expect(timeColor(20)).toBe('hsl(0, 80%, 45%)');
      expect(timeColor(25)).toBe('hsl(0, 80%, 45%)');
      expect(timeColor(100)).toBe('hsl(0, 80%, 45%)');
    });

    it('should return yellow (hue 60) for 10 seconds (midpoint)', () => {
      const color = timeColor(10);
      expect(color).toBe('hsl(60, 80%, 45%)');
    });

    it('should interpolate correctly for times between 0 and 20', () => {
      // 5 seconds: (1 - 5/20) * 120 = 0.75 * 120 = 90
      expect(timeColor(5)).toBe('hsl(90, 80%, 45%)');
      
      // 15 seconds: (1 - 15/20) * 120 = 0.25 * 120 = 30
      expect(timeColor(15)).toBe('hsl(30, 80%, 45%)');
    });

    it('should clamp negative values to 0 (green)', () => {
      expect(timeColor(-1)).toBe('hsl(120, 80%, 45%)');
      expect(timeColor(-10)).toBe('hsl(120, 80%, 45%)');
    });

    it('should handle fractional seconds correctly', () => {
      // 2.5 seconds: (1 - 2.5/20) * 120 = 0.875 * 120 = 105
      expect(timeColor(2.5)).toBe('hsl(105, 80%, 45%)');
      
      // 7.5 seconds: (1 - 7.5/20) * 120 = 0.625 * 120 = 75
      expect(timeColor(7.5)).toBe('hsl(75, 80%, 45%)');
    });

    it('should always use 80% saturation and 45% lightness', () => {
      const colors = [
        timeColor(0),
        timeColor(5),
        timeColor(10),
        timeColor(15),
        timeColor(20)
      ];
      
      colors.forEach(color => {
        expect(color).toMatch(/, 80%, 45%\)$/);
      });
    });

    it('should return valid HSL format', () => {
      const colors = [
        timeColor(0),
        timeColor(3.7),
        timeColor(10),
        timeColor(17.8),
        timeColor(20)
      ];
      
      colors.forEach(color => {
        expect(color).toMatch(/^hsl\(\d+, 80%, 45%\)$/);
      });
    });

    it('should provide smooth gradient from green to red', () => {
      // Test that hue decreases monotonically
      const times = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
      const hues = times.map(t => {
        const match = timeColor(t).match(/^hsl\((\d+),/);
        return match ? parseInt(match[1]) : 0;
      });
      
      // Each hue should be less than or equal to the previous
      for (let i = 1; i < hues.length; i++) {
        expect(hues[i]).toBeLessThanOrEqual(hues[i - 1]);
      }
    });

    it('should handle edge case: exactly 1 second', () => {
      // 1 second: (1 - 1/20) * 120 = 0.95 * 120 = 114
      expect(timeColor(1)).toBe('hsl(114, 80%, 45%)');
    });

    it('should handle edge case: exactly 19 seconds', () => {
      // 19 seconds: (1 - 19/20) * 120 = 0.05 * 120 = 6
      expect(timeColor(19)).toBe('hsl(6, 80%, 45%)');
    });

    it('should handle zero gracefully', () => {
      expect(timeColor(0)).toBe(timeColor(0.0));
    });

    it('should be consistent for same input', () => {
      const time = 12.345;
      expect(timeColor(time)).toBe(timeColor(time));
    });
  });
});
