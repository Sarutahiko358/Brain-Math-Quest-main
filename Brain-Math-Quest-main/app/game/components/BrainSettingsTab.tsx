import React from 'react';
import QuizTypeSelector from './QuizTypeSelector';
import { Settings } from '../../lib/settings';
import { Scene, Difficulty } from '../../lib/gameTypes';

interface BrainSettingsTabProps {
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
  scene: Scene;
}

const HELP_TEXT_WITH_MARGIN_STYLE: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  marginLeft: '8px',
  fontSize: '0.85em',
  opacity: 0.7,
};

const HELP_TEXT_STYLE: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  fontSize: '0.85em',
  opacity: 0.7,
};

export default function BrainSettingsTab({
  settings,
  setSettings,
  scene,
}: BrainSettingsTabProps) {
  return (
    <div className="form">
      <h4>🧠 脳トレ設定</h4>
      <label>
        難易度：
        <select
          value={settings.difficulty}
          onChange={(e) => setSettings(s => ({ ...s, difficulty: e.target.value as Difficulty }))}
        >
          <option value="easy">easy（簡単）</option>
          <option value="normal">normal（普通）</option>
          <option value="hard">hard（難しい）</option>
        </select>
        <small>クイズの難度、数値範囲、制限時間に影響</small>
      </label>

      <div className="difficultyInfo">
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

      <div style={{ marginTop: '16px', marginBottom: '8px' }}>
        <strong>出題する問題の種類（物語モード・無限の回廊モード）：</strong>
        <small style={HELP_TEXT_WITH_MARGIN_STYLE}>
          チェックした問題タイプのみが出題されます（最低1つ選択してください）
        </small>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '14px', marginBottom: '16px' }}>
        <QuizTypeSelector
          selectedTypes={settings.quizTypes}
          onChange={(types) => setSettings(s => ({ ...s, quizTypes: types }))}
        />
      </div>

      <hr />
      <h4>📝 答え合わせ設定</h4>
      <label className="row">
        正解時に答えを表示：
        <input
          type="checkbox"
          checked={settings.answerReview.showOnCorrect}
          onChange={(e) => setSettings(s => ({ ...s, answerReview: { ...s.answerReview, showOnCorrect: e.target.checked } }))}
        />
        <small style={HELP_TEXT_STYLE}>問題に正解したときに答え合わせ画面を表示</small>
      </label>

      <label className="row">
        不正解時に答えを表示：
        <input
          type="checkbox"
          checked={settings.answerReview.showOnWrong}
          onChange={(e) => setSettings(s => ({ ...s, answerReview: { ...s.answerReview, showOnWrong: e.target.checked } }))}
        />
        <small style={HELP_TEXT_STYLE}>問題に不正解だったときに答え合わせ画面を表示（デフォルト：オン）</small>
      </label>

      {scene === 'brainOnly' && (
        <>
          <hr />
          <h4>🧠 脳トレのみモード設定</h4>
          <label className="row">
            バトル風背景を表示：
            <input
              type="checkbox"
              checked={settings.brainOnly.battleBg}
              onChange={(e) => setSettings(s => ({ ...s, brainOnly: { ...s.brainOnly, battleBg: e.target.checked } }))}
            />
            <small style={HELP_TEXT_STYLE}>雰囲気を出すためのバトル風背景表示</small>
          </label>
          <small style={HELP_TEXT_STYLE}>
            ※ 難易度と出題する問題の種類は、上記の脳トレ設定と共通です
          </small>
        </>
      )}
    </div>
  );
}
