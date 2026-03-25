import React from 'react';
import Image from 'next/image';
import BrainQuizPane from '../../components/BrainQuizPane';
import { Enemy } from '../../lib/gameTypes';
import { QuizBundle } from '../../lib/quiz/types';
import { Settings } from '../../lib/settings';
import { BrainOnlyMode } from '../types';

interface BrainOnlyStats {
  correct: number;
  total: number;
  streak: number;
  maxStreak: number;
  totalTime: number;
}

interface BrainOnlySceneViewProps {
  brainEnemy: Enemy | null;
  brainEnemyAnim: string | null;
  battlePanelBgStyle: React.CSSProperties;
  brainOnlyStats: BrainOnlyStats;
  brainOnlyQuiz: QuizBundle | null;
  handleBrainOnlyResultLocal: (ok: boolean, quiz: QuizBundle) => void;
  setScene: (scene: 'title' | 'map' | 'battle' | 'result' | 'brainOnly') => void;
  setBrainOnlyQuiz: (quiz: QuizBundle | ((prev: QuizBundle | null) => QuizBundle | null) | null) => void;
  settings: Settings;
  brainOnlyMode: BrainOnlyMode;
  setShowBrainOnlyResult: (show: boolean) => void;
  showBrainOnlyConfig: boolean;
}

/**
 * Calculate enemy image dimensions
 */
function getEnemyImageSize(renderSize: number = 160): number {
  return Math.round(renderSize * 1.3);
}

/**
 * Calculate accuracy percentage
 */
function getAccuracyPercent(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

/**
 * Calculate average time per question
 */
function getAverageTime(totalTime: number, total: number): string {
  return total > 0 ? (totalTime / total).toFixed(1) : '0';
}

/**
 * Enemy display panel component
 */
function EnemyDisplay({
  enemy,
  animClass,
  bgStyle,
  showBattleBg,
}: {
  enemy: Enemy | null;
  animClass: string | null;
  bgStyle: React.CSSProperties;
  showBattleBg: boolean;
}) {
  const imageSize = getEnemyImageSize(enemy?.renderSize);

  // Apply battle background only if setting is enabled
  const appliedStyle = showBattleBg ? bgStyle : {};

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 8 }}>
      <div className={`enemy ${animClass || ''}`} style={appliedStyle}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {enemy?.imageUrl && (
            <div
              className="enemyImage"
              style={{
                position: 'relative',
                width: imageSize,
                height: imageSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <Image
                src={enemy.imageUrl}
                alt={enemy.name}
                fill
                sizes={`${imageSize}px`}
                priority
                style={{
                  objectFit: 'contain',
                  imageRendering: 'auto',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                }}
              />
            </div>
          )}
          {!enemy?.imageUrl && (
            <div style={{ fontSize: '64px', textAlign: 'center' }}>{enemy?.emoji || '👾'}</div>
          )}
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, opacity: 0.9 }}>
            {enemy?.name || 'ならずもの'}
          </div>
          <div style={{ textAlign: 'center', marginTop: 4, fontSize: 12, opacity: 0.75 }}>
            問題に正解すると確実に撃破！
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Statistics panel component
 */
function StatsPanel({ stats }: { stats: BrainOnlyStats }) {
  return (
    <div className="brainOnlyHeader">
      <h2>🧠 脳トレモード</h2>
      <div className="brainStats">
        <div className="statItem">
          <span className="label">正解数：</span>
          <span className="value">
            {stats.correct}/{stats.total}
          </span>
        </div>
        <div className="statItem">
          <span className="label">正解率：</span>
          <span className="value">
            {getAccuracyPercent(stats.correct, stats.total)}%
          </span>
        </div>
        <div className="statItem">
          <span className="label">連続正解：</span>
          <span className="value streak">{stats.streak}</span>
        </div>
        <div className="statItem">
          <span className="label">最大連続：</span>
          <span className="value">{stats.maxStreak}</span>
        </div>
        <div className="statItem">
          <span className="label">平均時間：</span>
          <span className="value">
            {getAverageTime(stats.totalTime, stats.total)}秒
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Quiz panel component
 */
function QuizPanel({
  quiz,
  onResult,
  settings,
  settingsOpen,
}: {
  quiz: QuizBundle;
  onResult: (ok: boolean, quiz: QuizBundle) => void;
  settings: Settings;
  settingsOpen: boolean;
}) {
  return (
    <div className="brainQuizFixed">
      <BrainQuizPane
        quiz={quiz.quiz}
        timeMax={quiz.timeMax}
        timeStart={quiz.timeStart!}
        onTimeout={() => onResult(false, quiz)}
        onSubmit={(ok) => onResult(ok, quiz)}
        onGiveup={() => onResult(false, quiz)}
        settings={settings}
        settingsOpen={settingsOpen}
      />
    </div>
  );
}

/**
 * Action buttons component
 */
function ActionButtons({
  onExit,
  onExitWithResults,
  brainOnlyMode,
}: {
  onExit: () => void;
  onExitWithResults: () => void;
  brainOnlyMode: BrainOnlyMode;
}) {
  return (
    <div className="brainOnlyActions">
      {brainOnlyMode === 'endless' && (
        <button onClick={onExitWithResults}>
          終了して成績表を見る
        </button>
      )}
      <button className="ghost" onClick={onExit}>
        {brainOnlyMode === 'endless' ? 'タイトルへ戻る' : '終了してタイトルへ'}
      </button>
    </div>
  );
}

/**
 * Brain-Only mode scene view
 */
export default function BrainOnlySceneView({
  brainEnemy,
  brainEnemyAnim,
  battlePanelBgStyle,
  brainOnlyStats,
  brainOnlyQuiz,
  handleBrainOnlyResultLocal,
  setScene,
  setBrainOnlyQuiz,
  settings,
  brainOnlyMode,
  setShowBrainOnlyResult,
  showBrainOnlyConfig,
}: BrainOnlySceneViewProps) {
  const handleExit = () => {
    setScene('title');
    setBrainOnlyQuiz(null);
  };

  const handleExitWithResults = () => {
    setBrainOnlyQuiz(null);
    setShowBrainOnlyResult(true);
  };

  return (
    <div className="brainOnly" style={{}}>
      <EnemyDisplay
        enemy={brainEnemy}
        animClass={brainEnemyAnim}
        bgStyle={battlePanelBgStyle}
        showBattleBg={settings.brainOnly.battleBg}
      />
      <StatsPanel stats={brainOnlyStats} />
      {brainOnlyQuiz && (
        <QuizPanel
          quiz={brainOnlyQuiz}
          onResult={handleBrainOnlyResultLocal}
          settings={settings}
          settingsOpen={showBrainOnlyConfig}
        />
      )}
      <ActionButtons
        onExit={handleExit}
        onExitWithResults={handleExitWithResults}
        brainOnlyMode={brainOnlyMode}
      />
    </div>
  );
}
