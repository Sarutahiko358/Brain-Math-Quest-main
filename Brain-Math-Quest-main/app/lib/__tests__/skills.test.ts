/**
 * Unit tests for skills module
 */

import { describe, it, expect } from 'vitest';
import {
  Skill,
  ALL_SKILLS,
  ULTIMATE_SKILL,
  ULTIMATE_MAGIC,
  ultimatePlusName,
  powerWithPlus,
  learned,
  learnedWithUltimate,
} from '../skills';

describe('Skills Module', () => {
  describe('ALL_SKILLS constant', () => {
    it('should have 9 basic skills', () => {
      expect(ALL_SKILLS).toHaveLength(9);
    });

    it('should have 3 physical skills (rank 1-3)', () => {
      const skills = ALL_SKILLS.filter(s => s.type === 'skill');
      expect(skills).toHaveLength(3);
      expect(skills.map(s => s.rank)).toEqual([1, 2, 3]);
    });

    it('should have 3 fire spells (rank 1-3)', () => {
      const fire = ALL_SKILLS.filter(s => s.type === 'fire');
      expect(fire).toHaveLength(3);
      expect(fire.map(s => s.rank)).toEqual([1, 2, 3]);
    });

    it('should have 3 heal spells (rank 1-3)', () => {
      const heal = ALL_SKILLS.filter(s => s.type === 'heal');
      expect(heal).toHaveLength(3);
      expect(heal.map(s => s.rank)).toEqual([1, 2, 3]);
    });

    it('should have no MP cost for physical skills', () => {
      const skills = ALL_SKILLS.filter(s => s.type === 'skill');
      skills.forEach(s => expect(s.mp).toBe(0));
    });

    it('should have MP cost for magic spells', () => {
      const magic = ALL_SKILLS.filter(s => s.type === 'fire' || s.type === 'heal');
      magic.forEach(s => expect(s.mp).toBeGreaterThan(0));
    });
  });

  describe('Ultimate skills', () => {
    it('ULTIMATE_SKILL should be rank 3 physical skill', () => {
      expect(ULTIMATE_SKILL.type).toBe('skill');
      expect(ULTIMATE_SKILL.rank).toBe(3);
      expect(ULTIMATE_SKILL.power).toBeGreaterThan(3);
    });

    it('ULTIMATE_MAGIC should be rank 3 fire spell', () => {
      expect(ULTIMATE_MAGIC.type).toBe('fire');
      expect(ULTIMATE_MAGIC.rank).toBe(3);
      expect(ULTIMATE_MAGIC.power).toBeGreaterThan(2.5);
    });
  });

  describe('ultimatePlusName', () => {
    it('should return base name when plus is 0', () => {
      expect(ultimatePlusName('Test', 0)).toBe('Test');
    });

    it('should return base name when plus is undefined', () => {
      expect(ultimatePlusName('Test', undefined)).toBe('Test');
    });

    it('should add +N suffix when plus > 0', () => {
      expect(ultimatePlusName('Test', 1)).toBe('Test+1');
      expect(ultimatePlusName('Test', 5)).toBe('Test+5');
    });
  });

  describe('powerWithPlus', () => {
    it('should return base power when plus is 0', () => {
      expect(powerWithPlus(100, 0)).toBe(100);
    });

    it('should return base power when plus is undefined', () => {
      expect(powerWithPlus(100, undefined)).toBe(100);
    });

    it('should add 8% per plus level', () => {
      expect(powerWithPlus(100, 1)).toBe(108);
      expect(powerWithPlus(100, 2)).toBeCloseTo(116, 10);
      expect(powerWithPlus(100, 5)).toBe(140);
    });

    it('should work with decimal powers', () => {
      expect(powerWithPlus(2.5, 1)).toBeCloseTo(2.7, 1);
      expect(powerWithPlus(3.2, 2)).toBeCloseTo(3.712, 2);
    });
  });

  describe('learned', () => {
    it('should return rank 1 skills for level 1-4', () => {
      const skills1 = learned(1);
      expect(skills1.skill).toHaveLength(1);
      expect(skills1.fire).toHaveLength(1);
      expect(skills1.heal).toHaveLength(1);
      expect(skills1.skill[0].rank).toBe(1);

      const skills4 = learned(4);
      expect(skills4.skill).toHaveLength(1);
      expect(skills4.fire).toHaveLength(1);
      expect(skills4.heal).toHaveLength(1);
    });

    it('should return rank 1-2 skills for level 5-9', () => {
      const skills5 = learned(5);
      expect(skills5.skill).toHaveLength(2);
      expect(skills5.fire).toHaveLength(2);
      expect(skills5.heal).toHaveLength(2);
      expect(skills5.skill.map(s => s.rank)).toEqual([1, 2]);

      const skills9 = learned(9);
      expect(skills9.skill).toHaveLength(2);
      expect(skills9.fire).toHaveLength(2);
      expect(skills9.heal).toHaveLength(2);
    });

    it('should return all rank 1-3 skills for level 10+', () => {
      const skills10 = learned(10);
      expect(skills10.skill).toHaveLength(3);
      expect(skills10.fire).toHaveLength(3);
      expect(skills10.heal).toHaveLength(3);
      expect(skills10.skill.map(s => s.rank)).toEqual([1, 2, 3]);

      const skills20 = learned(20);
      expect(skills20.skill).toHaveLength(3);
      expect(skills20.fire).toHaveLength(3);
      expect(skills20.heal).toHaveLength(3);
    });
  });

  describe('learnedWithUltimate', () => {
    it('should return base skills when no ultimates unlocked', () => {
      const skills = learnedWithUltimate(10, false, false, 0, 0);
      expect(skills.skill).toHaveLength(3);
      expect(skills.fire).toHaveLength(3);
      expect(skills.heal).toHaveLength(3);
      expect(skills.skill.every(s => s.key !== 'ultimate-aurora')).toBe(true);
      expect(skills.fire.every(s => s.key !== 'ultimate-cosmos')).toBe(true);
    });

    it('should add ultimate skill when unlocked', () => {
      const skills = learnedWithUltimate(10, true, false, 0, 0);
      expect(skills.skill).toHaveLength(4);
      expect(skills.fire).toHaveLength(3);
      expect(skills.skill[3].key).toBe('ultimate-aurora');
    });

    it('should add ultimate magic when unlocked', () => {
      const skills = learnedWithUltimate(10, false, true, 0, 0);
      expect(skills.skill).toHaveLength(3);
      expect(skills.fire).toHaveLength(4);
      expect(skills.fire[3].key).toBe('ultimate-cosmos');
    });

    it('should add both ultimates when both unlocked', () => {
      const skills = learnedWithUltimate(10, true, true, 0, 0);
      expect(skills.skill).toHaveLength(4);
      expect(skills.fire).toHaveLength(4);
      expect(skills.skill[3].key).toBe('ultimate-aurora');
      expect(skills.fire[3].key).toBe('ultimate-cosmos');
    });

    it('should enhance ultimate skill power with plus levels', () => {
      const skills0 = learnedWithUltimate(10, true, false, 0, 0);
      const skills2 = learnedWithUltimate(10, true, false, 2, 0);
      
      const basePower = skills0.skill[3].power;
      const enhancedPower = skills2.skill[3].power;
      
      expect(enhancedPower).toBeGreaterThan(basePower);
      expect(enhancedPower).toBeCloseTo(basePower * 1.16, 2);
    });

    it('should add +N to ultimate skill names with plus levels', () => {
      const skills = learnedWithUltimate(10, true, true, 3, 5);
      expect(skills.skill[3].name).toContain('+3');
      expect(skills.fire[3].name).toContain('+5');
    });

    it('should not modify heal spells', () => {
      const skills1 = learnedWithUltimate(10, false, false, 0, 0);
      const skills2 = learnedWithUltimate(10, true, true, 5, 5);
      expect(skills1.heal).toEqual(skills2.heal);
    });
  });

  describe('Skill type structure', () => {
    it('should have all required properties', () => {
      ALL_SKILLS.forEach((skill: Skill) => {
        expect(skill).toHaveProperty('key');
        expect(skill).toHaveProperty('name');
        expect(skill).toHaveProperty('rank');
        expect(skill).toHaveProperty('type');
        expect(skill).toHaveProperty('power');
        expect(typeof skill.key).toBe('string');
        expect(typeof skill.name).toBe('string');
        expect([1, 2, 3]).toContain(skill.rank);
        expect(['skill', 'fire', 'heal']).toContain(skill.type);
        expect(typeof skill.power).toBe('number');
      });
    });

    it('should have unique keys', () => {
      const keys = ALL_SKILLS.map(s => s.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });
});
