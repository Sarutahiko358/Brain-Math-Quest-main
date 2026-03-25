/**
 * Timer Manager
 *
 * Manages setTimeout/setInterval calls to prevent memory leaks.
 * All timers are tracked and can be cleared when component unmounts.
 */

export class TimerManager {
  private timeoutIds: Set<ReturnType<typeof setTimeout>> = new Set();
  private intervalIds: Set<ReturnType<typeof setInterval>> = new Set();

  /**
   * Wrapper for setTimeout that tracks the timer ID
   */
  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this.timeoutIds.delete(id);
      callback();
    }, delay);
    this.timeoutIds.add(id);
    return id;
  }

  /**
   * Wrapper for setInterval that tracks the timer ID
   */
  setInterval(callback: () => void, delay: number): ReturnType<typeof setInterval> {
    const id = setInterval(callback, delay);
    this.intervalIds.add(id);
    return id;
  }

  /**
   * Clear a specific timeout
   */
  clearTimeout(id: ReturnType<typeof setTimeout>): void {
    clearTimeout(id);
    this.timeoutIds.delete(id);
  }

  /**
   * Clear a specific interval
   */
  clearInterval(id: ReturnType<typeof setInterval>): void {
    clearInterval(id);
    this.intervalIds.delete(id);
  }

  /**
   * Clear all tracked timers
   */
  clearAll(): void {
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.intervalIds.forEach(id => clearInterval(id));
    this.timeoutIds.clear();
    this.intervalIds.clear();
  }

  /**
   * Get the count of active timers (for debugging)
   */
  getActiveTimerCount(): { timeouts: number; intervals: number } {
    return {
      timeouts: this.timeoutIds.size,
      intervals: this.intervalIds.size
    };
  }
}
