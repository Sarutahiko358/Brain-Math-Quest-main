/**
 * Quiz UI Type Definitions and Type Guards
 *
 * This module provides comprehensive type safety for quiz UI components.
 * It includes type definitions, type guard functions, and utility helpers
 * to eliminate the need for 'any' type assertions throughout the codebase.
 *
 * @module uiTypes
 */

/**
 * Represents a single chip in a chip-based quiz UI.
 * Chips are interactive elements that users can select, order, or manipulate.
 */
export interface Chip {
  /** Unique identifier for the chip */
  id: number;
  /** Display text shown on the chip */
  text: string;
  /** Numerical value associated with the chip */
  value: number;
}

/**
 * UI type for simple input-based quizzes.
 * Used for quizzes where the user types their answer (e.g., SUM, MISSING, RANGE_DIFF).
 */
export interface InputUI {
  kind: 'input';
}

/**
 * UI type for binary choice quizzes.
 * Used for comparison quizzes where the user chooses between two options.
 */
export interface Choices2UI {
  kind: 'choices2';
  /** Left option text (e.g., "5 + 3") */
  left: string;
  /** Right option text (e.g., "2 × 4") */
  right: string;
}

/**
 * UI type for chip selection quizzes.
 * Used for quizzes where the user selects one or more chips from a set.
 * Examples: PAIR, MAX_MIN, EVEN_ODD, MEDIAN, PAIR_DIFF, MAX_MIN_EXPR.
 */
export interface ChipsUI {
  kind: 'chips';
  /** Array of chips available for selection */
  chips: Chip[];
}

/**
 * UI type for chip ordering quizzes.
 * Used for quizzes where the user must arrange chips in a specific order.
 * Examples: ORDER, ORDER_SUM.
 */
export interface ChipsOrderUI {
  kind: 'chips-order';
  /** Array of chips to be ordered */
  chips: Chip[];
}

/**
 * UI type for multiple chip selection quizzes.
 * Used for quizzes where the user must select multiple correct chips.
 * Examples: MULTI_SELECT_MULTIPLES.
 */
export interface ChipsMultiUI {
  kind: 'chips-multi';
  /** Array of chips available for multi-selection */
  chips: Chip[];
}

/**
 * Union type representing all possible quiz UI configurations.
 * This discriminated union enables type-safe access to UI properties.
 */
export type QuizUI = InputUI | Choices2UI | ChipsUI | ChipsOrderUI | ChipsMultiUI;

/**
 * Type representing all possible UI kind values.
 * Useful for exhaustive checks and switch statements.
 */
export type QuizUIKind = QuizUI['kind'];

// ============================================================================
// Type Guard Functions
// ============================================================================

/**
 * Type guard to check if a UI is an InputUI.
 *
 * @param ui - The UI to check
 * @returns True if the UI is InputUI, with type narrowing
 *
 * @example
 * ```typescript
 * if (isInputUI(quiz.ui)) {
 *   // quiz.ui is now narrowed to InputUI
 *   console.log('Input quiz');
 * }
 * ```
 */
export function isInputUI(ui: QuizUI): ui is InputUI {
  return ui.kind === 'input';
}

/**
 * Type guard to check if a UI is a Choices2UI.
 *
 * @param ui - The UI to check
 * @returns True if the UI is Choices2UI, with type narrowing
 *
 * @example
 * ```typescript
 * if (isChoices2UI(quiz.ui)) {
 *   // quiz.ui is now narrowed to Choices2UI
 *   console.log(`Left: ${quiz.ui.left}, Right: ${quiz.ui.right}`);
 * }
 * ```
 */
export function isChoices2UI(ui: QuizUI): ui is Choices2UI {
  return ui.kind === 'choices2';
}

/**
 * Type guard to check if a UI is a ChipsUI.
 *
 * @param ui - The UI to check
 * @returns True if the UI is ChipsUI, with type narrowing
 *
 * @example
 * ```typescript
 * if (isChipsUI(quiz.ui)) {
 *   // quiz.ui is now narrowed to ChipsUI
 *   quiz.ui.chips.forEach(chip => console.log(chip.text));
 * }
 * ```
 */
export function isChipsUI(ui: QuizUI): ui is ChipsUI {
  return ui.kind === 'chips';
}

/**
 * Type guard to check if a UI is a ChipsOrderUI.
 *
 * @param ui - The UI to check
 * @returns True if the UI is ChipsOrderUI, with type narrowing
 *
 * @example
 * ```typescript
 * if (isChipsOrderUI(quiz.ui)) {
 *   // quiz.ui is now narrowed to ChipsOrderUI
 *   console.log(`Order ${quiz.ui.chips.length} chips`);
 * }
 * ```
 */
export function isChipsOrderUI(ui: QuizUI): ui is ChipsOrderUI {
  return ui.kind === 'chips-order';
}

/**
 * Type guard to check if a UI is a ChipsMultiUI.
 *
 * @param ui - The UI to check
 * @returns True if the UI is ChipsMultiUI, with type narrowing
 *
 * @example
 * ```typescript
 * if (isChipsMultiUI(quiz.ui)) {
 *   // quiz.ui is now narrowed to ChipsMultiUI
 *   console.log(`Select multiple from ${quiz.ui.chips.length} chips`);
 * }
 * ```
 */
export function isChipsMultiUI(ui: QuizUI): ui is ChipsMultiUI {
  return ui.kind === 'chips-multi';
}

/**
 * Type guard to check if a UI has chips (ChipsUI, ChipsOrderUI, or ChipsMultiUI).
 * This is useful for operations that work with any chip-based UI.
 *
 * @param ui - The UI to check
 * @returns True if the UI contains chips, with type narrowing
 *
 * @example
 * ```typescript
 * if (hasChips(quiz.ui)) {
 *   // quiz.ui is narrowed to ChipsUI | ChipsOrderUI | ChipsMultiUI
 *   const chipCount = quiz.ui.chips.length;
 * }
 * ```
 */
export function hasChips(ui: QuizUI): ui is ChipsUI | ChipsOrderUI | ChipsMultiUI {
  return ui.kind === 'chips' || ui.kind === 'chips-order' || ui.kind === 'chips-multi';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely extracts chips from a quiz UI if it has chips.
 * Returns undefined if the UI doesn't contain chips.
 *
 * @param ui - The UI to extract chips from
 * @returns The chips array if available, undefined otherwise
 *
 * @example
 * ```typescript
 * const chips = getChips(quiz.ui);
 * if (chips) {
 *   console.log(`Found ${chips.length} chips`);
 * }
 * ```
 */
export function getChips(ui: QuizUI): Chip[] | undefined {
  return hasChips(ui) ? ui.chips : undefined;
}

/**
 * Safely extracts the choice options from a Choices2UI.
 * Returns undefined if the UI is not a Choices2UI.
 *
 * @param ui - The UI to extract choices from
 * @returns An object with left and right choices if available, undefined otherwise
 *
 * @example
 * ```typescript
 * const choices = getChoices(quiz.ui);
 * if (choices) {
 *   console.log(`Compare: ${choices.left} vs ${choices.right}`);
 * }
 * ```
 */
export function getChoices(ui: QuizUI): { left: string; right: string } | undefined {
  return isChoices2UI(ui) ? { left: ui.left, right: ui.right } : undefined;
}

/**
 * Gets the number of chips in a chip-based UI.
 * Returns 0 if the UI doesn't contain chips.
 *
 * @param ui - The UI to count chips from
 * @returns The number of chips, or 0 if not applicable
 *
 * @example
 * ```typescript
 * const count = getChipCount(quiz.ui);
 * console.log(`Quiz has ${count} chips`);
 * ```
 */
export function getChipCount(ui: QuizUI): number {
  const chips = getChips(ui);
  return chips ? chips.length : 0;
}

/**
 * Finds a chip by its ID in a chip-based UI.
 * Returns undefined if the chip is not found or if the UI doesn't contain chips.
 *
 * @param ui - The UI to search
 * @param chipId - The ID of the chip to find
 * @returns The chip if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const chip = findChipById(quiz.ui, 2);
 * if (chip) {
 *   console.log(`Chip 2: ${chip.text} = ${chip.value}`);
 * }
 * ```
 */
export function findChipById(ui: QuizUI, chipId: number): Chip | undefined {
  const chips = getChips(ui);
  return chips?.find(chip => chip.id === chipId);
}

/**
 * Extracts all chip values from a chip-based UI.
 * Returns an empty array if the UI doesn't contain chips.
 *
 * @param ui - The UI to extract values from
 * @returns Array of chip values, or empty array if not applicable
 *
 * @example
 * ```typescript
 * const values = getChipValues(quiz.ui);
 * const sum = values.reduce((a, b) => a + b, 0);
 * ```
 */
export function getChipValues(ui: QuizUI): number[] {
  const chips = getChips(ui);
  return chips ? chips.map(chip => chip.value) : [];
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

/**
 * All UI type exports in one place for convenient importing.
 */
export type {
  Chip as QuizChip,
};
