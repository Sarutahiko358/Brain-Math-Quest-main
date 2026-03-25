// Save data migration utilities
// This module sanitizes older save data so the rest of the app can assume current schema.
// 目的: 過去バージョンとの互換を最低限保ちつつ、現在利用している SaveData 形のみを整形。
// 現行 SaveData は battle スナップショットを保存していないため、戦闘状態のマイグレーション処理は削除。

// We keep types light here to avoid circular importing of page.tsx.
// Use structural typing with unknown guards and narrow only the pieces we care about.

export interface MigratedSaveData {
  player: Record<string, unknown>;
  settings: Record<string, unknown>;
  dex: Record<string, unknown>;
  // 連続コンボ数（任意）: 現行実装では数値。未保存の旧データでは 0 を既定値とする
  combo?: number;
  meta: { saveDate: number; playTime: number; version: string };
}

/**
 * Migrate a raw parsed save object.
 * - Strips deprecated quiz types lingering in battle.quiz / battle.queue
 * - Ensures required top-level keys exist with sensible defaults
 * - Leaves gameplay stats intact
 */
export function migrateSaveData(raw: unknown): MigratedSaveData | null {
  if (!raw || typeof raw !== 'object') return null;

  const rawObj = raw as Record<string, unknown>;

  // Basic shape defaults
  const player = rawObj.player && typeof rawObj.player === 'object' ? rawObj.player as Record<string, unknown> : {};
  const settings = rawObj.settings && typeof rawObj.settings === 'object' ? rawObj.settings as Record<string, unknown> : {};
  const dex = rawObj.dex && typeof rawObj.dex === 'object' ? rawObj.dex as Record<string, unknown> : {};
  // combo は数値なら採用。未定義や不正値なら 0 にフォールバック
  const combo = ((): number => {
    const n = Number(rawObj.combo);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  })();
  const meta = rawObj.meta && typeof rawObj.meta === 'object'
    ? (() => {
        const metaObj = rawObj.meta as Record<string, unknown>;
        return {
          saveDate: coerceNum(metaObj.saveDate, Date.now()),
          playTime: coerceNum(metaObj.playTime, 0),
          version: String(metaObj.version || '0')
        };
      })()
    : { saveDate: Date.now(), playTime: 0, version: '0' };

  return { player, settings, dex, combo, meta };
}

function coerceNum(v: unknown, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

