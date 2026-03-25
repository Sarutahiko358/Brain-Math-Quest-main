/**
 * Brain Quiz Initialization Handler
 * 
 * Mechanically extracted from DQBrain.tsx - handles battle quiz initialization.
 * Original location: DQBrain.tsx lines ~1056-1072
 */

import { BattleState, GameMode } from '../../lib/gameTypes';
import { Settings } from '../../lib/settings';
import { makeQuizPack } from '../../lib/quiz/generators';
import { DojoMode } from '../types';
import { QuizType } from '../../lib/quiz/types';
import { getLibraryBossQuizTypes } from '../../lib/quiz/bossMappings';

export interface StartBrainQuizDeps {
  battle: BattleState | null;
  player: { mp: number };
  settings: Settings;
  dojoMode: DojoMode | null;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  addToast: (msg: string) => void;
  gameMode: GameMode;
  currentAreaId: number;
  quizTypesOverride: QuizType[] | null;
}

export function handleStartBrainQuiz(pack: "attack" | "fire" | "heal" | "run", deps: StartBrainQuizDeps) {
  const { battle, player, settings, dojoMode, setBattle, addToast, gameMode, currentAreaId, quizTypesOverride } = deps;

  if (!battle) return;
  if (pack === "fire" && player.mp < 4) { addToast("MPが たりない！"); return; }
  if (pack === "heal" && player.mp < 3) { addToast("MPが たりない！"); return; }

  // Decide effective quiz types with fallback order:
  // Dojo override -> Library boss mapping (when boss) -> settings.quizTypes
  let effectiveQuizTypes: QuizType[] | undefined = undefined;
  if (gameMode === 'library' && quizTypesOverride && quizTypesOverride.length > 0) {
    effectiveQuizTypes = quizTypesOverride;
  } else if (battle.enemy?.boss && gameMode === 'library') {
    const mapped = getLibraryBossQuizTypes(currentAreaId);
    if (mapped && mapped.length > 0) effectiveQuizTypes = mapped;
  } else {
    effectiveQuizTypes = settings.quizTypes;
  }
  const { quiz, time, power } = makeQuizPack(
    settings.difficulty,
    pack,
    {
      hardQuizRandom: settings.hardQuizRandom,
      // 道場モードをクイズ生成に伝える
      dojo: dojoMode === 'arithmetic' ? 'arithmetic' : dojoMode === 'random' ? 'random' : dojoMode === 'hard' ? 'hard' : undefined,
      // カスタム問題タイプを渡す（物語モードと無限の回廊モード用）
      quizTypes: effectiveQuizTypes
    }
  );
  setBattle(b => b ? { ...b, mode: "quiz", quiz: { quiz, timeMax: time, timeLeft: time, timeStart: Date.now(), pack, power } } : b);
}
