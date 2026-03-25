import React, { useState } from 'react';
import Overlay from '../../components/Overlay';
import { getTeacherForArea } from '../../lib/teachersLibrary';
import { useGameState, useGameActions } from '../contexts/GameContext';

export default function TeacherOverlay() {
  // Get state and actions from Context
  const { showTeacher, player } = useGameState();
  const { setShowTeacher, setShowDojo } = useGameActions();

  const [selectedTeachingIndex, setSelectedTeachingIndex] = useState<number | null>(null);
  const currentArea = player.currentArea;
  const teacher = getTeacherForArea(currentArea);

  if (!showTeacher || !teacher) return null;

  // Show teaching detail view
  if (selectedTeachingIndex !== null) {
    const teaching = teacher.teachings[selectedTeachingIndex];
    return (
      <Overlay
        title={`📖 ${teaching.title}`}
        onClose={() => setSelectedTeachingIndex(null)}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(100,150,255,0.1)', borderRadius: '8px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
              {teaching.content}
            </p>
          </div>

          {teaching.examples && teaching.examples.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '15px', color: '#4a90e2' }}>
                📝 例題：
              </h4>
              <div style={{ padding: '16px', background: 'rgba(240,245,250,0.95)', borderRadius: '8px', border: '1px solid rgba(74,144,226,0.3)' }}>
                {teaching.examples.map((example, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: idx < teaching.examples!.length - 1 ? '12px' : '0',
                      padding: '10px 12px',
                      background: '#ffffff',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      color: '#2c3e50',
                      border: '1px solid rgba(0,0,0,0.1)',
                      lineHeight: '1.6'
                    }}
                  >
                    {example}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setSelectedTeachingIndex(null)} style={{ flex: 1 }}>
                ← 戻る
              </button>
              {selectedTeachingIndex < teacher.teachings.length - 1 && (
                <button
                  onClick={() => setSelectedTeachingIndex(selectedTeachingIndex + 1)}
                  style={{ flex: 1 }}
                >
                  次の教え →
                </button>
              )}
            </div>
            <button
              className="ghost"
              onClick={() => { setShowTeacher(false); setShowDojo(true); }}
              style={{ width: '100%' }}
            >
              🥋 道場入口に戻る
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  // Show teacher introduction and teaching list
  return (
    <Overlay
      title={`${teacher.emoji} ${teacher.name}`}
      onClose={() => setShowTeacher(false)}
    >
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(100,150,255,0.1)', borderRadius: '8px', borderLeft: '4px solid #4a90e2' }}>
          <p style={{ fontSize: '14px', marginBottom: '12px', lineHeight: '1.6' }}>
            <strong>専門分野：</strong>{teacher.specialization}
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.8', fontStyle: 'italic' }}>
            「{teacher.greeting}」
          </p>
        </div>

        <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>📚 学べる教え（タップして詳細を見る）：</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '16px' }}>
          {teacher.teachings.map((teaching, index) => (
            <button
              key={index}
              onClick={() => setSelectedTeachingIndex(index)}
              style={{
                textAlign: 'left',
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(100,150,255,0.1) 0%, rgba(100,200,255,0.1) 100%)',
                border: '1px solid rgba(74,144,226,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'normal',
                wordBreak: 'break-word'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#4a90e2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📖 {teaching.title}
                <span style={{ fontSize: '12px', marginLeft: 'auto', color: '#888' }}>›</span>
              </div>
              <div style={{ fontSize: '13px', opacity: 0.85, lineHeight: '1.5' }}>
                {teaching.content}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,215,0,0.1)', borderRadius: '8px', fontSize: '13px' }}>
          <p style={{ marginBottom: '4px' }}>💡 <strong>ヒント：</strong></p>
          <p style={{ lineHeight: '1.6', margin: 0 }}>
            各教えをタップして、計算のコツや解法を学びましょう。実戦で使える技術が身につきます！
          </p>
        </div>

        <button
          className="ghost"
          onClick={() => { setShowTeacher(false); setShowDojo(true); }}
          style={{ marginTop: '16px', width: '100%' }}
        >
          🥋 道場入口に戻る
        </button>
      </div>
    </Overlay>
  );
}
