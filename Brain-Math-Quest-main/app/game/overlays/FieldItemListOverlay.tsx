import React from 'react';
import Overlay from '../../components/Overlay';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function FieldItemListOverlay() {
  // Get state and actions from Context
  const { showFieldItemList, scene, player } = useGameState();
  const { setShowFieldItemList, handleUseItemField } = useGameActions();

  if (!showFieldItemList || scene !== 'map') return null;

  return (
    <Overlay title="🧪 フィールドでのアイテム（一覧）" onClose={() => setShowFieldItemList(false)}>
      <div className="shopList">
        {player.items.length === 0 && <div style={{ opacity: 0.7 }}>使える道具がありません</div>}
        {player.items.map((it, idx) => (
          <div className="shopRow" key={idx}>
            <span>{it.name} ×{it.qty}{'（'}{
              it.effect === 'heal' ? `HP+${it.amount}` :
                it.effect === 'mp' ? `MP+${it.amount}` :
                  it.effect === 'comboUp' ? `コンボ+${it.amount}` :
                    it.effect === 'comboGuard' ? `コンボ維持（+${it.amount}）` : ''
            }{'）'}</span>
            <button onClick={() => { handleUseItemField(idx); }}>使う</button>
          </div>
        ))}
      </div>
      <div className="gBtns">
        <button className="ghost" onClick={() => setShowFieldItemList(false)}>閉じる</button>
      </div>
    </Overlay>
  );
}
