/**
 * Movement Adapter Edge Cases Tests - S21 PR-1
 * Comprehensive boundary and edge case testing for movement validation
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { validateMovement } from '../world/movementAdapter';
import { T, Tile, ROWS, COLS } from '../world/areas';
import { setSeed } from '../rng';

describe('movementAdapter - Edge Cases', () => {
  beforeAll(() => {
    console.info('[progress] movementAdapter.edgecases: start');
  });
  // Test map with various tile types for comprehensive testing
  const edgeCaseMap: Tile[][] = [
    [T.Grass, T.Grass, T.Wall, T.Town, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
    [T.Grass, T.Cave, T.Water, T.Castle, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
    [T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
    [T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
    [T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
    [T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
    [T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
    [T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
    [T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass, T.Grass],
  ];

  beforeEach(() => {
    setSeed(99999); // Fixed seed for all tests
  });
  afterAll(() => {
    console.info('[progress] movementAdapter.edgecases: done');
  });

  describe('Boundary Conditions - Map Edges', () => {
    it('should clamp movement beyond top edge (r=0, dr=-1)', () => {
      const result = validateMovement(
        { r: 0, c: 5 },
        -1,
        0,
        edgeCaseMap,
        0
      );

      expect(result.newPos).toEqual({ r: 0, c: 5 }); // Should stay at row 0
      expect(result.allowed).toBe(true); // Grass is walkable
    });

    it('should clamp movement beyond bottom edge (r=ROWS-1, dr=+1)', () => {
      const result = validateMovement(
        { r: ROWS - 1, c: 5 },
        1,
        0,
        edgeCaseMap,
        0
      );

      expect(result.newPos).toEqual({ r: ROWS - 1, c: 5 }); // Should stay at max row
      expect(result.allowed).toBe(true);
    });

    it('should clamp movement beyond left edge (c=0, dc=-1)', () => {
      const result = validateMovement(
        { r: 2, c: 0 },
        0,
        -1,
        edgeCaseMap,
        0
      );

      expect(result.newPos).toEqual({ r: 2, c: 0 }); // Should stay at col 0
      expect(result.allowed).toBe(true);
    });

    it('should clamp movement beyond right edge (c=COLS-1, dc=+1)', () => {
      const result = validateMovement(
        { r: 2, c: COLS - 1 },
        0,
        1,
        edgeCaseMap,
        0
      );

      expect(result.newPos).toEqual({ r: 2, c: COLS - 1 }); // Should stay at max col
      expect(result.allowed).toBe(true);
    });

    it('should clamp diagonal movement beyond top-left corner', () => {
      const result = validateMovement(
        { r: 0, c: 0 },
        -1,
        -1,
        edgeCaseMap,
        0
      );

      expect(result.newPos).toEqual({ r: 0, c: 0 }); // Should stay at corner
      expect(result.allowed).toBe(true);
    });

    it('should clamp diagonal movement beyond bottom-right corner', () => {
      const result = validateMovement(
        { r: ROWS - 1, c: COLS - 1 },
        1,
        1,
        edgeCaseMap,
        0
      );

      expect(result.newPos).toEqual({ r: ROWS - 1, c: COLS - 1 }); // Should stay at corner
      expect(result.allowed).toBe(true);
    });
  });

  describe('Unwalkable Tile Validation', () => {
    it('should reject movement to wall tile', () => {
      const result = validateMovement(
        { r: 0, c: 1 },
        0,
        1,
        edgeCaseMap,
        0
      );

      expect(result.allowed).toBe(false);
      expect(result.tile).toBe(T.Wall);
      expect(result.shouldEncounter).toBe(false); // No encounter on blocked movement
    });

    it('should reject movement to water tile', () => {
      const result = validateMovement(
        { r: 1, c: 1 },
        0,
        1,
        edgeCaseMap,
        0
      );

      expect(result.allowed).toBe(false);
      expect(result.tile).toBe(T.Water);
      expect(result.shouldEncounter).toBe(false);
    });

    it('should allow movement to cave tile', () => {
      const result = validateMovement(
        { r: 1, c: 0 },
        0,
        1,
        edgeCaseMap,
        0
      );

      expect(result.allowed).toBe(true);
      expect(result.tile).toBe(T.Cave);
    });
  });

  describe('Special Location Detection', () => {
    it('should detect town tile and not trigger encounters', () => {
      const result = validateMovement(
        { r: 0, c: 2 },
        0,
        1,
        edgeCaseMap,
        100 // Even with 100% encounter rate
      );

      expect(result.allowed).toBe(true);
      expect(result.tile).toBe(T.Town);
      expect(result.specialLocation).toBe('town');
      expect(result.shouldEncounter).toBe(false); // Towns never trigger encounters
    });

    it('should detect castle tile and not trigger encounters', () => {
      const result = validateMovement(
        { r: 1, c: 2 },
        0,
        1,
        edgeCaseMap,
        100 // Even with 100% encounter rate
      );

      expect(result.allowed).toBe(true);
      expect(result.tile).toBe(T.Castle);
      expect(result.specialLocation).toBe('castle');
      expect(result.shouldEncounter).toBe(false); // Castles never trigger encounters
    });

    it('should return null for grass tile special location', () => {
      const result = validateMovement(
        { r: 2, c: 2 },
        0,
        1,
        edgeCaseMap,
        0
      );

      expect(result.allowed).toBe(true);
      expect(result.tile).toBe(T.Grass);
      expect(result.specialLocation).toBeNull();
    });
  });

  describe('Encounter Rate Boundaries', () => {
    it('should never trigger encounter with 0% rate', () => {
      setSeed(12345);

      // Try multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        const result = validateMovement(
          { r: 2, c: 2 },
          0,
          1,
          edgeCaseMap,
          0 // 0% encounter rate
        );

        expect(result.shouldEncounter).toBe(false);
      }
    });

    it('should always trigger encounter with 100% rate on grass', () => {
      setSeed(12345);

      const result = validateMovement(
        { r: 2, c: 2 },
        0,
        1,
        edgeCaseMap,
        100 // 100% encounter rate
      );

      expect(result.allowed).toBe(true);
      expect(result.shouldEncounter).toBe(true);
    });

    it('should handle encounter rate at boundary value (50%)', () => {
      setSeed(55555);

      // With deterministic seed, should get consistent result
      const result = validateMovement(
        { r: 2, c: 2 },
        0,
        1,
        edgeCaseMap,
        50 // 50% encounter rate
      );

      // Result should be deterministic with fixed seed
      expect(typeof result.shouldEncounter).toBe('boolean');
    });

    it('should not trigger encounter on cave with 0% rate', () => {
      const result = validateMovement(
        { r: 1, c: 0 },
        0,
        1,
        edgeCaseMap,
        0 // 0% encounter rate
      );

      expect(result.tile).toBe(T.Cave);
      expect(result.shouldEncounter).toBe(false);
    });
  });

  describe('RNG Behavior Validation', () => {
    it('should produce valid boolean encounter results with mid-range encounter rate', () => {
      // Note: shouldTriggerEncounter uses Math.random() directly, not seeded RNG
      // So we test for valid outputs rather than determinism
      const result1 = validateMovement(
        { r: 2, c: 2 },
        0,
        1,
        edgeCaseMap,
        50
      );

      const result2 = validateMovement(
        { r: 2, c: 2 },
        0,
        1,
        edgeCaseMap,
        50
      );

      // Both should return valid boolean values
      expect(typeof result1.shouldEncounter).toBe('boolean');
      expect(typeof result2.shouldEncounter).toBe('boolean');
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should handle multiple encounter checks consistently', () => {
      // Run multiple checks to ensure no crashes or invalid states
      for (let i = 0; i < 5; i++) {
        const result = validateMovement(
          { r: 2, c: 2 },
          0,
          1,
          edgeCaseMap,
          30
        );

        expect(typeof result.shouldEncounter).toBe('boolean');
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('Zero-delta Movement', () => {
    it('should handle no movement (dr=0, dc=0)', () => {
      const result = validateMovement(
        { r: 2, c: 2 },
        0,
        0,
        edgeCaseMap,
        0
      );

      expect(result.newPos).toEqual({ r: 2, c: 2 }); // Same position
      expect(result.allowed).toBe(true);
      expect(result.tile).toBe(T.Grass);
    });
  });

  describe('Large Delta Values', () => {
    it('should clamp large positive delta', () => {
      const result = validateMovement(
        { r: 4, c: 6 },
        100, // Very large delta
        0,
        edgeCaseMap,
        0
      );

      expect(result.newPos.r).toBe(ROWS - 1); // Should clamp to max
      expect(result.newPos.c).toBe(6);
      expect(result.allowed).toBe(true);
    });

    it('should clamp large negative delta', () => {
      const result = validateMovement(
        { r: 4, c: 6 },
        -100, // Very large negative delta
        0,
        edgeCaseMap,
        0
      );

      expect(result.newPos.r).toBe(0); // Should clamp to min
      expect(result.newPos.c).toBe(6);
      expect(result.allowed).toBe(true);
    });
  });

  describe('All Tile Types Coverage', () => {
    it('should correctly identify grass tile', () => {
      const result = validateMovement({ r: 2, c: 2 }, 0, 1, edgeCaseMap, 0);

      expect(result.tile).toBe(T.Grass);
      expect(result.allowed).toBe(true);
      expect(result.specialLocation).toBeNull();
    });

    it('should correctly identify cave tile with encounter potential', () => {
      setSeed(12345);
      const result = validateMovement({ r: 1, c: 0 }, 0, 1, edgeCaseMap, 100);

      expect(result.tile).toBe(T.Cave);
      expect(result.allowed).toBe(true);
      expect(result.shouldEncounter).toBe(true); // Cave can have encounters
    });

    it('should handle movement to own position', () => {
      const currentPos = { r: 5, c: 5 };
      const result = validateMovement(currentPos, 0, 0, edgeCaseMap, 0);

      expect(result.newPos).toEqual(currentPos);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Encounter on Blocked Movement', () => {
    it('should not trigger encounter when movement to wall is blocked', () => {
      const result = validateMovement(
        { r: 0, c: 1 },
        0,
        1,
        edgeCaseMap,
        100 // High encounter rate
      );

      expect(result.allowed).toBe(false);
      expect(result.tile).toBe(T.Wall);
      expect(result.shouldEncounter).toBe(false); // No encounter on blocked movement
    });

    it('should not trigger encounter when movement to water is blocked', () => {
      const result = validateMovement(
        { r: 1, c: 1 },
        0,
        1,
        edgeCaseMap,
        100 // High encounter rate
      );

      expect(result.allowed).toBe(false);
      expect(result.tile).toBe(T.Water);
      expect(result.shouldEncounter).toBe(false); // No encounter on blocked movement
    });
  });
});
