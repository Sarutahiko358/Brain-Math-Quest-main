"use client";

import React from "react";
import { Player, BattleState } from "../lib/gameTypes";
import { AreaInfo } from "../lib/world/areas";
import { isGameOver } from "../lib/battle/conditions";
import GameOverDisplay from "./result/GameOverDisplay";
import VictoryRewards from "./result/VictoryRewards";
import QuizStatsDisplay from "./result/QuizStatsDisplay";
import ResultActions from "./result/ResultActions";

interface ResultViewProps {
  player: Player;
  battle: BattleState | null;
  dojoMode: null | 'arithmetic' | 'random' | 'hard';
  currentAreaInfo: AreaInfo;
  onRestartFromTown: () => void;
  onLoadFromSave: () => void;
  onGoToTitle: () => void;
  onContinueAdventure: () => void;
  onShowBestiary: () => void;
  onAnotherBattle: () => void;
  onExitDojo: () => void;
  onReturnToDojo?: () => void;
}

/**
 * ResultView - Display-only component for battle result screen
 * Shows victory or game over screen with rewards, stats, and action buttons
 * Props-based, all actions handled via callbacks
 */
export default function ResultView({
  player,
  battle,
  dojoMode,
  onRestartFromTown,
  onLoadFromSave,
  onGoToTitle,
  onContinueAdventure,
  onShowBestiary,
  onAnotherBattle,
  onExitDojo,
  onReturnToDojo,
}: ResultViewProps) {
  if (isGameOver(player)) {
    return (
      <GameOverDisplay
        onRestartFromTown={onRestartFromTown}
        onLoadFromSave={onLoadFromSave}
        onGoToTitle={onGoToTitle}
      />
    );
  }

  // Victory
  return (
    <div className="result" role="dialog" aria-labelledby="victory-title">
      <div id="victory-title" className="logo" role="heading" aria-level={1}>🎉 勝利！</div>
      {battle && <VictoryRewards battle={battle} />}
      {battle && <QuizStatsDisplay battle={battle} />}
      <ResultActions
        dojoMode={dojoMode}
        onContinueAdventure={onContinueAdventure}
        onShowBestiary={onShowBestiary}
        onAnotherBattle={onAnotherBattle}
        onExitDojo={onExitDojo}
        onReturnToDojo={onReturnToDojo}
      />
    </div>
  );
}
