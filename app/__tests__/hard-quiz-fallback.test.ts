import { describe, it, expect } from 'vitest';
import { makeQuizPack } from '../lib/quiz/generators';
import { isHardQuiz } from '../lib/quiz/difficulty';

describe('Hard Quiz Fallback', () => {
  it('hardQuizRandom=false の場合、最終的に難問を避ける', () => {
    // 複数回生成して難問が出続けないことを統計的に軽く確認
    // （完全決定的ではないが、フォールバックが無いと高確率でHardが残るケースを抑制）
    let hardCount = 0;
    for (let i = 0; i < 40; i++) {
      const { quiz } = makeQuizPack('normal', 'attack', { hardQuizRandom: false });
      if (isHardQuiz(quiz)) hardCount++;
    }
    // 全てが0でない場合でも、フォールバック後は極端にHard連発しない想定。
    // 安全マージンとして 40回中 6超は異常とみなす（閾値は調整可能）
    expect(hardCount).toBeLessThan(7);
  });
});
