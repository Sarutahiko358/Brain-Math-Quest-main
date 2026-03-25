import React, { useState } from 'react';
import Overlay from '../../components/Overlay';
import { T } from '../../lib/world/areas';
import { getAreaTrainingModes, AreaTrainingMode } from '../../lib/dojoLibrary';
import { getTeacherForArea } from '../../lib/teachersLibrary';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function DojoOverlay() {
  // Local state for library mode features
  const [areaTrainingMode, setAreaTrainingMode] = useState<AreaTrainingMode | null>(null);

  // Get state and actions from Context
  const { showDojo, gameMode, player } = useGameState();
  const { setShowDojo, setDojoMode, setSettings, startEncounter, setShowTeacher, setQuizTypesOverride, addToast } = useGameActions();

  const currentArea = player.currentArea;

  if (!showDojo) return null;

  // Library mode: Show area-specific training options
  if (gameMode === 'library' && currentArea !== undefined) {
    const trainingModes = getAreaTrainingModes(currentArea);
    const teacher = getTeacherForArea(currentArea);

    return (
      <Overlay title="🥋 道場（エリア特訓）" onClose={() => setShowDojo(false)}>
        <div className="dojo" style={{ padding: '20px' }}>
          {teacher && (
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(100,150,255,0.1)', borderRadius: '8px', borderLeft: '4px solid #4a90e2' }}>
              <p style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '24px', marginRight: '8px' }}>{teacher.emoji}</span>
                <strong>{teacher.name}</strong>
              </p>
              <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
                「{teacher.greeting}」
              </p>
              <button
                onClick={() => {
                  setShowDojo(false);
                  setShowTeacher(true);
                }}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                📖 {teacher.name}の教えを聞く
              </button>
            </div>
          )}

          <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>特訓コースを選択：</h4>
          <div className="gBtns" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {/* エリア特化型の特訓コース */}
            {trainingModes.map((mode, index) => (
              <button
                key={index}
                onClick={() => {
                  if (setAreaTrainingMode) setAreaTrainingMode(mode);
                  if (setQuizTypesOverride) setQuizTypesOverride(mode.quizTypes);
                  setDojoMode('random');
                  if (mode.difficulty) {
                    setSettings(s => ({ ...s, difficulty: mode.difficulty! }));
                  }
                  if (addToast) addToast(`特訓コース適用中: ${mode.name}`);
                  startEncounter(T.Grass);
                  setShowDojo(false);
                }}
                style={{ textAlign: 'left', padding: '12px' }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {mode.name}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>
                  {mode.description}
                </div>
              </button>
            ))}

            {/* 区切り線 */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', margin: '8px 0' }}></div>

            {/* ランダム出題モード */}
            <button
              onClick={() => {
                if (setAreaTrainingMode) setAreaTrainingMode(null);
                if (setQuizTypesOverride) setQuizTypesOverride(null);
                setDojoMode('random');
                startEncounter(T.Grass);
                setShowDojo(false);
              }}
              style={{ textAlign: 'left', padding: '12px', background: 'rgba(255,200,100,0.1)' }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                🎯 ランダム出題
              </div>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>
                全ての問題タイプからランダムに出題
              </div>
            </button>

            <button className="ghost" onClick={() => setShowDojo(false)}>
              出る
            </button>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,215,0,0.1)', borderRadius: '8px', fontSize: '13px' }}>
            <p style={{ marginBottom: '4px' }}>💡 <strong>特訓のコツ：</strong></p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
              <li>このエリアに特化した問題で集中的に練習できます</li>
              <li>師匠の教えを聞いて、計算のコツを学びましょう</li>
              <li>連続で正解すると経験値ボーナスが得られます</li>
            </ul>
          </div>
        </div>
      </Overlay>
    );
  }

  // Normal/Endless mode: Show traditional dojo options
  return (
    <Overlay title="🥋 道場（コンボ練習）" onClose={() => setShowDojo(false)}>
      <div className="dojo" style={{ padding: '20px' }}>
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          道場へようこそ！ここでは好きな問題タイプを選んで、コンボを伸ばす練習ができます。
          <br />
          このエリアの敵と連続で戦い、スキルを磨きましょう！
        </p>
        <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>問題タイプを選択：</h4>
        <div className="gBtns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={() => {
            // 道場：計算（足し算・引き算）モード
            setDojoMode('arithmetic');
            setSettings(s => ({ ...s, difficulty: 'easy' }));
            startEncounter(T.Grass);
            setShowDojo(false);
          }}>
            🔢 計算問題（足し算・引き算）
          </button>
          <button onClick={() => {
            // 道場：ランダム
            setDojoMode('random');
            startEncounter(T.Grass);
            setShowDojo(false);
          }}>
            🎯 ランダム出題
          </button>
          <button onClick={() => {
            // 道場：高難度
            setDojoMode('hard');
            setSettings(s => ({ ...s, difficulty: 'hard' }));
            startEncounter(T.Grass);
            setShowDojo(false);
          }}>
            💪 高難度モード
          </button>
          <button className="ghost" onClick={() => setShowDojo(false)}>
            出る
          </button>
        </div>
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,215,0,0.1)', borderRadius: '8px', fontSize: '13px' }}>
          <p style={{ marginBottom: '4px' }}>💡 <strong>コンボのコツ：</strong></p>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>連続で正解すると、コンボが増えて経験値ボーナスが得られます</li>
            <li>一度でも間違えるとコンボがリセットされます</li>
            <li>高コンボを目指して、集中力を高めましょう！</li>
          </ul>
        </div>
      </div>
    </Overlay>
  );
}
