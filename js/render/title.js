/**
 * Title Screen Renderer
 */

import { state } from '../data.js';
import { loadSave } from '../lib/saveSystem.js';
import { TITLE_DESCRIPTION_STYLE } from '../game/styles/constants.js'; // Need to ensure this path is usable or copy constants
// TITLE_DESCRIPTION_STYLE is simple object, better to inline style string for vanilla JS

const DESC_STYLE = "font-size:12px;opacity:0.8;margin-top:6px;margin-bottom:8px;";

export function renderTitle(state) {
    const el = document.getElementById('title-scene');
    if (!el) return;

    // Check for save data
    let hasSave = false;
    try {
        // We need to implement a lightweight check or just rely on loadSave returning null
        // But loadSave might modify state? In saveSystem.ts it returns null or data.
        // In js/lib/saveSystem.js (migrated), does it exist?
        // I need to be careful not to actually LOAD the state into global state here, just check existence.
        // actually localStorage key is 'dqbrain-save'.
        const raw = localStorage.getItem('dqbrain-save');
        if (raw) hasSave = true;
    } catch (e) { console.error(e); }

    el.innerHTML = `
      <div class="main">
        <div class="logo">🧙‍♀️🧠 Brain Math Quest</div>
        <div class="subtitle">脳トレで戦う ちいさなRPG</div>
        <div class="titleBtns">
          <button class="title-btn" data-action="new-story">📖 物語を始める</button>
          <div style="${DESC_STYLE}margin-bottom:10px">
             物語モード：エリアを進みボスを倒していくメインキャンペーンです。
          </div>

          <button class="title-btn" data-action="new-library" title="数の異世界を始める">📚 数の異世界</button>
          <div style="${DESC_STYLE}">
             数の異世界：図書館から異世界に召喚され、テスト形式の戦いで世界を救う物語です。
          </div>

          <button class="title-btn" data-action="new-endless" title="無限の回廊を始める">🌀 無限の回廊</button>
           <div style="${DESC_STYLE}">
             無限の回廊：階層が進むほど敵が強くなるエンドレス挑戦モードです。
          </div>

          <button class="title-btn" data-action="brain-only" title="脳トレのみを連続で楽しむ">🧠 脳トレのみ</button>
           <div style="${DESC_STYLE}">
             脳トレのみ：RPG要素なしで脳トレ問題に集中できるモードです。
          </div>

          ${hasSave ? `<button class="title-btn" data-action="continue">セーブから再開</button>` : ''}
          
          <button class="title-btn" data-action="settings">設定</button>
          <button class="title-btn" data-action="howto">操作説明</button>
        </div>
        <div class="tips">セーブはメニューから</div>
      </div>
  `;
}
