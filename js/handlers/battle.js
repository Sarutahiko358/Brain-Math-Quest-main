/**
 * Battle Logic Handler
 */

import { state } from '../data.js';
import { prepareEncounter } from '../lib/world/encounter.js';
import { getEncounterIntroLines } from '../lib/world/bosses.js'; // reused from bosses.js where we put it
import { createSeenUpdater } from '../utils.js';
import { playSound } from '../systems/sound.js';

export function startEncounter(tile) {
    const { player, gameMode, settings } = state;
    const currentDex = gameMode === 'endless' ? state.dexEndless : state.dexStory;

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const encounterResult = prepareEncounter({
        currentArea: player.currentArea,
        gameMode,
        endlessFloor: player.endlessFloor,
        difficulty: settings.difficulty,
        tile,
        pickFn: pick
    });

    if (!encounterResult) return;

    const { enemy, isBossRush, isEndless } = encounterResult;

    const intro = getEncounterIntroLines(enemy, {
        isKirin: enemy.name === '九尾の麒麟',
        isEndless,
        isBossRush,
        floor: player.endlessFloor || 1,
        kirinAttempt: (currentDex[enemy.name]?.seen || 0) + 1,
    });

    state.battle = {
        enemy,
        log: [intro[0]],
        queue: intro.slice(1),
        mode: "queue",
        quizStats: { total: 0, correct: 0, totalTime: 0 },
        // onVictory defaults?
    };

    state.scene = "battle";

    // Record seen
    const updater = createSeenUpdater(enemy.name);
    if (gameMode === 'endless') {
        state.dexEndless = updater(state.dexEndless);
    } else {
        state.dexStory = updater(state.dexStory);
    }

    playSound('encounter', settings.soundEffects); // hypothetical sound
}
