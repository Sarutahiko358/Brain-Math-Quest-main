/**
 * UI Component Types
 *
 * Centralized type definitions for UI components
 * Improves type reusability and maintainability
 */

/**
 * D-Pad anchor positions
 */
export type PadAnchor =
  | "tl"  // Top Left
  | "tr"  // Top Right
  | "bl"  // Bottom Left
  | "br"  // Bottom Right
  | "tc"  // Top Center
  | "bc"  // Bottom Center
  | "tcl" // Top Center Left
  | "tcr" // Top Center Right
  | "bcl" // Bottom Center Left
  | "bcr"; // Bottom Center Right

/**
 * D-Pad settings configuration
 */
export type PadSettings = {
  /** Whether the pad is visible */
  show: boolean;

  /** Anchor position for the pad */
  anchor: PadAnchor;

  /** Base size of the pad */
  size: number;

  /** Size as percentage (for scaling) */
  sizePct: number;

  /** Opacity level (0-1) */
  opacity: number;

  /** Custom position (overrides anchor) */
  pos?: { x: number; y: number };

  /** Whether the pad is collapsed */
  collapsed?: boolean;

  /** Whether the pad is floating (position: fixed) */
  floating?: boolean;
};
