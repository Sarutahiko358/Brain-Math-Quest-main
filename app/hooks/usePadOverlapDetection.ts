/**
 * usePadOverlapDetection Hook
 *
 * Detects visual overlap between status panel and D-pad overlay.
 * When overlapping, applies blur effect to prevent UI confusion.
 *
 * Extracted from DQBrain.tsx to reduce component complexity.
 */

import { useEffect, useState, RefObject } from 'react';

export interface PadOverlapDetectionOptions {
  /** Whether status panel is expanded */
  topStatusExpanded: boolean;
  /** Status panel detail element ref */
  topStatusDetailRef: RefObject<HTMLDivElement | null>;
  /** Pad wrapper element ref */
  padWrapRef: RefObject<HTMLDivElement | null>;
  /** Dependencies that affect layout: tile size, player stats */
  layoutDeps: unknown[];
}

/**
 * Detects overlap between status panel and D-pad overlay
 *
 * Algorithm:
 * 1. Get bounding rectangles of both elements
 * 2. Check for spatial overlap using AABB collision detection
 * 3. Update obscured state when overlap changes
 * 4. Re-check on window resize
 * 5. Debounce with setTimeout to avoid render thrashing
 *
 * @param options - Configuration options
 * @returns Whether the pad is currently obscured
 *
 * @example
 * ```tsx
 * const topStatusDetailRef = useRef<HTMLDivElement>(null);
 * const padWrapRef = useRef<HTMLDivElement>(null);
 *
 * const padObscured = usePadOverlapDetection({
 *   topStatusExpanded,
 *   topStatusDetailRef,
 *   padWrapRef,
 *   layoutDeps: [tileSize, player.hp, player.mp, player.lv]
 * });
 *
 * <div className={padObscured ? 'blurred' : ''}>
 *   <PadOverlay />
 * </div>
 * ```
 */
export function usePadOverlapDetection(options: PadOverlapDetectionOptions): boolean {
  const { topStatusExpanded, topStatusDetailRef, padWrapRef, layoutDeps } = options;
  const [padObscured, setPadObscured] = useState(false);

  useEffect(() => {
    /**
     * Check if two rectangles overlap using AABB collision detection
     * Returns true if rectangles intersect
     */
    function checkOverlap(): void {
      // No overlap when status is collapsed
      if (!topStatusExpanded) {
        setPadObscured(false);
        return;
      }

      // Get element bounds
      const statusRect = topStatusDetailRef.current?.getBoundingClientRect();
      const padRect = padWrapRef.current?.getBoundingClientRect();

      // Missing elements: no overlap
      if (!statusRect || !padRect) {
        setPadObscured(false);
        return;
      }

      // AABB collision detection
      // No overlap if:
      // - status is completely to the left of pad
      // - status is completely to the right of pad
      // - status is completely above pad
      // - status is completely below pad
      const noOverlap =
        statusRect.right < padRect.left ||
        statusRect.left > padRect.right ||
        statusRect.bottom < padRect.top ||
        statusRect.top > padRect.bottom;

      setPadObscured(!noOverlap);
    }

    // Initial check
    checkOverlap();

    // Re-check on window resize
    const onResize = () => checkOverlap();
    window.addEventListener('resize', onResize);

    // Debounced re-check to handle async layout changes
    const timeoutId = setTimeout(checkOverlap, 0);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timeoutId);
    };
    // layoutDeps is intentionally spread here to allow dynamic dependencies from caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topStatusExpanded, topStatusDetailRef, padWrapRef, ...layoutDeps]);

  return padObscured;
}
