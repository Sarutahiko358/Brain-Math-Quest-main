// filepath: /home/user/Brain-Math-Quest/app/components/result/QuizStatsDisplay.tsx
"use client";

import React from "react";
import { BattleState } from "../../lib/gameTypes";

interface QuizStatsDisplayProps {
  battle: BattleState;
}

/**
 * Quiz statistics display after battle
 */
export default function QuizStatsDisplay({ battle }: QuizStatsDisplayProps) {
  if (!battle.quizStats || battle.quizStats.total === 0) return null;

  const { quizStats, rewards } = battle;
  const accuracy = Math.round((quizStats.correct / quizStats.total) * 100);
  const avgTime = (quizStats.totalTime / quizStats.total).toFixed(1);

  return (
    <div className="quizStatsBox">
      <div className="quizStatsTitle">🧠 脳トレ成績</div>
      <div className="quizStatsContent">
        <div className="statRow">
          <span>正解率：</span>
          <strong>{quizStats.correct}/{quizStats.total} ({accuracy}%)</strong>
        </div>
        <div className="statRow">
          <span>平均時間：</span>
          <strong>{avgTime}秒</strong>
        </div>
        {rewards?.timeBonus && rewards.timeBonus > 0 && (
          <div className="statRow bonusRow">
            <span>⚡ 速解きボーナス獲得！</span>
          </div>
        )}
      </div>
    </div>
  );
}
