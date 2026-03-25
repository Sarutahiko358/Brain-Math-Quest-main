import { describe, it, expect } from 'vitest';
import { shouldRollEncounter, pickEnemy, scaleEnemy, getAvailableEnemies } from '../../lib/world/encounter';
import { ENEMY_POOL } from '../../lib/enemies';

describe('encounter rules', () => {
  it('should disable encounters in area 7', () => {
    expect(shouldRollEncounter(7)).toBe(false);
  });

  it('should disable encounters in area 8', () => {
    expect(shouldRollEncounter(8)).toBe(false);
  });

  it('should enable encounters in areas 1-6', () => {
    for (let i = 1; i <= 6; i++) {
      expect(shouldRollEncounter(i)).toBe(true);
    }
  });
});

describe('pickEnemy', () => {
  it('should return enemy for area 1 with seeded random', () => {
    // Deterministic picker: always pick first
    const pickFirst = <T,>(arr: T[]) => arr[0];
    const enemy = pickEnemy(1, pickFirst);
    expect(enemy).not.toBeNull();
    expect(enemy?.area).toBe(1);
    expect(enemy?.boss).not.toBe(true);
  });

  it('should return null for invalid area with no fallback', () => {
    const pickNone = <T,>(_arr: T[]) => undefined;
    const enemy = pickEnemy(999, pickNone);
    expect(enemy).toBeNull();
  });
});

describe('scaleEnemy', () => {
  it('should scale enemy for easy difficulty', () => {
    const enemy = { ...ENEMY_POOL[0] };
    const originalHP = enemy.maxHP;
    const originalAtk = enemy.atk;
    scaleEnemy(enemy, 'easy', false);
    expect(enemy.maxHP).toBeLessThanOrEqual(Math.round(originalHP * 0.9));
    expect(enemy.atk).toBeLessThanOrEqual(Math.round(originalAtk * 0.9));
  });

  it('should scale enemy for hard difficulty', () => {
    const enemy = { ...ENEMY_POOL[0] };
    const originalHP = enemy.maxHP;
    const originalAtk = enemy.atk;
    scaleEnemy(enemy, 'hard', false);
    expect(enemy.maxHP).toBeGreaterThan(originalHP);
    expect(enemy.atk).toBeGreaterThan(originalAtk);
  });

  it('should add bonus for cave/castle encounters', () => {
    const enemy = { ...ENEMY_POOL[0] };
    const originalAtk = enemy.atk;
    scaleEnemy(enemy, 'normal', true);
    expect(enemy.atk).toBe(originalAtk + 2);
  });
});

describe('getAvailableEnemies', () => {
  it('should return non-boss enemies for area 1', () => {
    const enemies = getAvailableEnemies(1, false);
    expect(enemies.length).toBeGreaterThan(0);
    expect(enemies.every(e => e.boss !== true)).toBe(true);
  });

  it('should return boss enemies for area 1', () => {
    const enemies = getAvailableEnemies(1, true);
    expect(enemies.length).toBeGreaterThan(0);
    expect(enemies.every(e => e.boss === true)).toBe(true);
  });
});
