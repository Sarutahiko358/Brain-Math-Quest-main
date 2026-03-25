import React, { useState, useEffect } from 'react';
import Overlay from '../../components/Overlay';
import QuizTypeSelector from '../components/QuizTypeSelector';
import { Scene, Difficulty } from '../../lib/gameTypes';
import { BrainOnlyMode } from '../types';
import { BrainOnlyState } from '../../hooks/useBrainOnlyMode';
import { Settings } from '../../lib/settings';
import { QuizType } from '../../lib/quiz/types';
import { useGameState, useGameActions } from '../contexts/GameContext';

const ALL_QUIZ_TYPES: QuizType[] = [
  'SUM', 'MISSING', 'COMPARE', 'PAIR', 'ORDER', 'MAX_MIN',
  'PAIR_DIFF', 'MAX_MIN_EXPR', 'ORDER_SUM', 'COMPARE_EXPR',
  'RANGE_DIFF', 'MULTI_SELECT_MULTIPLES',
  'PRIME', 'SQUARE_ROOT', 'FACTOR_PAIR', 'ARITHMETIC_SEQUENCE',
  'DIVISOR_COUNT', 'COMMON_DIVISOR', 'PATTERN_NEXT',
  'MODULO', 'EQUATION_BALANCE', 'FRACTION_COMPARE'
];

const HELP_TEXT_STYLE: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  fontSize: '0.85em',
  opacity: 0.7,
};

const HELP_TEXT_WITH_MARGIN_STYLE: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  marginLeft: '8px',
  fontSize: '0.85em',
  opacity: 0.7,
};

export default function BrainOnlySetupOverlay() {
  // Get state and actions from Context
  const { showBrainOnlySetup, brainOnlyDraft, settings, brainOnlyMode, brainOnlyTarget } = useGameState();
  const {
    setShowBrainOnlySetup,
    setBrainOnlyDraft,
    setBrainOnlyMode,
    setBrainOnlyTarget,
    setSettings,
    setBrainOnlyStats,
    setBrainOnlyRecords,
    setScene,
    startBrainOnlyQuiz,
    setShowBrainOnlyConfig
  } = useGameActions();
  // Local draft state for all settings
  const [draftSettings, setDraftSettings] = useState<Settings>(settings);

  // Reset draft when overlay opens - always start with all quiz types selected
  useEffect(() => {
    if (showBrainOnlySetup) {
      setDraftSettings({ ...settings, quizTypes: ALL_QUIZ_TYPES });
    }
  }, [showBrainOnlySetup, settings]);

  if (!showBrainOnlySetup) return null;

  const handleStart = () => {
    // Save settings
    setSettings(draftSettings);
    const next = brainOnlyDraft || settings.brainOnly;
    setSettings(s => ({ ...s, brainOnly: next }));

    // Initialize stats for tracking
    setBrainOnlyStats({ total: 0, correct: 0, totalTime: 0, streak: 0, maxStreak: 0 });
    setBrainOnlyRecords([]);

    // Start brain-only mode with dedicated scene
    setShowBrainOnlySetup(false);
    setScene('brainOnly');
    startBrainOnlyQuiz();
  };

  return (
    <Overlay title="🧠 脳トレのみモード" onClose={() => setShowBrainOnlySetup(false)}>
      <div className="form" style={{ display: 'grid', gap: 12, maxHeight: '70vh', overflowY: 'auto', maxWidth: '600px', margin: '0 auto', paddingRight: '12px' }}>

        {/* Difficulty */}
        <div>
          <h4 style={{ marginBottom: 8 }}>難易度</h4>
          <label>
            <select
              value={draftSettings.difficulty}
              onChange={(e) => setDraftSettings(s => ({ ...s, difficulty: e.target.value as Difficulty }))}
            >
              <option value="easy">easy（簡単）</option>
              <option value="normal">normal（普通）</option>
              <option value="hard">hard（難しい）</option>
            </select>
            <small style={HELP_TEXT_STYLE}>クイズの難度、数値範囲、制限時間に影響</small>
          </label>
        </div>

        <div className="difficultyInfo" style={{ marginTop: 8 }}>
          <h5>難易度別詳細：</h5>
          <div className="diffBox">
            <strong>easy</strong>
            <ul>
              <li>数値範囲：1-18</li>
              <li>制限時間：30秒</li>
              <li>乗算なし</li>
            </ul>
          </div>
          <div className="diffBox">
            <strong>normal</strong>
            <ul>
              <li>数値範囲：1-28</li>
              <li>制限時間：24秒</li>
              <li>乗算あり</li>
            </ul>
          </div>
          <div className="diffBox">
            <strong>hard</strong>
            <ul>
              <li>数値範囲：1-48</li>
              <li>制限時間：18秒</li>
              <li>乗算あり</li>
            </ul>
          </div>
        </div>

        <hr />

        {/* Quiz Types */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ marginBottom: 0 }}>出題する問題の種類</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="ghost"
                style={{ fontSize: '0.85em', padding: '4px 8px' }}
                onClick={() => setDraftSettings(s => ({ ...s, quizTypes: ALL_QUIZ_TYPES }))}
              >
                全て選択
              </button>
              <button
                type="button"
                className="ghost"
                style={{ fontSize: '0.85em', padding: '4px 8px' }}
                onClick={() => setDraftSettings(s => ({ ...s, quizTypes: [] }))}
              >
                全て解除
              </button>
            </div>
          </div>
          <small style={HELP_TEXT_WITH_MARGIN_STYLE}>
            チェックした問題タイプのみが出題されます（最低1つ選択してください）
          </small>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '14px', marginTop: 8 }}>
            <QuizTypeSelector
              selectedTypes={draftSettings.quizTypes}
              onChange={(types) => setDraftSettings(s => ({ ...s, quizTypes: types }))}
              hideButtons={true}
            />
          </div>
        </div>

        <hr />

        {/* Answer Review */}
        <div>
          <h4 style={{ marginBottom: 8 }}>📝 答え合わせ設定</h4>
          <label className="row">
            正解時に答えを表示：
            <input
              type="checkbox"
              checked={draftSettings.answerReview.showOnCorrect}
              onChange={(e) => setDraftSettings(s => ({ ...s, answerReview: { ...s.answerReview, showOnCorrect: e.target.checked } }))}
            />
          </label>
          <small style={HELP_TEXT_STYLE}>問題に正解したときに答え合わせ画面を表示</small>

          <label className="row" style={{ marginTop: 8 }}>
            不正解時に答えを表示：
            <input
              type="checkbox"
              checked={draftSettings.answerReview.showOnWrong}
              onChange={(e) => setDraftSettings(s => ({ ...s, answerReview: { ...s.answerReview, showOnWrong: e.target.checked } }))}
            />
          </label>
          <small style={HELP_TEXT_STYLE}>問題に不正解だったときに答え合わせ画面を表示（推奨：オン）</small>
        </div>

        <hr />

        {/* Display Settings */}
        <div>
          <h4 style={{ marginBottom: 8 }}>表示設定</h4>
          <label className="row">
            バトル風背景を表示：
            <input
              type="checkbox"
              checked={(brainOnlyDraft || settings.brainOnly).battleBg}
              onChange={(e) => setBrainOnlyDraft(d => ({ ...(d || settings.brainOnly), battleBg: e.target.checked }))}
            />
          </label>
          <small style={HELP_TEXT_STYLE}>雰囲気を出すためのバトル風背景表示</small>
        </div>

        <hr />

        {/* Mode Selection */}
        <div>
          <h4 style={{ marginBottom: 8 }}>モード選択</h4>
          <div className="form row" style={{ gap: 12, marginTop: 6 }}>
            <label className="row" style={{ gap: 6 }}>
              <input type="radio" name="brainMode" checked={brainOnlyMode === 'fixed'} onChange={() => setBrainOnlyMode('fixed')} />
              出題数を選ぶ
            </label>
            <label className="row" style={{ gap: 6 }}>
              <input type="radio" name="brainMode" checked={brainOnlyMode === 'endless'} onChange={() => setBrainOnlyMode('endless')} />
              無限に挑戦
            </label>
          </div>
          {brainOnlyMode === 'fixed' && (
            <div style={{ marginTop: 8 }}>
              出題数：
              <select value={brainOnlyTarget} onChange={(e) => setBrainOnlyTarget(Number(e.target.value))}>
                {[10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}問</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="ghost" onClick={() => setShowBrainOnlySetup(false)}>キャンセル</button>
          <button onClick={handleStart}>開始する</button>
        </div>
      </div>
    </Overlay>
  );
}
