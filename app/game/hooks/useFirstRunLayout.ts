import { useEffect } from 'react';
import { Settings } from '../../lib/settings';
import { FIRST_RUN_LAYOUT_DEFAULTS, loadSave } from '../../lib/saveSystem';
import { computeFirstRunLayout, GRID_GAP_PX, GRID_PADDING_PX } from '../../lib/uiLayout';
import { COLS, ROWS } from '../../lib/world/areas';

interface UseFirstRunLayoutParams {
  setSettings: (updater: (prev: Settings) => Settings) => void;
}

/**
 * Initializes UI layout on first run based on device characteristics
 *
 * Features:
 * - Device-aware sizing (tiny/phone/tablet)
 * - Topbar height detection
 * - Optimal pad and status overlay positioning
 * - Avoids overlap between UI elements
 *
 * Only runs once per device, unless save data exists
 */
export function useFirstRunLayout({ setSettings }: UseFirstRunLayoutParams): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const done = localStorage.getItem(FIRST_RUN_LAYOUT_DEFAULTS);
      const hasSave = !!loadSave();
      if (done || hasSave) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isTiny = vw < 360 || vh < 520;
      const isPhone = vw < 520;
      const isTablet = vw >= 520 && vw < 1024;
      const topbarEl = document.querySelector('.topbar') as HTMLElement | null;
      const topbarH = topbarEl ? Math.ceil(topbarEl.getBoundingClientRect().height) : 52;

      const layout = computeFirstRunLayout({
        vw,
        vh,
        cols: COLS,
        rows: ROWS,
        gridGap: GRID_GAP_PX,
        gridPad: GRID_PADDING_PX,
        topbarH,
        isPhone,
        isTablet,
        isTiny,
      });

      setSettings((s) => ({
        ...s,
        pad: {
          ...s.pad,
          anchor: 'bl',
          sizePct: layout.pad.sizePct,
          size: layout.pad.sizePx,
          pos: { x: layout.pad.x, y: layout.pad.y },
          floating: true,
          collapsed: false,
        },
        statusOverlay: {
          ...s.statusOverlay,
          anchor: 'br',
          size: layout.status.size,
          pos: { x: layout.status.x, y: layout.status.y },
          floating: true,
          collapsed: false,
        },
        linkSizes: true,
        tileSize: layout.tileSize > 0 && Number.isFinite(layout.tileSize) ? layout.tileSize : s.tileSize,
      }));

      localStorage.setItem(FIRST_RUN_LAYOUT_DEFAULTS, '1');
    } catch (error) {
      console.error('Failed to initialize first-run layout:', error);
    }
  }, [setSettings]);
}
