/**
 * Tests for TimerManager module
 *
 * Tests timer management functionality including setTimeout, setInterval,
 * and cleanup to prevent memory leaks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimerManager } from '../timerManager';

describe('TimerManager', () => {
  let manager: TimerManager;

  beforeEach(() => {
    manager = new TimerManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    manager.clearAll();
    vi.restoreAllMocks();
  });

  describe('setTimeout', () => {
    it('should execute callback after specified delay', () => {
      const callback = vi.fn();
      manager.setTimeout(callback, 100);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should track multiple timeouts', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      manager.setTimeout(callback1, 100);
      manager.setTimeout(callback2, 200);
      manager.setTimeout(callback3, 300);

      const { timeouts } = manager.getActiveTimerCount();
      expect(timeouts).toBe(3);
    });

    it('should remove timeout from tracking after execution', () => {
      const callback = vi.fn();
      manager.setTimeout(callback, 100);

      expect(manager.getActiveTimerCount().timeouts).toBe(1);

      vi.advanceTimersByTime(100);

      expect(manager.getActiveTimerCount().timeouts).toBe(0);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return timer ID', () => {
      const callback = vi.fn();
      const id = manager.setTimeout(callback, 100);

      expect(id).toBeDefined();
      // In test environment, timer IDs may be objects or numbers
      expect(id).not.toBeNull();
    });
  });

  describe('setInterval', () => {
    it('should execute callback repeatedly at specified interval', () => {
      const callback = vi.fn();
      manager.setInterval(callback, 100);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should track multiple intervals', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.setInterval(callback1, 100);
      manager.setInterval(callback2, 200);

      const { intervals } = manager.getActiveTimerCount();
      expect(intervals).toBe(2);
    });

    it('should return timer ID', () => {
      const callback = vi.fn();
      const id = manager.setInterval(callback, 100);

      expect(id).toBeDefined();
      // In test environment, timer IDs may be objects or numbers
      expect(id).not.toBeNull();
    });
  });

  describe('clearTimeout', () => {
    it('should cancel scheduled timeout', () => {
      const callback = vi.fn();
      const id = manager.setTimeout(callback, 100);

      manager.clearTimeout(id);

      vi.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should remove timeout from tracking', () => {
      const callback = vi.fn();
      const id = manager.setTimeout(callback, 100);

      expect(manager.getActiveTimerCount().timeouts).toBe(1);

      manager.clearTimeout(id);

      expect(manager.getActiveTimerCount().timeouts).toBe(0);
    });

    it('should handle clearing already executed timeout', () => {
      const callback = vi.fn();
      const id = manager.setTimeout(callback, 100);

      vi.advanceTimersByTime(100);

      // Should not throw
      expect(() => manager.clearTimeout(id)).not.toThrow();
      expect(manager.getActiveTimerCount().timeouts).toBe(0);
    });
  });

  describe('clearInterval', () => {
    it('should stop interval from executing', () => {
      const callback = vi.fn();
      const id = manager.setInterval(callback, 100);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      manager.clearInterval(id);

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(1); // Should not increase
    });

    it('should remove interval from tracking', () => {
      const callback = vi.fn();
      const id = manager.setInterval(callback, 100);

      expect(manager.getActiveTimerCount().intervals).toBe(1);

      manager.clearInterval(id);

      expect(manager.getActiveTimerCount().intervals).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all timeouts', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      manager.setTimeout(callback1, 100);
      manager.setTimeout(callback2, 200);
      manager.setTimeout(callback3, 300);

      expect(manager.getActiveTimerCount().timeouts).toBe(3);

      manager.clearAll();

      expect(manager.getActiveTimerCount().timeouts).toBe(0);

      vi.advanceTimersByTime(300);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });

    it('should clear all intervals', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.setInterval(callback1, 100);
      manager.setInterval(callback2, 200);

      expect(manager.getActiveTimerCount().intervals).toBe(2);

      manager.clearAll();

      expect(manager.getActiveTimerCount().intervals).toBe(0);

      vi.advanceTimersByTime(300);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should clear both timeouts and intervals', () => {
      const timeoutCallback = vi.fn();
      const intervalCallback = vi.fn();

      manager.setTimeout(timeoutCallback, 100);
      manager.setInterval(intervalCallback, 100);

      expect(manager.getActiveTimerCount().timeouts).toBe(1);
      expect(manager.getActiveTimerCount().intervals).toBe(1);

      manager.clearAll();

      expect(manager.getActiveTimerCount().timeouts).toBe(0);
      expect(manager.getActiveTimerCount().intervals).toBe(0);

      vi.advanceTimersByTime(200);

      expect(timeoutCallback).not.toHaveBeenCalled();
      expect(intervalCallback).not.toHaveBeenCalled();
    });
  });

  describe('getActiveTimerCount', () => {
    it('should return correct count of active timers', () => {
      expect(manager.getActiveTimerCount()).toEqual({ timeouts: 0, intervals: 0 });

      manager.setTimeout(() => {}, 100);
      manager.setTimeout(() => {}, 200);
      expect(manager.getActiveTimerCount()).toEqual({ timeouts: 2, intervals: 0 });

      manager.setInterval(() => {}, 100);
      expect(manager.getActiveTimerCount()).toEqual({ timeouts: 2, intervals: 1 });
    });

    it('should update count as timers are cleared', () => {
      const id1 = manager.setTimeout(() => {}, 100);
      const id2 = manager.setTimeout(() => {}, 200);
      const id3 = manager.setInterval(() => {}, 100);

      expect(manager.getActiveTimerCount()).toEqual({ timeouts: 2, intervals: 1 });

      manager.clearTimeout(id1);
      expect(manager.getActiveTimerCount()).toEqual({ timeouts: 1, intervals: 1 });

      manager.clearInterval(id3);
      expect(manager.getActiveTimerCount()).toEqual({ timeouts: 1, intervals: 0 });

      manager.clearTimeout(id2);
      expect(manager.getActiveTimerCount()).toEqual({ timeouts: 0, intervals: 0 });
    });

    it('should update count as timeouts execute', () => {
      manager.setTimeout(() => {}, 100);
      manager.setTimeout(() => {}, 200);

      expect(manager.getActiveTimerCount().timeouts).toBe(2);

      vi.advanceTimersByTime(100);
      expect(manager.getActiveTimerCount().timeouts).toBe(1);

      vi.advanceTimersByTime(100);
      expect(manager.getActiveTimerCount().timeouts).toBe(0);
    });
  });

  describe('memory leak prevention', () => {
    it('should not accumulate timers indefinitely', () => {
      // Create and execute many timeouts
      for (let i = 0; i < 100; i++) {
        manager.setTimeout(() => {}, 10);
      }

      expect(manager.getActiveTimerCount().timeouts).toBe(100);

      vi.advanceTimersByTime(10);

      // All should be cleared after execution
      expect(manager.getActiveTimerCount().timeouts).toBe(0);
    });

    it('should allow reuse after clearAll', () => {
      const callback = vi.fn();

      manager.setTimeout(callback, 100);
      manager.setInterval(() => {}, 100);

      manager.clearAll();

      // Should work normally after clearAll
      manager.setTimeout(callback, 100);
      expect(manager.getActiveTimerCount().timeouts).toBe(1);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
