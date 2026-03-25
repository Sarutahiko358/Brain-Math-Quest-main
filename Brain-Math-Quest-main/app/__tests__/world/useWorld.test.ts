import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorld } from '../../hooks/useWorld';
import { Player } from '../../lib/gameTypes';

describe('useWorld hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWorld());
    expect(result.current.state.currentArea).toBe(1);
    expect(result.current.state.playerPos).toEqual({ r: 2, c: 2 });
  });

  it('should sync from player state', () => {
    const { result } = renderHook(() => useWorld());
    const mockPlayer = {
      currentArea: 3,
      pos: { r: 5, c: 7 }
    } as Player;

    act(() => {
      result.current.syncFromPlayer(mockPlayer);
    });

    expect(result.current.state.currentArea).toBe(3);
    expect(result.current.state.playerPos).toEqual({ r: 5, c: 7 });
  });

  it('should update position when synced multiple times', () => {
    const { result } = renderHook(() => useWorld());
    
    act(() => {
      result.current.syncFromPlayer({ currentArea: 2, pos: { r: 3, c: 4 } } as Player);
    });
    expect(result.current.state.playerPos).toEqual({ r: 3, c: 4 });

    act(() => {
      result.current.syncFromPlayer({ currentArea: 2, pos: { r: 4, c: 5 } } as Player);
    });
    expect(result.current.state.playerPos).toEqual({ r: 4, c: 5 });
  });
});
