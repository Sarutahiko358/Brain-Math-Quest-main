/**
 * UI Overlay Renderer
 */

import { state } from '../data.js';

export function renderUI(state) {
    const layer = document.getElementById('overlay-layer');
    if (!layer) return;

    let html = '';

    if (state.showTown) {
        html += renderTownOverlay(state);
    }

    if (state.showMenu) {
        html += renderMenuOverlay(state);
    }

    if (state.map.message) {
        // html += renderMessageOverlay(state.map.message);
    }

    // .. render other overlays

    layer.innerHTML = html;

    // Toggle overlay visibility based on content
    layer.style.display = html ? 'block' : 'none';
}

function renderTownOverlay(state) {
    return `
    <div class="overlay">
      <div class="panel">
        <div class="panelHead">
           <h4>町</h4>
           <button class="close-overlay" data-target="town">×</button>
        </div>
        <div class="panelBody">
           <div class="townMenu">
             <button class="town-btn" data-action="inn">宿屋にとまる</button>
             <button class="town-btn" data-action="shop">武器屋・道具屋</button>
             <button class="town-btn" data-action="church">教会（セーブ）</button>
           </div>
        </div>
      </div>
    </div>
  `;
}

function renderMenuOverlay(state) {
    return `
    <div class="overlay">
       <div class="panel">
         <div class="panelHead"><h4>メニュー</h4><button class="close-overlay" data-target="menu">×</button></div>
         <div class="panelBody">
            <button class="menu-btn" data-action="item">どうぐ</button>
            <button class="menu-btn" data-action="equip">そうび</button>
            <button class="menu-btn" data-action="status">つよさ</button>
            <button class="menu-btn" data-action="save">セーブ</button>
         </div>
       </div>
    </div>
  `;
}
