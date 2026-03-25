"use client";

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Grid visual metrics (keep in sync with CSS .grid)
export const GRID_GAP_PX = 2;      // .grid gap
export const GRID_PADDING_PX = 8;  // .grid padding (each side)

export type FirstRunParams = {
  vw: number;
  vh: number;
  cols: number;
  rows: number;
  gridGap: number;
  gridPad: number;
  topbarH: number;
  isPhone: boolean;
  isTablet: boolean;
  isTiny: boolean;
};

export type FirstRunLayout = {
  pad: { sizePct: number; sizePx: number; x: number; y: number };
  status: { size: number; x: number; y: number };
  tileSize: number;
};

/**
 * Helper: Calculate initial tile size based on device and viewport
 */
function calculateInitialTileSize(p: FirstRunParams): number {
  const { vw, vh, isPhone, isTablet, cols, rows, gridGap, gridPad, topbarH } = p;

  const verticalUiReserve = isPhone ? 160 : 120;
  const horizontalPadding = 24;
  const availW = Math.max(200, vw - horizontalPadding);
  const availH = Math.max(200, vh - topbarH - verticalUiReserve);
  const gridFixedW = gridGap * (cols - 1) + gridPad * 2;
  const gridFixedH = gridGap * (rows - 1) + gridPad * 2;
  const maxTileByW = Math.floor((availW - gridFixedW) / cols);
  const maxTileByH = Math.floor((availH - gridFixedH) / rows);
  const deviceTargetTile = isPhone ? 24 : isTablet ? 34 : 46;
  const fitMax = Math.min(maxTileByW, maxTileByH);

  return clamp(Math.min(deviceTargetTile, fitMax), 16, 64);
}

/**
 * Helper: Calculate grid boundaries
 */
function calculateGridBounds(p: FirstRunParams, tileSize: number) {
  const { vw, cols, rows, gridGap, gridPad, topbarH } = p;

  const gridW = cols * tileSize + gridGap * (cols - 1) + gridPad * 2;
  const gridH = rows * tileSize + gridGap * (rows - 1) + gridPad * 2;
  const gridTop = topbarH + 56; // topbar + UIスケーラー分の余白
  const gridBottom = gridTop + gridH;
  const gridLeft = Math.max(0, Math.floor((vw - gridW) / 2)); // フィールドは中央寄せ想定
  const gridRight = gridLeft + gridW;

  return { gridW, gridH, gridTop, gridBottom, gridLeft, gridRight, gridPad };
}

/**
 * Helper: Calculate initial pad size
 */
function calculatePadSize(p: FirstRunParams) {
  const { isTiny, isPhone, isTablet } = p;

  const padPctBase = isTiny ? 86 : isPhone ? 98 : isTablet ? 105 : 122;
  const padSizePct = Math.max(60, Math.min(160, padPctBase));
  const padPx = Math.round(56 * padSizePct / 100);
  const padBox = (n: number) => 3*n + 26; // 3*pad + gaps(12) + padding(12) + border(2)
  const padW = padBox(padPx);
  const padH = padBox(padPx);

  return { padSizePct, padPx, padW, padH, padBox };
}

/**
 * Helper: Calculate status overlay size
 */
function calculateStatusSize(p: FirstRunParams, padSizePct: number) {
  const { isTiny, isPhone, isTablet } = p;

  const baseSize = isTiny ? 88 : isPhone ? 94 : isTablet ? 100 : 112;
  const baseStatusW = 260;
  const baseStatusH = 170;
  const padFactor = padSizePct / 100;

  const computeStatus = (stSize: number) => {
    const baseScale = (stSize || 100) / 100;
    const scale = baseScale * padFactor;
    const w = Math.round(baseStatusW * scale);
    const h = Math.round(baseStatusH * scale);
    return { w, h };
  };

  return { baseSize, computeStatus };
}

/**
 * Helper: Try to fit elements horizontally below grid
 */
function tryHorizontalLayout(
  p: FirstRunParams,
  gridBounds: ReturnType<typeof calculateGridBounds>,
  padDims: { padW: number; padH: number; padSizePct: number; padBox: (n: number) => number },
  statusSizes: { baseSize: number; computeStatus: (s: number) => { w: number; h: number } }
) {
  const { vh } = p;
  const { gridW, gridBottom, gridLeft, gridRight, gridPad } = gridBounds;
  const { padW, padH } = padDims;

  let statusSize = statusSizes.baseSize;
  let { w: statusW, h: statusH } = statusSizes.computeStatus(statusSize);

  const spacing = 16;
  const margin = 12;
  const innerMargin = Math.max(12, Math.min(24, Math.floor(gridPad) + 8));
  const belowGridY = gridBottom + spacing;

  const padX = gridLeft + innerMargin;
  const padY = belowGridY;
  const statusX = Math.max(gridLeft + innerMargin, gridRight - innerMargin - statusW);
  const statusY = belowGridY;

  const horizontalFitInGrid = (padW + spacing + statusW + innerMargin * 2) <= gridW;
  let verticalFit = (belowGridY + Math.max(padH, statusH) + margin) <= vh;

  // Try to shrink to fit vertically while maintaining horizontal layout
  const minStatusSize = 80;
  if ((!verticalFit) && (statusSize > minStatusSize || padDims.padSizePct > 70)) {
    const result = shrinkToFitVertical(
      statusSize,
      padDims,
      belowGridY,
      vh,
      margin,
      minStatusSize,
      statusSizes.computeStatus
    );
    statusSize = result.statusSize;
    statusW = result.statusW;
    statusH = result.statusH;
    verticalFit = result.verticalFit;
  }

  const horizontalOK = horizontalFitInGrid && verticalFit;

  return {
    horizontalOK,
    padX,
    padY,
    statusX,
    statusY,
    statusSize,
    statusW,
    statusH,
    belowGridY,
    spacing,
    margin,
    innerMargin,
    gridLeft,
    gridRight
  };
}

/**
 * Helper: Shrink elements to fit vertically
 */
function shrinkToFitVertical(
  initialStatusSize: number,
  padDims: { padW: number; padH: number; padSizePct: number; padBox: (n: number) => number },
  belowGridY: number,
  vh: number,
  margin: number,
  minStatusSize: number,
  computeStatus: (s: number) => { w: number; h: number }
) {
  let statusSize = initialStatusSize;
  let { w: statusW, h: statusH } = computeStatus(statusSize);
  let { padW, padH } = padDims;
  const padSizePct = padDims.padSizePct;
  let currentPadPct = padSizePct;
  let verticalFit = false;
  let guard = 0;

  while (!verticalFit && guard < 8) {
    if (statusSize > minStatusSize) {
      statusSize -= 4;
      const dim = computeStatus(statusSize);
      statusW = dim.w;
      statusH = dim.h;
    }
    if (!verticalFit && currentPadPct > 70) {
      currentPadPct -= 4;
      const newPadPx = Math.round(56 * currentPadPct / 100);
      padW = padDims.padBox(newPadPx);
      padH = padDims.padBox(newPadPx);
    }
    verticalFit = (belowGridY + Math.max(padH, statusH) + margin) <= vh;
    guard++;
  }

  return { statusSize, statusW, statusH, padW, padH, verticalFit };
}

/**
 * Helper: Layout elements vertically when horizontal doesn't fit
 */
function layoutVertical(
  p: FirstRunParams,
  gridBounds: ReturnType<typeof calculateGridBounds>,
  padDims: { padW: number; padH: number; padSizePct: number; padBox: (n: number) => number },
  belowGridY: number,
  spacing: number,
  margin: number,
  innerMargin: number,
  statusSize: number,
  computeStatus: (s: number) => { w: number; h: number }
) {
  const { vh } = p;
  const { gridLeft, gridRight } = gridBounds;
  let { padW, padH } = padDims;

  const padY = belowGridY;
  let statusY = padY + padH + spacing;
  const padX = gridLeft + innerMargin;

  let currentStatusSize = statusSize;
  let { w: statusW, h: statusH } = computeStatus(currentStatusSize);
  let statusX = Math.max(gridLeft + innerMargin, gridRight - innerMargin - statusW);

  const minStatusSize = 80;
  let guard = 0;
  while ((statusY + statusH + margin) > vh && guard < 10) {
    if (currentStatusSize > minStatusSize) {
      currentStatusSize -= 4;
      const dim = computeStatus(currentStatusSize);
      statusW = dim.w;
      statusH = dim.h;
    } else if (padH > 120) {
      const shrinkPadPx = Math.max(40, Math.round(padH / 3) - 4);
      padW = padDims.padBox(shrinkPadPx);
      padH = padDims.padBox(shrinkPadPx);
    } else {
      break;
    }
    statusX = Math.max(gridLeft + innerMargin, gridRight - innerMargin - statusW);
    statusY = padY + padH + spacing;
    guard++;
  }

  // Force position up if still overflowing
  if ((statusY + statusH + margin) > vh) {
    statusY = Math.max(margin, vh - (statusH + margin));
  }

  return { padX, padY, statusX, statusY, statusSize: currentStatusSize, statusW, statusH, padW, padH };
}

export function computeFirstRunLayout(p: FirstRunParams): FirstRunLayout {
  const { isPhone, isTablet } = p;

  // Calculate tile size and grid bounds
  const initialTile = calculateInitialTileSize(p);
  const gridBounds = calculateGridBounds(p, initialTile);

  // Calculate pad and status sizes
  const padSizes = calculatePadSize(p);
  const statusCalc = calculateStatusSize(p, padSizes.padSizePct);

  // Try horizontal layout first
  const horizontal = tryHorizontalLayout(p, gridBounds, padSizes, statusCalc);

  let finalLayout;
  if (!horizontal.horizontalOK) {
    // Fall back to vertical layout
    finalLayout = layoutVertical(
      p,
      gridBounds,
      padSizes,
      horizontal.belowGridY,
      horizontal.spacing,
      horizontal.margin,
      horizontal.innerMargin,
      horizontal.statusSize,
      statusCalc.computeStatus
    );
  } else {
    finalLayout = {
      padX: horizontal.padX,
      padY: horizontal.padY,
      statusX: horizontal.statusX,
      statusY: horizontal.statusY,
      statusSize: horizontal.statusSize,
      statusW: horizontal.statusW,
      statusH: horizontal.statusH,
      padW: padSizes.padW,
      padH: padSizes.padH
    };
  }

  return {
    pad: {
      sizePct: clamp(Math.round((finalLayout.padW - 26) / 3 / 56 * 100), 60, 160),
      sizePx: Math.round((finalLayout.padW - 26) / 3),
      x: finalLayout.padX,
      y: finalLayout.padY
    },
    status: {
      size: Math.max(60, Math.min(160, isPhone ? 92 : isTablet ? 100 : 108, finalLayout.statusSize)),
      x: finalLayout.statusX,
      y: finalLayout.statusY
    },
    tileSize: initialTile,
  };
}
