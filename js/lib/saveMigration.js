// Save data migration utilities
// This module sanitizes older save data so the rest of the app can assume current schema.

/**
 * Migrate a raw parsed save object.
 */
export function migrateSaveData(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const rawObj = raw;

    // Basic shape defaults
    const player = rawObj.player && typeof rawObj.player === 'object' ? rawObj.player : {};
    const settings = rawObj.settings && typeof rawObj.settings === 'object' ? rawObj.settings : {};
    const dex = rawObj.dex && typeof rawObj.dex === 'object' ? rawObj.dex : {};

    // combo
    const n = Number(rawObj.combo);
    const combo = Number.isFinite(n) && n >= 0 ? n : 0;

    const meta = rawObj.meta && typeof rawObj.meta === 'object'
        ? (() => {
            const metaObj = rawObj.meta;
            return {
                saveDate: coerceNum(metaObj.saveDate, Date.now()),
                playTime: coerceNum(metaObj.playTime, 0),
                version: String(metaObj.version || '0')
            };
        })()
        : { saveDate: Date.now(), playTime: 0, version: '0' };

    return { player, settings, dex, combo, meta, mode: rawObj.mode };
}

function coerceNum(v, d) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
}
