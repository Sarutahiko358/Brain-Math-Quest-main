/**
 * Save System Logic
 * Connects saveSystem library with global state
 */

import { state, initGame } from '../data.js';
import {
    loadSave,
    saveToSlot,
    loadFromSlot,
    createSaveData,
    findBestSaveSlot,
    extractPlayerFromSave,
    extractDexFromSave,
    extractGameModeFromSave
} from '../lib/saveSystem.js';
import { mergeSettings } from '../lib/settings.js';

export function initializeSaveSystem() {
    const s = loadSave();
    if (s) {
        applyLoadedSave(s);
        return true;
    } else {
        initGame();
        return false;
    }
}

export function applyLoadedSave(s) {
    state.player = extractPlayerFromSave(s);
    state.settings = mergeSettings(s.settings);

    const dex = extractDexFromSave(s);
    state.dexStory = dex.story;
    state.dexEndless = dex.endless;
    state.equipDex = dex.equip;

    state.gameMode = extractGameModeFromSave(s);
    state.quizCombo = s.combo ?? 0;
    state.playTime = s.meta?.playTime || 0;
    // Scene should be set by caller (usually 'map')
}

export function doSave(slot = null) {
    const targetSlot = slot || findBestSaveSlot();
    const data = createSaveData({
        player: state.player,
        settings: state.settings,
        dexStory: state.dexStory,
        dexEndless: state.dexEndless,
        equipDex: state.equipDex,
        quizCombo: state.quizCombo,
        playTime: state.playTime,
        gameMode: state.gameMode
    });

    return saveToSlot(targetSlot, data);
}

export function doLoad(slot = null) {
    let s;
    if (slot) {
        s = loadFromSlot(slot);
    } else {
        s = loadSave();
    }

    if (s) {
        applyLoadedSave(s);
        return true;
    }
    return false;
}
