// filepath: /home/runner/work/Brain-Math-Quest/Brain-Math-Quest/app/components/BrainQuizPane.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Quiz, Scratch } from '../lib/quiz/types';
import { checkAnswer } from '../lib/quiz/checkAnswer';
import { UI_TIMINGS } from '../lib/ui/constants';
import { QUIZ_INPUT } from './constants/quiz';
import QuizTimer from './quiz/QuizTimer';
import QuizUIDisplay from './quiz/QuizUIDisplay';
import QuizAnswerReview from './quiz/QuizAnswerReview';
import { Settings } from '../lib/settings';

export default function BrainQuizPane({
  quiz,
  timeMax,
  timeStart,
  onTimeout,
  onSubmit,
  onGiveup,
  settings,
  settingsOpen,
}: {
  quiz: Quiz;
  timeMax: number;
  timeStart: number;
  onTimeout: () => void;
  onSubmit: (ok: boolean, scratch: Scratch) => void;
  onGiveup: () => void;
  settings?: Settings;
  settingsOpen?: boolean;
}) {
  const [scratch, setScratch] = useState<Scratch>({ val: "", sel: [], seq: [], seqIds: [] });
  // 入力状態を keydown リスナーで参照するための最新参照
  const scratchRef = useRef<Scratch>(scratch);
  useEffect(() => { scratchRef.current = scratch; }, [scratch]);
  const [now, setNow] = useState<number>(Date.now());
  const endedRef = useRef(false);
  const [showReview, setShowReview] = useState<{ isCorrect: boolean; scratch: Scratch } | null>(null);
  // Answer review state ref for timer check
  const showReviewRef = useRef(showReview);
  useEffect(() => { showReviewRef.current = showReview; }, [showReview]);
  // Settings open state ref for timer check
  const settingsOpenRef = useRef(settingsOpen);
  useEffect(() => { settingsOpenRef.current = settingsOpen; }, [settingsOpen]);

  // 新しい問題が来たら入力・選択状態をリセット
  useEffect(() => {
    setScratch({ val: "", sel: [], seq: [], seqIds: [] });
    endedRef.current = false;
    setShowReview(null);
    setNow(Date.now());
  }, [quiz]);

  // タイマーは内部で駆動し、親への頻繁な re-render を防ぐ
  useEffect(() => {
    // Note: endedRef is only reset when quiz changes (see above useEffect)
    // Do NOT reset it here, as onTimeout changes frequently due to parent re-renders
    // QUIZ_TIMER_POLL間隔でポーリング。ただし 1/10秒の境界が変化した時のみ再レンダーし無駄な更新を抑制
    let lastTenths = -1;
    const id = setInterval(() => {
      // Stop timer during answer review or when settings are open
      if (showReviewRef.current || settingsOpenRef.current) return;

      const t = Date.now();
      const elapsedSec = (t - timeStart) / 1000;
      const left = timeMax - elapsedSec;
      if (!endedRef.current && left <= 0) {
        endedRef.current = true;
        clearInterval(id);
        onTimeout();
        return;
      }
      const tenths = Math.floor(elapsedSec * 10);
      if (tenths !== lastTenths) {
        lastTenths = tenths;
        setNow(t);
      }
    }, UI_TIMINGS.QUIZ_TIMER_POLL);
    return () => clearInterval(id);
  }, [timeMax, timeStart, onTimeout]);

  // Handle submission with answer review
  const handleSubmitWithReview = (sc: Scratch) => {
    const isCorrect = checkAnswer(quiz, sc);
    const shouldShowReview = settings?.answerReview
      ? (isCorrect && settings.answerReview.showOnCorrect) || (!isCorrect && settings.answerReview.showOnWrong)
      : !isCorrect; // Default: show only on wrong

    if (shouldShowReview) {
      setShowReview({ isCorrect, scratch: sc });
    } else {
      onSubmit(isCorrect, sc);
    }
  };

  // Handle continue from answer review
  const handleContinueFromReview = () => {
    if (showReview) {
      onSubmit(showReview.isCorrect, showReview.scratch);
      setShowReview(null);
    }
  };

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (quiz.ui.kind !== "input") return;
      const sc = scratchRef.current;
      if (e.key === "Enter") {
        handleSubmitWithReview(sc);
        return;
      }
      if (/^\d$/.test(e.key)) {
        setScratch((s) => ({ ...s, val: (s.val + e.key).slice(0, QUIZ_INPUT.MAX_DIGITS) }));
      }
      if (e.key === "Backspace") {
        setScratch((s) => ({ ...s, val: s.val.slice(0, -1) }));
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [quiz, settings?.answerReview]);

  const elapsed = Math.max(0, Math.min(timeMax, (now - timeStart) / 1000));
  const timeLeft = Math.max(0, timeMax - elapsed);

  return (
    <>
      <div className="quizWrap" role="region" aria-label="脳トレクイズ">
        <QuizTimer elapsed={elapsed} timeLeft={timeLeft} timeMax={timeMax} />

        <div className="prompt" role="heading" aria-level={2}>{quiz.prompt}</div>
        {quiz.expr && <div className="expr" aria-label="問題式">{quiz.expr}</div>}

        <QuizUIDisplay
          quiz={quiz}
          scratch={scratch}
          setScratch={setScratch}
          onSubmit={(ok, sc) => handleSubmitWithReview(sc)}
        />

        <div className="quizBtns" role="group" aria-label="クイズ操作">
          <button className="ghost" onClick={onGiveup} aria-label="この問題をスキップする">
            スキップ
          </button>
          {quiz.ui.kind !== "choices2" && (
            <button onClick={() => handleSubmitWithReview(scratch)} aria-label="回答を決定して送信する">
              決定
            </button>
          )}
        </div>

        {quiz.note && <div className="note">{quiz.note}</div>}
      </div>

      {showReview && (
        <QuizAnswerReview
          quiz={quiz}
          scratch={showReview.scratch}
          isCorrect={showReview.isCorrect}
          onContinue={handleContinueFromReview}
        />
      )}
    </>
  );
}
