import { describe, it, expect } from 'vitest';
import { generateEndlessFloor, scaleStats, pickBackground } from '../lib/world/endless';

describe('endless core', () => {
  it('scales stats monotonically with floor', () => {
    const s1 = scaleStats(1, 'mob');
    const s5 = scaleStats(5, 'mob');
    const s10 = scaleStats(10, 'mob');
    expect(s5.hp).toBeGreaterThan(s1.hp);
    expect(s10.hp).toBeGreaterThan(s5.hp);
    expect(s10.atk).toBeGreaterThan(s5.atk);
  });

  it('generates background path under /images/backgrounds', () => {
    const bg = pickBackground(123);
    expect(bg.startsWith('/images/backgrounds/')).toBe(true);
  });

  it('generates mobs and a boss including kirin candidate in pool', () => {
    const f = generateEndlessFloor(7, 999);
    expect(f.mobs.length).toBeGreaterThan(0);
    expect(f.boss).toBeTruthy();
    expect(f.boss.stats.hp).toBeGreaterThan(f.mobs[0].stats.hp);
  });
});
