/**
 * Battle Conditions Test
 *
 * Unit tests for pure condition checker functions
 */

import { describe, it, expect } from 'vitest';
import {
  isGameOver,
  hasRewards,
  hasRewardItems,
  hasTimeBonus,
  hasLevelUp,
} from '../conditions';
import { Player, BattleState } from '../../gameTypes';

describe('Battle Conditions', () => {
  describe('isGameOver', () => {
    it('should return true when player HP is 0', () => {
      const player = { hp: 0 } as Player;
      expect(isGameOver(player)).toBe(true);
    });

    it('should return true when player HP is negative', () => {
      const player = { hp: -10 } as Player;
      expect(isGameOver(player)).toBe(true);
    });

    it('should return false when player HP is positive', () => {
      const player = { hp: 50 } as Player;
      expect(isGameOver(player)).toBe(false);
    });

    it('should return false when player HP is 1', () => {
      const player = { hp: 1 } as Player;
      expect(isGameOver(player)).toBe(false);
    });
  });

  describe('hasRewards', () => {
    it('should return true when battle has rewards', () => {
      const battle = {
        rewards: { exp: 100, gold: 50 }
      } as unknown as BattleState;
      expect(hasRewards(battle)).toBe(true);
    });

    it('should return false when battle is null', () => {
      expect(hasRewards(null)).toBe(false);
    });

    it('should return false when battle has no rewards', () => {
      const battle = {} as unknown as BattleState;
      expect(hasRewards(battle)).toBe(false);
    });
  });

  describe('hasRewardItems', () => {
    it('should return true when battle has items', () => {
      const battle = {
        rewards: {
          exp: 100,
          gold: 50,
          items: ['ポーション', '剣']
        }
      } as unknown as BattleState;
      expect(hasRewardItems(battle)).toBe(true);
    });

    it('should return false when items array is empty', () => {
      const battle = {
        rewards: {
          exp: 100,
          gold: 50,
          items: []
        }
      } as unknown as BattleState;
      expect(hasRewardItems(battle)).toBe(false);
    });

    it('should return false when battle is null', () => {
      expect(hasRewardItems(null)).toBe(false);
    });

    it('should return false when battle has no items', () => {
      const battle = {
        rewards: { exp: 100, gold: 50 }
      } as unknown as BattleState;
      expect(hasRewardItems(battle)).toBe(false);
    });
  });

  describe('hasTimeBonus', () => {
    it('should return true when timeBonus is positive', () => {
      const battle = {
        rewards: {
          exp: 100,
          gold: 50,
          timeBonus: 25
        }
      } as unknown as BattleState;
      expect(hasTimeBonus(battle)).toBe(true);
    });

    it('should return false when timeBonus is 0', () => {
      const battle = {
        rewards: {
          exp: 100,
          gold: 50,
          timeBonus: 0
        }
      } as unknown as BattleState;
      expect(hasTimeBonus(battle)).toBe(false);
    });

    it('should return false when timeBonus is negative', () => {
      const battle = {
        rewards: {
          exp: 100,
          gold: 50,
          timeBonus: -10
        }
      } as unknown as BattleState;
      expect(hasTimeBonus(battle)).toBe(false);
    });

    it('should return false when battle is null', () => {
      expect(hasTimeBonus(null)).toBe(false);
    });

    it('should return false when battle has no timeBonus', () => {
      const battle = {
        rewards: { exp: 100, gold: 50 }
      } as unknown as BattleState;
      expect(hasTimeBonus(battle)).toBe(false);
    });
  });

  describe('hasLevelUp', () => {
    it('should return true when battle has levelUp', () => {
      const battle = {
        rewards: {
          exp: 100,
          gold: 50,
          levelUp: {
            oldLv: 5,
            newLv: 6,
            hpGain: 10,
            mpGain: 5,
            atkGain: 2,
            defGain: 1
          }
        }
      } as unknown as BattleState;
      expect(hasLevelUp(battle)).toBe(true);
    });

    it('should return false when battle is null', () => {
      expect(hasLevelUp(null)).toBe(false);
    });

    it('should return false when battle has no levelUp', () => {
      const battle = {
        rewards: { exp: 100, gold: 50 }
      } as unknown as BattleState;
      expect(hasLevelUp(battle)).toBe(false);
    });
  });
});
