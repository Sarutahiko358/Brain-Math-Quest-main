/**
 * Map Renderer
 */

import { tileEmoji } from '../utils.js';
import { COLS, GUARDIANS_A7 } from '../lib/world/areas.js';
import { BOSS_POOL } from '../lib/enemies.js';
import { effATK, effDEF, nextExpFor } from '../lib/battle/stats.js'; // Ensure this exists (user might have edited battle.js but not this file?)
// Actually user edited battle.js to implement these LOCALLY. 
// I should use the one in lib/battle/stats.js if possible, or duplicate here if that file is unreliable.
// The user edited lib/battle/stats.js too? No, I viewed it and they created it?
// Wait, I created lib/battle/stats.js in Step 299.
// User didn't edit it in Step 307.
// So I can import from it.
import { state } from '../data.js';

// Styles
const UI_COLORS = {
    GOLD: '#ffd700',
    PURPLE: '#6A1B9A',
    GREEN: '#4CAF50',
    ORANGE: '#FF9800',
    DARK_BLUE_BG: '#0c1330cc'
};

const AREA_INFO_STYLE = `text-align:center;padding:4px 0;font-size:14px;font-weight:bold;`;
const CLEAR_CONDITION_BASE_STYLE = `text-align:center;padding:6px;font-size:13px;color:white;font-weight:bold;border-radius:4px;margin:4px auto;max-width:90%;`;

// Guardian Definitions
const GUARDIAN_DEFINITIONS = [
    { name: 'genbu', emoji: "🐢", flag: 'genbuDefeated' },
    { name: 'seiryu', emoji: "🐉", flag: 'seiryuDefeated' },
    { name: 'suzaku', emoji: "🕊️", flag: 'suzakuDefeated' },
    { name: 'byakko', emoji: "🐯", flag: 'byakkoDefeated' },
];

function shouldShowBoss(r, c, player, currentAreaInfo, currentDex, allBeastsDefeated) {
    const atBossPos = currentAreaInfo.bossPos.r === r && currentAreaInfo.bossPos.c === c;

    if (player.currentArea === 7 || player.currentArea === 9) {
        return atBossPos && allBeastsDefeated;
    }

    return atBossPos && !(currentDex[currentAreaInfo.bossName]?.defeated > 0);
}

function getGuardianEmoji(r, c, currentArea, flags) {
    if (currentArea !== 7) return null;
    const f = flags || {};

    for (const guardian of GUARDIAN_DEFINITIONS) {
        const pos = GUARDIANS_A7[guardian.name];
        const isDefeated = f[guardian.flag] || false;
        if (r === pos.r && c === pos.c && !isDefeated) {
            return guardian.emoji;
        }
    }
    return null;
}

function areAllBeastsDefeated(flags) {
    const f = flags || {};
    return !!f.genbuDefeated && !!f.seiryuDefeated && !!f.suzakuDefeated && !!f.byakkoDefeated;
}

// Helper to get map data
import { AREAS } from '../lib/world/areas.js';
import { LIBRARY_AREAS } from '../lib/world/areasLibrary.js';

function getCurrentMapData(state) {
    const id = state.player.currentArea;
    if (id >= 201) {
        const info = LIBRARY_AREAS.find(a => a.id === (id - 200));
        if (info) return { map: info.map, info };
    }
    const info = AREAS.find(a => a.id === id);
    if (info) return { map: info.map, info };
    return null;
}

/* -------------------- RENDER FUNCTION -------------------- */

export function renderMap(state) {
    const gridEl = document.getElementById('map-grid');
    const infoEl = document.getElementById('map-info-panel');
    const statusEl = document.getElementById('status-bar-container');

    if (!gridEl || !state.player) return;

    const { player, settings, gameMode } = state;
    const mapData = getCurrentMapData(state);
    if (!mapData) return;

    // 1. Render Map Grid
    const width = COLS * settings.tileSize;
    gridEl.style.gridTemplateColumns = `repeat(${COLS}, ${settings.tileSize}px)`;

    const allBeastsDefeated = areAllBeastsDefeated(player.flags);
    const currentDex = gameMode === 'endless' ? state.dexEndless : state.dexStory;

    let gridHtml = '';
    mapData.map.forEach((row, r) => {
        row.forEach((tile, c) => {
            const isPlayerPos = player.pos.r === r && player.pos.c === c;
            const isBoss = shouldShowBoss(r, c, player, mapData.info, currentDex, allBeastsDefeated);
            const bossEmoji = BOSS_POOL.find(b => b.name === mapData.info.bossName)?.emoji || "👑";
            const guardianEmoji = getGuardianEmoji(r, c, player.currentArea, player.flags);
            const isDojo = mapData.info.dojoPos && r === mapData.info.dojoPos.r && c === mapData.info.dojoPos.c;

            let inner = `<div class="tile">${tileEmoji(tile)}</div>`;

            if (guardianEmoji) {
                inner += `<div class="ply" style="font-size:18px;animation:pulse 2s infinite">${guardianEmoji}</div>`;
            }
            if (isDojo) {
                inner += `<div class="ply" style="font-size:18px;animation:pulse 2s infinite">🥋</div>`;
            }
            if (isBoss) {
                inner += `<div class="ply" style="font-size:24px;animation:pulse 2s infinite">${bossEmoji}</div>`;
            }
            if (isPlayerPos) {
                inner += `<div class="ply" style="z-index:2">${player.avatar}</div>`;
            }

            gridHtml += `<div class="cell" style="width:${settings.tileSize}px;height:${settings.tileSize}px">${inner}</div>`;
        });
    });
    gridEl.innerHTML = gridHtml;

    // 2. Render Map Info Panel
    if (infoEl) {
        const isEndless = gameMode === 'endless';
        const isBossRoom = player.currentArea === 9; // Simplified check
        const isCleared = !isEndless && !isBossRoom && (currentDex[mapData.info.bossName]?.defeated > 0); // Simplified

        // Determine banner state
        let bg = UI_COLORS.ORANGE;
        let text = `🎯 クリア条件：城で「${mapData.info.bossName}」を倒す`;

        if (isBossRoom) {
            bg = UI_COLORS.PURPLE;
            text = `⚔️ ここはボスの間：歩くと歴代ボスが出現します`;
        } else if (isCleared) {
            bg = UI_COLORS.GREEN;
            text = `✅ クリア済み：${mapData.info.bossName}を倒した！`;
        }

        infoEl.innerHTML = `
      <div class="areaInfo" style="${AREA_INFO_STYLE}">
        📍 ${mapData.info.name}
        ${isEndless ? ` - 第${player.endlessFloor || 1}階層` : ''}
        ${gameMode === 'story' ? ` - ${mapData.info.description || ''}` : ''}
      </div>
      <div class="clearCondition" style="${CLEAR_CONDITION_BASE_STYLE}background:${bg}">
        ${text}
      </div>
    `;
    }

    // 3. Render Status Bar
    if (statusEl) {
        // Only render if needed (optimization can be added later)
        statusEl.innerHTML = renderStatusBar(state);

        // Bind toggle click
        const toggleBtn = statusEl.querySelector('#status-toggle-btn');
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                state.ui = state.ui || {};
                state.ui.topStatusExpanded = !state.ui.topStatusExpanded;
                renderMap(state); // Re-render to show expanded
            };
        }
    }
}

function renderStatusBar(state) {
    const { player, quizCombo, settings } = state;
    const expanded = state.ui?.topStatusExpanded || false;
    const statusSize = settings.statusOverlay.size;
    const fontSizeRef = Math.round(14 * (statusSize / 100) * 0.9);

    let html = `
    <div class="topStatusWrap" style="margin-top:8px; opacity:${settings.statusOverlay.opacity}; transition:opacity 0.2s;">
      <div class="topStatusBar">
        <button id="status-toggle-btn" class="ghost" style="padding:4px 8px">${expanded ? '▲' : '▼'}</button>
        <div class="topStatusMini" style="font-size:${fontSizeRef}px">
           <span style="margin-right:8px">${player.avatar}</span>
           <span>Lv${player.lv}</span>
           <span style="margin:0 8px">HP ${player.hp}/${player.maxHP}</span>
           <span>MP ${player.mp}/${player.maxMP}</span>
           ${quizCombo > 0 ? `<span style="margin:0 8px;color:${UI_COLORS.GOLD};font-weight:bold">🔥×${quizCombo}</span>` : ''}
        </div>
      </div>
  `;

    if (expanded) {
        const detailSize = Math.round(14 * (statusSize / 100) * 0.8);
        html += `
      <div class="topStatusDetail" style="font-size:${detailSize}px">
         <div class="statusLine nowrap">HP ${player.hp}/${player.maxHP} MP ${player.mp}/${player.maxMP}</div>
         <div class="statusLine">ATK ${effATK(player)}（主人公 ${player.baseATK} + 装備 ${player.equip?.weapon?.atk || 0}：${player.equip?.weapon?.name || '素手'}）</div>
         <div class="statusLine">DEF ${effDEF(player)}（主人公 ${player.baseDEF} + 装備 ${player.equip?.armor?.def || 0}：${player.equip?.armor?.name || '服'}）</div>
         <div class="statusLine nowrap">EXP ${player.exp}/${nextExpFor(player.lv)} GOLD ${player.gold}</div>
         ${quizCombo > 0 ? `
           <div class="statusLine" style="margin-top:4px;color:${UI_COLORS.GOLD};font-weight:bold">
             🔥 連続コンボ：×${quizCombo}
           </div>
         ` : ''}
         <div class="statusLine" style="margin-top:4px">所持品：${player.items.map(i => `${i.name}×${i.amount || 1}`).join('、') || 'なし'}</div>
      </div>
    `;
    }

    html += `</div>`;
    return html;
}
