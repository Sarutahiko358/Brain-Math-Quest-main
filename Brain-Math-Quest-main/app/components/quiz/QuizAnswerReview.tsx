import React from 'react';
import { Quiz, Scratch } from '../../lib/quiz/types';

interface QuizAnswerReviewProps {
  quiz: Quiz;
  scratch: Scratch;
  isCorrect: boolean;
  onContinue: () => void;
}

/**
 * Format user's answer based on scratch state and quiz type
 */
function formatUserAnswer(quiz: Quiz, scratch: Scratch): string {
  // For chips-based UI (selection)
  if (quiz.ui.kind === 'chips' || quiz.ui.kind === 'chips-multi') {
    if (scratch.sel.length === 0) return '（未選択）';
    return scratch.sel.map(chip => chip.text).join(', ');
  }

  // For chips-order UI
  if (quiz.ui.kind === 'chips-order') {
    if (scratch.seq.length === 0) return '（未選択）';
    const chips = quiz.ui.chips;
    return scratch.seq.map(val => {
      const chip = chips.find(c => c.value === val);
      return chip ? chip.text : String(val);
    }).join(' → ');
  }

  // For choices2 UI
  if (quiz.ui.kind === 'choices2') {
    if (scratch.sel.length === 0) return '（未選択）';
    return scratch.sel[0].text;
  }

  // For input UI
  if (quiz.ui.kind === 'input') {
    return scratch.val || '（未入力）';
  }

  return '（回答なし）';
}

/**
 * Format correct answer based on quiz type
 */
function formatCorrectAnswer(quiz: Quiz): string {
  // For ORDER type, parse JSON array
  if (quiz.type === 'ORDER' || quiz.type === 'ORDER_SUM') {
    try {
      const arr = JSON.parse(quiz.answer);
      if (Array.isArray(arr)) {
        return arr.join(' → ');
      }
    } catch {
      // Fall through to default
    }
  }

  // For chips-based types with multiple correct patterns
  if (quiz.type === 'PAIR' || quiz.type === 'FACTOR_PAIR' || quiz.type === 'PAIR_DIFF') {
    // Extract pattern count from prompt if available
    const match = quiz.prompt.match(/（(\d+)通り）/);
    if (match) {
      return `複数の正解パターンがあります (${match[1]}通り)`;
    }
  }

  return quiz.answer;
}

/**
 * Generate example/explanation for the answer
 */
function formatAnswerExample(quiz: Quiz): string | null {
  // DIVISOR_COUNT: Show list of divisors
  if (quiz.type === 'DIVISOR_COUNT') {
    const match = quiz.prompt.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const divisors: number[] = [];
      for (let i = 1; i <= num; i++) {
        if (num % i === 0) {
          divisors.push(i);
        }
      }
      return `${num}の約数は、${divisors.length}個あり、それは${divisors.join('・')}です`;
    }
  }

  // PRIME: Explain why it's prime or not
  if (quiz.type === 'PRIME') {
    const match = quiz.prompt.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);

      if (num <= 1) {
        return `${num}は1以下なので素数ではありません`;
      }
      if (num === 2) {
        return `2は唯一の偶数の素数です`;
      }
      if (num % 2 === 0) {
        return `${num}は2で割り切れるので素数ではありません`;
      }

      // Check for divisors
      const divisors: number[] = [];
      for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) {
          divisors.push(i);
        }
      }

      if (divisors.length > 0) {
        return `${num}は${divisors[0]}で割り切れるので素数ではありません`;
      }
      return `${num}は1と自分自身以外で割り切れないので素数です`;
    }
  }

  // SQUARE_ROOT: Explain why it's a perfect square or not
  if (quiz.type === 'SQUARE_ROOT') {
    const match = quiz.prompt.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const sqrt = Math.sqrt(num);
      const isSquare = Number.isInteger(sqrt);

      if (isSquare) {
        return `${num} = ${sqrt} × ${sqrt} なので平方数です`;
      } else {
        const lower = Math.floor(sqrt);
        const upper = lower + 1;
        return `${lower}² = ${lower * lower}、${upper}² = ${upper * upper} なので、${num}は平方数ではありません`;
      }
    }
  }

  // COMMON_DIVISOR: Show GCD calculation
  if (quiz.type === 'COMMON_DIVISOR') {
    const matches = quiz.prompt.match(/(\d+)/g);
    if (matches && matches.length >= 2) {
      const a = parseInt(matches[0], 10);
      const b = parseInt(matches[1], 10);

      // Find all divisors of both numbers
      const divisorsA: number[] = [];
      const divisorsB: number[] = [];

      for (let i = 1; i <= a; i++) {
        if (a % i === 0) divisorsA.push(i);
      }
      for (let i = 1; i <= b; i++) {
        if (b % i === 0) divisorsB.push(i);
      }

      const commonDivisors = divisorsA.filter(d => divisorsB.includes(d));
      return `${a}と${b}の公約数は ${commonDivisors.join('・')} で、最大公約数は ${Math.max(...commonDivisors)} です`;
    }
  }

  // FACTOR_PAIR: Show factor pairs
  if (quiz.type === 'FACTOR_PAIR') {
    const match = quiz.prompt.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const pairs: string[] = [];

      for (let i = 1; i * i <= num; i++) {
        if (num % i === 0) {
          pairs.push(`${i}×${num / i}`);
        }
      }

      return `${num}の因数ペアは ${pairs.join('、')} です`;
    }
  }

  // MODULO: Show division example
  if (quiz.type === 'MODULO') {
    const matches = quiz.prompt.match(/(\d+)/g);
    if (matches && matches.length >= 2) {
      const dividend = parseInt(matches[0], 10);
      const divisor = parseInt(matches[1], 10);
      const quotient = Math.floor(dividend / divisor);
      const remainder = dividend % divisor;

      return `${dividend} ÷ ${divisor} = ${quotient} 余り ${remainder}`;
    }
  }

  // MAX_MIN_EXPR: Show all expressions with values
  if (quiz.type === 'MAX_MIN_EXPR') {
    if (quiz.ui.kind === 'chips' && quiz.ui.chips) {
      const expressions = quiz.ui.chips.map(chip => `${chip.text} = ${chip.value}`).join('\n');
      const answer = quiz.ui.chips.find(chip => String(chip.value) === quiz.answer);
      const answerText = answer ? `正解: ${answer.text} = ${answer.value}` : '';
      return `${expressions}\n\n${answerText}`;
    }
  }

  // ORDER_SUM: Show all expressions with values in correct order
  if (quiz.type === 'ORDER_SUM') {
    if (quiz.ui.kind === 'chips-order' && quiz.ui.chips) {
      const sorted = quiz.ui.chips
        .slice()
        .sort((a, b) => a.value - b.value)
        .map(chip => `${chip.text} = ${chip.value}`)
        .join('\n');
      return `正しい順序（小さい順）:\n${sorted}`;
    }
  }

  // RANGE_DIFF: Show max, min, and difference
  if (quiz.type === 'RANGE_DIFF') {
    if (quiz.expr) {
      const matches = quiz.expr.match(/\d+/g);
      if (matches) {
        const nums = matches.map(n => parseInt(n, 10));
        const max = Math.max(...nums);
        const min = Math.min(...nums);
        const diff = max - min;
        return `最大値: ${max}\n最小値: ${min}\n最大値 - 最小値 = ${max} - ${min} = ${diff}`;
      }
    }
  }

  // PATTERN_NEXT: Explain the pattern
  if (quiz.type === 'PATTERN_NEXT') {
    if (quiz.expr) {
      const matches = quiz.expr.match(/\d+/g);
      if (matches) {
        const nums = matches.map(n => parseInt(n, 10));
        if (nums.length >= 2) {
          const diff = nums[1] - nums[0];
          const allSameDiff = nums.every((n, i) => i === 0 || n - nums[i - 1] === diff);

          if (allSameDiff) {
            return `等差数列です（公差: ${diff > 0 ? '+' : ''}${diff}）`;
          } else {
            // Check for other patterns
            const ratios = nums.slice(1).map((n, i) => n / nums[i]);
            const allSameRatio = ratios.every((r, i) => i === 0 || Math.abs(r - ratios[0]) < 0.01);

            if (allSameRatio && ratios[0]) {
              return `等比数列です（公比: ×${ratios[0]}）`;
            }
          }
        }
      }
    }
  }

  return null;
}

export default function QuizAnswerReview({
  quiz,
  scratch,
  isCorrect,
  onContinue
}: QuizAnswerReviewProps) {
  const userAnswer = formatUserAnswer(quiz, scratch);
  const correctAnswer = formatCorrectAnswer(quiz);
  const example = formatAnswerExample(quiz);

  return (
    <div className="answerReviewOverlay">
      <div className="answerReviewDialog">
        <div className={`answerReviewResult ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? '⭕ 正解！' : '❌ 不正解'}
        </div>

        <div className="answerReviewContent">
          <div className="answerReviewSection">
            <h4>問題</h4>
            <p>{quiz.prompt}</p>
            {quiz.expr && <p className="expr">{quiz.expr}</p>}
          </div>

          <div className="answerReviewSection">
            <h4>あなたの回答</h4>
            <p className="userAnswer">{userAnswer}</p>
          </div>

          <div className="answerReviewSection">
            <h4>正解</h4>
            <p className="correctAnswer">{correctAnswer}</p>
          </div>

          {example && (
            <div className="answerReviewSection">
              <h4>解説</h4>
              <p className="example">{example}</p>
            </div>
          )}

          {quiz.note && (
            <div className="answerReviewSection">
              <p className="note">{quiz.note}</p>
            </div>
          )}
        </div>

        <div className="answerReviewActions">
          <button onClick={onContinue} className="primary" autoFocus>
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
