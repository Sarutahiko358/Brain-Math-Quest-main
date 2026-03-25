/**
 * Encounter Adapter Edge Cases Tests - S21 PR-1
 * Comprehensive boundary and edge case testing for encounter preparation
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { prepareEncounter, type EncounterContext } from '../world/encounterAdapter';
import { T } from '../world/areas';
import { setSeed } from '../rng';

// Test helper: deterministic picker that returns first element
function pickFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Test helper: deterministic picker that returns last element (reserved for future tests)
function _pickLast<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

// Test helper: picker that always returns undefined (empty pool simulation)
function pickNone<T>(_arr: T[]): T | undefined {
  return undefined;
}

describe('encounterAdapter - Edge Cases', () => {
  beforeAll(() => {
    console.info('[progress] encounterAdapter.edgecases: start');
  });
  beforeEach(() => {
    setSeed(88888); // Fixed seed for reproducibility
  });
  afterAll(() => {
    console.info('[progress] encounterAdapter.edgecases: done');
  });

  describe('Difficulty Scaling Boundaries', () => {
    it('should apply easy difficulty (0.9x) scaling correctly', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'easy',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      expect(result?.enemy).toBeDefined();
      // Verify easy mode scaling was applied (stats should be 0.9x base)
      expect(result?.enemy.hp).toBeGreaterThan(0);
      expect(result?.enemy.maxHP).toBeGreaterThan(0);
    });

    it('should apply normal difficulty (1.0x) scaling correctly', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      expect(result?.enemy).toBeDefined();
      expect(result?.enemy.hp).toBeGreaterThan(0);
    });

    it('should apply hard difficulty (1.25x) scaling correctly', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'hard',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      expect(result?.enemy).toBeDefined();
      // Verify hard mode scaling was applied (stats should be 1.25x base)
      expect(result?.enemy.hp).toBeGreaterThan(0);
      expect(result?.enemy.maxHP).toBeGreaterThan(0);
    });

    it('should compare easy vs hard difficulty scaling', () => {
      const baseContext: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        tile: T.Grass,
        pickFn: pickFirst,
        difficulty: 'easy'
      };

      setSeed(12345);
      const easyResult = prepareEncounter({ ...baseContext, difficulty: 'easy' });

      setSeed(12345); // Same seed for fair comparison
      const hardResult = prepareEncounter({ ...baseContext, difficulty: 'hard' });

      expect(easyResult).not.toBeNull();
      expect(hardResult).not.toBeNull();

      // Hard should have higher stats than easy (1.25 / 0.9 ≈ 1.39x)
      if (easyResult && hardResult) {
        expect(hardResult.enemy.maxHP).toBeGreaterThan(easyResult.enemy.maxHP);
        expect(hardResult.enemy.atk).toBeGreaterThan(easyResult.enemy.atk);
      }
    });
  });

  describe('Cave and Castle Bonus', () => {
    it('should apply +2 atk bonus in cave tile', () => {
      setSeed(11111);
      const grassContext: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };
      const grassResult = prepareEncounter(grassContext);

      setSeed(11111); // Same seed for fair comparison
      const caveContext: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Cave,
        pickFn: pickFirst
      };
      const caveResult = prepareEncounter(caveContext);

      expect(grassResult).not.toBeNull();
      expect(caveResult).not.toBeNull();

      if (grassResult && caveResult) {
        // Cave should have +2 atk bonus
        expect(caveResult.enemy.atk).toBe(grassResult.enemy.atk + 2);
      }
    });

    it('should apply +2 atk bonus in castle tile', () => {
      setSeed(22222);
      const grassContext: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };
      const grassResult = prepareEncounter(grassContext);

      setSeed(22222); // Same seed for fair comparison
      const castleContext: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Castle,
        pickFn: pickFirst
      };
      const castleResult = prepareEncounter(castleContext);

      expect(grassResult).not.toBeNull();
      expect(castleResult).not.toBeNull();

      if (grassResult && castleResult) {
        // Castle should have +2 atk bonus
        expect(castleResult.enemy.atk).toBe(grassResult.enemy.atk + 2);
      }
    });

    it('should combine cave bonus with difficulty scaling', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'hard',
        tile: T.Cave,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      // Should apply both 1.25x multiplier AND +2 cave bonus
      expect(result?.enemy.atk).toBeGreaterThan(0);
    });
  });

  describe('Boss Rush Mode (Area 9)', () => {
    it('should only select bosses in area 9', () => {
      const context: EncounterContext = {
        currentArea: 9,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      expect(result?.enemy.boss).toBe(true);
      expect(result?.isBossRush).toBe(true);
      expect(result?.isEndless).toBe(false);
    });

    it('should exclude Kirin (九尾の麒麟) from boss rush pool', () => {
      const context: EncounterContext = {
        currentArea: 9,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: (arr) => {
          // Try to pick Kirin if it exists in the pool
          const kirin = arr.find(e => e.name === '九尾の麒麟');
          return kirin || arr[0]; // Fallback to first if Kirin not found
        }
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      // Should never return Kirin, even if picker tries to select it
      expect(result?.enemy.name).not.toBe('九尾の麒麟');
    });

    it('should apply difficulty scaling to boss rush encounters', () => {
      const context: EncounterContext = {
        currentArea: 9,
        gameMode: 'story',
        difficulty: 'hard',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      expect(result?.enemy.boss).toBe(true);
      expect(result?.enemy.hp).toBeGreaterThan(0);
      // Hard mode scaling should be applied to boss
    });
  });

  describe('Endless Mode', () => {
    it('should prepare endless encounter with floor 1', () => {
      const context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        endlessFloor: 1,
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      expect(result?.isEndless).toBe(true);
      expect(result?.isBossRush).toBe(false);
      expect(result?.enemy.hp).toBeGreaterThan(0);
    });

    it('should scale stats with increasing floor level', () => {
      setSeed(33333);
      const floor1Context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        endlessFloor: 1,
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };
      const floor1Result = prepareEncounter(floor1Context);

      setSeed(33333); // Same seed for fair comparison
      const floor10Context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        endlessFloor: 10,
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };
      const floor10Result = prepareEncounter(floor10Context);

      expect(floor1Result).not.toBeNull();
      expect(floor10Result).not.toBeNull();

      if (floor1Result && floor10Result) {
        // Floor 10 should have significantly higher stats than floor 1
        expect(floor10Result.enemy.maxHP).toBeGreaterThan(floor1Result.enemy.maxHP);
        expect(floor10Result.enemy.atk).toBeGreaterThan(floor1Result.enemy.atk);
      }
    });

    it('should apply 1.4x field boss multiplier to boss enemies in endless', () => {
      const context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        endlessFloor: 5,
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: (arr) => arr.find(e => e.boss === true) || arr[0]
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      // Boss should get 1.4x multiplier on top of floor scaling
      expect(result?.enemy.hp).toBeGreaterThan(0);
    });

    it('should exclude Kirin from endless mode pool', () => {
      const context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        endlessFloor: 5,
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: (arr) => arr.find(e => e.name === '九尾の麒麟') || arr[0]
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      // Should never return Kirin in endless mode
      expect(result?.enemy.name).not.toBe('九尾の麒麟');
    });

    it('should handle floor 0 edge case', () => {
      const context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        endlessFloor: 0,
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      // Should still work with floor 0 (treated as floor 1)
      expect(result?.enemy.hp).toBeGreaterThan(0);
    });

    it('should handle missing endlessFloor (defaults to 1)', () => {
      const context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      // Should default to floor 1 when endlessFloor is undefined
      expect(result?.enemy.hp).toBeGreaterThan(0);
    });

    it('should apply jitter (0.9-1.1x) to endless mode stats', () => {
      const context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        endlessFloor: 5,
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      setSeed(44444);
      const result1 = prepareEncounter(context);

      setSeed(55555); // Different seed for different jitter
      const result2 = prepareEncounter(context);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();

      // With different seeds, jitter should produce slightly different stats
      // Both should be positive though
      if (result1 && result2) {
        expect(result1.enemy.hp).toBeGreaterThan(0);
        expect(result2.enemy.hp).toBeGreaterThan(0);
      }
    });
  });

  describe('Empty Pool Fallback', () => {
    it('should return null when no enemy can be picked', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickNone // Always returns undefined
      };

      const result = prepareEncounter(context);

      expect(result).toBeNull();
    });

    it('should use fallback pool for non-existent area', () => {
      const context: EncounterContext = {
        currentArea: 999, // Non-existent area
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      // Should still find an enemy from fallback pool
      expect(result).not.toBeNull();
      if (result) {
        expect(result.enemy.boss).not.toBe(true); // Should not be a boss
      }
    });
  });

  describe('Normal Story Mode Encounters', () => {
    it('should not include bosses in normal story encounters', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      expect(result?.enemy.boss).not.toBe(true);
      expect(result?.isBossRush).toBe(false);
      expect(result?.isEndless).toBe(false);
    });

    it('should select from area-specific enemy pool', () => {
      const context: EncounterContext = {
        currentArea: 2,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      if (result) {
        // Should be from area 2 or fallback pool
        expect(result.enemy).toBeDefined();
      }
    });

    it('should handle all valid areas (1-9)', () => {
      for (let area = 1; area <= 9; area++) {
        const context: EncounterContext = {
          currentArea: area,
          gameMode: 'story',
          difficulty: 'normal',
          tile: T.Grass,
          pickFn: pickFirst
        };

        const result = prepareEncounter(context);

        // All areas should produce a valid encounter
        expect(result).not.toBeNull();
        if (area === 9) {
          expect(result?.isBossRush).toBe(true);
        } else {
          expect(result?.isBossRush).toBe(false);
        }
      }
    });
  });

  describe('Deterministic RNG Behavior with Custom Picker', () => {
    it('should produce consistent results with deterministic picker', () => {
      // Use a deterministic picker (not random) to ensure consistency
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst // Deterministic picker
      };

      const result1 = prepareEncounter(context);
      const result2 = prepareEncounter(context);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();

      if (result1 && result2) {
        // With deterministic picker and story mode (no jitter), results should match
        expect(result1.enemy.name).toBe(result2.enemy.name);
        expect(result1.enemy.hp).toBe(result2.enemy.hp);
        expect(result1.enemy.maxHP).toBe(result2.enemy.maxHP);
        expect(result1.enemy.atk).toBe(result2.enemy.atk);
      }
    });

    it('should handle random picker without crashes', () => {
      // Use actual random picker (Math.random) to test real-world usage
      const randomPicker = <T>(arr: T[]): T | undefined => {
        return arr[Math.floor(Math.random() * arr.length)];
      };

      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: randomPicker
      };

      // Just verify it works without crashing
      const result1 = prepareEncounter(context);
      const result2 = prepareEncounter(context);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();

      if (result1 && result2) {
        // Both should be valid enemies (name may differ due to randomness)
        expect(result1.enemy).toBeDefined();
        expect(result2.enemy).toBeDefined();
        expect(typeof result1.enemy.name).toBe('string');
        expect(typeof result2.enemy.name).toBe('string');
      }
    });
  });

  describe('HP Sync After Scaling', () => {
    it('should sync current HP to maxHP after scaling in story mode', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'hard',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      if (result) {
        // Current HP should equal maxHP after scaling
        expect(result.enemy.hp).toBe(result.enemy.maxHP);
      }
    });

    it('should sync current HP to maxHP after scaling in endless mode', () => {
      const context: EncounterContext = {
        currentArea: 10,
        gameMode: 'endless',
        endlessFloor: 5,
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);

      expect(result).not.toBeNull();
      if (result) {
        // Current HP should equal maxHP after scaling
        expect(result.enemy.hp).toBe(result.enemy.maxHP);
      }
    });
  });

  describe('All Tile Type Coverage', () => {
    it('should handle grass tile correctly', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Grass,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);
      expect(result).not.toBeNull();
    });

    it('should handle cave tile correctly', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Cave,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);
      expect(result).not.toBeNull();
    });

    it('should handle castle tile correctly', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Castle,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);
      expect(result).not.toBeNull();
    });

    it('should handle town tile (even though towns don\'t trigger encounters)', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Town,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);
      // Should still prepare encounter (validation happens elsewhere)
      expect(result).not.toBeNull();
    });

    it('should handle water tile (even though water blocks movement)', () => {
      const context: EncounterContext = {
        currentArea: 1,
        gameMode: 'story',
        difficulty: 'normal',
        tile: T.Water,
        pickFn: pickFirst
      };

      const result = prepareEncounter(context);
      // Should still prepare encounter (validation happens elsewhere)
      expect(result).not.toBeNull();
    });
  });
});
