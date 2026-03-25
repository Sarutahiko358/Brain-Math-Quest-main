import { useEffect } from 'react';
import { Settings } from '../../lib/settings';

/**
 * Syncs specific settings to localStorage on change
 *
 * Tracks changes to:
 * - Pad position and size percentage
 * - Status overlay position and size
 * - Tile size
 *
 * Saves to localStorage under key 'dq_live_settings_v2'
 */
export function useSettingsSync(settings: Settings): void {
  useEffect(() => {
    try {
      // 参照は必要なキーのみに限定し、オブジェクト全体をspreadしないことで
      // exhaustive-depsの警告(親オブジェクト参照)を回避
      const partial = {
        pad: {
          pos: settings.pad.pos,
          sizePct: settings.pad.sizePct,
        },
        statusOverlay: {
          pos: settings.statusOverlay.pos,
          size: settings.statusOverlay.size,
        },
        tileSize: settings.tileSize,
      } as const;
      localStorage.setItem('dq_live_settings_v2', JSON.stringify(partial));
    } catch (error) {
      console.error('Failed to save live settings:', error);
    }
  }, [settings.pad.pos, settings.pad.sizePct, settings.statusOverlay.pos, settings.statusOverlay.size, settings.tileSize]);
}
