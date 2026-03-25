/**
 * Device capabilities handler
 */

/**
 * Trigger device vibration if the Vibration API is available
 */
export function vibrate(ms) {
    if (typeof navigator !== "undefined" && 'vibrate' in navigator) {
        const vibrateFn = navigator.vibrate;
        if (vibrateFn) {
            navigator.vibrate(ms);
        }
    }
}
