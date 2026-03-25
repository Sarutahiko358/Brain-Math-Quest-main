import { describe, it, expect } from 'vitest';
import type { Player } from '../../gameTypes';
import { applyExpGold } from '../flow';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    avatar: '🧪',
    lv: 1,
    exp: 0,
    gold: 0,
    maxHP: 98,
    hp: 98,
    maxMP: 98,
    mp: 98,
    baseATK: 5,
    baseDEF: 3,
    equip: { weapon: { name: 'Stick', atk: 1, price: 0 }, armor: { name: 'Cloth', def: 1, price: 0 } },
    items: [],
    keyItems: [],
    pos: { r: 2, c: 2 },
    currentArea: 1,
    clearedAreas: [],
    storyShownAreas: [],
    ...overrides,
  };
}

describe('HP/MP growth should exceed 99 (no cap)', () => {
  it('level up increases maxHP/maxMP beyond 99', () => {
    const p = makePlayer({ maxHP: 98, hp: 98, maxMP: 98, mp: 98, lv: 1, exp: 0 });
    // Enough exp to guarantee at least 1 level up (>= 40)
    const { player: p2, levelUp } = applyExpGold(p, 100, 0);
    expect(levelUp).toBeTruthy();
    expect(p2.maxHP).toBeGreaterThan(99);
    expect(p2.maxMP).toBeGreaterThan(99);
    // Current HP/MP also should not be capped to 99 (they restore to new max on level-up)
    expect(p2.hp).toBe(p2.maxHP);
    expect(p2.mp).toBe(p2.maxMP);
  });
});
