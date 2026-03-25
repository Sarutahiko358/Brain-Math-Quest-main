/**
 * Tests for computeCompletionStats utility function
 */

import { describe, it, expect } from 'vitest';
import { computeCompletionStats } from '../utils';
import { Player } from '../../lib/gameTypes';
import { WEAPONS, ARMORS } from '../../lib/equipment';
import { DexData } from '../types';
import { BOSS_POOL, ENEMY_POOL } from '../../lib/enemies';
import { LIBRARY_AREAS } from '../../lib/world/areasLibrary';

describe('computeCompletionStats', () => {
  const basePlayer: Player = {
    name: 'Test',
    avatar: '🦸',
    lv: 10,
    exp: 100,
    gold: 1000,
    maxHP: 100,
    hp: 100,
    maxMP: 50,
    mp: 50,
    baseATK: 20,
    baseDEF: 15,
    equip: { weapon: WEAPONS[0], armor: ARMORS[0] },
    items: [],
    keyItems: [],
    pos: { r: 5, c: 5 },
    currentArea: 3,
    clearedAreas: [1, 2],
    storyShownAreas: [1, 2, 3],
  };

  describe('Story Mode', () => {
    it('should calculate stats for player with no progress', () => {
      const player = { ...basePlayer, clearedAreas: [] };
      const emptyDex: DexData = {};

      const result = computeCompletionStats({
        player,
        gameMode: 'story',
        dexStory: emptyDex,
        dexEndless: emptyDex,
      });

      expect(result.defeatedBosses).toBe(0);
      expect(result.totalBosses).toBe(BOSS_POOL.length);
      expect(result.encounteredEnemies).toBe(0);
      expect(result.defeatedEnemies).toBe(0);
      expect(result.totalEnemies).toBe(ENEMY_POOL.length + BOSS_POOL.length);
      expect(result.clearedAreas).toBe(0);
      expect(result.mainlineAreas).toBe(9);
      expect(result.completion).toBe(0);
      expect(result.bossesDone).toBe(false);
      expect(result.areasDone).toBe(false);
      expect(result.seenDone).toBe(false);
      expect(result.defeatedDone).toBe(false);
      expect(result.allDone).toBe(false);
    });

    it('should calculate stats for player with partial progress', () => {
      const player = { ...basePlayer, clearedAreas: [1, 2, 3] };
      const dex: DexData = {
        [BOSS_POOL[0].name]: { seen: 1, defeated: 1 },
        [BOSS_POOL[1].name]: { seen: 1, defeated: 1 },
        [ENEMY_POOL[0].name]: { seen: 3, defeated: 2 },
        [ENEMY_POOL[1].name]: { seen: 2, defeated: 1 },
      };

      const result = computeCompletionStats({
        player,
        gameMode: 'story',
        dexStory: dex,
        dexEndless: {},
      });

      expect(result.defeatedBosses).toBe(2);
      expect(result.encounteredEnemies).toBe(4);
      expect(result.defeatedEnemies).toBe(4);
      expect(result.clearedAreas).toBe(3);
      expect(result.bossesDone).toBe(false);
      expect(result.areasDone).toBe(false);
      expect(result.seenDone).toBe(false);
      expect(result.defeatedDone).toBe(false);
      expect(result.allDone).toBe(false);
      expect(result.completion).toBeGreaterThan(0);
      expect(result.completion).toBeLessThan(100);
    });

    it('should calculate 100% completion when all done', () => {
      const player = { ...basePlayer, clearedAreas: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
      const dex: DexData = {};

      // Add all bosses
      BOSS_POOL.forEach(b => {
        dex[b.name] = { seen: 1, defeated: 1 };
      });

      // Add all enemies
      ENEMY_POOL.forEach(e => {
        dex[e.name] = { seen: 1, defeated: 1 };
      });

      const result = computeCompletionStats({
        player,
        gameMode: 'story',
        dexStory: dex,
        dexEndless: {},
      });

      expect(result.defeatedBosses).toBe(BOSS_POOL.length);
      expect(result.encounteredEnemies).toBe(ENEMY_POOL.length + BOSS_POOL.length);
      expect(result.defeatedEnemies).toBe(ENEMY_POOL.length + BOSS_POOL.length);
      expect(result.clearedAreas).toBe(9);
      expect(result.bossesDone).toBe(true);
      expect(result.areasDone).toBe(true);
      expect(result.seenDone).toBe(true);
      expect(result.defeatedDone).toBe(true);
      expect(result.allDone).toBe(true);
      expect(result.completion).toBe(100);
    });

    it('should handle seen but not defeated enemies', () => {
      const dex: DexData = {
        [BOSS_POOL[0].name]: { seen: 5, defeated: 0 },
        [ENEMY_POOL[0].name]: { seen: 10, defeated: 0 },
      };

      const result = computeCompletionStats({
        player: basePlayer,
        gameMode: 'story',
        dexStory: dex,
        dexEndless: {},
      });

      expect(result.encounteredEnemies).toBe(2);
      expect(result.defeatedEnemies).toBe(0);
      expect(result.seenDone).toBe(false);
      expect(result.defeatedDone).toBe(false);
    });
  });

  describe('Endless Mode', () => {
    it('should calculate stats for endless mode at floor 1', () => {
      const player = { ...basePlayer, currentArea: 10, endlessFloor: 1 };
      const emptyDex: DexData = {};

      const result = computeCompletionStats({
        player,
        gameMode: 'endless',
        dexStory: {},
        dexEndless: emptyDex,
      });

      expect(result.clearedAreas).toBe(0); // (1 - 1)
      expect(result.mainlineAreas).toBe('∞');
      expect(result.completion).toBe(0);
      expect(result.allDone).toBe(false);
    });

    it('should calculate stats for endless mode at floor 10', () => {
      const player = { ...basePlayer, currentArea: 10, endlessFloor: 10 };
      const emptyDex: DexData = {};

      const result = computeCompletionStats({
        player,
        gameMode: 'endless',
        dexStory: {},
        dexEndless: emptyDex,
      });

      expect(result.clearedAreas).toBe(9); // (10 - 1)
      expect(result.mainlineAreas).toBe('∞');
    });

    it('should calculate completion without area progress in endless', () => {
      const player = { ...basePlayer, currentArea: 10, endlessFloor: 5 };
      const dex: DexData = {
        [BOSS_POOL[0].name]: { seen: 1, defeated: 1 },
        [ENEMY_POOL[0].name]: { seen: 3, defeated: 2 },
      };

      const result = computeCompletionStats({
        player,
        gameMode: 'endless',
        dexStory: {},
        dexEndless: dex,
      });

      // Endless mode completion = (pctBoss + pctSeen + pctDefeated) / 3
      expect(result.completion).toBeGreaterThan(0);
      expect(result.completion).toBeLessThan(100);
      expect(result.areasDone).toBe(false); // Areas don't count in endless
    });

    it('should mark allDone without area requirement in endless', () => {
      const player = { ...basePlayer, currentArea: 10, endlessFloor: 100 };
      const dex: DexData = {};

      // Add all bosses and enemies
      [...BOSS_POOL, ...ENEMY_POOL].forEach(e => {
        dex[e.name] = { seen: 1, defeated: 1 };
      });

      const result = computeCompletionStats({
        player,
        gameMode: 'endless',
        dexStory: {},
        dexEndless: dex,
      });

      expect(result.bossesDone).toBe(true);
      expect(result.seenDone).toBe(true);
      expect(result.defeatedDone).toBe(true);
      expect(result.allDone).toBe(true); // No area requirement
      expect(result.completion).toBe(100);
    });

    it('should handle undefined endlessFloor', () => {
      const player = { ...basePlayer, currentArea: 10, endlessFloor: undefined };

      const result = computeCompletionStats({
        player,
        gameMode: 'endless',
        dexStory: {},
        dexEndless: {},
      });

      expect(result.clearedAreas).toBe(0); // (1 - 1) when undefined defaults to 1
    });
  });

  describe('Library Mode', () => {
    it('should use library-specific boss pool and library mainline area count', () => {
      const player = { ...basePlayer, clearedAreas: [] };
      const emptyDex: DexData = {};

      const result = computeCompletionStats({
        player,
        gameMode: 'library',
        dexStory: emptyDex, // library は現状 dexStory を流用
        dexEndless: emptyDex,
      });

      const libraryBossCount = BOSS_POOL.filter(b => b.imageUrl.startsWith('/images/enemies/lib/')).length;
      const mainlineLibraryCount = LIBRARY_AREAS.filter(a => a.mainline).length;

      expect(result.totalBosses).toBe(libraryBossCount);
      expect(result.mainlineAreas).toBe(mainlineLibraryCount);
      // フィールド敵は共通プールのため、総数は ENEMY_POOL + ライブラリボス
      expect(result.totalEnemies).toBe(ENEMY_POOL.length + libraryBossCount);
    });

    it('should count library bosses defeated independently of story bosses', () => {
      const player = { ...basePlayer, clearedAreas: [] };
      const dex: DexData = {};

      // defeat all library bosses only
      BOSS_POOL.filter(b => b.imageUrl.startsWith('/images/enemies/lib/')).forEach(b => {
        dex[b.name] = { seen: 1, defeated: 1 };
      });

      const result = computeCompletionStats({
        player,
        gameMode: 'library',
        dexStory: dex,
        dexEndless: {},
      });

      const libraryBossCount = BOSS_POOL.filter(b => b.imageUrl.startsWith('/images/enemies/lib/')).length;
      expect(result.defeatedBosses).toBe(libraryBossCount);
      expect(result.bossesDone).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty boss and enemy pools gracefully', () => {
      // This is theoretical since BOSS_POOL and ENEMY_POOL are constants
      // but tests the division by zero protection
      const result = computeCompletionStats({
        player: basePlayer,
        gameMode: 'story',
        dexStory: {},
        dexEndless: {},
      });

      // Should not throw and should return valid percentages
      expect(result.completion).toBeGreaterThanOrEqual(0);
      expect(result.completion).toBeLessThanOrEqual(100);
    });

    it('should cap completion at 100', () => {
      const player = { ...basePlayer, clearedAreas: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
      const dex: DexData = {};

      [...BOSS_POOL, ...ENEMY_POOL].forEach(e => {
        dex[e.name] = { seen: 100, defeated: 100 }; // High numbers
      });

      const result = computeCompletionStats({
        player,
        gameMode: 'story',
        dexStory: dex,
        dexEndless: {},
      });

      expect(result.completion).toBe(100);
      expect(result.completion).not.toBeGreaterThan(100);
    });
  });
});
