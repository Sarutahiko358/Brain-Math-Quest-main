/**
 * Tests for movement utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNewPosition,
  isWalkable,
  isAtPosition,
  shouldTriggerEncounter,
  getSpecialLocationType,
} from '../../lib/world/movement';
import { T } from '../../lib/world/areas';

describe('movement utilities', () => {
  describe('calculateNewPosition', () => {
    it('should calculate new position with delta', () => {
      const pos = { r: 5, c: 5 };
      expect(calculateNewPosition(pos, -1, 0)).toEqual({ r: 4, c: 5 }); // up
      expect(calculateNewPosition(pos, 1, 0)).toEqual({ r: 6, c: 5 }); // down
      expect(calculateNewPosition(pos, 0, -1)).toEqual({ r: 5, c: 4 }); // left
      expect(calculateNewPosition(pos, 0, 1)).toEqual({ r: 5, c: 6 }); // right
    });

    it('should clamp position to map bounds (0-8 for rows, 0-12 for cols)', () => {
      // Top-left corner
      expect(calculateNewPosition({ r: 0, c: 0 }, -1, -1)).toEqual({ r: 0, c: 0 });
      
      // Bottom-right corner (ROWS=9, COLS=13 from areas.ts, so max is 8 and 12)
      expect(calculateNewPosition({ r: 8, c: 12 }, 1, 1)).toEqual({ r: 8, c: 12 });
      
      // Clamp row
      expect(calculateNewPosition({ r: 0, c: 5 }, -5, 0)).toEqual({ r: 0, c: 5 });
      expect(calculateNewPosition({ r: 8, c: 5 }, 5, 0)).toEqual({ r: 8, c: 5 });
      
      // Clamp column
      expect(calculateNewPosition({ r: 5, c: 0 }, 0, -5)).toEqual({ r: 5, c: 0 });
      expect(calculateNewPosition({ r: 5, c: 12 }, 0, 5)).toEqual({ r: 5, c: 12 });
    });
  });

  describe('isWalkable', () => {
    it('should return false for walls and water', () => {
      expect(isWalkable(T.Wall)).toBe(false);
      expect(isWalkable(T.Water)).toBe(false);
    });

    it('should return true for walkable tiles', () => {
      expect(isWalkable(T.Grass)).toBe(true);
      expect(isWalkable(T.Town)).toBe(true);
      expect(isWalkable(T.Cave)).toBe(true);
      expect(isWalkable(T.Castle)).toBe(true);
    });
  });

  describe('isAtPosition', () => {
    it('should return true when positions match', () => {
      expect(isAtPosition({ r: 5, c: 3 }, { r: 5, c: 3 })).toBe(true);
      expect(isAtPosition({ r: 0, c: 0 }, { r: 0, c: 0 })).toBe(true);
    });

    it('should return false when positions do not match', () => {
      expect(isAtPosition({ r: 5, c: 3 }, { r: 5, c: 4 })).toBe(false);
      expect(isAtPosition({ r: 5, c: 3 }, { r: 6, c: 3 })).toBe(false);
      expect(isAtPosition({ r: 5, c: 3 }, { r: 6, c: 4 })).toBe(false);
    });
  });

  describe('shouldTriggerEncounter', () => {
    it('should never trigger on town or castle tiles', () => {
      // Test multiple times to ensure randomness doesn't affect this
      for (let i = 0; i < 100; i++) {
        expect(shouldTriggerEncounter(T.Town, 100)).toBe(false);
        expect(shouldTriggerEncounter(T.Castle, 100)).toBe(false);
      }
    });

    it('should never trigger with 0% encounter rate', () => {
      for (let i = 0; i < 100; i++) {
        expect(shouldTriggerEncounter(T.Grass, 0)).toBe(false);
        expect(shouldTriggerEncounter(T.Cave, 0)).toBe(false);
      }
    });

    it('should always trigger with 100% encounter rate on eligible tiles', () => {
      for (let i = 0; i < 100; i++) {
        expect(shouldTriggerEncounter(T.Grass, 100)).toBe(true);
        expect(shouldTriggerEncounter(T.Cave, 100)).toBe(true);
      }
    });

    it('should sometimes trigger with medium encounter rate', () => {
      // With 50% rate, we expect roughly half to trigger
      // Using a large sample to avoid flaky tests
      let triggered = 0;
      const samples = 1000;
      for (let i = 0; i < samples; i++) {
        if (shouldTriggerEncounter(T.Grass, 50)) {
          triggered++;
        }
      }
      // Allow 40-60% range (should be very reliable with 1000 samples)
      expect(triggered).toBeGreaterThan(samples * 0.4);
      expect(triggered).toBeLessThan(samples * 0.6);
    });
  });

  describe('getSpecialLocationType', () => {
    it('should return "town" for town tiles', () => {
      expect(getSpecialLocationType(T.Town)).toBe('town');
    });

    it('should return "castle" for castle tiles', () => {
      expect(getSpecialLocationType(T.Castle)).toBe('castle');
    });

    it('should return null for other tiles', () => {
      expect(getSpecialLocationType(T.Grass)).toBe(null);
      expect(getSpecialLocationType(T.Cave)).toBe(null);
      expect(getSpecialLocationType(T.Wall)).toBe(null);
      expect(getSpecialLocationType(T.Water)).toBe(null);
    });
  });
});
