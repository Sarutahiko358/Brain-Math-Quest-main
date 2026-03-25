/**
 * Tests for DQBrain utility functions
 */

import { describe, it, expect } from 'vitest';
import { healAtInnCost, tileEmoji, getShopAssortment, createSeenUpdater, createDefeatedUpdater, createEquipDexUpdater, buildBattleBackgroundStyle } from '../utils';
import { Player } from '../../lib/gameTypes';
import { T } from '../../lib/world/areas';
import { WEAPONS, ARMORS } from '../../lib/equipment';
import { DexData, EquipDexState } from '../types';

describe('healAtInnCost', () => {
  it('should calculate cost correctly for level 1 player', () => {
    const player: Player = {
      name: 'Test',
      avatar: '🦸',
      lv: 1,
      exp: 0,
      gold: 100,
      maxHP: 40,
      hp: 40,
      maxMP: 12,
      mp: 12,
      baseATK: 3,
      baseDEF: 2,
      equip: { weapon: WEAPONS[0], armor: ARMORS[0] },
      items: [],
      keyItems: [],
      pos: { r: 0, c: 0 },
      currentArea: 1,
      clearedAreas: [],
      storyShownAreas: []
    };

    // INN_PRICE is 15, so for level 1: min(15 + 0, 60) = 15
    expect(healAtInnCost(player)).toBe(15);
  });

  it('should calculate cost correctly for level 10 player', () => {
    const player: Player = {
      name: 'Test',
      avatar: '🦸',
      lv: 10,
      exp: 0,
      gold: 100,
      maxHP: 40,
      hp: 40,
      maxMP: 12,
      mp: 12,
      baseATK: 3,
      baseDEF: 2,
      equip: { weapon: WEAPONS[0], armor: ARMORS[0] },
      items: [],
      keyItems: [],
      pos: { r: 0, c: 0 },
      currentArea: 1,
      clearedAreas: [],
      storyShownAreas: []
    };

    // INN_PRICE is 15, so for level 10: min(15 + (10-1)*2, 60) = min(33, 60) = 33
    expect(healAtInnCost(player)).toBe(33);
  });

  it('should cap at 60G for high level players', () => {
    const player: Player = {
      name: 'Test',
      avatar: '🦸',
      lv: 50,
      exp: 0,
      gold: 100,
      maxHP: 40,
      hp: 40,
      maxMP: 12,
      mp: 12,
      baseATK: 3,
      baseDEF: 2,
      equip: { weapon: WEAPONS[0], armor: ARMORS[0] },
      items: [],
      keyItems: [],
      pos: { r: 0, c: 0 },
      currentArea: 1,
      clearedAreas: [],
      storyShownAreas: []
    };

    // INN_PRICE is 15, so for level 50: min(15 + 49*2, 60) = min(113, 60) = 60
    expect(healAtInnCost(player)).toBe(60);
  });
});

describe('tileEmoji', () => {
  it('should return grass emoji for Grass tile', () => {
    expect(tileEmoji(T.Grass)).toBe("🟩");
  });

  it('should return wall emoji for Wall tile', () => {
    expect(tileEmoji(T.Wall)).toBe("🪨");
  });

  it('should return water emoji for Water tile', () => {
    expect(tileEmoji(T.Water)).toBe("🟦");
  });

  it('should return town emoji for Town tile', () => {
    expect(tileEmoji(T.Town)).toBe("🏘️");
  });

  it('should return cave emoji for Cave tile', () => {
    expect(tileEmoji(T.Cave)).toBe("🕳️");
  });

  it('should return castle emoji for Castle tile', () => {
    expect(tileEmoji(T.Castle)).toBe("🏰");
  });
});

describe('getShopAssortment', () => {
  it('should return full assortment even when ultimate is unlocked (for completion)', () => {
    const result = getShopAssortment(5, undefined, true);
    // コンプリート対応: ultimateUnlocked でも装備は購入可能
    expect(result.weapons.length).toBeGreaterThan(0);
    expect(result.armors.length).toBeGreaterThan(0);
  });

  it('should return limited assortment for area 1 in story mode', () => {
    const result = getShopAssortment(1, undefined, false);
    // Area 1: max index = Math.max(2, area + 1) = Math.max(2, 2) = 2
    expect(result.weapons.length).toBe(2);
    expect(result.armors.length).toBe(2);
    expect(result.weapons).toEqual(WEAPONS.slice(0, 2));
    expect(result.armors).toEqual(ARMORS.slice(0, 2));
  });

  it('should return full assortment for area 6+ in story mode', () => {
    const result = getShopAssortment(6, undefined, false);
    expect(result.weapons.length).toBe(WEAPONS.length);
    expect(result.armors.length).toBe(ARMORS.length);
    expect(result.weapons).toEqual(WEAPONS);
    expect(result.armors).toEqual(ARMORS);
  });

  it('should scale with floor in endless mode (area 10)', () => {
    // Floor 1: max index = Math.max(2, 1 + 1) = 2
    const result1 = getShopAssortment(10, 1, false);
    expect(result1.weapons.length).toBe(2);
    expect(result1.armors.length).toBe(2);

    // Floor 5: max index = Math.max(2, 1 + 5) = 6
    const result5 = getShopAssortment(10, 5, false);
    expect(result5.weapons.length).toBe(6);
    expect(result5.armors.length).toBe(6);
  });

  it('should handle undefined floor in endless mode', () => {
    const result = getShopAssortment(10, undefined, false);
    // Floor defaults to 1: max index = Math.max(2, 1 + 1) = 2
    expect(result.weapons.length).toBe(2);
    expect(result.armors.length).toBe(2);
  });

  it('should cap at total weapons/armors count in endless mode', () => {
    const result = getShopAssortment(10, 1000, false);
    expect(result.weapons.length).toBe(WEAPONS.length);
    expect(result.armors.length).toBe(ARMORS.length);
  });
});

describe('createSeenUpdater', () => {
  it('should create an updater that records a new enemy as seen', () => {
    const dex: DexData = {};
    const updater = createSeenUpdater('Slime');
    const newDex = updater(dex);

    expect(newDex['Slime']).toEqual({ seen: 1, defeated: 0 });
  });

  it('should increment seen count for existing enemy', () => {
    const dex: DexData = {
      'Slime': { seen: 2, defeated: 1 }
    };
    const updater = createSeenUpdater('Slime');
    const newDex = updater(dex);

    expect(newDex['Slime']).toEqual({ seen: 3, defeated: 1 });
  });

  it('should not mutate original dex data', () => {
    const dex: DexData = {
      'Slime': { seen: 1, defeated: 0 }
    };
    const updater = createSeenUpdater('Slime');
    const newDex = updater(dex);

    expect(dex['Slime']).toEqual({ seen: 1, defeated: 0 });
    expect(newDex['Slime']).toEqual({ seen: 2, defeated: 0 });
  });
});

describe('createDefeatedUpdater', () => {
  it('should create an updater that records a new enemy as defeated', () => {
    const dex: DexData = {};
    const updater = createDefeatedUpdater('Slime');
    const newDex = updater(dex);

    expect(newDex['Slime']).toEqual({ seen: 0, defeated: 1 });
  });

  it('should increment defeated count for existing enemy', () => {
    const dex: DexData = {
      'Slime': { seen: 3, defeated: 1 }
    };
    const updater = createDefeatedUpdater('Slime');
    const newDex = updater(dex);

    expect(newDex['Slime']).toEqual({ seen: 3, defeated: 2 });
  });

  it('should not mutate original dex data', () => {
    const dex: DexData = {
      'Slime': { seen: 2, defeated: 1 }
    };
    const updater = createDefeatedUpdater('Slime');
    const newDex = updater(dex);

    expect(dex['Slime']).toEqual({ seen: 2, defeated: 1 });
    expect(newDex['Slime']).toEqual({ seen: 2, defeated: 2 });
  });
});

describe('createEquipDexUpdater', () => {
  it('should add a new weapon to empty dex', () => {
    const dex: EquipDexState = { weapons: [], armors: [] };
    const updater = createEquipDexUpdater('weapon', 'こんぼう');
    const newDex = updater(dex);

    expect(newDex.weapons).toEqual(['こんぼう']);
    expect(newDex.armors).toEqual([]);
  });

  it('should add a new armor to empty dex', () => {
    const dex: EquipDexState = { weapons: [], armors: [] };
    const updater = createEquipDexUpdater('armor', 'ぬののふく');
    const newDex = updater(dex);

    expect(newDex.weapons).toEqual([]);
    expect(newDex.armors).toEqual(['ぬののふく']);
  });

  it('should not add duplicate weapon', () => {
    const dex: EquipDexState = { weapons: ['こんぼう'], armors: [] };
    const updater = createEquipDexUpdater('weapon', 'こんぼう');
    const newDex = updater(dex);

    expect(newDex.weapons).toEqual(['こんぼう']);
    expect(newDex).toBe(dex); // Same reference when no change
  });

  it('should not add duplicate armor', () => {
    const dex: EquipDexState = { weapons: [], armors: ['ぬののふく'] };
    const updater = createEquipDexUpdater('armor', 'ぬののふく');
    const newDex = updater(dex);

    expect(newDex.armors).toEqual(['ぬののふく']);
    expect(newDex).toBe(dex); // Same reference when no change
  });

  it('should not mutate original dex when adding', () => {
    const dex: EquipDexState = { weapons: ['こんぼう'], armors: [] };
    const updater = createEquipDexUpdater('weapon', 'どうのつるぎ');
    const newDex = updater(dex);

    expect(dex.weapons).toEqual(['こんぼう']);
    expect(newDex.weapons).toEqual(['こんぼう', 'どうのつるぎ']);
  });
});

describe('buildBattleBackgroundStyle', () => {
  it('should return gradient-only style when no images', () => {
    const gradient = 'linear-gradient(to bottom, #333, #111)';
    const result = buildBattleBackgroundStyle([], gradient);

    expect(result).toEqual({
      backgroundImage: gradient,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    });
  });

  it('should build layered style with single image', () => {
    const images = ['/images/bg.png'];
    const gradient = 'linear-gradient(to bottom, #333, #111)';
    const result = buildBattleBackgroundStyle(images, gradient);

    expect(result.backgroundImage).toBe('url(/images/bg.png), linear-gradient(to bottom, #333, #111)');
    expect(result.backgroundSize).toBe('cover, cover');
    expect(result.backgroundRepeat).toBe('no-repeat, no-repeat');
    expect(result.backgroundPosition).toBe('center, center');
  });

  it('should build layered style with multiple images', () => {
    const images = ['/images/bg1.png', '/images/bg2.png'];
    const gradient = 'linear-gradient(to bottom, #333, #111)';
    const result = buildBattleBackgroundStyle(images, gradient);

    expect(result.backgroundImage).toBe('url(/images/bg1.png), url(/images/bg2.png), linear-gradient(to bottom, #333, #111)');
    expect(result.backgroundSize).toBe('cover, cover, cover');
    expect(result.backgroundRepeat).toBe('no-repeat, no-repeat, no-repeat');
    expect(result.backgroundPosition).toBe('center, center, center');
  });

  it('should handle empty gradient string', () => {
    const images = ['/images/bg.png'];
    const gradient = '';
    const result = buildBattleBackgroundStyle(images, gradient);

    expect(result.backgroundImage).toBe('url(/images/bg.png), ');
    expect(result.backgroundSize).toBe('cover, cover');
  });
});
