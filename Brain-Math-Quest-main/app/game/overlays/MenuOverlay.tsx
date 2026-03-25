import React from 'react';
import Overlay from '../../components/Overlay';
import { effATK, effDEF } from '../../lib/battle/stats';
import { nextExpFor } from '../../lib/battle/xp';
import CompletionStats from '../components/CompletionStats';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function MenuOverlay() {
  // Get state and actions from Context
  const {
    showMenu,
    player,
    gameMode,
    dexStory,
    dexEndless,
    quizCombo,
    playTime,
    scene,
    equipDex
  } = useGameState();

  const {
    setShowMenu,
    setShowStory,
    setShowDex,
    setShowEquipDex,
    setShowFieldHealList,
    setShowFieldItemList,
    setShowSaveMenu,
    setShowSettings
  } = useGameActions();

  if (!showMenu) return null;

  // モード別の表示ラベルを定義（表示のみ。ロジックや状態管理へ影響なし）
  const progressLabel =
    gameMode === 'endless'
      ? '（無限の回廊）'
      : gameMode === 'library'
        ? '（数の異世界）'
        : '（物語モード）';

  const storyButtonText =
    gameMode === 'endless'
      ? '📖 モード説明を見る'
      : gameMode === 'library'
        ? '📚 異世界ストーリーを見る'
        : '📖 ストーリーを見る';

  const menuTitle =
    gameMode === 'endless'
      ? 'メニュー - 無限の回廊'
      : gameMode === 'library'
        ? 'メニュー - 数の異世界'
        : 'メニュー';

  return (
    <Overlay title={menuTitle} onClose={() => setShowMenu(false)}>
      <div className="menuGrid">
        <div>
          <h4>ステータス</h4>
          <p>{player.avatar} {player.name} Lv{player.lv}</p>
          <p>HP {player.hp}/{player.maxHP} / MP {player.mp}/{player.maxMP}</p>
          <p>ATK {effATK(player)}（{player.equip.weapon.name}） / DEF {effDEF(player)}（{player.equip.armor.name}）</p>
          <p>EXP {player.exp}/{nextExpFor(player.lv)} / GOLD {player.gold}</p>
          <p>所持品：{player.items.map(i => `${i.name}×${i.qty}`).join("、") || "なし"}</p>
          <p style={{ fontSize: "12px", opacity: 0.8 }}>⏱ プレイ時間: {Math.floor(playTime / 3600)}h {Math.floor((playTime % 3600) / 60)}m</p>

          <h4 style={{ marginTop: '16px' }}>達成状況{progressLabel}</h4>
          <CompletionStats
            player={player}
            gameMode={gameMode}
            dexStory={dexStory}
            dexEndless={dexEndless}
            quizCombo={quizCombo}
            equipDex={equipDex}
          />
        </div>
        <div className="vbtns">
          <button onClick={() => { setShowStory("intro"); setShowMenu(false); }}>{storyButtonText}</button>
          <button onClick={() => { setShowDex(true); setShowMenu(false); }}>図鑑</button>
          <button onClick={() => { setShowEquipDex(true); setShowMenu(false); }}>装備図鑑</button>
          {/* フィールドで回復魔法/アイテムの一覧UIへ */}
          {scene === 'map' && (
            <>
              <button onClick={() => { setShowFieldHealList(true); setShowMenu(false); }}>🧙 フィールド用回復魔法（一覧）</button>
              <button onClick={() => { setShowFieldItemList(true); setShowMenu(false); }}>🧪 フィールド用アイテム（一覧）</button>
            </>
          )}
          <button onClick={() => { setShowSaveMenu(true); setShowMenu(false); }}>💾 セーブ/ロード</button>
          <button onClick={() => { setShowSettings(true); setShowMenu(false); }}>設定</button>
          <button onClick={() => setShowMenu(false)}>閉じる</button>
        </div>
      </div>
    </Overlay>
  );
}
