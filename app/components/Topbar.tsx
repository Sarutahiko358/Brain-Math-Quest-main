"use client";
import React from "react";

type Scene = "title" | "map" | "battle" | "result" | "brainOnly";
type GameMode = 'story' | 'endless' | 'library';

export default function Topbar({
  scene,
  gameMode,
  currentFloor,
  onOpenMenu,
  onOpenStageSelect,
  onGoTitle,
  onOpenHowto,
  onOpenSettings,
  showConfirm,
}: {
  scene: Scene;
  gameMode?: GameMode;
  currentFloor?: number;
  onOpenMenu: () => void;
  onOpenStageSelect: () => void;
  onGoTitle: () => void;
  onOpenHowto: () => void;
  onOpenSettings: () => void;
  showConfirm?: (message: string) => Promise<boolean>;
}) {
  const handleGoTitle = async () => {
    if (scene !== "title") {
      const ok = showConfirm 
        ? await showConfirm("タイトルに戻りますか？未保存の進行は失われる可能性があります。")
        : confirm("タイトルに戻りますか？未保存の進行は失われる可能性があります。");
      if (!ok) return;
    }
    onGoTitle();
  };

  return (
    <div className="topbar" role="banner">
      <div className="brand">{scene === "title" ? '🧠 Brain Math Quest' : ''}</div>
      <div className="stat" role="navigation" aria-label="トップナビゲーション">
        {(scene === "map" || scene === "battle") && (
          <>
            <button className="zabuton" onClick={onOpenMenu} aria-label="メニューを開く">メニュー</button>
            <button className="zabuton" onClick={onOpenStageSelect} aria-label="ステージ選択を開く">
              {gameMode === 'endless' ? `第${currentFloor || 1}階層` : 'ステージ'}
            </button>
            <button className="zabuton" onClick={handleGoTitle} aria-label="タイトル画面に戻る">タイトルへ</button>
          </>
        )}
        {scene === "brainOnly" && (
          <button className="zabuton" onClick={handleGoTitle} aria-label="タイトル画面に戻る">タイトルへ</button>
        )}
        <button className="zabuton" onClick={onOpenHowto} aria-label="操作方法を開く">操作</button>
        <button className="zabuton" onClick={onOpenSettings} aria-label="設定を開く">設定</button>
      </div>
      <div aria-hidden="true" />
    </div>
  );
}
