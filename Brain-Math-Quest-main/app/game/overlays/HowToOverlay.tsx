import React from 'react';
import Overlay from '../../components/Overlay';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function HowToOverlay() {
  // Get state and actions from Context
  const { showHowto } = useGameState();
  const { setShowHowto } = useGameActions();

  if (!showHowto) return null;

  return (
    <Overlay title="操作説明" onClose={() => setShowHowto(false)}>
      <ul className="help">
        <li>移動：矢印キー / WASD / 画面のDパッド</li>
        <li>メニュー：Mキー（マップ時）</li>
        <li>バトル：脳トレに正解して攻撃・回復・逃走</li>
        <li>ログ進行：クリック / Enter / Space</li>
        <li>町（🏘️）：武器屋・道具屋・宿屋（HP/MP全回復）</li>
        <li>洞窟（🕳️）・城（🏰）：ボスに出会いやすい</li>
        <li>道場（🥋）：コンボ練習用の連続バトル</li>
        <li>城でボス撃破：次のエリアへ進める</li>
        <li>セーブ/ロード：メニューから💾セーブ/ロード</li>
        <li>図鑑：出会った/倒した敵を記録します</li>
      </ul>
    </Overlay>
  );
}
