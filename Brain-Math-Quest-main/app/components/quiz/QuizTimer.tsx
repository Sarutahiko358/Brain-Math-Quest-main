// filepath: /home/user/Brain-Math-Quest/app/components/quiz/QuizTimer.tsx
"use client";

import React from "react";
import { QUIZ_TIMING } from '../constants/quiz';

interface QuizTimerProps {
  elapsed: number;
  timeLeft: number;
  timeMax: number;
}

/**
 * Quiz timer display with progress bar and timing information
 */
export default function QuizTimer({ elapsed, timeLeft, timeMax }: QuizTimerProps) {
  const pct = Math.max(0, Math.min(100, (timeLeft / timeMax) * 100));
  const speedTarget = timeMax * QUIZ_TIMING.SPEED_BONUS_THRESHOLD;
  const isFast = elapsed < speedTarget;

  return (
    <>
      <div className="timerBar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="残り時間">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="quizTimeInfo" role="timer" aria-live="polite">
        <span className={isFast ? "timeElapsed fast" : "timeElapsed"} aria-label={`経過時間 ${elapsed.toFixed(QUIZ_TIMING.TIME_ELAPSED_DECIMALS)}秒`}>
          {elapsed.toFixed(QUIZ_TIMING.TIME_ELAPSED_DECIMALS)}秒
        </span>
        <span className="timeTarget" aria-label={`目標時間 ${speedTarget.toFixed(QUIZ_TIMING.TIME_TARGET_DECIMALS)}秒以下`}>
          ⚡目標: {speedTarget.toFixed(QUIZ_TIMING.TIME_TARGET_DECIMALS)}秒以下
        </span>
        <span className="timeLeft" aria-label={`残り時間 ${timeLeft.toFixed(QUIZ_TIMING.TIME_LEFT_DECIMALS)}秒`}>
          {timeLeft.toFixed(QUIZ_TIMING.TIME_LEFT_DECIMALS)}秒
        </span>
      </div>
    </>
  );
}
