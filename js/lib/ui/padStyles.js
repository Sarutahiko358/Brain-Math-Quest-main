/**
 * Styles for D-Pad positioning
 */

import { PAD_LAYOUT } from './constants/pad.js';

const ANCHOR_STYLES = {
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

function applyCustomPosition(style, pos) {
    return {
        ...style,
        left: pos.x,
        top: pos.y,
        transform: 'none',
        right: 'auto',
        bottom: 'auto',
    };
}

function applyAnchorPosition(style, anchor) {
    const anchorStyle = ANCHOR_STYLES[anchor];
    return anchorStyle ? { ...style, ...anchorStyle } : style;
}

export function styleForPad(pad) {
    const baseStyle = {
        position: pad.floating ? "fixed" : "static",
        zIndex: PAD_LAYOUT.Z_INDEX
    };

    if (!pad.floating) return baseStyle;

    if (pad.pos) {
        return applyCustomPosition(baseStyle, pad.pos);
    }

    return applyAnchorPosition(baseStyle, pad.anchor);
}
