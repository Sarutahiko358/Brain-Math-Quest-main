import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveToSlot,
  loadFromSlot,
  getAllSaveSlots,
  deleteSaveSlot,
  loadSave,
  createSaveData,
  findBestSaveSlot,
  extractPlayerFromSave,
  extractDexFromSave,
  extractGameModeFromSave,
  SAVE_KEY_PREFIX,
  MAX_SAVE_SLOTS,
  SaveData
} from '../saveSystem';
import { mergeSettings } from '../settings';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Setup global localStorage mock
beforeEach(() => {
  global.localStorage = localStorageMock as any;
  localStorageMock.clear();
});

describe('saveSystem - Save/Load Operations', () => {
  const mockPlayer: any = {
    name: 'テスト勇者',
    lv: 5,
    hp: 100,
    maxHP: 100,
    mp: 50,
    maxMP: 50,
    exp: 1000,
    gold: 500,
    atk: 20,
    def: 15,
    currentArea: 3,
    pos: { row: 5, col: 5 },
    clearedAreas: [1, 2],
    storyShownAreas: [1, 2],
    endlessFloor: 1,
    weapons: [],
    armors: [],
    accessories: [],
    tools: [],
    skills: [],
    magics: []
  };

  const mockSettings: any = {
    difficulty: 'normal' as const,
    bgm: true,
    se: true
  };

  const mockDexStory = { 'スライム': { seen: 10, defeated: 8 } };
  const mockDexEndless = { 'メタルスライム': { seen: 2, defeated: 1 } };
  const mockEquipDex = { weapons: ['銅の剣'], armors: ['皮の鎧'] };

  it('should save and load from a slot', () => {
    const saveData: SaveData = {
      player: mockPlayer,
      settings: mockSettings,
      dex: { story: mockDexStory, endless: mockDexEndless, equip: mockEquipDex },
      combo: 5,
      meta: { saveDate: Date.now(), playTime: 3600, version: '2.0' },
      mode: 'story'
    };

    const saved = saveToSlot(1, saveData);
    expect(saved).toBe(true);

    const loaded = loadFromSlot(1);
    expect(loaded).not.toBeNull();
    expect(loaded!.player.name).toBe('テスト勇者');
    expect(loaded!.player.lv).toBe(5);
    expect(loaded!.combo).toBe(5);
    expect(loaded!.mode).toBe('story');
  });

  it('should return null when loading from empty slot', () => {
    const loaded = loadFromSlot(1);
    expect(loaded).toBeNull();
  });

  it('should get all save slots', () => {
    const saveData1: SaveData = {
      player: { ...mockPlayer, name: 'Player1' },
      settings: mockSettings,
      dex: { story: mockDexStory, endless: mockDexEndless, equip: mockEquipDex },
      combo: 1,
      meta: { saveDate: Date.now(), playTime: 100, version: '2.0' },
      mode: 'story'
    };

    const saveData2: SaveData = {
      player: { ...mockPlayer, name: 'Player2' },
      settings: mockSettings,
      dex: { story: mockDexStory, endless: mockDexEndless, equip: mockEquipDex },
      combo: 2,
      meta: { saveDate: Date.now(), playTime: 200, version: '2.0' },
      mode: 'endless'
    };

    saveToSlot(1, saveData1);
    saveToSlot(3, saveData2);

    const slots = getAllSaveSlots();
    expect(slots).toHaveLength(MAX_SAVE_SLOTS);
    expect(slots[0]?.player.name).toBe('Player1');
    expect(slots[1]).toBeNull();
    expect(slots[2]?.player.name).toBe('Player2');
  });

  it('should delete a save slot', () => {
    const saveData: SaveData = {
      player: mockPlayer,
      settings: mockSettings,
      dex: { story: mockDexStory, endless: mockDexEndless, equip: mockEquipDex },
      combo: 3,
      meta: { saveDate: Date.now(), playTime: 500, version: '2.0' },
      mode: 'story'
    };

    saveToSlot(2, saveData);
    expect(loadFromSlot(2)).not.toBeNull();

    const deleted = deleteSaveSlot(2);
    expect(deleted).toBe(true);
    expect(loadFromSlot(2)).toBeNull();
  });

  it('should load the most recent save', () => {
    // Use direct localStorage to set precise timestamps
    // saveToSlot would override timestamps with Date.now()
    const now = Date.now();
    
    localStorage.setItem(SAVE_KEY_PREFIX + '1', JSON.stringify({
      player: { ...mockPlayer, name: 'Oldest' },
      settings: mockSettings,
      dex: { story: mockDexStory, endless: mockDexEndless, equip: mockEquipDex },
      combo: 1,
      meta: { saveDate: now - 2000, playTime: 100, version: '2.0' },
      mode: 'story'
    }));

    localStorage.setItem(SAVE_KEY_PREFIX + '2', JSON.stringify({
      player: { ...mockPlayer, name: 'Middle' },
      settings: mockSettings,
      dex: { story: mockDexStory, endless: mockDexEndless, equip: mockEquipDex },
      combo: 2,
      meta: { saveDate: now - 1000, playTime: 200, version: '2.0' },
      mode: 'story'
    }));

    localStorage.setItem(SAVE_KEY_PREFIX + '3', JSON.stringify({
      player: { ...mockPlayer, name: 'Newest' },
      settings: mockSettings,
      dex: { story: mockDexStory, endless: mockDexEndless, equip: mockEquipDex },
      combo: 3,
      meta: { saveDate: now, playTime: 150, version: '2.0' },
      mode: 'story'
    }));

    const loaded = loadSave();
    expect(loaded).not.toBeNull();
    expect(loaded!.player.name).toBe('Newest');
  });
});

describe('saveSystem - Helper Functions', () => {
  it('createSaveData should create valid save data', () => {
    const gameState = {
      player: { name: 'Hero', lv: 10, hp: 200, maxHP: 200 } as any,
      settings: mergeSettings({ difficulty: 'hard' }),
      dexStory: { 'ドラゴン': { seen: 1, defeated: 1 } },
      dexEndless: {},
      equipDex: { weapons: ['鋼の剣'], armors: [] },
      quizCombo: 10,
      playTime: 7200,
      gameMode: 'endless' as const
    };

    const saveData = createSaveData(gameState);

    expect(saveData.player.name).toBe('Hero');
    expect(saveData.settings.difficulty).toBe('hard');
    expect(saveData.dex.story).toEqual({ 'ドラゴン': { seen: 1, defeated: 1 } });
    expect(saveData.combo).toBe(10);
    expect(saveData.meta.playTime).toBe(7200);
    expect(saveData.meta.version).toBe('2.0');
    expect(saveData.mode).toBe('endless');
    expect(saveData.meta.saveDate).toBeGreaterThan(0);
  });

  it('findBestSaveSlot should prefer empty slots', () => {
    // All slots empty
    expect(findBestSaveSlot()).toBe(1);

    // Fill slot 1
    const saveData1: SaveData = {
      player: { name: 'P1' } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 100, version: '2.0' },
      mode: 'story'
    };
    saveToSlot(1, saveData1);
    expect(findBestSaveSlot()).toBe(2);

    // Fill slot 2
    saveToSlot(2, { ...saveData1, player: { name: 'P2' } as any });
    expect(findBestSaveSlot()).toBe(3);
  });

  it('findBestSaveSlot should find oldest when all slots full', () => {
    // Since saveToSlot updates saveDate to Date.now(), we need to save in reverse order
    // to ensure slot 3 is oldest. Or use direct localStorage manipulation.
    // Let's use direct localStorage to set precise timestamps
    const now = Date.now();
    
    localStorage.setItem(SAVE_KEY_PREFIX + '1', JSON.stringify({
      player: { name: 'Middle' } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: now - 1000, playTime: 100, version: '2.0' },
      mode: 'story'
    }));
    
    localStorage.setItem(SAVE_KEY_PREFIX + '2', JSON.stringify({
      player: { name: 'Newest' } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: now, playTime: 100, version: '2.0' },
      mode: 'story'
    }));
    
    localStorage.setItem(SAVE_KEY_PREFIX + '3', JSON.stringify({
      player: { name: 'Oldest' } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: now - 2000, playTime: 100, version: '2.0' },
      mode: 'story'
    }));

    expect(findBestSaveSlot()).toBe(3);
  });

  it('extractPlayerFromSave should fill missing fields', () => {
    const saveData: SaveData = {
      player: { name: 'Hero', lv: 5 } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 0, version: '2.0' },
      mode: 'story'
    };

    const player = extractPlayerFromSave(saveData);
    expect(player.name).toBe('Hero');
    expect(player.lv).toBe(5);
    expect(player.currentArea).toBe(1);
    expect(player.clearedAreas).toEqual([]);
    expect(player.storyShownAreas).toEqual([]);
    expect(player.endlessFloor).toBe(1);
  });

  it('extractPlayerFromSave should preserve existing fields', () => {
    const saveData: SaveData = {
      player: { 
        name: 'Hero', 
        lv: 10,
        currentArea: 5,
        clearedAreas: [1, 2, 3, 4],
        storyShownAreas: [1, 2, 3],
        endlessFloor: 10
      } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 0, version: '2.0' },
      mode: 'story'
    };

    const player = extractPlayerFromSave(saveData);
    expect(player.currentArea).toBe(5);
    expect(player.clearedAreas).toEqual([1, 2, 3, 4]);
    expect(player.endlessFloor).toBe(10);
  });

  it('extractDexFromSave should handle new format', () => {
    const saveData: SaveData = {
      player: { name: 'Hero' } as any,
      settings: mergeSettings({}),
      dex: { 
        story: { 'スライム': { seen: 5, defeated: 3 } },
        endless: { 'ボス': { seen: 1, defeated: 1 } },
        equip: { weapons: ['剣'], armors: ['鎧'] }
      },
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 0, version: '2.0' },
      mode: 'story'
    };

    const dex = extractDexFromSave(saveData);
    expect(dex.story).toEqual({ 'スライム': { seen: 5, defeated: 3 } });
    expect(dex.endless).toEqual({ 'ボス': { seen: 1, defeated: 1 } });
    expect(dex.equip).toEqual({ weapons: ['剣'], armors: ['鎧'] });
  });

  it('extractDexFromSave should handle old format', () => {
    const saveData: SaveData = {
      player: { name: 'Hero' } as any,
      settings: mergeSettings({}),
      dex: { 'スライム': { seen: 5, defeated: 3 } } as any,
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 0, version: '2.0' },
      mode: 'story'
    };

    const dex = extractDexFromSave(saveData);
    expect(dex.story).toEqual({ 'スライム': { seen: 5, defeated: 3 } });
    expect(dex.endless).toEqual({});
    expect(dex.equip).toEqual({ weapons: [], armors: [] });
  });

  it('extractGameModeFromSave should respect mode field', () => {
    const storyData: SaveData = {
      player: { name: 'Hero', currentArea: 1 } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 0, version: '2.0' },
      mode: 'story'
    };

    expect(extractGameModeFromSave(storyData)).toBe('story');

    const endlessData: SaveData = {
      ...storyData,
      mode: 'endless'
    };

    expect(extractGameModeFromSave(endlessData)).toBe('endless');
  });

  it('extractGameModeFromSave should infer from currentArea for backward compat', () => {
    const oldEndlessData: SaveData = {
      player: { name: 'Hero', currentArea: 10 } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 0, version: '1.0' }
    } as any;

    expect(extractGameModeFromSave(oldEndlessData)).toBe('endless');
  });
});

describe('saveSystem - Migration and Compatibility', () => {
  it('should migrate old save format', () => {
    const oldSaveData = {
      player: { name: 'OldHero', lv: 8 } as any,
      settings: mergeSettings({ difficulty: 'easy' }),
      dex: { 'モンスター': { seen: 10, defeated: 8 } },
      meta: { saveDate: Date.now() - 10000, playTime: 5000, version: '1.0' }
    };

    saveToSlot(1, oldSaveData as any);
    const loaded = loadSave();

    expect(loaded).not.toBeNull();
    expect(loaded!.player.name).toBe('OldHero');
    expect(loaded!.combo).toBe(0); // Default value
  });

  it('should preserve combo in new saves', () => {
    const newSaveData: SaveData = {
      player: { name: 'NewHero', lv: 15 } as any,
      settings: mergeSettings({ difficulty: 'hard' }),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 25,
      meta: { saveDate: Date.now(), playTime: 10000, version: '2.0' },
      mode: 'story'
    };

    saveToSlot(1, newSaveData);
    const loaded = loadFromSlot(1);

    expect(loaded).not.toBeNull();
    expect(loaded!.combo).toBe(25);
  });

  it('should handle missing meta fields gracefully', () => {
    const incompleteSave = {
      player: { name: 'TestHero' } as any,
      settings: mergeSettings({}),
      dex: {}
    };

    saveToSlot(1, incompleteSave as any);
    const loaded = loadSave();

    expect(loaded).not.toBeNull();
    expect(loaded!.combo).toBe(0);
    expect(loaded!.meta).toBeDefined();
  });
});

describe('saveSystem - Error Handling', () => {
  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('Storage full'); };

    const saveData: SaveData = {
      player: { name: 'Hero' } as any,
      settings: mergeSettings({}),
      dex: { story: {}, endless: {}, equip: { weapons: [], armors: [] } },
      combo: 0,
      meta: { saveDate: Date.now(), playTime: 0, version: '2.0' },
      mode: 'story'
    };

    const saved = saveToSlot(1, saveData);
    expect(saved).toBe(false);

    // Restore
    localStorage.setItem = originalSetItem;
  });

  it('should handle corrupted save data', () => {
    localStorage.setItem(SAVE_KEY_PREFIX + '1', 'invalid json {{{');
    const loaded = loadFromSlot(1);
    expect(loaded).toBeNull();
  });

  it('should return null when no saves exist', () => {
    const loaded = loadSave();
    expect(loaded).toBeNull();
  });
});
