// filepath: /home/user/Brain-Math-Quest/app/components/result/ResultActions.tsx
"use client";

import React from "react";

interface ResultActionsProps {
  dojoMode: null | 'arithmetic' | 'random' | 'hard';
  onContinueAdventure: () => void;
  onShowBestiary: () => void;
  onAnotherBattle: () => void;
  onExitDojo: () => void;
  onReturnToDojo?: () => void;
}

/**
 * Action buttons for result screen (dojo or adventure mode)
 */
export default function ResultActions({
  dojoMode,
  onContinueAdventure,
  onShowBestiary,
  onAnotherBattle,
  onExitDojo,
  onReturnToDojo,
}: ResultActionsProps) {
  if (dojoMode) {
    return (
      <>
        <div className="subtitle">まだ戦いますか？（道場モード）</div>
        <div className="titleBtns" role="group" aria-label="道場モード選択">
          <button onClick={onAnotherBattle} aria-label="もう一戦 - 道場で続けて戦闘する">⚔️ もう一戦！</button>
          {onReturnToDojo && (
            <button onClick={onReturnToDojo} aria-label="道場入口に戻る - 道場メニューに戻る">🥋 道場入口に戻る</button>
          )}
          <button onClick={onExitDojo} aria-label="道場を出る - 道場を退出してマップに戻る">🚪 道場を出る</button>
          <button onClick={onShowBestiary} aria-label="図鑑を見る - モンスター図鑑を開く">📖 図鑑を見る</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="subtitle">つぎの冒険へ でかけよう！</div>
      <div className="titleBtns" role="group" aria-label="次の行動選択">
        <button onClick={onContinueAdventure} aria-label="冒険を続ける - マップに戻って冒険を続ける">冒険を つづける</button>
        <button onClick={onShowBestiary} aria-label="図鑑を見る - モンスター図鑑を開く">図鑑を見る</button>
      </div>
    </>
  );
}
