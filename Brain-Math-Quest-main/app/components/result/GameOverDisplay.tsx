// filepath: /home/user/Brain-Math-Quest/app/components/result/GameOverDisplay.tsx
"use client";

import React from "react";
import { GAME_OVER_MESSAGE_STYLE } from '../constants/result';

interface GameOverDisplayProps {
  onRestartFromTown: () => void;
  onLoadFromSave: () => void;
  onGoToTitle: () => void;
}

/**
 * Game Over screen display
 */
export default function GameOverDisplay({ onRestartFromTown, onLoadFromSave, onGoToTitle }: GameOverDisplayProps) {
  return (
    <div className="result" role="dialog" aria-labelledby="result-title">
      <div id="result-title" className="logo" role="heading" aria-level={1}>💤 GAME OVER</div>
      <div className="subtitle" role="status" aria-live="polite">目の前が まっくらに なった…</div>
      <div style={GAME_OVER_MESSAGE_STYLE}>
        「勇者よ、まだ終わりではない。\n町の宿屋から再び旅立つのだ...」
      </div>
      <div className="titleBtns" role="group" aria-label="ゲームオーバー後の選択">
        <button onClick={onRestartFromTown} aria-label="町から再開 - HP/MP半分、所持金30%減で町の宿屋から再スタート">
          町から再開（HP/MP半分、所持金30%減）
        </button>
        <button onClick={onLoadFromSave} aria-label="セーブから再開 - セーブデータをロードして再開">セーブから再開</button>
        <button onClick={onGoToTitle} aria-label="タイトルにもどる - タイトル画面に戻る">タイトルにもどる</button>
      </div>
    </div>
  );
}
