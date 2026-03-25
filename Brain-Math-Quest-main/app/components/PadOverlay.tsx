"use client";
import React, { useRef } from "react";
import { UI_COLORS, UI_SIZES } from "../lib/ui/constants";
import { PadSettings } from "../lib/types/ui";
import { clamp } from "../lib/utils/math";
import { styleForPad } from "../lib/ui/padStyles";
import { usePadDrag } from "../hooks/usePadDrag";
import { usePadRepeat } from "../hooks/usePadRepeat";
import DirectionButton from "./DirectionButton";

export default function PadOverlay(props: {
  pad: PadSettings;
  onMove: (x: number, y: number) => void;
  onToggleCollapsed: () => void;
  onChangeSizePct: (nextPct: number) => void;
  tryMove: (dr: number, dc: number) => void;
  onOpenMenu: () => void;
  autoRepeatEnabled?: boolean;
}) {
  const { pad, onMove, onToggleCollapsed, onChangeSizePct, tryMove, onOpenMenu, autoRepeatEnabled } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { beginDrag, onMovePtr, endDrag } = usePadDrag(onMove);
  const { beginRepeat, clearRepeat } = usePadRepeat(tryMove, autoRepeatEnabled);

  const style = styleForPad(pad);
  if (!pad.show) return null;

  const preventDefault = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBeginDrag = (e: React.PointerEvent) => beginDrag(e, rootRef);

  const handleSizeDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeSizePct(clamp((pad.sizePct || 100) - UI_SIZES.PAD_SIZE_STEP, UI_SIZES.PAD_SIZE_MIN, UI_SIZES.PAD_SIZE_MAX));
  };

  const handleSizeIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeSizePct(clamp((pad.sizePct || 100) + UI_SIZES.PAD_SIZE_STEP, UI_SIZES.PAD_SIZE_MIN, UI_SIZES.PAD_SIZE_MAX));
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapsed();
  };

  return (
    <div
      ref={rootRef}
      className="padOverlay"
      style={style}
      onContextMenu={preventDefault}
      onDragStart={preventDefault}
      onPointerMove={onMovePtr}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="overlayHeader"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: UI_COLORS.DARK_BLUE_BG,
          border: `1px solid ${UI_COLORS.BLUE_BORDER}`,
          padding: '4px 6px',
          borderRadius: 8,
          marginBottom: 6,
          userSelect: 'none',
          justifyContent: 'flex-start'
        }}
      >
        <button
          aria-label="ドラッグで移動"
          title="ドラッグで移動"
          className="ghost"
          onPointerDown={handleBeginDrag}
          onContextMenu={preventDefault}
          onDragStart={preventDefault}
          onClick={preventDefault}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 14, opacity: 0.85 }}>⠿</span>
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="ghost"
          onPointerDown={preventDefault}
          onContextMenu={preventDefault}
          onDragStart={preventDefault}
          onClick={handleSizeDecrease}
          aria-label="小さく"
        >－</button>
        <button
          className="ghost"
          onPointerDown={preventDefault}
          onContextMenu={preventDefault}
          onDragStart={preventDefault}
          onClick={handleSizeIncrease}
          aria-label="大きく"
        >＋</button>
        <button
          className="ghost"
          onPointerDown={preventDefault}
          onDragStart={preventDefault}
          onContextMenu={preventDefault}
          onClick={handleToggle}
          aria-label={pad.collapsed ? '展開' : '折りたたみ'}
        >{pad.collapsed ? '▲' : '▼'}</button>
      </div>

      {!pad.collapsed && (
        <div
          className="pad"
          role="group"
          aria-label="方向キー操作パッド"
          style={{ '--pad': `${Math.round(UI_SIZES.PAD_BASE_SIZE * pad.sizePct / 100)}px`, opacity: pad.opacity } as React.CSSProperties}
        >
          <div />
          <DirectionButton
            label="▲"
            ariaLabel="上に移動"
            onClick={() => tryMove(-1, 0)}
            onRepeatStart={() => beginRepeat(-1, 0)}
            onRepeatEnd={clearRepeat}
          />
          <div />
          <DirectionButton
            label="◀"
            ariaLabel="左に移動"
            onClick={() => tryMove(0, -1)}
            onRepeatStart={() => beginRepeat(0, -1)}
            onRepeatEnd={clearRepeat}
          />
          <button
            className="center"
            onClick={onOpenMenu}
            onContextMenu={preventDefault}
            onDragStart={preventDefault}
            aria-label="メニューを開く"
          >☰</button>
          <DirectionButton
            label="▶"
            ariaLabel="右に移動"
            onClick={() => tryMove(0, 1)}
            onRepeatStart={() => beginRepeat(0, 1)}
            onRepeatEnd={clearRepeat}
          />
          <div />
          <DirectionButton
            label="▼"
            ariaLabel="下に移動"
            onClick={() => tryMove(1, 0)}
            onRepeatStart={() => beginRepeat(1, 0)}
            onRepeatEnd={clearRepeat}
          />
          <div />
        </div>
      )}
    </div>
  );
}
