import React from 'react';
import Overlay from '../../components/Overlay';
import { learned } from '../../lib/skills';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function FieldHealListOverlay() {
  // Get state and actions from Context
  const { showFieldHealList, scene, player } = useGameState();
  const { setShowFieldHealList, castFieldHealLocal } = useGameActions();

  if (!showFieldHealList || scene !== 'map') return null;

  const heals = learned(player.lv).heal;
  const keys = new Set(heals.map(h => h.key));
  const has1 = keys.has('heal');
  const has2 = keys.has('heal-more');
  const has3 = keys.has('heal-all');
  const mp = player.mp;
  const can1 = mp >= 3 && has1;
  const can2 = mp >= 6 && has2;
  const can3 = mp >= 9 && has3;

  return (
    <Overlay title="🧙 フィールドでの回復魔法（一覧）" onClose={() => setShowFieldHealList(false)}>
      <div className="vbtns">
        <button
          disabled={!can1}
          title="ヒール（MP3）：HPを最大の約30%回復"
          onClick={() => { castFieldHealLocal(3, 0.30, 'ヒール', 'heal', false); }}
        >
          ヒール（MP3）{!has1 ? '（未習得）' : (mp < 3 ? '（MP不足）' : '')}
        </button>
        <button
          disabled={!can2}
          title="ハイヒール（MP6）：HPを最大の約60%回復"
          onClick={() => { castFieldHealLocal(6, 0.60, 'ハイヒール', 'heal-more', false); }}
        >
          ハイヒール（MP6）{!has2 ? '（未習得）' : (mp < 6 ? '（MP不足）' : '')}
        </button>
        <button
          disabled={!can3}
          title="ドハイヒール（MP9）：HPを全快回復"
          onClick={() => { castFieldHealLocal(9, 1.0, 'ドハイヒール', 'heal-all', true); }}
        >
          ドハイヒール（MP9）{!has3 ? '（未習得）' : (mp < 9 ? '（MP不足）' : '')}
        </button>
        <button className="ghost" onClick={() => setShowFieldHealList(false)}>閉じる</button>
      </div>
    </Overlay>
  );
}
