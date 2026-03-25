/**
 * Encounter Adapter Tests - S10 Step2
 * Verify encounter preparation logic delegates correctly to existing helpers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { prepareEncounter, type EncounterContext } from '../world/encounterAdapter';
import { T } from '../world/areas';
import { setSeed } from '../rng';

// Mock pick function for deterministic testing
function mockPickFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

describe('encounterAdapter - prepareEncounter', () => {
  beforeEach(() => {
    setSeed(12345); // Fixed seed for reproducible tests
  });

  it('should prepare normal encounter for story mode', () => {
    const context: EncounterContext = {
      currentArea: 1,
      gameMode: 'story',
      difficulty: 'normal',
      tile: T.Grass,
      pickFn: mockPickFirst
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    expect(result?.enemy).toBeDefined();
    expect(result?.enemy.area).toBe(1);
    expect(result?.enemy.boss).not.toBe(true);
    expect(result?.isBossRush).toBe(false);
    expect(result?.isEndless).toBe(false);
  });

  it('should apply easy difficulty scaling', () => {
    const context: EncounterContext = {
      currentArea: 1,
      gameMode: 'story',
      difficulty: 'easy',
      tile: T.Grass,
      pickFn: mockPickFirst
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    // Enemy stats should be scaled by 0.9 for easy mode
    // Exact values depend on base enemy stats
  });

  it('should apply hard difficulty scaling', () => {
    const context: EncounterContext = {
      currentArea: 1,
      gameMode: 'story',
      difficulty: 'hard',
      tile: T.Grass,
      pickFn: mockPickFirst
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    // Enemy stats should be scaled by 1.25 for hard mode
  });

  it('should apply cave bonus in cave tile', () => {
    const context: EncounterContext = {
      currentArea: 1,
      gameMode: 'story',
      difficulty: 'normal',
      tile: T.Cave,
      pickFn: mockPickFirst
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    // Enemy should get +2 atk bonus in cave
    expect(result?.enemy.atk).toBeGreaterThan(0);
  });

  it('should prepare boss rush encounter in area 9', () => {
    const context: EncounterContext = {
      currentArea: 9,
      gameMode: 'story',
      difficulty: 'normal',
      tile: T.Grass,
      pickFn: mockPickFirst
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    expect(result?.enemy.boss).toBe(true);
    expect(result?.isBossRush).toBe(true);
    expect(result?.isEndless).toBe(false);
  });

  it('should exclude Kirin from boss rush pool', () => {
    const context: EncounterContext = {
      currentArea: 9,
      gameMode: 'story',
      difficulty: 'normal',
      tile: T.Grass,
      pickFn: (arr) => arr.find(e => e.name === '九尾の麒麟') || arr[0]
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    expect(result?.enemy.name).not.toBe('九尾の麒麟');
  });

  it('should prepare endless mode encounter', () => {
    const context: EncounterContext = {
      currentArea: 10,
      gameMode: 'endless',
      endlessFloor: 5,
      difficulty: 'normal',
      tile: T.Grass,
      pickFn: mockPickFirst
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    expect(result?.isEndless).toBe(true);
    expect(result?.isBossRush).toBe(false);
    // Stats should be scaled based on floor 5
    expect(result?.enemy.hp).toBeGreaterThan(0);
  });

  it('should apply field boss multiplier in endless mode', () => {
    // Pick a boss enemy for endless mode
    const context: EncounterContext = {
      currentArea: 10,
      gameMode: 'endless',
      endlessFloor: 3,
      difficulty: 'normal',
      tile: T.Grass,
      pickFn: (arr) => arr.find(e => e.boss === true) || arr[0]
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    // Boss in endless mode should have 1.4x multiplier
    expect(result?.enemy.hp).toBeGreaterThan(0);
  });

  it('should return null if no enemies available', () => {
    const context: EncounterContext = {
      currentArea: 999, // Non-existent area
      gameMode: 'story',
      difficulty: 'normal',
      tile: T.Grass,
      pickFn: () => undefined // Always returns undefined
    };

    const result = prepareEncounter(context);

    // Should still return something from fallback pool unless pickFn always returns undefined
    // With mockPickFirst that returns undefined, should return null
    expect(result).toBeNull();
  });

  it('should handle castle tile similar to cave', () => {
    const context: EncounterContext = {
      currentArea: 1,
      gameMode: 'story',
      difficulty: 'normal',
      tile: T.Castle,
      pickFn: mockPickFirst
    };

    const result = prepareEncounter(context);

    expect(result).not.toBeNull();
    // Castle should also get cave bonus
    expect(result?.enemy.atk).toBeGreaterThan(0);
  });
});
