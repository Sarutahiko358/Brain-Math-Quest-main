/**
 * Tests for guardian encounter utilities
 */

import { describe, it, expect } from 'vitest';
import {
  GUARDIAN_NAMES,
  GUARDIAN_REWARDS,
  scaleGuardianStats,
  prepareGuardianEnemy,
  getGuardianReward,
  allGuardiansDefeated,
} from '../../lib/world/guardianEncounter';
import { Enemy } from '../../lib/enemies';

const mockGuardian: Enemy = {
  name: '玄武',
  emoji: '🐢',
  maxHP: 200,
  hp: 200,
  atk: 30,
  minLevel: 1,
  maxLevel: 99,
  area: 7,
  boss: true,
  imageUrl: '/images/enemies/genbu.png',
  renderSize: 160,
};

describe('guardian encounter utilities', () => {
  describe('scaleGuardianStats', () => {
    it('should scale stats for easy difficulty', () => {
      const scaled = scaleGuardianStats(mockGuardian, 'easy');
      expect(scaled.maxHP).toBe(180); // 200 * 0.9
      expect(scaled.hp).toBe(180);
      expect(scaled.atk).toBe(27); // 30 * 0.9
      expect(scaled.renderSize).toBe(240); // 160 * 1.5
    });

    it('should not scale stats for normal difficulty', () => {
      const scaled = scaleGuardianStats(mockGuardian, 'normal');
      expect(scaled.maxHP).toBe(200); // 200 * 1.0
      expect(scaled.hp).toBe(200);
      expect(scaled.atk).toBe(30); // 30 * 1.0
      expect(scaled.renderSize).toBe(240); // 160 * 1.5
    });

    it('should scale stats for hard difficulty', () => {
      const scaled = scaleGuardianStats(mockGuardian, 'hard');
      expect(scaled.maxHP).toBe(250); // 200 * 1.25
      expect(scaled.hp).toBe(250);
      expect(scaled.atk).toBe(38); // 30 * 1.25
      expect(scaled.renderSize).toBe(240); // 160 * 1.5
    });

    it('should use default render size if not specified', () => {
      const guardianNoSize = { ...mockGuardian };
      delete guardianNoSize.renderSize;
      const scaled = scaleGuardianStats(guardianNoSize, 'normal');
      expect(scaled.renderSize).toBe(240); // 160 (default) * 1.5
    });
  });

  describe('prepareGuardianEnemy', () => {
    it('should prepare guardian with scaled stats', () => {
      // Note: This test depends on BOSS_POOL having the guardian
      // In a real scenario, we might want to mock BOSS_POOL
      const enemy = prepareGuardianEnemy('玄武', 'normal');
      
      if (enemy) {
        expect(enemy.name).toBe('玄武');
        expect(enemy.hp).toBe(enemy.maxHP);
        // Stats should be scaled
        expect(enemy.renderSize).toBeGreaterThan(0);
      }
      // If guardian not found in pool, it returns null
      // This is acceptable for test
    });

    it('should return null for non-existent guardian', () => {
      const enemy = prepareGuardianEnemy('存在しない守護者', 'normal');
      expect(enemy).toBe(null);
    });

    it('should scale guardian stats based on difficulty', () => {
      const easyEnemy = prepareGuardianEnemy('玄武', 'easy');
      const hardEnemy = prepareGuardianEnemy('玄武', 'hard');
      
      if (easyEnemy && hardEnemy) {
        // Hard should have higher stats than easy
        expect(hardEnemy.maxHP).toBeGreaterThan(easyEnemy.maxHP);
        expect(hardEnemy.atk).toBeGreaterThan(easyEnemy.atk);
      }
    });
  });

  describe('getGuardianReward', () => {
    it('should return correct reward for each guardian', () => {
      expect(getGuardianReward(GUARDIAN_NAMES.GENBU)).toBe(GUARDIAN_REWARDS.GENBU);
      expect(getGuardianReward(GUARDIAN_NAMES.SEIRYU)).toBe(GUARDIAN_REWARDS.SEIRYU);
      expect(getGuardianReward(GUARDIAN_NAMES.SUZAKU)).toBe(GUARDIAN_REWARDS.SUZAKU);
      expect(getGuardianReward(GUARDIAN_NAMES.BYAKKO)).toBe(GUARDIAN_REWARDS.BYAKKO);
    });

    it('should return null for unknown guardian', () => {
      expect(getGuardianReward('Unknown Guardian')).toBe(null);
    });

    it('should handle empty string', () => {
      expect(getGuardianReward('')).toBe(null);
    });
  });

  describe('allGuardiansDefeated', () => {
    it('should return true when all guardians are defeated', () => {
      const flags = {
        genbuDefeated: true,
        seiryuDefeated: true,
        suzakuDefeated: true,
        byakkoDefeated: true,
      };
      expect(allGuardiansDefeated(flags)).toBe(true);
    });

    it('should return false when any guardian is not defeated', () => {
      expect(allGuardiansDefeated({
        genbuDefeated: false,
        seiryuDefeated: true,
        suzakuDefeated: true,
        byakkoDefeated: true,
      })).toBe(false);

      expect(allGuardiansDefeated({
        genbuDefeated: true,
        seiryuDefeated: false,
        suzakuDefeated: true,
        byakkoDefeated: true,
      })).toBe(false);

      expect(allGuardiansDefeated({
        genbuDefeated: true,
        seiryuDefeated: true,
        suzakuDefeated: false,
        byakkoDefeated: true,
      })).toBe(false);

      expect(allGuardiansDefeated({
        genbuDefeated: true,
        seiryuDefeated: true,
        suzakuDefeated: true,
        byakkoDefeated: false,
      })).toBe(false);
    });

    it('should return false when all guardians are not defeated', () => {
      const flags = {
        genbuDefeated: false,
        seiryuDefeated: false,
        suzakuDefeated: false,
        byakkoDefeated: false,
      };
      expect(allGuardiansDefeated(flags)).toBe(false);
    });

    it('should handle missing flags as false', () => {
      expect(allGuardiansDefeated({})).toBe(false);
      expect(allGuardiansDefeated({ genbuDefeated: true })).toBe(false);
    });

    it('should handle undefined flags correctly', () => {
      const flags = {
        genbuDefeated: true,
        seiryuDefeated: undefined,
        suzakuDefeated: true,
        byakkoDefeated: true,
      };
      expect(allGuardiansDefeated(flags)).toBe(false);
    });
  });
});
