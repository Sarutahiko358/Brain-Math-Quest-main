/**
 * Tests for getAreaClearBannerState utility function
 */

import { describe, it, expect } from 'vitest';
import { getAreaClearBannerState } from '../utils';
import { Player } from '../../lib/gameTypes';
import { AreaInfo } from '../../lib/world/areas';
import { WEAPONS, ARMORS } from '../../lib/equipment';
import { DexData } from '../types';

describe('getAreaClearBannerState', () => {
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

  const baseAreaInfo: AreaInfo = {
    id: 3,
    name: 'Test Area',
    description: 'Test Description',
    map: [],
    startPos: { r: 0, c: 0 },
    bossName: 'Test Boss',
    bossPos: { r: 9, c: 9 },
    bossDefeated: false,
    story: {
      intro: 'Test intro',
      bossEncounter: 'Test encounter',
      victory: 'Test victory',
    },
  };

  it('should return bossRoom state for area 9', () => {
    const player = { ...basePlayer, currentArea: 9 };
    const areaInfo = { ...baseAreaInfo, bossName: '虚空の王' };
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: {},
    });
    
    expect(result.state).toBe('bossRoom');
    expect(result.bossName).toBe('虚空の王');
  });

  it('should return cleared state when boss is defeated', () => {
    const player = { ...basePlayer, currentArea: 3 };
    const areaInfo = { ...baseAreaInfo, bossName: 'TestBoss' };
    const dex: DexData = {
      TestBoss: { seen: 1, defeated: 1 },
    };
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    expect(result.state).toBe('cleared');
    expect(result.bossName).toBe('TestBoss');
  });

  it('should return cleared state when boss defeated multiple times', () => {
    const player = { ...basePlayer, currentArea: 5 };
    const areaInfo = { ...baseAreaInfo, bossName: 'MultiBoss' };
    const dex: DexData = {
      MultiBoss: { seen: 10, defeated: 5 },
    };
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    expect(result.state).toBe('cleared');
  });

  it('should return target state when boss not defeated', () => {
    const player = { ...basePlayer, currentArea: 2 };
    const areaInfo = { ...baseAreaInfo, bossName: 'UndefeatedBoss' };
    const dex: DexData = {};
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    expect(result.state).toBe('target');
    expect(result.bossName).toBe('UndefeatedBoss');
  });

  it('should return target state when boss seen but not defeated', () => {
    const player = { ...basePlayer, currentArea: 4 };
    const areaInfo = { ...baseAreaInfo, bossName: 'SeenBoss' };
    const dex: DexData = {
      SeenBoss: { seen: 5, defeated: 0 },
    };
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    expect(result.state).toBe('target');
  });

  it('should handle area 1', () => {
    const player = { ...basePlayer, currentArea: 1 };
    const areaInfo = { ...baseAreaInfo, bossName: '巨大スライム' };
    const dex: DexData = {};
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    expect(result.state).toBe('target');
    expect(result.bossName).toBe('巨大スライム');
  });

  it('should handle area 8', () => {
    const player = { ...basePlayer, currentArea: 8 };
    const areaInfo = { ...baseAreaInfo, bossName: 'Area8Boss' };
    const dex: DexData = {
      Area8Boss: { seen: 1, defeated: 1 },
    };
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    expect(result.state).toBe('cleared');
  });

  it('should handle area 10 (endless) not as bossRoom', () => {
    const player = { ...basePlayer, currentArea: 10 };
    const areaInfo = { ...baseAreaInfo, bossName: 'EndlessBoss' };
    const dex: DexData = {};
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    // Area 10 is not special for banner state, only area 9 is
    expect(result.state).toBe('target');
  });

  it('should prioritize area 9 check over defeated status', () => {
    const player = { ...basePlayer, currentArea: 9 };
    const areaInfo = { ...baseAreaInfo, bossName: 'BossRoom' };
    const dex: DexData = {
      BossRoom: { seen: 10, defeated: 10 }, // Even if defeated
    };
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    // Area 9 always shows bossRoom state
    expect(result.state).toBe('bossRoom');
  });

  it('should handle empty dex for non-special areas', () => {
    const player = { ...basePlayer, currentArea: 3 };
    const areaInfo = { ...baseAreaInfo, bossName: 'NewBoss' };
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: {},
    });
    
    expect(result.state).toBe('target');
  });

  it('should handle boss name with special characters', () => {
    const player = { ...basePlayer, currentArea: 5 };
    const areaInfo = { ...baseAreaInfo, bossName: '炎龍ヴォルカノ' };
    const dex: DexData = {
      '炎龍ヴォルカノ': { seen: 2, defeated: 1 },
    };
    
    const result = getAreaClearBannerState({
      player,
      currentAreaInfo: areaInfo,
      currentDex: dex,
    });
    
    expect(result.state).toBe('cleared');
    expect(result.bossName).toBe('炎龍ヴォルカノ');
  });
});
