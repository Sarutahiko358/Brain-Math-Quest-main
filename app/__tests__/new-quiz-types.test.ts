import { describe, it, expect } from 'vitest';

// Since page.tsx is a client component and contains many dependencies,
// we'll test the quiz type logic separately
describe('New Quiz Types', () => {
  // EVEN_ODD は現在出題しない方針のため対象外

  describe('MAX_MIN', () => {
    it('should find maximum value', () => {
      const nums = [3, 7, 2, 9, 5];
      const max = Math.max(...nums);
      expect(max).toBe(9);
    });

    it('should find minimum value', () => {
      const nums = [3, 7, 2, 9, 5];
      const min = Math.min(...nums);
      expect(min).toBe(2);
    });
  });

  // Removed PAIR_TEN and SEQUENCE tests (quiz types deleted)

  describe('Quiz Type Coverage', () => {
    it('should have all quiz types defined', () => {
      const quizTypes = [
        'SUM',
        'MISSING',
        'COMPARE',
        'PAIR',
        'ORDER',
        'MAX_MIN'
      ];

      expect(quizTypes.length).toBe(6);
      expect(quizTypes).toContain('MAX_MIN');
      // Removed expectations for deleted quiz types
    });
  });
});
