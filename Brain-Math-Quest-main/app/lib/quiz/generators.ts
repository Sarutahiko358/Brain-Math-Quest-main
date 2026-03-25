/**
 * Quiz Generators Module
 *
 * Provides pure functions for generating various quiz types.
 * Each generator creates a Quiz object with appropriate UI configuration,
 * answer validation, and difficulty settings.
 *
 * Quiz Types:
 * - SUM: Addition problems
 * - MISSING: Fill-in-the-blank arithmetic
 * - COMPARE: Comparison of expressions
 * - PAIR: Select two numbers that sum to target
 * - ORDER: Sort numbers in ascending/descending order
 * - EVEN_ODD: Identify even or odd numbers
 * - MAX_MIN: Find maximum or minimum value
 * - And many more specialized types
 *
 * All generators are pure functions and use seeded RNG for deterministic results.
 */

import { R, pick, shuffle } from '../rng';
import { QuizType, Quiz, quizBaseByDifficulty } from './types';
import { isHardQuiz } from './difficulty';
import type { Difficulty } from '../gameTypes';

// Individual quiz generators (pure)
export function genSUM(range: number, opts?: { maxTerms?: number }): Quiz {
  const maxTerms = Math.max(2, Math.min(5, opts?.maxTerms ?? 5));
  const n = R(2, maxTerms);
  const nums = Array.from({ length: n }, () => R(1, range));
  const ans = nums.reduce((s, v) => s + v, 0);
  return { type: 'SUM', prompt: '合計を答えてください', expr: `${nums.join(' + ')} = ?`, ui: { kind: 'input' }, answer: String(ans), note: `項目${n}個 / 範囲1-${range}` };
}
export function genMISSING(range: number, allowMul: boolean): Quiz {
  if (allowMul && Math.random() < 0.5) {
    const a = R(2, Math.max(3, Math.floor(range / 3)));
    const b = R(2, Math.max(3, Math.floor(range / 3)));
    const s = a * b;
    return { type: 'MISSING', prompt: '？に入る数は？', expr: `？ × ${a} = ${s}`, ui: { kind: 'input' }, answer: String(b), note: '整数のみ' };
  } else {
    const x = R(1, range - 2);
    const y = R(1, range - x);
    const s = x + y;
    return { type: 'MISSING', prompt: '？に入る数は？', expr: `${x} + ？ = ${s}`, ui: { kind: 'input' }, answer: String(y), note: `範囲1-${range}` };
  }
}
export function genCOMPARE(range: number, allowMul: boolean): Quiz {
  const mk = () => {
    const ops = allowMul ? ['+', '-', '×'] : ['+', '-'];
    let a = R(1, range), b = R(1, range);
    const op = pick(ops as string[]) as '+' | '-' | '×';
    // Prevent negative results
    if (op === '-' && a < b) {
      [a, b] = [b, a];
    }
    const val = op === '+' ? a + b : op === '-' ? a - b : a * b;
    return { text: `${a} ${op} ${b}`, val };
  };
  const L = mk();
  let Rr = mk(), g = 0;
  while (L.val === Rr.val && g++ < 10) Rr = mk();
  const ans = L.val > Rr.val ? 'L' : 'R';
  return { type: 'COMPARE', prompt: 'どちらが大きい？', ui: { kind: 'choices2', left: L.text, right: Rr.text }, answer: ans, note: '同値回避' };
}
export function genPAIR(range: number): Quiz {
  const n = R(4, 6);
  let nums = Array.from({ length: n }, () => R(1, range));
  for (let i = 0; i < 5 && new Set(nums).size !== nums.length; i++) nums = shuffle(nums);
  const i = R(0, n - 1), j = (i + R(1, n - 1)) % n;
  const target = nums[i] + nums[j];

  // Count all valid pairs
  let pairCount = 0;
  for (let a = 0; a < nums.length; a++) {
    for (let b = a + 1; b < nums.length; b++) {
      if (nums[a] + nums[b] === target) {
        pairCount++;
      }
    }
  }

  return {
    type: 'PAIR',
    prompt: `2つ選んで合計が ${target} になるように！（${pairCount}通り）`,
    ui: { kind: 'chips', chips: nums.map((v, k) => ({ id: k, text: String(v), value: v })) },
    answer: String(target),
    checkFn: sc => sc.sel.length === 2 && sc.sel[0].value + sc.sel[1].value === target,
    note: pairCount > 1 ? `${pairCount}通りの組み合わせがあります。どの組み合わせを選んでも正解です` : `チップ${n}枚`
  };
}
export function genORDER(range: number, opts?: { order?: 'asc' | 'desc' }): Quiz {
  const n = R(4, 6);
  // 重複なしの整数を生成
  const set = new Set<number>();
    const maxAttempts = 100;
    let attempts = 0;
    while (set.size < n && attempts++ < maxAttempts) {
      set.add(R(1, range));
    }
    const nums = Array.from(set);
    const order: 'asc' | 'desc' = opts?.order ?? (Math.random() < 0.5 ? 'asc' : 'desc');
    const sorted = [...nums].sort((a, b) => order === 'asc' ? a - b : b - a);
    const chips = nums.map((v, k) => ({ id: k, text: String(v), value: v }));
    return {
      type: 'ORDER',
      prompt: order === 'asc' ? '小さい順にタップ！' : '大きい順にタップ！',
      ui: { kind: 'chips-order', chips },
      answer: JSON.stringify(sorted),
      checkFn: (sc) => {
        const seqVals = sc.seqIds.map((id: number) => {
          const ch = chips.find((c) => c.id === id);
          return ch ? ch.value : undefined;
        }).filter((v: number | undefined): v is number => v !== undefined) as number[];
        return seqVals.length === sorted.length && seqVals.every((v: number, i: number) => v === sorted[i]);
      },
      note: `要素${n}個 / ${order === 'asc' ? '昇順' : '降順'}`
    };
}
export function genMAX_MIN(range: number): Quiz {
  const n = R(4, 6);
  // 重複なしの整数を生成
  const set = new Set<number>();
  const maxAttempts = 100;
  let attempts = 0;
  while (set.size < n && attempts++ < maxAttempts) {
    set.add(R(1, range));
  }
  const nums = Array.from(set);
  const isMax = Math.random() < 0.5;
  const target = isMax ? Math.max(...nums) : Math.min(...nums);
  return {
    type: 'MAX_MIN',
    prompt: isMax ? '最大の数を選んでください' : '最小の数を選んでください',
    ui: { kind: 'chips', chips: nums.map((v, k) => ({ id: k, text: String(v), value: v })) },
    answer: String(target),
    checkFn: sc => sc.sel.length === 1 && sc.sel[0].value === target,
    note: `チップ${n}枚`
  };
}

// New quiz types
export function genPAIR_DIFF(range: number): Quiz {
  const n = R(4, 6);
  let nums = Array.from({ length: n }, () => R(1, range));
  for (let i = 0; i < 5 && new Set(nums).size !== nums.length; i++) nums = shuffle(nums);
  const i = R(0, n - 1), j = (i + R(1, n - 1)) % n;
  const target = Math.abs(nums[i] - nums[j]);

  // Count all valid pairs
  let pairCount = 0;
  for (let a = 0; a < nums.length; a++) {
    for (let b = a + 1; b < nums.length; b++) {
      if (Math.abs(nums[a] - nums[b]) === target) {
        pairCount++;
      }
    }
  }

  return {
    type: 'PAIR_DIFF',
    prompt: `2つ選んで差が ${target} になるように！（${pairCount}通り）`,
    ui: { kind: 'chips', chips: nums.map((v, k) => ({ id: k, text: String(v), value: v })) },
    answer: String(target),
    checkFn: sc => sc.sel.length === 2 && Math.abs(sc.sel[0].value - sc.sel[1].value) === target,
    note: pairCount > 1 ? `${pairCount}通りの組み合わせがあります。どの組み合わせを選んでも正解です` : `チップ${n}枚`
  };
}

export function genMAX_MIN_EXPR(range: number, allowMul: boolean): Quiz {
  const n = R(4, 6);
  const exprs: { text: string; val: number }[] = [];
  const usedValues = new Set<number>();

  let attempts = 0;
  const maxAttempts = 50;

  while (exprs.length < n && attempts < maxAttempts) {
    attempts++;
    const ops = allowMul ? ['+', '-', '×'] : ['+', '-'];
    let a = R(1, Math.max(3, Math.floor(range / 2)));
    let b = R(1, Math.max(3, Math.floor(range / 2)));
    const op = pick(ops as string[]) as '+' | '-' | '×';
    // Prevent negative results
    if (op === '-' && a < b) {
      [a, b] = [b, a];
    }
    const val = op === '+' ? a + b : op === '-' ? a - b : a * b;

    // Only add if value is unique
    if (!usedValues.has(val)) {
      exprs.push({ text: `${a} ${op} ${b}`, val });
      usedValues.add(val);
    }
  }

  const isMax = Math.random() < 0.5;
  const target = isMax ? Math.max(...exprs.map(e => e.val)) : Math.min(...exprs.map(e => e.val));
  return {
    type: 'MAX_MIN_EXPR',
    prompt: isMax ? '最大の値を選んでください' : '最小の値を選んでください',
    ui: { kind: 'chips', chips: exprs.map((e, k) => ({ id: k, text: e.text, value: e.val })) },
    answer: String(target),
    checkFn: sc => sc.sel.length === 1 && sc.sel[0].value === target,
    note: `式${exprs.length}個 / ${isMax ? '最大' : '最小'}`
  };
}

export function genORDER_SUM(range: number, _allowMul: boolean): Quiz {
  const n = R(3, 4);
  const items: { text: string; val: number }[] = [];
  const usedSums = new Set<number>();
  let attempts = 0;
  const maxAttempts = 50;

  while (items.length < n && attempts < maxAttempts) {
    attempts++;
    const terms = R(2, 3);
    const nums: number[] = [];
    let sum = 0;
    for (let j = 0; j < terms; j++) {
      const num = R(1, Math.max(3, Math.floor(range / 3)));
      nums.push(num);
      sum += num;
    }
    // Only add if sum is unique
    if (!usedSums.has(sum)) {
      items.push({ text: nums.join(' + '), val: sum });
      usedSums.add(sum);
    }
  }

  // Fallback: if we couldn't generate enough unique sums, force uniqueness by adding small offsets
  if (items.length < n) {
    while (items.length < n && attempts < maxAttempts * 2) {
      attempts++;
      const terms = R(2, 3);
      const nums: number[] = [];
      let sum = 0;
      for (let j = 0; j < terms; j++) {
        const num = R(1, Math.max(3, Math.floor(range / 3)));
        nums.push(num);
        sum += num;
      }
      // Adjust sum to make it unique
      let adjustedSum = sum;
      while (usedSums.has(adjustedSum) && adjustedSum < range * 3) {
        adjustedSum++;
      }
      if (!usedSums.has(adjustedSum)) {
        items.push({ text: nums.join(' + '), val: adjustedSum });
        usedSums.add(adjustedSum);
      }
    }
  }

  const sorted = [...items].sort((a, b) => b.val - a.val);
  const chips = items.map((item, k) => ({ id: k, text: item.text, value: item.val }));
  return {
    type: 'ORDER_SUM',
    prompt: '合計が大きい順にタップ！',
    ui: { kind: 'chips-order', chips },
    answer: JSON.stringify(sorted.map(s => s.val)),
    checkFn: (sc) => {
      const seqVals = sc.seqIds.map((id: number) => {
        const ch = chips.find((c) => c.id === id);
        return ch ? ch.value : undefined;
      }).filter((v: number | undefined): v is number => v !== undefined) as number[];
      return seqVals.length === sorted.length && seqVals.every((v: number, i: number) => v === sorted[i].val);
    },
    note: `式${n}個 / 合計降順`
  };
}

export function genCOMPARE_EXPR(range: number, allowMul: boolean): Quiz {
  const mk = () => {
    const ops = allowMul ? ['+', '-', '×'] : ['+', '-'];
    let a = R(1, Math.max(3, Math.floor(range / 2)));
    let b = R(1, Math.max(3, Math.floor(range / 2)));
    const op = pick(ops as string[]) as '+' | '-' | '×';
    // Prevent negative results
    if (op === '-' && a < b) {
      [a, b] = [b, a];
    }
    const val = op === '+' ? a + b : op === '-' ? a - b : a * b;
    return { text: `${a} ${op} ${b}`, val };
  };
  const L = mk();
  let Rr = mk(), g = 0;
  while (L.val === Rr.val && g++ < 10) Rr = mk();
  const ans = L.val > Rr.val ? 'L' : 'R';
  return {
    type: 'COMPARE_EXPR',
    prompt: 'どちらが大きい？',
    ui: { kind: 'choices2', left: L.text, right: Rr.text },
    answer: ans,
    note: '両辺とも式'
  };
}

export function genRANGE_DIFF(range: number): Quiz {
  const n = R(4, 6);
  const set = new Set<number>();
  const maxAttempts = 100;
  let attempts = 0;
  while (set.size < n && attempts++ < maxAttempts) {
    set.add(R(1, range));
  }
  const nums = Array.from(set);
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  const diff = max - min;
  return {
    type: 'RANGE_DIFF',
    prompt: `最大値 − 最小値 を答えてください`,
    expr: `[${nums.join(', ')}]`,
    ui: { kind: 'input' },
    answer: String(diff),
    note: `チップ${n}枚 / 範囲差`
  };
}

export function genMULTI_SELECT_MULTIPLES(range: number): Quiz {
  const base = pick([3, 4, 5, 6]) as number;
  const n = R(6, 8);
  const nums: number[] = [];
  const multiples: number[] = [];

  // Generate numbers, some are multiples
  for (let i = 0; i < n; i++) {
    if (multiples.length < 2 || (multiples.length < 4 && Math.random() < 0.4)) {
      const mult = R(1, Math.floor(range / base)) * base;
      nums.push(mult);
      multiples.push(mult);
    } else {
      let num = R(1, range);
      let attempts = 0;
      while (num % base === 0 && attempts++ < 10) {
        num = R(1, range);
      }
      nums.push(num);
    }
  }

  // Shuffle
  const shuffled = shuffle(nums);
  const chips = shuffled.map((v, k) => ({ id: k, text: String(v), value: v }));

  return {
    type: 'MULTI_SELECT_MULTIPLES',
    prompt: `${base}の倍数をすべて選んでください`,
    ui: { kind: 'chips-multi', chips },
    answer: JSON.stringify(multiples.sort((a, b) => a - b)),
    checkFn: (sc) => {
      const selected = sc.sel.map(s => s.value).sort((a, b) => a - b);
      const expected = multiples.sort((a, b) => a - b);
      return selected.length === expected.length &&
             selected.every((v, i) => v === expected[i]);
    },
    note: `${base}の倍数 / 全選択`
  };
}

// Helper function to check if a number is prime
function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Helper function to get divisors count
function getDivisorsCount(n: number): number {
  let count = 0;
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) count++;
  }
  return count;
}

// Helper function to calculate GCD (Greatest Common Divisor)
function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

export function genPRIME(range: number): Quiz {
  // Generate a number in range
  const num = R(2, range);
  const prime = isPrime(num);

  return {
    type: 'PRIME',
    prompt: `${num} は素数？合成数？`,
    ui: { kind: 'choices2', left: '素数', right: '合成数' },
    answer: prime ? 'L' : 'R',
    note: `範囲2-${range}`
  };
}

export function genSQUARE_ROOT(range: number): Quiz {
  const maxRoot = Math.floor(Math.sqrt(range));
  const n = R(6, 8);
  const nums: number[] = [];
  const squares: number[] = [];

  // Generate some perfect squares
  const numSquares = R(2, Math.min(4, maxRoot));
  for (let i = 0; i < numSquares; i++) {
    const root = R(1, maxRoot);
    const square = root * root;
    if (!nums.includes(square) && square <= range) {
      nums.push(square);
      squares.push(square);
    }
  }

  // Fill with non-squares
  while (nums.length < n) {
    const num = R(1, range);
    const isSquare = Math.sqrt(num) === Math.floor(Math.sqrt(num));
    if (!isSquare && !nums.includes(num)) {
      nums.push(num);
    }
  }

  const shuffled = shuffle(nums);
  const chips = shuffled.map((v, k) => ({ id: k, text: String(v), value: v }));

  return {
    type: 'SQUARE_ROOT',
    prompt: '平方数（完全平方数）をすべて選んでください',
    ui: { kind: 'chips-multi', chips },
    answer: JSON.stringify(squares.sort((a, b) => a - b)),
    checkFn: (sc) => {
      const selected = sc.sel.map(s => s.value).sort((a, b) => a - b);
      const expected = squares.sort((a, b) => a - b);
      return selected.length === expected.length &&
             selected.every((v, i) => v === expected[i]);
    },
    note: `チップ${n}枚 / 平方数選択`
  };
}

export function genFACTOR_PAIR(range: number): Quiz {
  // Generate target product
  const target = R(6, range);

  // Find all factor pairs of target
  const factors: number[] = [];
  for (let i = 1; i <= Math.sqrt(target); i++) {
    if (target % i === 0) {
      factors.push(i);
      if (i !== target / i) {
        factors.push(target / i);
      }
    }
  }

  // Pick one pair
  const sortedFactors = factors.sort((a, b) => a - b);
  const pairIndex = R(0, Math.floor(sortedFactors.length / 2) - 1);
  const factor1 = sortedFactors[pairIndex];
  const factor2 = target / factor1;

  // Generate other numbers
  const n = R(6, 8);
  const nums = [factor1, factor2];

  while (nums.length < n) {
    const num = R(1, Math.min(range, target));
    if (!nums.includes(num)) {
      nums.push(num);
    }
  }

  const shuffled = shuffle(nums);
  const chips = shuffled.map((v, k) => ({ id: k, text: String(v), value: v }));

  // Count all valid factor pairs in chips
  let pairCount = 0;
  for (let a = 0; a < nums.length; a++) {
    for (let b = a + 1; b < nums.length; b++) {
      if (nums[a] * nums[b] === target) {
        pairCount++;
      }
    }
  }

  return {
    type: 'FACTOR_PAIR',
    prompt: `2つ選んで掛けると ${target} になるように！（${pairCount}通り）`,
    ui: { kind: 'chips', chips },
    answer: String(target),
    checkFn: sc => sc.sel.length === 2 && sc.sel[0].value * sc.sel[1].value === target,
    note: pairCount > 1 ? `${pairCount}通りの組み合わせがあります。どの組み合わせを選んでも正解です` : `積=${target}`
  };
}

export function genARITHMETIC_SEQUENCE(range: number): Quiz {
  // Generate common difference (smaller for easier difficulty)
  const maxDiff = Math.max(2, Math.floor(range / 10));
  const diff = R(1, maxDiff);

  // Generate starting number
  const start = R(1, Math.max(3, range - diff * 5));

  // Generate sequence of 5 numbers
  const sequence = Array.from({ length: 5 }, (_, i) => start + i * diff);

  // Pick a position to hide (not first or last for easier understanding)
  const hidePos = R(1, 3);
  const answer = sequence[hidePos];

  // Create display with ?
  const display = sequence.map((v, i) => i === hidePos ? '?' : String(v)).join(', ');

  return {
    type: 'ARITHMETIC_SEQUENCE',
    prompt: '？に入る数は？',
    expr: display,
    ui: { kind: 'input' },
    answer: String(answer),
    note: `公差${diff} / 等差数列`
  };
}

export function genDIVISOR_COUNT(range: number): Quiz {
  const num = R(2, range);
  const count = getDivisorsCount(num);

  return {
    type: 'DIVISOR_COUNT',
    prompt: `${num} の約数は何個？`,
    ui: { kind: 'input' },
    answer: String(count),
    note: `範囲2-${range}`
  };
}

export function genCOMMON_DIVISOR(range: number): Quiz {
  // Generate two numbers with GCD > 1
  let a, b, divisor;
  let attempts = 0;

  do {
    // Try random generation first
    a = R(4, range);
    b = R(4, range);
    divisor = gcd(a, b);
    attempts++;

    // If GCD is 1 after several attempts, force a common divisor
    if (attempts > 10 && divisor === 1) {
      const commonDivisor = R(2, Math.min(10, Math.floor(range / 4)));
      a = commonDivisor * R(2, Math.floor(range / commonDivisor));
      b = commonDivisor * R(2, Math.floor(range / commonDivisor));
      divisor = gcd(a, b);
    }
  } while (divisor === 1 && attempts < 20);

  return {
    type: 'COMMON_DIVISOR',
    prompt: `${a} と ${b} の最大公約数は？`,
    ui: { kind: 'input' },
    answer: String(divisor),
    note: `範囲4-${range}`
  };
}

export function genPATTERN_NEXT(range: number): Quiz {
  // Select pattern type
  const patterns = ['arithmetic', 'geometric', 'square'];
  const patternType = pick(patterns) as string;

  let sequence: number[] = [];
  let answer = 0;
  let patternDesc = '';

  if (patternType === 'arithmetic') {
    // Arithmetic sequence: a, a+d, a+2d, a+3d
    const diff = R(2, Math.min(5, Math.floor(range / 4)));
    const start = R(1, Math.max(3, range - diff * 4));
    sequence = Array.from({ length: 4 }, (_, i) => start + i * diff);
    answer = start + 4 * diff;
    patternDesc = `等差数列(公差${diff})`;
  } else if (patternType === 'geometric') {
    // Geometric sequence: a, a×r, a×r², a×r³ (r=2 or 3)
    const ratio = pick([2, 3]) as number;
    const start = R(1, Math.floor(range / (ratio ** 3)));
    sequence = Array.from({ length: 4 }, (_, i) => start * (ratio ** i));
    answer = start * (ratio ** 4);
    patternDesc = `等比数列(×${ratio})`;
  } else {
    // Square numbers: 1², 2², 3², 4²
    const maxN = Math.floor(Math.sqrt(range));
    const start = R(1, Math.max(2, maxN - 4));
    sequence = Array.from({ length: 4 }, (_, i) => (start + i) ** 2);
    answer = (start + 4) ** 2;
    patternDesc = '平方数';
  }

  // Generate wrong choices
  const choices = [answer];
  while (choices.length < 4) {
    const offset = R(-5, 5);
    const candidate = answer + offset;
    if (candidate > 0 && !choices.includes(candidate)) {
      choices.push(candidate);
    }
  }

  const shuffled = shuffle(choices);
  const chips = shuffled.map((v, k) => ({ id: k, text: String(v), value: v }));

  return {
    type: 'PATTERN_NEXT',
    prompt: '次に来る数は？',
    expr: `${sequence.join(', ')}, ?`,
    ui: { kind: 'chips', chips },
    answer: String(answer),
    checkFn: sc => sc.sel.length === 1 && sc.sel[0].value === answer,
    note: patternDesc
  };
}

export function genMODULO(range: number): Quiz {
  // Generate divisor (lower values for easier difficulty)
  const maxDivisor = Math.max(3, Math.floor(range / 4));
  const divisor = R(2, maxDivisor);

  // Generate dividend
  const dividend = R(divisor + 1, range);
  const remainder = dividend % divisor;

  return {
    type: 'MODULO',
    prompt: `${dividend} ÷ ${divisor} の余りは？`,
    ui: { kind: 'input' },
    answer: String(remainder),
    note: `被除数${dividend} / 除数${divisor}`
  };
}

export function genEQUATION_BALANCE(range: number): Quiz {
  // Choose equation type
  const eqTypes = ['simple', 'twoStep'];
  const eqType = range > 20 ? pick(eqTypes) as string : 'simple';

  let expr = '';
  let answer = 0;
  let eqDesc = '';

  if (eqType === 'simple') {
    // Balance equation: a + b = c + ?
    const a = R(1, Math.floor(range / 3));
    const b = R(1, Math.floor(range / 3));
    const sum = a + b;
    const c = R(1, Math.max(2, sum - 2));
    answer = sum - c;
    expr = `${a} + ${b} = ${c} + ?`;
    eqDesc = '加算バランス';
  } else {
    // Multiplication balance: a × b = c + ?
    const a = R(2, Math.min(5, Math.floor(range / 5)));
    const b = R(2, Math.min(5, Math.floor(range / 5)));
    const product = a * b;
    const c = R(1, Math.max(2, product - 3));
    answer = product - c;
    expr = `${a} × ${b} = ${c} + ?`;
    eqDesc = '掛け算バランス';
  }

  return {
    type: 'EQUATION_BALANCE',
    prompt: '？に入る数は？',
    expr,
    ui: { kind: 'input' },
    answer: String(answer),
    note: eqDesc
  };
}

export function genFRACTION_COMPARE(range: number): Quiz {
  // Generate two fractions with simple denominators
  const maxDenom = Math.max(3, Math.min(8, Math.floor(range / 3)));

  // First fraction
  const denom1 = R(2, maxDenom);
  const numer1 = R(1, denom1 - 1);

  // Second fraction (ensure different value)
  let denom2 = R(2, maxDenom);
  let numer2 = R(1, denom2 - 1);

  // Ensure fractions are different by comparing values
  let attempts = 0;
  while (numer1 * denom2 === numer2 * denom1 && attempts++ < 10) {
    denom2 = R(2, maxDenom);
    numer2 = R(1, denom2 - 1);
  }

  // Compare: numer1/denom1 vs numer2/denom2
  // Cross multiply: numer1 * denom2 vs numer2 * denom1
  const val1 = numer1 * denom2;
  const val2 = numer2 * denom1;
  const answer = val1 > val2 ? 'L' : 'R';

  return {
    type: 'FRACTION_COMPARE',
    prompt: 'どちらが大きい？',
    ui: { kind: 'choices2', left: `${numer1}/${denom1}`, right: `${numer2}/${denom2}` },
    answer,
    note: `分母${Math.max(denom1, denom2)}以下`
  };
}

/**
 * Helper functions for makeQuizPack to reduce complexity
 */

function calculateRange(
  pack: 'attack' | 'fire' | 'heal' | 'run',
  diff: Difficulty,
  base: ReturnType<typeof quizBaseByDifficulty>,
  diffBoost: number,
  dojo?: 'arithmetic' | 'random' | 'hard'
): number {
  const packRangeMap: Record<typeof pack, number> = {
    fire: diff === 'easy' ? base.base + 2 : diff === 'hard' ? base.base + 8 : base.base + 5,
    heal: diff === 'easy' ? base.base - 4 : diff === 'hard' ? base.base + 2 : base.base - 2,
    run: Math.max(12, base.base - 8),
    attack: base.base
  };

  let range = Math.max(6, Math.round(packRangeMap[pack] + diffBoost));

  // Dojo adjustments
  if (dojo === 'arithmetic') {
    range = Math.min(range, 12);
  } else if (dojo === 'random') {
    range = Math.min(range, 16);
  }

  return range;
}

function calculateTime(
  pack: 'attack' | 'fire' | 'heal' | 'run',
  diff: Difficulty,
  base: ReturnType<typeof quizBaseByDifficulty>,
  diffBoost: number
): number {
  const packTimeMap: Record<typeof pack, number> = {
    run: Math.max(8, base.time - 8),
    fire: diff === 'easy' ? base.time : diff === 'hard' ? base.time - 3 : base.time - 2,
    heal: diff === 'easy' ? base.time + 2 : diff === 'hard' ? base.time - 2 : base.time,
    attack: base.time
  };

  return Math.max(6, Math.round(packTimeMap[pack] - Math.max(0, diffBoost / 4)));
}

// All available quiz types (22 total)
const ALL_QUIZ_TYPES: QuizType[] = [
  'SUM', 'MISSING', 'COMPARE', 'PAIR', 'ORDER',
  'MAX_MIN', 'PAIR_DIFF', 'MAX_MIN_EXPR', 'ORDER_SUM',
  'COMPARE_EXPR', 'RANGE_DIFF', 'MULTI_SELECT_MULTIPLES',
  'PRIME', 'SQUARE_ROOT', 'FACTOR_PAIR', 'ARITHMETIC_SEQUENCE',
  'DIVISOR_COUNT', 'COMMON_DIVISOR', 'PATTERN_NEXT',
  'MODULO', 'EQUATION_BALANCE', 'FRACTION_COMPARE'
];

function pickQuizType(
  pack: 'attack' | 'fire' | 'heal' | 'run',
  dojo: 'arithmetic' | 'random' | 'hard' | undefined,
  quizTypes: QuizType[] | undefined
): QuizType {
  // If quizTypes is defined (even if empty), use custom quiz type selection
  if (quizTypes !== undefined) {
    // Empty array means use all quiz types
    let allowedTypes = quizTypes.length === 0 ? ALL_QUIZ_TYPES : quizTypes;

    const packTypeFilters: Record<string, QuizType[]> = {
      run: ['COMPARE', 'COMPARE_EXPR', 'PRIME', 'MODULO'],
      heal: ['MISSING', 'SUM', 'RANGE_DIFF', 'ARITHMETIC_SEQUENCE', 'DIVISOR_COUNT', 'EQUATION_BALANCE'],
      fire: ['MISSING', 'ORDER', 'PAIR', 'MAX_MIN', 'MAX_MIN_EXPR', 'ORDER_SUM', 'MULTI_SELECT_MULTIPLES', 'SQUARE_ROOT', 'FACTOR_PAIR', 'PATTERN_NEXT', 'COMMON_DIVISOR', 'FRACTION_COMPARE']
    };

    const filterTypes = packTypeFilters[pack];
    if (filterTypes) {
      const filtered = allowedTypes.filter(t => filterTypes.includes(t));
      if (filtered.length > 0) allowedTypes = filtered;
    }

    return pick(allowedTypes as unknown as string[]) as QuizType;
  }

  // Dojo mode type selection
  if (dojo === 'arithmetic') {
    return pick(['SUM', 'COMPARE', 'RANGE_DIFF']) as QuizType;
  }
  if (dojo === 'random') {
    return pick(['SUM', 'COMPARE', 'MAX_MIN', 'MISSING', 'RANGE_DIFF']) as QuizType;
  }

  // Pack-based type selection
  const packTypesMap: Record<typeof pack, QuizType[]> = {
    run: ['COMPARE', 'COMPARE_EXPR', 'PRIME', 'MODULO'],
    heal: ['MISSING', 'SUM', 'RANGE_DIFF', 'ARITHMETIC_SEQUENCE', 'DIVISOR_COUNT', 'EQUATION_BALANCE'],
    fire: ['MISSING', 'ORDER', 'PAIR', 'MAX_MIN', 'MAX_MIN_EXPR', 'ORDER_SUM', 'MULTI_SELECT_MULTIPLES', 'SQUARE_ROOT', 'FACTOR_PAIR', 'PATTERN_NEXT', 'COMMON_DIVISOR', 'FRACTION_COMPARE'],
    attack: ['SUM', 'MISSING', 'COMPARE', 'PAIR', 'ORDER', 'MAX_MIN', 'PAIR_DIFF', 'MAX_MIN_EXPR', 'ORDER_SUM', 'COMPARE_EXPR', 'RANGE_DIFF', 'MULTI_SELECT_MULTIPLES', 'PRIME', 'SQUARE_ROOT', 'FACTOR_PAIR', 'ARITHMETIC_SEQUENCE', 'DIVISOR_COUNT', 'COMMON_DIVISOR', 'PATTERN_NEXT', 'MODULO', 'EQUATION_BALANCE', 'FRACTION_COMPARE']
  };

  return pick(packTypesMap[pack] as unknown as string[]) as QuizType;
}

function generateQuizByType(
  type: QuizType,
  range: number,
  allowMul: boolean,
  isDojoEasy: boolean
): Quiz {
  const generators: Record<QuizType, () => Quiz> = {
    SUM: () => genSUM(range, { maxTerms: isDojoEasy ? 3 : 5 }),
    MISSING: () => genMISSING(range, allowMul),
    COMPARE: () => genCOMPARE(range, allowMul),
    PAIR: () => genPAIR(range),
    ORDER: () => genORDER(range),
    MAX_MIN: () => genMAX_MIN(range),
    PAIR_DIFF: () => genPAIR_DIFF(range),
    MAX_MIN_EXPR: () => genMAX_MIN_EXPR(range, allowMul),
    ORDER_SUM: () => genORDER_SUM(range, allowMul),
    COMPARE_EXPR: () => genCOMPARE_EXPR(range, allowMul),
    RANGE_DIFF: () => genRANGE_DIFF(range),
    MULTI_SELECT_MULTIPLES: () => genMULTI_SELECT_MULTIPLES(range),
    PRIME: () => genPRIME(range),
    SQUARE_ROOT: () => genSQUARE_ROOT(range),
    FACTOR_PAIR: () => genFACTOR_PAIR(range),
    ARITHMETIC_SEQUENCE: () => genARITHMETIC_SEQUENCE(range),
    DIVISOR_COUNT: () => genDIVISOR_COUNT(range),
    COMMON_DIVISOR: () => genCOMMON_DIVISOR(range),
    PATTERN_NEXT: () => genPATTERN_NEXT(range),
    MODULO: () => genMODULO(range),
    EQUATION_BALANCE: () => genEQUATION_BALANCE(range),
    FRACTION_COMPARE: () => genFRACTION_COMPARE(range)
  };

  const generator = generators[type];
  return generator ? generator() : genSUM(range);
}

function generateEasyFallback(range: number, dojo: 'arithmetic' | 'random' | 'hard' | undefined): Quiz {
  const easyRange = Math.max(4, Math.round(range * 0.6));
  const easyOrder: QuizType[] = ['RANGE_DIFF', 'MAX_MIN', 'PAIR', 'COMPARE', 'SUM', 'MISSING', 'ORDER'];

  for (const et of easyOrder) {
    let candidate: Quiz | null = null;

    if (dojo === 'arithmetic' || dojo === 'random') {
      // Dojo modes: only SUM/COMPARE/RANGE_DIFF
      if (et === 'SUM') {
        candidate = genSUM(Math.min(easyRange, dojo === 'arithmetic' ? 10 : 12), { maxTerms: 3 });
      } else if (et === 'COMPARE') {
        candidate = genCOMPARE(Math.min(easyRange, 10), false);
      } else if (et === 'RANGE_DIFF') {
        candidate = genRANGE_DIFF(Math.min(easyRange, 12));
      }
    } else {
      candidate = generateQuizByType(et, easyRange, false, false);
    }

    if (candidate && !isHardQuiz(candidate)) {
      return candidate;
    }
  }

  // Ultimate fallback
  return {
    type: 'SUM',
    expr: '1 + 2 = ?',
    answer: '3',
    ui: { kind: 'input' },
    prompt: '1 + 2 = ?'
  } as Quiz;
}

/**
 * Check if hard quizzes should be allowed
 */
function shouldAllowHardQuiz(
  isDojoEasy: boolean,
  hardQuizRandom?: boolean
): boolean {
  if (isDojoEasy) return false;
  return hardQuizRandom ?? true;
}

/**
 * Calculate quiz power based on pack type
 */
function calculateQuizPower(pack: 'attack' | 'fire' | 'heal' | 'run'): number {
  switch (pack) {
    case 'fire': return 1.5;
    case 'heal': return 0;
    case 'run': return 0;
    case 'attack': return 1;
    default: return 1;
  }
}

/**
 * Generate a non-hard quiz with fallback
 */
function generateNonHardQuiz(
  pack: 'attack' | 'fire' | 'heal' | 'run',
  range: number,
  allowMul: boolean,
  isDojoEasy: boolean,
  dojo?: 'arithmetic' | 'random' | 'hard',
  quizTypes?: QuizType[]
): Quiz {
  let q = genSUM(range);

  // Try up to 5 times to generate a non-hard quiz
  for (let i = 0; i < 5; ++i) {
    const t = pickQuizType(pack, dojo, quizTypes);
    q = generateQuizByType(t, range, allowMul, isDojoEasy);
    if (!isHardQuiz(q)) break;
  }

  // Final fallback if still hard
  if (isHardQuiz(q)) {
    q = generateEasyFallback(range, dojo);
  }

  return q;
}

export function makeQuizPack(
  diff: Difficulty,
  pack: 'attack' | 'fire' | 'heal' | 'run',
  opts?: { diffBoost?: number; hardQuizRandom?: boolean; dojo?: 'arithmetic' | 'random' | 'hard'; quizTypes?: QuizType[] }
): { quiz: Quiz; time: number; power: number } {
  const base = quizBaseByDifficulty(diff);
  const dojo = opts?.dojo;
  const isDojoEasy = dojo === 'arithmetic' || dojo === 'random';
  const allowMul = (diff !== 'easy') && !isDojoEasy;

  const range = calculateRange(pack, diff, base, opts?.diffBoost ?? 0, dojo);
  const time = calculateTime(pack, diff, base, opts?.diffBoost ?? 0);
  const allowHard = shouldAllowHardQuiz(isDojoEasy, opts?.hardQuizRandom);

  let q: Quiz;

  if (!allowHard) {
    q = generateNonHardQuiz(pack, range, allowMul, isDojoEasy, dojo, opts?.quizTypes);
  } else {
    // Allow hard quizzes
    const t = pickQuizType(pack, dojo, opts?.quizTypes);
    q = generateQuizByType(t, range, allowMul, isDojoEasy);
  }

  const power = calculateQuizPower(pack);

  return { quiz: q, time, power };
}
