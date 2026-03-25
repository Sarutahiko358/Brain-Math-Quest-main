/**
 * Global Game State
 */

import { createInitialPlayer, createInitialSettings } from './lib/initialState.js';

export const state = {
    player: null,
    settings: null,

    // Dex data
    dexStory: {},
    dexEndless: {},
    equipDex: { weapons: {}, armors: {} }, // Object mapping name -> boolean/count

    // Meta
    gameMode: 'story',
    quizCombo: 0,
    playTime: 0,

    // Runtime State
    scene: 'title', // title, map, battle, result, brainOnly

    // Battle State
    battle: null,

    // Map State
    map: {
        tints: [], // visual tints
        message: null, // map message
    },

    // System Flags
    isSaveMenuOpen: false,
    savePopupVisible: false,
};

export function initGame() {
    const p = createInitialPlayer();
    const s = createInitialSettings();

    state.player = p;
    state.settings = s;

    state.dexStory = {};
    state.dexEndless = {};
    state.equipDex = { weapons: {}, armors: {} };

    state.gameMode = 'story';
    state.quizCombo = 0;
    state.playTime = 0;

    state.scene = 'title';
    state.battle = null;
}
