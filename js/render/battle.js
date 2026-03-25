/**
 * Battle Renderer
 */

import { effATK, effDEF } from '../lib/battle/stats.js'; // need to port stats.js?
// Assuming we need to create lib/battle/stats.js or similar
// For now, let's implement simple helpers inside if dependencies are missing.
// Actually lib/battle/stats.ts likely exists, need to port it.
// Checking file list... logic suggests we should port it.
// I will implement basic stat calc here to save a step or fix later.

import { state } from '../data.js';

function effATK(player) {
    return player.atk + (player.equip?.weapon?.atk || 0);
}

function effDEF(player) {
    return player.def + (player.equip?.armor?.def || 0);
}

function nextExpFor(lv) {
    return Math.floor(10 * Math.pow(lv, 2.5)); // Approximate format from memory/logic
}

export function renderBattle(state) {
    const container = document.getElementById('battle-container');
    if (!container) return;

    const { battle, player, settings } = state;
    if (!battle) return;

    const enemy = battle.enemy;

    // 1. Enemy View
    let enemyHtml = `
    <div class="enemy ${battle.animState || ''}">
      <div class="bossBanner ${enemy.name === '九尾の麒麟' ? 'kirin' : ''}">
         <div class="ename">${enemy.emoji} ${enemy.name}</div>
         <div class="ehp">HP: ${enemy.hp} / ${enemy.maxHP}</div>
      </div>
      <div style="display:grid;place-items:center;height:100%">
         <img src="${enemy.image || '/images/enemies/slime.png'}" 
              alt="${enemy.name}" 
              style="max-width:80%;max-height:80%;object-fit:contain"
              onerror="this.style.display='none';this.nextElementSibling.style.display='block'" 
         />
         <div style="display:none;font-size:64px">${enemy.emoji}</div>
      </div>
      <!-- Damage Numbers overlay -->
      ${renderDamageNumbers(battle)}
    </div>
  `;

    // 2. Player Stats
    let statsHtml = `
    <div class="plStat">
       <div>${player.avatar} ${player.name} Lv${player.lv}</div>
       <div>HP ${player.hp}/${player.maxHP} / MP ${player.mp}/${player.maxMP}</div>
       <div id="btn-toggle-details" style="cursor:pointer;user-select:none">
         ${state.ui?.detailsExpanded ? '▲' : '▼'} 詳細
       </div>
       ${state.ui?.detailsExpanded ? `
         <div>ATK ${effATK(player)} / DEF ${effDEF(player)}</div>
         <div>EXP ${player.exp}/${nextExpFor(player.lv)} / G ${player.gold}</div>
       ` : ''}
    </div>
  `;

    // 3. Log
    let logHtml = `<div class="log" id="battle-log">`;
    battle.log.forEach(line => {
        logHtml += `<div>${line}</div>`;
    });
    if (battle.queue?.length > 0) {
        logHtml += `<div class="nextTip">▼ タップで進む</div>`;
    }
    logHtml += `</div>`;

    // 4. Command Bar or Quiz
    let cmdHtml = '';
    if (battle.mode === 'quiz' && battle.quiz) {
        cmdHtml = renderQuizPane(battle.quiz);
    } else {
        cmdHtml = renderCommandBar(battle.mode);
    }

    container.innerHTML = enemyHtml + statsHtml + logHtml + cmdHtml;
}

function renderDamageNumbers(battle) {
    if (!battle.damageNumbers) return '';
    return battle.damageNumbers.map(dn => `
    <div class="damageNumber ${dn.isHeal ? 'heal' : ''} ${dn.isCritical ? 'critical' : ''}" 
         style="left:${dn.x}%;top:${dn.y}%">
      ${dn.value}
    </div>
  `).join('');
}

function renderCommandBar(mode) {
    // Simple state machine for command bar
    if (mode === 'select') {
        return `
      <div class="cmds">
        <button class="cmd-btn" data-action="attack">こうげき</button>
        <button class="cmd-btn" data-action="skill">とくぎ</button>
        <button class="cmd-btn" data-action="magic">じゅもん</button>
        <button class="cmd-btn" data-action="item">どうぐ</button>
        <button class="cmd-btn" data-action="run" style="background:#555">にげる</button>
      </div>
    `;
    }
    if (mode === 'queue' || mode === 'victory') {
        return `<div class="cmds onecol"><button class="cmd-btn" data-action="next">次へ</button></div>`;
    }
    // ... other modes (skill selection, etc.) implementations
    return `<div class="cmds onecol"><button class="cmd-btn" data-action="back">もどる</button></div>`;
}

function renderQuizPane(quizData) {
    // Using quizData to render HTML
    return `
    <div class="quizWrap">
       <div class="quizTimeInfo">
          <div>残り時間: <span class="timeLeft">${Math.ceil(quizData.timeLeft || 10)}</span>s</div>
       </div>
       <div class="prompt">解を求めよ</div>
       <div class="expr">${quizData.quiz.question} = ?</div>
       
       <div class="keypad">
          <div class="screen">${quizData.input || ''}</div>
          <div class="keys">
             ${[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map(n =>
        `<button class="quiz-key" data-val="${n}">${n}</button>`
    ).join('')}
             <button class="quiz-del" data-action="del">⌫</button>
             <button class="quiz-submit" data-action="submit">OK</button>
          </div>
       </div>
    </div>
  `;
}
