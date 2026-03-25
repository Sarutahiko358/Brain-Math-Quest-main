import React from 'react';
import { QuizType } from '../../lib/quiz';

/**
 * QuizTypeSelector
 *
 * Reusable component for selecting quiz types with checkboxes.
 * Used in Settings overlay and Brain-Only mode configuration.
 */

interface QuizTypeSelectorProps {
  /**
   * Currently selected quiz types
   */
  selectedTypes: QuizType[];

  /**
   * Callback when quiz types change
   * @param types - New array of selected quiz types
   */
  onChange: (types: QuizType[]) => void;

  /**
   * Optional font size for labels (default: 13px)
   */
  fontSize?: number;

  /**
   * Hide the select all/deselect all buttons (default: false)
   */
  hideButtons?: boolean;
}

const QUIZ_TYPE_OPTIONS = [
  { type: 'SUM' as QuizType, label: '合計' },
  { type: 'MISSING' as QuizType, label: '穴埋め' },
  { type: 'COMPARE' as QuizType, label: '大小比較' },
  { type: 'PAIR' as QuizType, label: 'ペア' },
  { type: 'ORDER' as QuizType, label: '並び替え' },
  { type: 'MAX_MIN' as QuizType, label: '最大最小' },
  { type: 'PAIR_DIFF' as QuizType, label: 'ペア差分' },
  { type: 'MAX_MIN_EXPR' as QuizType, label: '式最大最小' },
  { type: 'ORDER_SUM' as QuizType, label: '合計順' },
  { type: 'COMPARE_EXPR' as QuizType, label: '式比較' },
  { type: 'RANGE_DIFF' as QuizType, label: '範囲差' },
  { type: 'MULTI_SELECT_MULTIPLES' as QuizType, label: '倍数選択' },
  { type: 'PRIME' as QuizType, label: '素数判定' },
  { type: 'SQUARE_ROOT' as QuizType, label: '平方数判定' },
  { type: 'FACTOR_PAIR' as QuizType, label: '因数ペア' },
  { type: 'ARITHMETIC_SEQUENCE' as QuizType, label: '等差数列' },
  { type: 'DIVISOR_COUNT' as QuizType, label: '約数の個数' },
  { type: 'COMMON_DIVISOR' as QuizType, label: '最大公約数' },
  { type: 'PATTERN_NEXT' as QuizType, label: '数列パターン' },
  { type: 'MODULO' as QuizType, label: '余りの計算' },
  { type: 'EQUATION_BALANCE' as QuizType, label: '等式のバランス' },
  { type: 'FRACTION_COMPARE' as QuizType, label: '分数の比較' },
];

export default function QuizTypeSelector({
  selectedTypes,
  onChange,
  fontSize = 13,
  hideButtons = false
}: QuizTypeSelectorProps) {
  const handleToggle = (type: QuizType, checked: boolean) => {
    const newTypes = checked
      ? [...selectedTypes, type]
      : selectedTypes.filter(t => t !== type);

    // Allow empty selection (will use all types)
    onChange(newTypes);
  };

  const handleSelectAll = () => {
    const allTypes = QUIZ_TYPE_OPTIONS.map(opt => opt.type);
    onChange(allTypes);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {!hideButtons && (
        <>
          <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{ fontSize: fontSize - 1, padding: '4px 8px' }}
            >
              一斉選択
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              style={{ fontSize: fontSize - 1, padding: '4px 8px' }}
            >
              一斉解除
            </button>
          </div>
          <small style={{ fontSize: fontSize - 2, color: '#999', marginBottom: '8px', display: 'block' }}>
            ※ 一つも選択が無い時には全てから出題されます
          </small>
        </>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {QUIZ_TYPE_OPTIONS.map(({ type, label }) => (
          <label
            key={type}
            className="row"
            style={{ fontSize, margin: 0 }}
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={(e) => handleToggle(type, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
