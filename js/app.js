/**
 * Main Application Entry Point
 */

import { state, initGame } from './data.js';
import { initializeSaveSystem } from './systems/save.js';
import { tryMove } from './handlers/map.js';
import { renderMap } from './render/map.js';
import { renderBattle } from './render/battle.js';
import { renderTitle } from './render/title.js';
import { renderUI } from './render/ui.js';

/* -------------------- Rendering -------------------- */

function render() {
    // Switch Scene
    document.querySelectorAll('.scene').forEach(el => el.classList.remove('active'));
    const sceneId = state.scene === 'map' ? 'map-scene' :
        state.scene === 'battle' ? 'battle-scene' :
            state.scene === 'title' ? 'title-scene' :
                state.scene === 'result' ? 'result-scene' : 'title-scene';

    const sceneEl = document.getElementById(sceneId);
    if (sceneEl) sceneEl.classList.add('active');

    // Render Scene Content
    if (state.scene === 'map') {
        renderMap(state);
        renderUI(state); // Overlays are mostly pertinent to map or global
    } else if (state.scene === 'battle') {
        renderBattle(state);
    } else if (state.scene === 'title') {
        renderTitle(state);
    }
}

/* -------------------- Input Handling -------------------- */

function handleInput(key) {
    if (state.scene === 'map') {
        let dr = 0, dc = 0;
        if (key === 'ArrowUp' || key === 'w') dr = -1;
        if (key === 'ArrowDown' || key === 's') dr = 1;
        if (key === 'ArrowLeft' || key === 'a') dc = -1;
        if (key === 'ArrowRight' || key === 'd') dc = 1;

        if (dr !== 0 || dc !== 0) {
            const moved = tryMove(dr, dc);
            if (moved) render();
        }
    }
}

function setupEventListeners() {
    // Keyboard
    document.addEventListener('keydown', e => handleInput(e.key));

    // Title Screen
    const titleScene = document.getElementById('title-scene');
    if (titleScene) {
        titleScene.addEventListener('click', (e) => {
            const btn = e.target.closest('.title-btn');
            if (!btn) return;
            const action = btn.dataset.action;

            if (action === 'new-story') {
                initGame(); // Reset
                state.scene = 'map';
                render();
            } else if (action === 'new-library') {
                initGame();
                state.gameMode = 'library';
                state.scene = 'map';
                render();
            } else if (action === 'new-endless') {
                initGame();
                state.gameMode = 'endless';
                state.scene = 'map';
                render();
            } else if (action === 'continue') {
                if (initializeSaveSystem()) {
                    state.scene = 'map';
                    render();
                }
            }
        });
    }

    // Pad Buttons
    const padMap = { 'pad-up': 'ArrowUp', 'pad-down': 'ArrowDown', 'pad-left': 'ArrowLeft', 'pad-right': 'ArrowRight' };
    Object.keys(padMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                handleInput(padMap[id]);
            });
            // Touch support could be added here
        }
    });

    // Battle Delegate
    const battleContainer = document.getElementById('battle-container');
    battleContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.cmd-btn');
        if (btn) {
            const action = btn.dataset.action;
            console.log('Battle Action:', action);
            // TODO: Implement battle action handlers in handlers/battle.js
            if (action === 'back') {
                state.battle.mode = 'select';
                render();
            }
            // Mock attack for now
            if (action === 'attack') {
                state.battle.log.push(`${state.player.name}の攻撃！`);
                state.battle.log.push(`${state.battle.enemy.name}に10のダメージ！`); // dummy
                state.battle.enemy.hp -= 10;
                state.battle.mode = 'queue';
                render();
            }
            if (action === 'next') {
                // Next queue or enemy turn
                state.battle.mode = 'select'; // Simplify loop
                render();
            }
        }
    });
}

/* -------------------- Initialization -------------------- */

function init() {
    console.log('Game Initializing...');

    // Try loading save
    if (!initializeSaveSystem()) {
        console.log('No save found, starting new game state.');
        initGame();
    } else {
        // If save loaded, maybe go to map directly?
        // For now, stick to title screen unless auto-resume is desired
        // state.scene = 'map'; 
    }

    setupEventListeners();
    render();
}

// Start
window.onload = init;
