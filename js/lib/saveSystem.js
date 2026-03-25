/**
 * Save System module
 * Handles all save/load operations including:
 * - Save slot management
 * - Local storage persistence
 * - Export/Import functionality
 * - Save data migration
 */

import { migrateSaveData } from './saveMigration.js';

export const SAVE_KEY_PREFIX = "dq_like_brain_v2_slot_";
export const MAX_SAVE_SLOTS = 3;
export const FIRST_RUN_LAYOUT_DEFAULTS = "dq_like_first_layout_defaults_v1";

/* -------------------- Save/Load Functions -------------------- */

/**
 * Save data to a specific slot
 */
export function saveToSlot(slot, data) {
    try {
        const saveData = {
            ...data,
            meta: {
                saveDate: Date.now(),
                playTime: data.meta?.playTime || 0,
                version: "2.0"
            },
        };
        localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(saveData));
        return true;
    } catch (error) {
        console.error(`Failed to save to slot ${slot}:`, error);
        return false;
    }
}

/**
 * Load data from a specific slot
 */
export function loadFromSlot(slot) {
    try {
        const s = localStorage.getItem(SAVE_KEY_PREFIX + slot);
        return s ? JSON.parse(s) : null;
    } catch (error) {
        console.error(`Failed to load from slot ${slot}:`, error);
        return null;
    }
}

/**
 * Get all save slots
 */
export function getAllSaveSlots() {
    const slots = [];
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        slots.push(loadFromSlot(i));
    }
    return slots;
}

/**
 * Delete a save slot
 */
export function deleteSaveSlot(slot) {
    try {
        localStorage.removeItem(SAVE_KEY_PREFIX + slot);
        return true;
    } catch (error) {
        console.error(`Failed to delete save slot ${slot}:`, error);
        return false;
    }
}

/**
 * Export save data to a JSON file
 */
export function exportSaveData(data) {
    try {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rpg-brain-save-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Export failed:", e);
    }
}

/**
 * Import save data from a JSON file
 */
export function importSaveData(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result);
            callback(data);
        } catch (error) {
            console.error('Failed to import save data:', error);
            callback(null);
        }
    };
    reader.readAsText(file);
}

/**
 * Load the most recent save automatically
 */
export function loadSave() {
    try {
        let latestSlot = 1;
        let latestTime = 0;
        for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
            const data = localStorage.getItem(SAVE_KEY_PREFIX + i);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.meta && parsed.meta.saveDate > latestTime) {
                    latestTime = parsed.meta.saveDate;
                    latestSlot = i;
                }
            }
        }
        if (latestTime > 0) {
            const s = localStorage.getItem(SAVE_KEY_PREFIX + latestSlot);
            if (!s) return null;
            const raw = JSON.parse(s);
            // マイグレーション
            const migrated = migrateSaveData(raw);
            return migrated;
        }
    } catch (error) {
        console.error('Failed to load most recent save:', error);
    }
    return null;
}

/* -------------------- Helper Functions -------------------- */

/**
 * Create save data from current game state
 */
export function createSaveData(gameState) {
    return {
        player: gameState.player,
        settings: gameState.settings,
        dex: {
            story: gameState.dexStory,
            endless: gameState.dexEndless,
            equip: gameState.equipDex
        },
        combo: gameState.quizCombo,
        meta: {
            saveDate: Date.now(),
            playTime: gameState.playTime,
            version: "2.0"
        },
        mode: gameState.gameMode
    };
}

/**
 * Find the best slot for auto-save
 */
export function findBestSaveSlot() {
    const slots = getAllSaveSlots();
    const emptySlot = slots.findIndex(s => s === null);
    if (emptySlot >= 0) {
        return emptySlot + 1;
    }

    // All slots full, find oldest
    let targetSlot = 1;
    let oldestTime = Date.now();
    slots.forEach((s, idx) => {
        if (s && s.meta && s.meta.saveDate < oldestTime) {
            oldestTime = s.meta.saveDate;
            targetSlot = idx + 1;
        }
    });
    return targetSlot;
}

export function extractPlayerFromSave(saveData) {
    return {
        ...saveData.player,
        currentArea: saveData.player.currentArea || 1,
        clearedAreas: saveData.player.clearedAreas || [],
        storyShownAreas: saveData.player.storyShownAreas || [],
        endlessFloor: saveData.player.endlessFloor || 1
    };
}

export function extractDexFromSave(saveData) {
    const rawDex = saveData.dex;
    if (rawDex && typeof rawDex === 'object' && ('story' in rawDex || 'endless' in rawDex)) {
        return {
            story: rawDex.story || {},
            endless: rawDex.endless || {},
            equip: rawDex.equip || { weapons: [], armors: [] }
        };
    } else {
        return {
            story: rawDex || {},
            endless: {},
            equip: { weapons: [], armors: [] }
        };
    }
}

export function extractGameModeFromSave(saveData) {
    const mode = saveData.mode;
    if (mode === 'endless') return 'endless';
    if (mode === 'library') return 'library';
    if (saveData.player.currentArea === 10) return 'endless';
    return 'story';
}
