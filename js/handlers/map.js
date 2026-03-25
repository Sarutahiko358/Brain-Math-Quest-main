/**
 * Map Logic Handler
 */

import { state } from '../data.js';
import { validateMovement, isAtPosition } from '../lib/world/movement.js';
import { prepareEncounter } from '../lib/world/encounter.js';
import { startEncounter } from './battle.js';
import { GUARDIANS_A7 } from '../lib/world/areas.js';
import {
    GUARDIAN_NAMES,
    GUARDIAN_REWARDS,
    prepareGuardianEnemy,
    scaleGuardianStats,
    getGuardianReward,
    allGuardiansDefeated
} from '../lib/world/guardians.js';
import { getKirinIntroLines, getFloorBoss, getBossIntroLines } from '../lib/world/bosses.js';
import { scaleStats, getFloorBoss as getEndlessFloorBoss } from '../lib/world/endless.js'; // getFloorBoss alias
import { BOSS_POOL } from '../lib/enemies.js';
import { createSeenUpdater } from '../utils.js';
import { playSound } from '../systems/sound.js';

/* -------------------- Guardian Logic -------------------- */

function checkGuardianEncounter(newPos) {
    if (state.player.currentArea !== 7) return false;

    const f = state.player.flags || {};
    const settings = state.settings;

    const startGuardianEncounter = (guardianName) => {
        // Show story UI (TODO: implement message display system)
        state.map.message = "bossEncounter"; // flag to show intro?

        setTimeout(() => {
            const enemy = prepareGuardianEnemy(guardianName, settings.difficulty);
            if (enemy) {
                const rewardName = getGuardianReward(guardianName);

                // Initiate battle
                state.battle = {
                    enemy,
                    log: [`${enemy.emoji} ${enemy.name} が 試練を与える！`],
                    queue: [],
                    mode: "queue",
                    quizStats: { total: 0, correct: 0, totalTime: 0 },
                    onVictory: () => {
                        if (rewardName) {
                            const p = state.player;
                            if (!p.keyItems.includes(rewardName)) {
                                p.keyItems.push(rewardName);
                            }
                            // addToast(`${rewardName} を手に入れた！（認められた証）`);
                            // equipAccessory(rewardName);
                        }
                    }
                };
                state.scene = "battle";

                // Record seen
                const updater = createSeenUpdater(enemy.name);
                state.dexStory = updater(state.dexStory);
            }
        }, 200);
    };

    if (isAtPosition(newPos, GUARDIANS_A7.genbu) && !f.genbuDefeated) {
        startGuardianEncounter(GUARDIAN_NAMES.GENBU);
        return true;
    }
    if (isAtPosition(newPos, GUARDIANS_A7.seiryu) && !f.seiryuDefeated) {
        startGuardianEncounter(GUARDIAN_NAMES.SEIRYU);
        return true;
    }
    if (isAtPosition(newPos, GUARDIANS_A7.suzaku) && !f.suzakuDefeated) {
        startGuardianEncounter(GUARDIAN_NAMES.SUZAKU);
        return true;
    }
    if (isAtPosition(newPos, GUARDIANS_A7.byakko) && !f.byakkoDefeated) {
        startGuardianEncounter(GUARDIAN_NAMES.BYAKKO);
        return true;
    }

    return false;
}

/* -------------------- Boss Logic -------------------- */

function checkBossEncounter(newPos, currentAreaInfo, currentDex) {
    if (!isAtPosition(newPos, currentAreaInfo.bossPos)) {
        return { triggered: false, shouldStopMoving: false };
    }

    // Area 7 check
    if (state.player.currentArea === 7) {
        const f = state.player.flags || {};
        if (!allGuardiansDefeated(f)) {
            // addToast("四方に散る四聖獣のもとへ向かい、すべての試練を越えよ。");
            console.log("Guardians not defeated");
            return { triggered: false, shouldStopMoving: false };
        }
    }

    const alwaysFightHere = state.player.currentArea === 9;
    const isEndlessMode = state.gameMode === 'endless';
    const bossDefeated = (() => {
        if (alwaysFightHere || isEndlessMode) return 0;
        if (state.player.currentArea === 7) {
            const f = state.player.flags || {};
            return allGuardiansDefeated(f) ? 1 : 0;
        }
        return currentDex[currentAreaInfo.bossName]?.defeated || 0;
    })();

    if (!(alwaysFightHere || isEndlessMode || bossDefeated === 0)) {
        return { triggered: false, shouldStopMoving: true };
    }

    // Endless Mode Logic
    if (isEndlessMode) {
        // Preventing double trigger handled by caller/state usually
        setTimeout(() => {
            const floor = state.player.endlessFloor || 1;
            const bossBase = getEndlessFloorBoss(floor);
            const bossStats = scaleStats(floor, 'boss'); // imported from endless.js
            const jitter = 0.9 + Math.random() * 0.2;
            const enemy = {
                ...bossBase,
                maxHP: Math.round(bossStats.maxHP * jitter),
                hp: Math.round(bossStats.hp * jitter),
                atk: Math.round(bossStats.atk * jitter),
                renderSize: Math.round((bossBase.renderSize || 160) * 1.5)
            };

            const lines = [`💀 第${floor}階層 フロアボス\n${enemy.emoji} ${enemy.name} が あらわれた！`];

            state.battle = {
                enemy,
                log: [lines[0]],
                queue: [],
                mode: "queue",
                quizStats: { total: 0, correct: 0, totalTime: 0 },
                onVictory: () => {
                    const nextFloor = (state.player.endlessFloor || 1) + 1;
                    state.player.endlessFloor = nextFloor;
                    state.player.pos = currentAreaInfo.startPos;
                    // addToast(`👑 第${floor}階層 クリア！ 第${nextFloor}階層へ進む…`);
                }
            };
            state.scene = "battle";

            const updater = createSeenUpdater(enemy.name);
            state.dexEndless = updater(state.dexEndless);

        }, 800);
        return { triggered: true, shouldStopMoving: true };
    }

    // Normal Boss
    setTimeout(() => {
        const bossData = BOSS_POOL.find(b => b.name === currentAreaInfo.bossName);
        if (bossData) {
            const settings = state.settings;
            const dmul = settings.difficulty === "easy" ? 0.9 : settings.difficulty === "hard" ? 1.25 : 1.0;
            const enemy = { ...bossData };
            enemy.maxHP = Math.round(enemy.maxHP * dmul);
            enemy.hp = enemy.maxHP;
            enemy.atk = Math.round(enemy.atk * dmul);
            const baseSize = enemy.renderSize || 160;
            enemy.renderSize = Math.round(baseSize * 1.5);

            const lines = (enemy.name === '九尾の麒麟')
                ? getKirinIntroLines(((currentDex[enemy.name]?.seen || 0) + 1), 'boss', enemy)
                : [`${enemy.emoji} ${enemy.name} が あらわれた！`];

            state.battle = {
                enemy,
                log: [lines[0]],
                queue: lines.slice(1),
                mode: "queue",
                quizStats: { total: 0, correct: 0, totalTime: 0 }
            };
            state.scene = "battle";

            const updater = createSeenUpdater(enemy.name);
            state.dexStory = updater(state.dexStory);
        }
    }, 1200);

    return { triggered: true, shouldStopMoving: true };
}

/* -------------------- Main Move Handler -------------------- */
import { AREAS } from '../lib/world/areas.js';
import { LIBRARY_AREAS } from '../lib/world/areasLibrary.js';

function getCurrentAreaInfo(id) {
    if (id >= 201) {
        return LIBRARY_AREAS.find(a => a.id === (id - 200)) || LIBRARY_AREAS[0]; // Logic needs fix: Library IDs are 1-9 in array but might be mapped differently?
        // areasLibrary.ts exports LIBRARY_AREAS with ids 1..9.
        // However, usually library areas are mapped to 201..209 in game.
        // Let's assume ID match. 
        // In areasLibrary.ts, ids are 1..9. 
        // In game logic, library areas are often treated as areaId + 200.
        // If state.player.currentArea is 201, we want id=1 from LIBRARY_AREAS.
        return LIBRARY_AREAS.find(a => a.id === (id - 200));
    }
    return AREAS.find(a => a.id === id) || AREAS[0];
}

function getCurrentMap(areaInfo) {
    return areaInfo.map;
}

export function tryMove(dr, dc) {
    if (state.scene !== "map") return false;
    // TODO: overlay check

    const player = state.player;
    const currentAreaInfo = getCurrentAreaInfo(player.currentArea);
    if (!currentAreaInfo) return false;

    const currentMap = currentAreaInfo.map;
    const settings = state.settings;

    const validation = validateMovement(player.pos, dr, dc, currentMap, settings.encounterRate);

    if (!validation.allowed) return false;

    const { newPos, tile, specialLocation, shouldEncounter } = validation;

    // Update pos tentatively (handlers might revert or override)
    player.pos = newPos;

    // Guardian Check
    if (checkGuardianEncounter(newPos)) {
        return true; // Encounter triggered
    }

    // Boss Check
    const bossResult = checkBossEncounter(newPos, currentAreaInfo, state.gameMode === 'endless' ? state.dexEndless : state.dexStory);
    if (bossResult.shouldStopMoving) {
        return true;
    }

    // Dojo Check
    if (currentAreaInfo.dojoPos && isAtPosition(newPos, currentAreaInfo.dojoPos)) {
        state.showDojo = true; // flag for UI
        return true;
    }

    // Special Locations
    if (specialLocation === 'town' || specialLocation === 'castle') {
        state.map.showTownCallback = true; // flag to open town menu
    } else if (shouldEncounter) {
        startEncounter(tile);
    } else {
        // Normal step noise?
    }

    return true;
}
