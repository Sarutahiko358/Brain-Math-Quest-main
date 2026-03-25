import React from 'react';
import PadOverlay from '../../components/PadOverlay';
import { Settings } from '../../lib/settings';

interface MapPadOverlayProps {
  settings: Settings;
  padWrapRef: React.RefObject<HTMLDivElement | null>;
  padObscuredComputed: boolean;
  padHasDragged: boolean;
  scene: 'title' | 'map' | 'battle' | 'result' | 'brainOnly';
  setPadHasDragged: (value: boolean) => void;
  setSettings: (updater: (prev: Settings) => Settings) => void;
  tryMove: (dr: number, dc: number) => void;
  setShowMenu: (show: boolean) => void;
}

/**
 * Map scene pad overlay with floating/non-floating modes
 */
export default function MapPadOverlay({
  settings,
  padWrapRef,
  padObscuredComputed,
  padHasDragged,
  scene,
  setPadHasDragged,
  setSettings,
  tryMove,
  setShowMenu,
}: MapPadOverlayProps) {
  if (!settings.pad.show) return null;

  const isFloating = padHasDragged ? settings.pad.floating : false;

  const handleMove = (x: number, y: number) => {
    setPadHasDragged(true);
    setSettings(s => ({ ...s, pad: { ...s.pad, pos: { x, y }, floating: true } }));
  };

  const handleToggleCollapsed = () => {
    setSettings(s => ({ ...s, pad: { ...s.pad, collapsed: !s.pad.collapsed } }));
  };

  const handleChangeSizePct = (nextPct: number) => {
    setSettings(s => ({ ...s, pad: { ...s.pad, sizePct: nextPct, size: Math.round(56 * nextPct / 100) } }));
  };

  return (
    <div ref={padWrapRef as React.Ref<HTMLDivElement>} className={padObscuredComputed ? 'padBlurWrap blurred' : 'padBlurWrap'}>
      {isFloating ? (
        // 浮動時はラッパー（transformあり）を介さず直接配置
        <PadOverlay
          pad={{ ...settings.pad, floating: true }}
          onMove={handleMove}
          onToggleCollapsed={handleToggleCollapsed}
          onChangeSizePct={handleChangeSizePct}
          tryMove={tryMove}
          onOpenMenu={() => setShowMenu(true)}
          autoRepeatEnabled={scene === "map"}
        />
      ) : (
        // 非浮動時のみ中央寄せラッパーを使用
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', top: 12 }}>
          <PadOverlay
            pad={{ ...settings.pad, floating: false }}
            onMove={handleMove}
            onToggleCollapsed={handleToggleCollapsed}
            onChangeSizePct={handleChangeSizePct}
            tryMove={tryMove}
            onOpenMenu={() => setShowMenu(true)}
            autoRepeatEnabled={scene === "map"}
          />
        </div>
      )}
    </div>
  );
}
