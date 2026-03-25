// filepath: /home/user/Brain-Math-Quest/app/components/quiz/QuizUIDisplay.tsx
"use client";

import React from "react";
import { Quiz, Scratch, Chip, hasChips, isChoices2UI } from '../../lib/quiz/types';
import { checkAnswer } from '../../lib/quiz/checkAnswer';
import {
  QUIZ_INPUT,
  QUIZ_CHIPS,
  QUIZ_STYLES,
  KEYPAD_BUTTONS,
  KEYPAD_ARIA_LABELS,
} from '../constants/quiz';

interface QuizUIDisplayProps {
  quiz: Quiz;
  scratch: Scratch;
  setScratch: React.Dispatch<React.SetStateAction<Scratch>>;
  onSubmit: (ok: boolean, scratch: Scratch) => void;
}

// Helper: Render 2-choice quiz
function Choices2Quiz({ quiz, scratch, onSubmit }: QuizUIDisplayProps) {
  if (!isChoices2UI(quiz.ui)) return null;

  const ui = quiz.ui; // Type narrowed to Choices2UI

  const handleChoice = (choice: 'L' | 'R') => {
    const choiceText = choice === 'L' ? ui.left : ui.right;
    const updatedScratch = {
      ...scratch,
      val: choiceText, // Store selected choice text
      sel: [{ id: 0, text: choiceText, value: choice === 'L' ? 0 : 1 }] // Use numeric value for type compatibility
    };
    onSubmit(quiz.answer === choice, updatedScratch);
  };

  return (
    <div className="twoChoices" role="group" aria-label="2択選択">
      <button onClick={() => handleChoice('L')} aria-label={`左の選択肢: ${ui.left}`}>
        {ui.left}
      </button>
      <button onClick={() => handleChoice('R')} aria-label={`右の選択肢: ${ui.right}`}>
        {ui.right}
      </button>
    </div>
  );
}

// Helper: Render chip selection quiz (max 2)
function ChipsQuiz({ chips, scratch, setScratch }: Pick<QuizUIDisplayProps, 'scratch' | 'setScratch'> & { chips: Chip[] }) {
  return (
    <div className="chips" role="group" aria-label="チップ選択（最大2個）">
      {chips.map((c: Chip) => {
        const selected = scratch.sel.find((x) => x.id === c.id);
        return (
          <button
            key={c.id}
            className={`chip ${selected ? "sel" : ""}`}
            onClick={() => {
              setScratch((s) => {
                const i = s.sel.findIndex((x) => x.id === c.id);
                const sel = [...s.sel];
                if (i >= 0) sel.splice(i, 1);
                else if (sel.length < QUIZ_CHIPS.MAX_SELECTION) sel.push(c);
                return { ...s, sel };
              });
            }}
            aria-label={`${c.text}${selected ? ' 選択中' : ''}`}
            aria-pressed={!!selected}
          >
            {c.text}
          </button>
        );
      })}
    </div>
  );
}

// Helper: Render multi-chip selection quiz
function ChipsMultiQuiz({ chips, scratch, setScratch }: Pick<QuizUIDisplayProps, 'scratch' | 'setScratch'> & { chips: Chip[] }) {
  return (
    <div className="chips" role="group" aria-label="チップ選択（複数選択可）">
      {chips.map((c: Chip) => {
        const selected = scratch.sel.find((x) => x.id === c.id);
        return (
          <button
            key={c.id}
            className={`chip ${selected ? "sel" : ""}`}
            onClick={() => {
              setScratch((s) => {
                const i = s.sel.findIndex((x) => x.id === c.id);
                const sel = [...s.sel];
                if (i >= 0) sel.splice(i, 1);
                else sel.push(c);
                return { ...s, sel };
              });
            }}
            aria-label={`${c.text}${selected ? ' 選択中' : ''}`}
            aria-pressed={!!selected}
          >
            {c.text}
          </button>
        );
      })}
    </div>
  );
}

// Helper: Render ordered chip selection quiz
function ChipsOrderQuiz({ chips, scratch, setScratch }: Pick<QuizUIDisplayProps, 'scratch' | 'setScratch'> & { chips: Chip[] }) {
  return (
    <div className="chipsOrderWrap">
      <div className="chips" role="group" aria-label="チップ選択（順序指定）">
        {chips.map((c: Chip) => {
          const disabled = scratch.seqIds.includes(c.id);
          return (
            <button
              key={c.id}
              className={`chip ${disabled ? "disabled" : ""}`}
              onClick={() => {
                if (disabled) return;
                setScratch((s) => ({ ...s, seq: [...s.seq, c.value], seqIds: [...s.seqIds, c.id] }));
              }}
              aria-label={`${c.text}${disabled ? ' 選択済み' : ''}`}
              aria-disabled={disabled}
            >
              {c.text}
            </button>
          );
        })}
      </div>
      <div className="chips picked" style={QUIZ_STYLES.CHIP_GROUP} role="group" aria-label="選択済みチップ">
        {scratch.seqIds.map((id, idx) => {
          const ch = chips.find((x: Chip) => x.id === id);
          if (!ch) return null;
          return (
            <button
              key={`${id}-${idx}`}
              className="chip sel"
              aria-label={`${ch.text}の選択を取り消す`}
              onClick={() => {
                setScratch((s) => {
                  const i = s.seqIds.indexOf(id);
                  if (i < 0) return s;
                  const seqIds = [...s.seqIds];
                  const seq = [...s.seq];
                  seqIds.splice(i, 1);
                  seq.splice(i, 1);
                  return { ...s, seq, seqIds };
                });
              }}
            >
              {ch.text} ✕
            </button>
          );
        })}
      </div>
      <div className="gBtns" style={QUIZ_STYLES.CHIP_GROUP}>
        <button className="ghost" onClick={() => setScratch((s) => ({ ...s, seq: [], seqIds: [] }))} aria-label="すべてのチップ選択をクリアする">全消去</button>
        <button className="ghost" onClick={() => setScratch((s) => ({ ...s, seq: s.seq.slice(0, -1), seqIds: s.seqIds.slice(0, -1) }))} aria-label="最後のチップ選択を取り消す">ひとつ戻す</button>
      </div>
    </div>
  );
}

// Helper: Render input keypad quiz
function InputQuiz({ quiz, scratch, setScratch, onSubmit }: QuizUIDisplayProps) {
  return (
    <div className="keypad" role="group" aria-label="数字入力キーパッド">
      <div className="screen" role="textbox" aria-label="入力値" aria-readonly="true">{scratch.val}</div>
      <div className="keys">
        {KEYPAD_BUTTONS.map((k) => (
          <button
            key={k}
            onClick={() => {
              if (k === "←") {
                setScratch((s) => ({ ...s, val: s.val.slice(0, -1) }));
              } else if (k === "OK") {
                onSubmit(checkAnswer(quiz, scratch), scratch);
              } else {
                setScratch((s) =>
                  s.val.length >= QUIZ_INPUT.MAX_DIGITS ? s : { ...s, val: s.val + k }
                );
              }
            }}
            aria-label={KEYPAD_ARIA_LABELS[k] || `数字 ${k}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Dynamic quiz UI display based on quiz type
 */
export default function QuizUIDisplay({ quiz, scratch, setScratch, onSubmit }: QuizUIDisplayProps) {
  return (
    <div className="dyn">
      {quiz.ui.kind === "choices2" && <Choices2Quiz quiz={quiz} scratch={scratch} setScratch={setScratch} onSubmit={onSubmit} />}
      {quiz.ui.kind === "chips" && hasChips(quiz.ui) && <ChipsQuiz chips={quiz.ui.chips} scratch={scratch} setScratch={setScratch} />}
      {quiz.ui.kind === "chips-multi" && hasChips(quiz.ui) && <ChipsMultiQuiz chips={quiz.ui.chips} scratch={scratch} setScratch={setScratch} />}
      {quiz.ui.kind === "chips-order" && hasChips(quiz.ui) && <ChipsOrderQuiz chips={quiz.ui.chips} scratch={scratch} setScratch={setScratch} />}
      {quiz.ui.kind === "input" && <InputQuiz quiz={quiz} scratch={scratch} setScratch={setScratch} onSubmit={onSubmit} />}
    </div>
  );
}
