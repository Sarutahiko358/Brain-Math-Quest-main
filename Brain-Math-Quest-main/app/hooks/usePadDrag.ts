import { useCallback, useRef } from 'react';
import { clamp } from '../lib/utils/math';

export function usePadDrag(onMove: (x: number, y: number) => void) {
  const dragRef = useRef<{
    id: number;
    dx: number;
    dy: number;
    maxX: number;
    maxY: number;
  } | null>(null);

  const beginDrag = useCallback((e: React.PointerEvent, rootRef: React.RefObject<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const el = rootRef.current ?? (e.currentTarget as HTMLElement).closest('.padOverlay') as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    const vw = typeof window !== 'undefined' ? window.innerWidth : rect.right + 1;
    const vh = typeof window !== 'undefined' ? window.innerHeight : rect.bottom + 1;
    const maxX = Math.max(0, vw - rect.width);
    const maxY = Math.max(0, vh - rect.height);
    dragRef.current = {
      id: e.pointerId,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      maxX,
      maxY,
    };
    if (el && 'setPointerCapture' in el) {
      (el as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, []);

  const onMovePtr = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const x = clamp(e.clientX - d.dx, 0, d.maxX);
    const y = clamp(e.clientY - d.dy, 0, d.maxY);
    onMove(x, y);
  }, [onMove]);

  const endDrag = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
  }, []);

  return { beginDrag, onMovePtr, endDrag };
}
