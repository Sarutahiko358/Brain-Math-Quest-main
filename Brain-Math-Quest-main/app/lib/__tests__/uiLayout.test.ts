import { computeFirstRunLayout, GRID_GAP_PX, GRID_PADDING_PX } from '../../lib/uiLayout';

describe('Grid constants', () => {
  it('GRID_GAP_PX is defined correctly', () => {
    expect(GRID_GAP_PX).toBe(2);
  });

  it('GRID_PADDING_PX is defined correctly', () => {
    expect(GRID_PADDING_PX).toBe(8);
  });
});

describe('computeFirstRunLayout', () => {
  const base = { cols: 13, rows: 9, gridGap: 2, gridPad: 8, topbarH: 52 };

  it('phone viewport returns sane ranges', () => {
    const out = computeFirstRunLayout({ vw: 390, vh: 700, isPhone: true, isTablet: false, isTiny: false, ...base });
    expect(out.tileSize).toBeGreaterThanOrEqual(16);
    expect(out.tileSize).toBeLessThanOrEqual(64);
    expect(out.pad.sizePct).toBeGreaterThanOrEqual(60);
    expect(out.pad.sizePct).toBeLessThanOrEqual(160);
    expect(out.status.size).toBeGreaterThanOrEqual(60);
    expect(out.status.size).toBeLessThanOrEqual(160);
    expect(out.pad.x).toBeGreaterThanOrEqual(0);
    expect(out.pad.y).toBeGreaterThanOrEqual(0);
    expect(out.status.x).toBeGreaterThanOrEqual(0);
    expect(out.status.y).toBeGreaterThanOrEqual(0);
  });

  it('desktop viewport yields larger tiles than phone baseline', () => {
    const phone = computeFirstRunLayout({ vw: 390, vh: 700, isPhone: true, isTablet: false, isTiny: false, ...base });
    const desktop = computeFirstRunLayout({ vw: 1440, vh: 900, isPhone: false, isTablet: false, isTiny: false, ...base });
    expect(desktop.tileSize).toBeGreaterThanOrEqual(phone.tileSize);
  });
});
