import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Global test hygiene: clear all timers after each spec to avoid lingering intervals/timeouts
// that can delay coverage aggregation and give the impression of a hang.
afterEach(() => {
    try {
        vi.clearAllTimers();
    } catch {
        // ignore
    }
});
