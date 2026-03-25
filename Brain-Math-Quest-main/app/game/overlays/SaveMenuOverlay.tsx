import React from 'react';
import Overlay from '../../components/Overlay';
import { getAllSaveSlots } from '../../lib/saveSystem';
import { AREAS } from '../../lib/world/areas';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function SaveMenuOverlay() {
  // Get state and actions from Context
  const { showSaveMenu, scene } = useGameState();
  const { setShowSaveMenu, doDeleteSlot, doLoadFromSlot, doSaveToSlot, doExport, doImport } = useGameActions();

  if (!showSaveMenu) return null;

  return (
    <Overlay title="💾 セーブ / ロード" onClose={() => setShowSaveMenu(false)}>
      <div className="saveMenu">
        <div className="saveSlots">
          {getAllSaveSlots().map((saveData, idx) => {
            const slot = idx + 1;
            return (
              <div key={slot} className="saveSlot">
                <div className="slotHeader">
                  <h4>スロット {slot}</h4>
                  {saveData && (
                    <button className="deleteBtn ghost" onClick={() => doDeleteSlot(slot)} aria-label={`スロット ${slot} を削除`}>🗑️</button>
                  )}
                </div>
                {saveData ? (
                  <div className="slotInfo">
                    <p><strong>{saveData.player.avatar} {saveData.player.name}</strong> Lv{saveData.player.lv}</p>
                    <p>HP {saveData.player.hp}/{saveData.player.maxHP} / MP {saveData.player.mp}/{saveData.player.maxMP}</p>
                    {/* セーブ種別（物語/無限）と位置情報 */}
                    <p>
                      モード：{saveData.mode === 'endless' || saveData.player.currentArea === 10 ? '無限の回廊' : '物語'}
                      {saveData.mode === 'endless' || saveData.player.currentArea === 10 ? (
                        <>（第{saveData.player.endlessFloor || 1}階層）</>
                      ) : (
                        <>（{AREAS.find(a => a.id === saveData.player.currentArea)?.name || '？？？'}）</>
                      )}
                    </p>
                    <p>💰 {saveData.player.gold}G / 📍 マップ座標 ({saveData.player.pos.r}, {saveData.player.pos.c})</p>
                    <p className="saveTime">
                      💾 {new Date(saveData.meta.saveDate).toLocaleString('ja-JP')}
                    </p>
                    <p className="playTime">
                      ⏱ {Math.floor(saveData.meta.playTime / 3600)}h {Math.floor((saveData.meta.playTime % 3600) / 60)}m
                    </p>
                    <div className="slotBtns">
                      <button onClick={() => doLoadFromSlot(slot)}>📂 ロード</button>
                      {/* タイトル画面では上書き保存を隠す（誤操作防止） */}
                      {scene !== 'title' && (
                        <button onClick={() => doSaveToSlot(slot)}>💾 上書き保存</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="slotEmpty">
                    <p>データなし</p>
                    {scene !== 'title' && (
                      <button onClick={() => doSaveToSlot(slot)}>💾 新規保存</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="saveExtra">
          <h4>データ管理</h4>
          <div className="gBtns">
            <button onClick={doExport}>📥 エクスポート</button>
            <button onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e: Event) => {
                const target = e.target as HTMLInputElement;
                const file = target?.files?.[0];
                if (file) doImport(file);
              };
              input.click();
            }}>📤 インポート</button>
          </div>
          <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "8px" }}>
            ※ エクスポートでセーブデータをファイルとしてダウンロードできます
          </p>
        </div>
      </div>
    </Overlay>
  );
}
