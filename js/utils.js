/**
 * DQBrain Utility Functions
 * 
 * Pure utility functions extracted from DQBrain.tsx.
 */

import { T } from './lib/world/areas.js';
import { INN_PRICE, WEAPONS, ARMORS } from './lib/equipment.js';
import { ENEMY_POOL, BOSS_POOL } from './lib/enemies.js';
import { LIBRARY_AREAS } from './lib/world/areasLibrary.js';

/**
 * Calculate the cost to heal at an inn based on player level.
 * Cost increases with level up to a maximum of 60G.
 */
export function healAtInnCost(p) {
    return Math.min(INN_PRICE + Math.max(0, (p.lv - 1) * 2), 60);
}

/**
 * Convert a tile type to its emoji representation for display.
 */
export function tileEmoji(t) {
    return t === T.Grass
        ? "🟩"
        : t === T.Wall
            ? "🪨"
            : t === T.Water
                ? "🟦"
                : t === T.Town
                    ? "🏘️"
                    : t === T.Cave
                        ? "🕳️"
                        : "🏰";
}

/**
 * Calculate the shop assortment based on player progress.
 * Returns available weapons and armors for purchase.
 */
export function getShopAssortment(
    currentArea,
    endlessFloor,
    _ultimateUnlocked
) {
    // コンプリート対応: ultimateUnlocked時も全装備を購入可能にする
    if (currentArea === 10) {
        // Endless: 1階層ごとに1つずつ増える
        const floor = endlessFloor || 1;
        const maxIdx = Math.min(WEAPONS.length, Math.max(2, 1 + floor));
        const maxArmorIdx = Math.min(ARMORS.length, Math.max(2, 1 + floor));
        return { weapons: WEAPONS.slice(0, maxIdx), armors: ARMORS.slice(0, maxArmorIdx) };
    }
    // Story: インデックス上限: ステージ番号+1程度をベースに、最大は全アイテム
    const isFull = currentArea >= 6;
    const maxIdx = isFull ? WEAPONS.length : Math.min(WEAPONS.length, Math.max(2, currentArea + 1));
    const maxArmorIdx = isFull ? ARMORS.length : Math.min(ARMORS.length, Math.max(2, currentArea + 1));
    return {
        weapons: WEAPONS.slice(0, maxIdx),
        armors: ARMORS.slice(0, maxArmorIdx),
    };
}

/**
 * Create an updater function that records an enemy as seen in the dex.
 */
export function createSeenUpdater(name) {
    return (d) => ({
        ...d,
        [name]: {
            seen: (d[name]?.seen || 0) + 1,
            defeated: d[name]?.defeated || 0
        }
    });
}

/**
 * Create an updater function that records an enemy as defeated in the dex.
 */
export function createDefeatedUpdater(name) {
    return (d) => ({
        ...d,
        [name]: {
            seen: d[name]?.seen || 0, // already seen if defeated
            defeated: (d[name]?.defeated || 0) + 1
        }
    });
}

/**
 * Helper to build battle background style based on area
 */
export function getBattleBackgroundStyle(currentArea, isBoss) {
    if (isBoss) {
        return { background: 'linear-gradient(135deg, #1a0b2e 0%, #000000 100%)' };
    }

    // Library areas (using distinct colors)
    if (currentArea === 201) return { background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)' }; // 数の門
    if (currentArea === 202) return { background: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)' }; // 加算の草原
    if (currentArea === 203) return { background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }; // 減算の森
    if (currentArea === 204) return { background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }; // 乗算の山
    if (currentArea === 205) return { background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }; // 除算の谷
    if (currentArea === 206) return { background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' }; // 四則の神殿
    if (currentArea === 207) return { background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)' }; // 分数の迷宮
    if (currentArea === 208) return { background: 'linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)' }; // 方程式の塔
    if (currentArea === 209) return { background: 'linear-gradient(135deg, #fafafa 0%, #eeeeee 100%)' }; // 数の玉座

    switch (currentArea) {
        case 1: return { background: 'linear-gradient(135deg, #8ba 0%, #8d8 100%)' }; // 草原
        case 2: return { background: 'linear-gradient(135deg, #252 0%, #141 100%)' }; // 森
        case 3: return { background: 'linear-gradient(135deg, #445 0%, #223 100%)' }; // 洞窟
        case 4: return { background: 'linear-gradient(135deg, #522 0%, #832 100%)' }; // 火山
        case 5: return { background: 'linear-gradient(135deg, #aee 0%, #68a 100%)' }; // 氷
        case 6: return { background: 'linear-gradient(135deg, #324 0%, #102 100%)' }; // 魔王城
        case 7: return { background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)' }; // 試練の塔（金・橙）
        case 8: return { background: 'linear-gradient(135deg, #000000 0%, #4b0082 100%)' }; // 虚空の間（漆黒・深紫）
        case 9: return { background: 'linear-gradient(135deg, #ff0000 0%, #800000 100%)' }; // ボスの間（赤・深紅）
        case 10: return { background: 'linear-gradient(135deg, #1a237e 0%, #000000 100%)' }; // 無限の回廊（深青・黒）
        default: return { background: '#333' };
    }
}

/**
 * Compute completion statistics for the save data.
 * Pure calculation based on player state and game constants.
 */
export function computeCompletionStats(
    clearedAreas,
    enemyDex,
    equipDex
) {
    // 1. Areas (Target: 10 areas + 9 library areas)
    // Area 1-6 (Story), 7,8,9 (Extra) + 10 (Endless) = 10 areas
    // Library 201-209 = 9 areas
    // Total = 19
    const storyAreas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 10 is endless introduction
    const libAreas = [201, 202, 203, 204, 205, 206, 207, 208, 209];
    const totalAreas = storyAreas.length + libAreas.length;
    const clearedCount = clearedAreas.filter(id => storyAreas.includes(id) || libAreas.includes(id)).length;
    const areaPct = Math.round((clearedCount / totalAreas) * 100);

    // 2. Enemies
    // Include main ENEMY_POOL and BOSS_POOL
    // Library bosses are in BOSS_POOL
    // We need to filter unique names
    const allEnemies = [...ENEMY_POOL, ...BOSS_POOL];
    const uniqueEnemyNames = Array.from(new Set(allEnemies.map(e => e.name)));
    const totalEnemies = uniqueEnemyNames.length;
    const defeatedCount = uniqueEnemyNames.filter(name => (enemyDex[name]?.defeated || 0) > 0).length;
    const enemyPct = Math.round((defeatedCount / totalEnemies) * 100);

    // 3. Equipment
    // Weapons + Armors + Accessories
    // TOOLS are consumables, usually not counted in equipment dex, but let's check
    // Standard RPG dex usually means durable equipment
    const totalEquip = WEAPONS.length + ARMORS.length; // + ACCESSORIES.length if tracked
    // NOTE: accessing accessories from WEAPONS/ARMORS imports if seeded, but accessoris are in equipment.ts
    // For now let's stick to what tracked in EquipDexState (weapons + armors) if that's the scope

    // Count collected
    const collectedW = Object.values(equipDex.weapons).filter(Boolean).length;
    const collectedA = Object.values(equipDex.armors).filter(Boolean).length;
    const collectedTotal = collectedW + collectedA;
    const equipPct = Math.round((collectedTotal / totalEquip) * 100);

    // Total Progress
    const totalPct = Math.round((areaPct + enemyPct + equipPct) / 3);

    return {
        areaPct,
        enemyPct,
        equipPct,
        totalPct,
        clearedCount,
        totalAreas,
        defeatedCount,
        totalEnemies,
        collectedTotal,
        totalEquip
    };
}

/**
 * Get library area info by ID
 */
export function getLibraryArea(id) {
    // ID is like 201, 202... map to index 0, 1...
    if (id < 201 || id > 209) return undefined;
    return LIBRARY_AREAS[id - 201];
}
