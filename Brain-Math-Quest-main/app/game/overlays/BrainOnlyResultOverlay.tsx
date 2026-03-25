import React from 'react';
import Overlay from '../../components/Overlay';
import { labelOfType } from '../../lib/quiz/labels';
import { timeColor } from '../../lib/ui/colors';
import { UI_COLORS } from '../../lib/ui/constants';
import { pickFastestAndSlowest, summarizeByType } from '../utils';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function BrainOnlyResultOverlay() {
  // Get state and actions from Context
  const {
    showBrainOnlyResult,
    scene,
    brainOnlyStats,
    brainOnlyMode,
    brainOnlyTarget,
    brainOnlyRecords
  } = useGameState();

  const {
    setShowBrainOnlyResult,
    setBrainOnlyStats,
    setBrainOnlyRecords,
    setShowBrainOnlySetup,
    setScene,
    setBrainOnlyQuiz,
    startBrainOnlyQuiz
  } = useGameActions();

  if (!showBrainOnlyResult || scene !== 'brainOnly') return null;

  return (
    <Overlay title="🧠 成績" onClose={() => setShowBrainOnlyResult(false)}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><strong>出題数</strong><div>{brainOnlyStats.total}{brainOnlyMode === 'fixed' ? ` / ${brainOnlyTarget}` : ''}</div></div>
          <div><strong>正解数</strong><div>{brainOnlyStats.correct}</div></div>
          <div><strong>正解率</strong><div>{brainOnlyStats.total > 0 ? Math.round(brainOnlyStats.correct / brainOnlyStats.total * 100) : 0}%</div></div>
          <div><strong>平均時間</strong><div>{brainOnlyStats.total > 0 ? (brainOnlyStats.totalTime / brainOnlyStats.total).toFixed(1) : 0}秒</div></div>
          <div><strong>最大連続正解</strong><div>{brainOnlyStats.maxStreak}</div></div>
        </div>
        {/* 最速/最遅 */}
        {brainOnlyRecords.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(() => {
              const result = pickFastestAndSlowest(brainOnlyRecords);
              if (!result) return null;
              const { fastest, slowest } = result;
              return (
                <>
                  <div><strong>最速</strong><div style={{ color: timeColor(fastest.time) }}>{fastest.time.toFixed(1)}秒 {fastest.ok ? '⭕' : '❌'} {labelOfType(fastest.type)}</div></div>
                  <div><strong>最遅</strong><div style={{ color: timeColor(slowest.time) }}>{slowest.time.toFixed(1)}秒 {slowest.ok ? '⭕' : '❌'} {labelOfType(slowest.type)}</div></div>
                </>
              );
            })()}
          </div>
        )}
        {/* タイプ別正解率 */}
        {brainOnlyRecords.length > 0 && (
          <div>
            <strong>タイプ別正解率</strong>
            <table style={{ width: '100%', fontSize: 12, marginTop: 6 }}>
              <thead>
                <tr><th style={{ textAlign: 'left' }}>タイプ</th><th>正解率</th><th>回数</th><th>平均秒</th></tr>
              </thead>
              <tbody>
                {summarizeByType(brainOnlyRecords).map(stat => (
                  <tr key={stat.type}>
                    <td>{labelOfType(stat.type)}</td>
                    <td>{stat.rate}%</td>
                    <td>{stat.count}</td>
                    <td style={{ color: timeColor(stat.avgTime) }}>{stat.avgTime.toFixed(1)}秒</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* ヒートマップ（5問単位のブロックで時間を色表現） */}
        {brainOnlyRecords.length > 0 && (
          <div>
            <strong>タイム・ヒートマップ</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10px, 1fr))', gap: 4, marginTop: 6 }}>
              {brainOnlyRecords.map((r, i) => (
                <div key={i} title={`#${i + 1} ${r.ok ? '⭕' : '❌'} ${r.time.toFixed(1)}秒 ${labelOfType(r.type)}`} style={{ height: 10, background: timeColor(r.time), borderRadius: 2, opacity: r.ok ? 1 : 0.5 }} />
              ))}
            </div>
          </div>
        )}
        {brainOnlyRecords.length > 0 && (
          <div style={{ maxHeight: 220, overflow: 'auto', border: `1px solid ${UI_COLORS.BLUE_BORDER}`, borderRadius: 10, padding: 8 }}>
            <table style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr><th style={{ textAlign: 'left' }}>#</th><th style={{ textAlign: 'left' }}>結果</th><th style={{ textAlign: 'left' }}>時間</th><th style={{ textAlign: 'left' }}>タイプ</th></tr>
              </thead>
              <tbody>
                {brainOnlyRecords.map((r, i) => (
                  <tr key={i}><td>{i + 1}</td><td>{r.ok ? '⭕' : '❌'}</td><td>{r.time.toFixed(1)}秒</td><td>{labelOfType(r.type)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="gBtns" style={{ justifyContent: 'end' }}>
          <button onClick={() => {
            setBrainOnlyStats({ total: 0, correct: 0, totalTime: 0, streak: 0, maxStreak: 0 });
            setBrainOnlyRecords([]);
            setShowBrainOnlyResult(false);
            setScene('brainOnly');
            startBrainOnlyQuiz();
          }}>もう一度</button>
          <button onClick={() => { setShowBrainOnlyResult(false); setShowBrainOnlySetup(true); }}>設定して再開</button>
          <button className="ghost" onClick={() => { setShowBrainOnlyResult(false); setScene('title'); setBrainOnlyQuiz(null); }}>タイトルへ</button>
        </div>
      </div>
    </Overlay>
  );
}
