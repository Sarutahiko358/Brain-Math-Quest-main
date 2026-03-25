/**
 * Movement Adapter Tests - S10 Step1
 * Verify movement validation logic delegates correctly to existing helpers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { validateMovement } from '../world/movementAdapter';
import { T, Tile } from '../world/areas';
import { setSeed } from '../rng';

describe('movementAdapter - validateMovement', () => {
  // Simple test map
  const testMap: Tile[][] = [
    [T.Grass, T.Grass, T.Wall, T.Town],
    [T.Grass, T.Cave, T.Water, T.Castle],
    [T.Grass, T.Grass, T.Grass, T.Grass],
  ];

  beforeEach(() => {
    setSeed(12345); // Fixed seed for reproducible encounter tests
  });

  it('should allow movement to walkable grass tile', () => {
    const result = validateMovement(
      { r: 0, c: 0 },
      1,
      0,
      testMap,
      0
    );

    expect(result.allowed).toBe(true);
    expect(result.newPos).toEqual({ r: 1, c: 0 });
    expect(result.tile).toBe(T.Grass);
    expect(result.specialLocation).toBeNull();
  });

  it('should not allow movement to wall', () => {
    const result = validateMovement(
      { r: 0, c: 1 },
      0,
      1,
      testMap,
      0
    );

    expect(result.allowed).toBe(false);
    expect(result.newPos).toEqual({ r: 0, c: 2 });
    expect(result.tile).toBe(T.Wall);
  });

  it('should not allow movement to water', () => {
    const result = validateMovement(
      { r: 1, c: 1 },
      0,
      1,
      testMap,
      0
    );

    expect(result.allowed).toBe(false);
    expect(result.newPos).toEqual({ r: 1, c: 2 });
    expect(result.tile).toBe(T.Water);
  });

  it('should detect town as special location', () => {
    const result = validateMovement(
      { r: 0, c: 2 },
      0,
      1,
      testMap,
      0
    );

    expect(result.allowed).toBe(true);
    expect(result.newPos).toEqual({ r: 0, c: 3 });
    expect(result.tile).toBe(T.Town);
    expect(result.specialLocation).toBe('town');
    expect(result.shouldEncounter).toBe(false); // Towns don't trigger encounters
  });

  it('should detect castle as special location', () => {
    const result = validateMovement(
      { r: 1, c: 2 },
      0,
      1,
      testMap,
      0
    );

    expect(result.allowed).toBe(true);
    expect(result.newPos).toEqual({ r: 1, c: 3 });
    expect(result.tile).toBe(T.Castle);
    expect(result.specialLocation).toBe('castle');
    expect(result.shouldEncounter).toBe(false); // Castles don't trigger encounters
  });

  it('should detect encounters based on encounter rate', () => {
    setSeed(12345); // Reset seed for consistent encounter roll
    
    // With 100% encounter rate on grass
    const result1 = validateMovement(
      { r: 0, c: 0 },
      1,
      0,
      testMap,
      100
    );

    expect(result1.allowed).toBe(true);
    expect(result1.shouldEncounter).toBe(true);

    // With 0% encounter rate
    const result2 = validateMovement(
      { r: 0, c: 0 },
      1,
      0,
      testMap,
      0
    );

    expect(result2.allowed).toBe(true);
    expect(result2.shouldEncounter).toBe(false);
  });

  it('should handle boundary clamping', () => {
    // Try to move up from top edge
    const result = validateMovement(
      { r: 0, c: 0 },
      -1,
      0,
      testMap,
      0
    );

    // Should stay at row 0 (clamped)
    expect(result.newPos).toEqual({ r: 0, c: 0 });
    expect(result.allowed).toBe(true); // Still on grass
  });

  it('should handle diagonal movement to walkable tile', () => {
    const result = validateMovement(
      { r: 0, c: 0 },
      1,
      1,
      testMap,
      0
    );

    expect(result.allowed).toBe(true);
    expect(result.newPos).toEqual({ r: 1, c: 1 });
    expect(result.tile).toBe(T.Cave);
  });
});
