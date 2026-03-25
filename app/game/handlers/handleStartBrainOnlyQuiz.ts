/**
 * Brain-Only Mode Quiz Initialization Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles brain-only mode quiz initialization.
 * Original location: DQBrain.tsx lines ~1079-1106
 */

import { QuizBundle } from '../../lib/quiz/types';
import { Settings } from '../../lib/settings';
import { makeQuizPack } from '../../lib/quiz/generators';
import { Enemy } from '../../lib/enemies';
import { pick } from '../../lib/rng';
import { ENEMY_POOL } from '../../lib/enemies';

export interface StartBrainOnlyQuizDeps {
  settings: Settings;
  setBrainEnemy: (enemy: Enemy | null) => void;
  setBrainOnlyQuiz: (quiz: QuizBundle | null) => void;
}

export function handleStartBrainOnlyQuiz(deps: StartBrainOnlyQuizDeps) {
  const { settings, setBrainEnemy, setBrainOnlyQuiz } = deps;
  
  // S10 Step3: Quiz generation delegation to makeQuizPack
  // Previously had duplicate quiz type selection logic (30+ lines)
  // Now delegates to makeQuizPack which already supports quizTypes option
  const difficulty = settings.difficulty;
  const pack = 'attack';

  // Use makeQuizPack with quizTypes option (handles all quiz type selection)
  const result = makeQuizPack(difficulty, pack, {
    hardQuizRandom: settings.hardQuizRandom,
    quizTypes: settings.quizTypes.length > 0 ? settings.quizTypes : undefined
  });
  
  // pick a pseudo enemy to fight this quiz
  try {
    const e = pick(ENEMY_POOL);
    setBrainEnemy(e);
  } catch (error) {
    console.error('Failed to pick brain-only enemy:', error);
  }

  setBrainOnlyQuiz({
    quiz: result.quiz,
    timeMax: result.time,
    timeLeft: result.time,
    timeStart: Date.now(),
    pack: 'attack',
    power: 1
  });
}
