/**
 * Quiz UI Type Definitions and Type Guards
 * 
 * This module provides comprehensive type safety for quiz UI components.
 * It includes type definitions, type guard functions, and utility helpers
 * to eliminate the need for 'any' type assertions throughout the codebase.
 */

// ============================================================================
// Type Guard Functions
// ============================================================================

/**
 * Type guard to check if a UI is an InputUI.
 */
export function isInputUI(ui) {
    return ui.kind === 'input';
}

/**
 * Type guard to check if a UI is a Choices2UI.
 */
export function isChoices2UI(ui) {
    return ui.kind === 'choices2';
}

/**
 * Type guard to check if a UI is a ChipsUI.
 */
export function isChipsUI(ui) {
    return ui.kind === 'chips';
}

/**
 * Type guard to check if a UI is a ChipsOrderUI.
 */
export function isChipsOrderUI(ui) {
    return ui.kind === 'chips-order';
}

/**
 * Type guard to check if a UI is a ChipsMultiUI.
 */
export function isChipsMultiUI(ui) {
    return ui.kind === 'chips-multi';
}

/**
 * Type guard to check if a UI has chips (ChipsUI, ChipsOrderUI, or ChipsMultiUI).
 */
export function hasChips(ui) {
    return ui.kind === 'chips' || ui.kind === 'chips-order' || ui.kind === 'chips-multi';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely extracts chips from a quiz UI if it has chips.
 */
export function getChips(ui) {
    return hasChips(ui) ? ui.chips : undefined;
}

/**
 * Safely extracts the choice options from a Choices2UI.
 */
export function getChoices(ui) {
    return isChoices2UI(ui) ? { left: ui.left, right: ui.right } : undefined;
}

/**
 * Gets the number of chips in a chip-based UI.
 */
export function getChipCount(ui) {
    const chips = getChips(ui);
    return chips ? chips.length : 0;
}

/**
 * Finds a chip by its ID in a chip-based UI.
 */
export function findChipById(ui, chipId) {
    const chips = getChips(ui);
    return chips?.find(chip => chip.id === chipId);
}

/**
 * Extracts all chip values from a chip-based UI.
 */
export function getChipValues(ui) {
    const chips = getChips(ui);
    return chips ? chips.map(chip => chip.value) : [];
}
