// filepath: /home/runner/work/Brain-Math-Quest/Brain-Math-Quest/app/components/Overlay.tsx
"use client";

import React, { useEffect } from "react";
import { UI_TIMINGS } from "../lib/ui/constants";

export default function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // オーバーレイを開いた直後のクリック（Dパッド等のPointerUpに伴うクリック抜け）で
  // 即座に閉じないよう、短時間は背景クリックを無視するガードを入れる
  const [armed, setArmed] = React.useState(false);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", f);
    // OVERLAY_ARM_DELAY後に閉じ処理を有効化
    const t = setTimeout(() => setArmed(true), UI_TIMINGS.OVERLAY_ARM_DELAY);
    return () => {
      window.removeEventListener("keydown", f);
      clearTimeout(t);
    };
  }, [onClose]);
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
      onClick={(_e) => {
        // 開いた直後は無視
        if (!armed) return;
        onClose();
      }}
      onMouseDown={(e) => {
        // 開いた直後のmousedownも念のため無視
        if (!armed) e.stopPropagation();
      }}
    >
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panelHead">
          <h3 id="overlay-title">{title}</h3>
          <button className="ghost" onClick={onClose} aria-label="パネルを閉じる">
            ✕
          </button>
        </div>
        <div className="panelBody">{children}</div>
      </div>
    </div>
  );
}
