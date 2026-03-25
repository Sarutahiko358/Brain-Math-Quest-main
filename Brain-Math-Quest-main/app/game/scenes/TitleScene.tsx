import React from 'react';
import { Settings } from '../../lib/settings';
import { loadSave } from '../../lib/saveSystem';
import { Scene, GameMode } from '../../lib/gameTypes';
import { TITLE_DESCRIPTION_STYLE } from '../styles/constants';

interface TitleSceneProps {
  showConfirm: (message: string) => Promise<boolean>;
  resetAll: (areaId?: number, mode?: GameMode) => void;
  setGameMode: (mode: GameMode) => void;
  setScene: (scene: Scene) => void;
  addToast: (message: string) => void;
  setBrainOnlyDraft: (settings: Settings['brainOnly']) => void;
  setShowBrainOnlySetup: (show: boolean) => void;
  setShowSaveMenu: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowHowto: (show: boolean) => void;
  settings: Settings;
}

/**
 * タイトルシーン - ゲーム開始画面
 *
 * 純粋な表示コンポーネント。ステート管理はDQBrain側で行う。
 *
 * @param props - イベントハンドラーと設定
 */
export default function TitleScene({
  showConfirm,
  resetAll,
  setGameMode,
  setScene,
  addToast,
  setBrainOnlyDraft,
  setShowBrainOnlySetup,
  setShowSaveMenu,
  setShowSettings,
  setShowHowto,
  settings
}: TitleSceneProps) {
  return (
    <div className="title">
      <div className="logo">🧙‍♀️🧠 Brain Math Quest</div>
      <div className="subtitle">脳トレで戦う ちいさなRPG</div>
      <div className="titleBtns">
        <button onClick={async () => {
          let hasSave = false;
          try { hasSave = !!loadSave(); } catch { hasSave = false; }
          if (hasSave) {
            const ok = await showConfirm("新しくゲームを始めます。よろしいですか？");
            if (!ok) return;
          }
          resetAll(); // story
          setGameMode('story');
          setScene("map");
        }}>📖 物語を始める</button>
        {/* 物語モードの簡単な説明 */}
        <div style={{ ...TITLE_DESCRIPTION_STYLE, marginBottom: 10 }}>
          物語モード：エリアを進みボスを倒していくメインキャンペーンです。
        </div>
        {/* 数の異世界（ライブラリモード） */}
        <button
          onClick={async () => {
            let hasSave = false;
            try { hasSave = !!loadSave(); } catch { hasSave = false; }
            if (hasSave) {
              const ok = await showConfirm("数の異世界を新規開始します。よろしいですか？");
              if (!ok) return;
            }
            resetAll(undefined, 'library');
            setScene("map");
            addToast("📚 数の異世界への冒険が始まる！");
          }}
          title="数の異世界を始める"
        >
          📚 数の異世界
        </button>
        <div style={TITLE_DESCRIPTION_STYLE}>
          数の異世界：図書館から異世界に召喚され、テスト形式の戦いで世界を救う物語です。
        </div>
        {/* 無限の回廊（エンドレスモード） */}
        <button
          onClick={async () => {
            let hasSave = false;
            try { hasSave = !!loadSave(); } catch { hasSave = false; }
            if (hasSave) {
              const ok = await showConfirm("無限の回廊を新規開始します。よろしいですか？");
              if (!ok) return;
            }
            resetAll(undefined, 'endless');
            setScene("map");
            addToast("🌀 無限の回廊を開始！");
          }}
          title="無限の回廊を始める"
        >
          🌀 無限の回廊
        </button>
        <div style={TITLE_DESCRIPTION_STYLE}>
          無限の回廊：階層が進むほど敵が強くなるエンドレス挑戦モードです。
        </div>
        <button
          onClick={() => {
            setBrainOnlyDraft(settings.brainOnly);
            setShowBrainOnlySetup(true);
          }}
          title="脳トレのみを連続で楽しむ"
        >
          🧠 脳トレのみ
        </button>
        <div style={TITLE_DESCRIPTION_STYLE}>
          脳トレのみ：RPG要素なしで脳トレ問題に集中できるモードです。
        </div>
        <button onClick={() => setShowSaveMenu(true)}>セーブから再開</button>
        <button onClick={() => setShowSettings(true)}>設定</button>
        <button onClick={() => setShowHowto(true)}>操作説明</button>
      </div>
      <div className="tips">セーブはメニューから</div>
    </div>
  );
}
