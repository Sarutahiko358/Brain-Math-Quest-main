// filepath: /home/user/Brain-Math-Quest/app/lib/ui/padStyles.ts
import React from "react";
import { PadSettings } from "../types/ui";
import { PAD_LAYOUT } from "../../components/constants/pad";

/**
 * Anchor position styles mapping
 * Maps anchor positions to CSS styles
 */
const ANCHOR_STYLES: Record<string, React.CSSProperties> = {
  tl: { left: PAD_LAYOUT.EDGE_MARGIN, top: PAD_LAYOUT.EDGE_MARGIN },
  tr: { right: PAD_LAYOUT.EDGE_MARGIN, top: PAD_LAYOUT.EDGE_MARGIN },
  bl: { left: PAD_LAYOUT.EDGE_MARGIN, bottom: PAD_LAYOUT.EDGE_MARGIN },
  br: { right: PAD_LAYOUT.EDGE_MARGIN, bottom: PAD_LAYOUT.EDGE_MARGIN },
  tc: { left: PAD_LAYOUT.CENTER_OFFSET, transform: "translateX(-50%)", top: PAD_LAYOUT.EDGE_MARGIN },
  bc: { left: PAD_LAYOUT.CENTER_OFFSET, transform: "translateX(-50%)", bottom: PAD_LAYOUT.EDGE_MARGIN },
  tcl: { left: PAD_LAYOUT.OFF_CENTER_OFFSET, transform: "translateX(-50%)", top: PAD_LAYOUT.EDGE_MARGIN },
  tcr: { right: PAD_LAYOUT.OFF_CENTER_OFFSET, transform: "translateX(50%)", top: PAD_LAYOUT.EDGE_MARGIN },
  bcl: { left: PAD_LAYOUT.OFF_CENTER_OFFSET, transform: "translateX(-50%)", bottom: PAD_LAYOUT.EDGE_MARGIN },
  bcr: { right: PAD_LAYOUT.OFF_CENTER_OFFSET, transform: "translateX(50%)", bottom: PAD_LAYOUT.EDGE_MARGIN },
};

/**
 * Apply custom position styles
 */
function applyCustomPosition(
  style: React.CSSProperties,
  pos: { x: number; y: number }
): React.CSSProperties {
  return {
    ...style,
    left: pos.x,
    top: pos.y,
    transform: 'none',
    right: 'auto',
    bottom: 'auto',
  };
}

/**
 * Apply anchor-based position styles
 */
function applyAnchorPosition(
  style: React.CSSProperties,
  anchor: string
): React.CSSProperties {
  const anchorStyle = ANCHOR_STYLES[anchor];
  return anchorStyle ? { ...style, ...anchorStyle } : style;
}

/**
 * Calculate CSS styles for pad positioning based on settings
 * Supports floating mode with anchor positions or custom x/y coordinates
 */
export function styleForPad(pad: PadSettings): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    position: pad.floating ? "fixed" : "static",
    zIndex: PAD_LAYOUT.Z_INDEX
  };

  // Non-floating mode: return base style only
  if (!pad.floating) return baseStyle;

  // Custom position takes precedence
  if (pad.pos) {
    return applyCustomPosition(baseStyle, pad.pos);
  }

  // Anchor-based positioning
  return applyAnchorPosition(baseStyle, pad.anchor);
}
