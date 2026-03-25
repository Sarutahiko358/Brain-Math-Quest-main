/**
 * Tests for boss encounter utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getKirinIntroLines,
  getBossIntroLines,
  getGuardianIntroLines,
  getEncounterIntroLines,
} from '../../lib/world/bossEncounter';
import { Enemy } from '../../lib/enemies';

const mockKirin: Enemy = {
  name: '九尾の麒麟',
  emoji: '⚡',
  maxHP: 999,
  hp: 999,
  atk: 80,
  minLevel: 1,
  maxLevel: 99,
  area: 8,
  boss: true,
  imageUrl: '/images/enemies/kirin.png',
};

const mockBoss: Enemy = {
  name: 'テストボス',
  emoji: '👹',
  maxHP: 500,
  hp: 500,
  atk: 50,
  minLevel: 1,
  maxLevel: 99,
  area: 3,
  boss: true,
  imageUrl: '/images/enemies/testboss.png',
};

describe('boss encounter utilities', () => {
  describe('getKirinIntroLines', () => {
    it('should return first encounter lines for attempt 1', () => {
      const lines = getKirinIntroLines(1, 'boss', mockKirin);
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('⚡ 九尾の麒麟 が あらわれた！');
      expect(lines[1]).toContain('万雷轟く');
    });

    it('should return second encounter lines for attempt 2', () => {
      const lines = getKirinIntroLines(2, 'boss', mockKirin);
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('⚡ 九尾の麒麟 が あらわれた！');
      expect(lines[1]).toContain('再び来たか');
    });

    it('should return different lines for rush variant on attempt 2', () => {
      const rushLines = getKirinIntroLines(2, 'rush', mockKirin);
      const bossLines = getKirinIntroLines(2, 'boss', mockKirin);
      expect(rushLines[1]).not.toBe(bossLines[1]);
      expect(rushLines[1]).toContain('雷鳴はなお止まず');
    });

    it('should return third encounter lines for attempt 3', () => {
      const lines = getKirinIntroLines(3, 'boss', mockKirin);
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('三たび');
    });

    it('should return fourth encounter lines for attempt 4', () => {
      const lines = getKirinIntroLines(4, 'boss', mockKirin);
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('四度');
    });

    it('should return random lines from pool for attempts 5+', () => {
      const lines5 = getKirinIntroLines(5, 'boss', mockKirin);
      const lines10 = getKirinIntroLines(10, 'boss', mockKirin);
      const lines100 = getKirinIntroLines(100, 'boss', mockKirin);
      
      expect(lines5).toHaveLength(2);
      expect(lines10).toHaveLength(2);
      expect(lines100).toHaveLength(2);
      
      // All should have base message
      expect(lines5[0]).toBe('⚡ 九尾の麒麟 が あらわれた！');
      expect(lines10[0]).toBe('⚡ 九尾の麒麟 が あらわれた！');
      expect(lines100[0]).toBe('⚡ 九尾の麒麟 が あらわれた！');
      
      // Second line should be from the common pool
      const commonPhrases = ['何度でもよい', '幾度でも', '執念', '尾は九つ', '雷は鍛える'];
      const hasCommonPhrase = (line: string) => commonPhrases.some(p => line.includes(p));
      expect(hasCommonPhrase(lines5[1])).toBe(true);
      expect(hasCommonPhrase(lines10[1])).toBe(true);
      expect(hasCommonPhrase(lines100[1])).toBe(true);
    });

    it('should handle edge cases for attempt number', () => {
      // Zero should be treated as 1
      const lines0 = getKirinIntroLines(0, 'boss', mockKirin);
      expect(lines0[1]).toContain('万雷轟く');
      
      // Negative should be clamped to 1
      const linesNeg = getKirinIntroLines(-5, 'boss', mockKirin);
      expect(linesNeg[1]).toContain('万雷轟く');
      
      // Very large number should work
      const lines999 = getKirinIntroLines(999, 'boss', mockKirin);
      expect(lines999).toHaveLength(2);
    });
  });

  describe('getBossIntroLines', () => {
    it('should return standard intro for non-endless mode', () => {
      const lines = getBossIntroLines(mockBoss, false);
      expect(lines).toEqual(['👹 テストボス が あらわれた！']);
    });

    it('should return floor-specific intro for endless mode', () => {
      const lines = getBossIntroLines(mockBoss, true, 5);
      expect(lines).toEqual(['💀 第5階層 フロアボス\n👹 テストボス が あらわれた！']);
    });

    it('should handle floor 1 in endless mode', () => {
      const lines = getBossIntroLines(mockBoss, true, 1);
      expect(lines[0]).toContain('第1階層');
    });
  });

  describe('getGuardianIntroLines', () => {
    it('should return trial message for guardians', () => {
      const guardian: Enemy = {
        ...mockBoss,
        name: '玄武',
        emoji: '🐢',
      };
      const lines = getGuardianIntroLines(guardian);
      expect(lines).toEqual(['🐢 玄武 が 試練を与える！']);
    });
  });

  describe('getEncounterIntroLines', () => {
    it('should use Kirin lines when isKirin is true', () => {
      const lines = getEncounterIntroLines(mockKirin, {
        isKirin: true,
        isEndless: false,
        isBossRush: false,
        kirinAttempt: 1,
      });
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('万雷轟く');
    });

    it('should use endless format when in endless mode', () => {
      const lines = getEncounterIntroLines(mockBoss, {
        isKirin: false,
        isEndless: true,
        isBossRush: false,
        floor: 3,
      });
      expect(lines).toEqual(['💀 第3階層\n👹 テストボス が あらわれた！']);
    });

    it('should use standard format for normal encounters', () => {
      const lines = getEncounterIntroLines(mockBoss, {
        isKirin: false,
        isEndless: false,
        isBossRush: false,
      });
      expect(lines).toEqual(['👹 テストボス が あらわれた！']);
    });

    it('should prioritize Kirin variant over endless format', () => {
      const lines = getEncounterIntroLines(mockKirin, {
        isKirin: true,
        isEndless: true,
        isBossRush: true,
        floor: 5,
        kirinAttempt: 2,
      });
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('雷鳴はなお止まず'); // Rush variant for attempt 2
    });
  });
});
