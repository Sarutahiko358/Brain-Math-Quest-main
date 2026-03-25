/**
 * Attack Action Handler
 *
 * Handles attack and fire magic action quiz results.
 * Extracted from actionHandlers.ts for better modularity.
 */

import { Player, BattleState, GameMode } from '../../../lib/gameTypes';
import { Settings } from '../../../lib/settings';
import { isHardQuiz } from '../../../lib/quiz/difficulty';
import { processAttackResult } from '../../../lib/quiz/engine';
import { BattleAnimState, DexData, EquipDexState } from '../../types';
import { LevelUpInfo, LevelUpDetail } from '../../../lib/battle/flow';
import { TimerManager } from '../../../lib/timerManager';
import { processLevelUpDisplay, applyLevelUpDisplay } from '../levelUpProcessor';
import { processVictoryRewards } from '../rewardProcessor';
import { processBossVictory } from '../bossVictoryProcessor';
import { applyComboGuardOrReset } from '../comboManager';
import {
  showDamageAnimation,
  showWeakDamageAnimation,
  showBonusAnimations
} from '../battleAnimations';
import { playSoundEffect } from '../handleSoundEffects';

export interface AttackActionDeps {
  timerManager: TimerManager;
  battle: BattleState;
  player: Player;
  gameMode: GameMode;
  quizCombo: number;
  settings: Settings;
  equipDex: EquipDexState;
  currentAreaInfo: { bossName: string };
  enemyPanelRef: React.RefObject<HTMLDivElement | null>;
  currentDex: DexData;
  setBattle: (updater: (b: BattleState | null) => BattleState | null) => void;
  setPlayer: (updater: (p: Player) => Player) => void;
  setQuizCombo: (updater: ((c: number) => number) | number) => void;
  setBattleAnim: (anim: BattleAnimState | null) => void;
  setShowStory: (story: "bossVictory" | "bossEncounter" | null) => void;
  setEquipDex: (updater: (ed: EquipDexState) => EquipDexState) => void;
  addToast: (msg: string) => void;
  pushLog: (msg: string) => void;
  vibrate: (ms: number) => void;
  enemyStrike: (nextCheck?: boolean) => void;
  giveExpGold: (exp: number, gold: number) => { levelUp?: LevelUpInfo, details?: LevelUpDetail[] };
  recordDefeated: (name: string) => void;
  addToEquipDex: (kind: 'weapon'|'armor', name: string) => void;
}

/**
 * Handle successful attack/fire action
 *
 * Process flow:
 * 1. Calculate damage and bonuses from quiz result
 * 2. Apply MP cost (for fire magic)
 * 3. Increase combo
 * 4. Apply damage to enemy
 * 5. Show damage animation with bonus indicators
 * 6. Log messages
 * 7. Check for enemy defeat:
 *    - If defeated: process rewards, level-up, boss victory events
 *    - If alive: trigger enemy counter-attack
 *
 * @param pack - Action type ('attack' or 'fire')
 * @param timeSpent - Time spent on the quiz in seconds
 * @param deps - Action handler dependencies
 */
export function handleSuccessfulAttack(
  pack: "attack" | "fire",
  timeSpent: number,
  deps: AttackActionDeps
): void {
  const {
    timerManager,
    battle,
    player,
    gameMode,
    quizCombo,
    settings,
    equipDex,
    currentAreaInfo,
    enemyPanelRef,
    setBattle,
    setPlayer,
    setQuizCombo,
    setBattleAnim,
    setShowStory,
    setEquipDex,
    addToast,
    pushLog,
    vibrate,
    enemyStrike,
    giveExpGold,
    recordDefeated,
    addToEquipDex
  } = deps;

  if (!battle.quiz) return; // Type guard

  // Check test mode completion first
  if (battle.testMode) {
    const { questionsAsked, totalQuestions, correctAnswers, requiredCorrect } = battle.testMode;

    // Log test progress
    pushLog(`📝 テスト進行: ${questionsAsked}/${totalQuestions}問 (正解: ${correctAnswers})`);

    // Check if test is complete
    if (questionsAsked >= totalQuestions) {
      const passed = correctAnswers >= requiredCorrect;

      if (passed) {
        // Test passed - player wins
        pushLog(`🎉 合格！ ${correctAnswers}/${totalQuestions}問 正解！`);
        pushLog(`💀 ${battle.enemy.name} を 倒した！`);
        playSoundEffect('victory', settings.soundEffects);

        // Force enemy HP to 0 for victory processing
        setBattle(b => b ? ({
          ...b,
          enemy: { ...b.enemy, hp: 0 }
        }) : b);

        // Process victory rewards
        const rewardResult = processVictoryRewards(
          { player, gameMode, settings, equipDex, battle, hard: false },
          { setPlayer, addToEquipDex, pushLog, giveExpGold }
        );

        // Display level-up if applicable
        if (rewardResult.levelUp) {
          const levelUpResult = processLevelUpDisplay(rewardResult.levelUp, rewardResult.levelUpDetails);
          applyLevelUpDisplay(battle, levelUpResult, pushLog, setBattle);
        }

        pushLog(``);
        pushLog(`「▶ 続ける」ボタンを押してください`);

        setBattle(b => b ? ({
          ...b,
          mode: "victory",
          rewards: {
            exp: rewardResult.exp,
            gold: rewardResult.gold,
            timeBonus: rewardResult.timeBonus,
            items: rewardResult.dropMessages.length > 0 ? rewardResult.dropMessages : undefined,
            levelUp: rewardResult.levelUp,
            levelUpDetails: rewardResult.levelUpDetails
          }
        }) : b);

        recordDefeated(battle.enemy.name);

        if (gameMode === 'library' && battle.onVictory) {
          battle.onVictory();
        }

        // Process boss victory for library mode
        if (gameMode === 'library' && battle.enemy.boss && battle.enemy.name === currentAreaInfo.bossName) {
          processBossVictory(
            { player, gameMode, battle, currentAreaInfo, equipDex },
            { setPlayer, setEquipDex, pushLog, addToast, setShowStory, timerManager }
          );
        }
      } else {
        // Test failed - player loses
        pushLog(`❌ 不合格... ${correctAnswers}/${totalQuestions}問 正解（${requiredCorrect}問以上必要）`);
        pushLog(`${battle.enemy.name} に敗北した...`);

        // Set player HP to 0 for defeat
        setPlayer(p => ({ ...p, hp: 0 }));

        timerManager.setTimeout(() => {
          pushLog(``);
          pushLog(`戦闘に敗れた...`);
          pushLog(`「▶ 続ける」ボタンを押してください`);
          setBattle(b => b ? ({ ...b, mode: "victory" }) : b);
        }, 1000);
      }

      return; // Exit early - test mode complete
    } else {
      // Test continues - just log progress and continue to next question
      timerManager.setTimeout(() => {
        setBattle(b => b ? ({ ...b, mode: "select" }) : b);
      }, 1500);
      return;
    }
  }

  // Calculate attack outcome (normal battle mode)
  const hard = isHardQuiz(battle.quiz.quiz);
  const context = { player, enemy: battle.enemy, quiz: battle.quiz, quizCombo, settings };
  const outcome = processAttackResult(true, pack, context, timeSpent);

  // Log all outcome messages
  outcome.messages.forEach(msg => pushLog(msg));

  // Show bonus animations (speed, hard quiz)
  showBonusAnimations(!!outcome.speedBonus, !!outcome.hardBonus, {
    setBattleAnim,
    timerManager,
    vibrate
  });

  // Apply MP cost for magic
  if (outcome.playerMPChange) {
    setPlayer(p => ({ ...p, mp: p.mp + outcome.playerMPChange! }));
  }

  // Increase combo
  if (typeof outcome.comboChange === 'number') {
    const comboIncrease = outcome.comboChange;
    setQuizCombo((c) => {
      const newCombo = c + comboIncrease;
      // コンボ音を再生（5の倍数で特別な音）
      if (newCombo > 0 && newCombo % 5 === 0) {
        playSoundEffect('combo', settings.soundEffects);
      }
      return newCombo;
    });
  }

  // Apply damage to enemy
  if (outcome.enemyDamage) {
    setBattle(b => b ? ({
      ...b,
      enemy: { ...b.enemy, hp: Math.max(0, b.enemy.hp - outcome.enemyDamage!) }
    }) : b);
    // 攻撃音を再生
    playSoundEffect('attack', settings.soundEffects);
  }

  // Show damage animation with scroll effect
  const dmg = outcome.enemyDamage || 0;
  showDamageAnimation(dmg, !!outcome.comboBonus, enemyPanelRef, {
    setBattleAnim,
    timerManager,
    vibrate
  });

  // Check for enemy defeat after animation
  timerManager.setTimeout(() => {
    const after = battle.enemy.hp - dmg;

    if (after <= 0) {
      // Enemy defeated
      pushLog(`💀 ${battle.enemy.name} を たおした！`);
      // 勝利音を再生
      playSoundEffect('victory', settings.soundEffects);

      // Process victory rewards and equipment drops
      const rewardResult = processVictoryRewards(
        { player, gameMode, settings, equipDex, battle, hard },
        { setPlayer, addToEquipDex, pushLog, giveExpGold }
      );

      // Display level-up if applicable
      if (rewardResult.levelUp) {
        const levelUpResult = processLevelUpDisplay(rewardResult.levelUp, rewardResult.levelUpDetails);
        applyLevelUpDisplay(battle, levelUpResult, pushLog, setBattle);
      }

      // Prompt user to continue
      pushLog(``);
      pushLog(`「▶ 続ける」ボタンを押してください`);

      // Update battle state to victory mode
      setBattle(b => b ? ({
        ...b,
        mode: "victory",
        rewards: {
          exp: rewardResult.exp,
          gold: rewardResult.gold,
          timeBonus: rewardResult.timeBonus,
          items: rewardResult.dropMessages.length > 0 ? rewardResult.dropMessages : undefined,
          levelUp: rewardResult.levelUp,
          levelUpDetails: rewardResult.levelUpDetails
        }
      }) : b);

      // Record defeat in bestiary
      recordDefeated(battle.enemy.name);

      // Call onVictory for endless mode floor bosses
      if (gameMode === 'endless' && battle.enemy.boss && battle.onVictory) {
        battle.onVictory();
      }

      // Process boss-specific victory events (guardians, ultimate unlocks)
      processBossVictory(
        { battle, player, gameMode, equipDex, currentAreaInfo },
        { setPlayer, setEquipDex, pushLog, addToast, setShowStory, timerManager }
      );
    } else {
      // Enemy still alive
      pushLog(`${battle.enemy.name} HP: ${after}/${battle.enemy.maxHP}`);
      enemyStrike();
    }
  }, 40);
}

/**
 * Handle failed attack/fire action
 *
 * Process flow:
 * 1. Calculate weak damage (if skill) or zero damage (if magic)
 * 2. Apply MP cost (for fire magic)
 * 3. Apply weak damage to enemy
 * 4. Show weak damage animation
 * 5. Log messages
 * 6. Apply combo guard (if equipped) or reset combo
 * 7. Trigger enemy counter-attack
 *
 * @param pack - Action type ('attack' or 'fire')
 * @param timeSpent - Time spent on the quiz in seconds
 * @param deps - Action handler dependencies
 */
export function handleFailedAttack(
  pack: "attack" | "fire",
  timeSpent: number,
  deps: AttackActionDeps
): void {
  const {
    battle,
    player,
    gameMode,
    quizCombo,
    settings,
    equipDex,
    currentAreaInfo,
    setBattle,
    setPlayer,
    setQuizCombo,
    setBattleAnim,
    setEquipDex,
    setShowStory,
    addToast,
    pushLog,
    timerManager,
    vibrate,
    enemyStrike,
    giveExpGold,
    recordDefeated,
    addToEquipDex
  } = deps;

  if (!battle.quiz) return; // Type guard

  // Check test mode completion first (same logic as successful attack)
  if (battle.testMode) {
    const { questionsAsked, totalQuestions, correctAnswers, requiredCorrect } = battle.testMode;

    // Log test progress
    pushLog(`📝 テスト進行: ${questionsAsked}/${totalQuestions}問 (正解: ${correctAnswers})`);

    // Check if test is complete
    if (questionsAsked >= totalQuestions) {
      const passed = correctAnswers >= requiredCorrect;

      if (passed) {
        // Test passed - player wins (same as successful attack)
        pushLog(`🎉 合格！ ${correctAnswers}/${totalQuestions}問 正解！`);
        pushLog(`💀 ${battle.enemy.name} を 倒した！`);
        playSoundEffect('victory', settings.soundEffects);

        setBattle(b => b ? ({
          ...b,
          enemy: { ...b.enemy, hp: 0 }
        }) : b);

        const rewardResult = processVictoryRewards(
          { player, gameMode, settings, equipDex, battle, hard: false },
          { setPlayer, addToEquipDex, pushLog, giveExpGold }
        );

        if (rewardResult.levelUp) {
          const levelUpResult = processLevelUpDisplay(rewardResult.levelUp, rewardResult.levelUpDetails);
          applyLevelUpDisplay(battle, levelUpResult, pushLog, setBattle);
        }

        pushLog(``);
        pushLog(`「▶ 続ける」ボタンを押してください`);

        setBattle(b => b ? ({
          ...b,
          mode: "victory",
          rewards: {
            exp: rewardResult.exp,
            gold: rewardResult.gold,
            timeBonus: rewardResult.timeBonus,
            items: rewardResult.dropMessages.length > 0 ? rewardResult.dropMessages : undefined,
            levelUp: rewardResult.levelUp,
            levelUpDetails: rewardResult.levelUpDetails
          }
        }) : b);

        recordDefeated(battle.enemy.name);

        if (gameMode === 'library' && battle.onVictory) {
          battle.onVictory();
        }

        if (gameMode === 'library' && battle.enemy.boss && battle.enemy.name === currentAreaInfo.bossName) {
          processBossVictory(
            { player, gameMode, battle, currentAreaInfo, equipDex },
            { setPlayer, setEquipDex, pushLog, addToast, setShowStory, timerManager }
          );
        }
      } else {
        // Test failed - player loses
        pushLog(`❌ 不合格... ${correctAnswers}/${totalQuestions}問 正解（${requiredCorrect}問以上必要）`);
        pushLog(`${battle.enemy.name} に敗北した...`);

        setPlayer(p => ({ ...p, hp: 0 }));

        timerManager.setTimeout(() => {
          pushLog(``);
          pushLog(`戦闘に敗れた...`);
          pushLog(`「▶ 続ける」ボタンを押してください`);
          setBattle(b => b ? ({ ...b, mode: "victory" }) : b);
        }, 1000);
      }

      return; // Exit early - test mode complete
    } else {
      // Test continues - just log progress and continue to next question
      timerManager.setTimeout(() => {
        setBattle(b => b ? ({ ...b, mode: "select" }) : b);
      }, 1500);
      return;
    }
  }

  // Calculate failed attack outcome (normal battle mode)
  const context = { player, enemy: battle.enemy, quiz: battle.quiz, quizCombo, settings };
  const outcome = processAttackResult(false, pack, context, timeSpent);

  // Log all outcome messages
  outcome.messages.forEach(msg => pushLog(msg));

  // Apply MP cost for magic (still costs MP even if failed)
  if (outcome.playerMPChange) {
    setPlayer(p => ({ ...p, mp: p.mp + outcome.playerMPChange! }));
  }

  // Apply weak damage (skills only, magic does zero damage on fail)
  if (outcome.enemyDamage && outcome.enemyDamage > 0) {
    setBattle(b => b ? ({
      ...b,
      enemy: { ...b.enemy, hp: Math.max(0, b.enemy.hp - outcome.enemyDamage!) }
    }) : b);
  }

  // Show weak damage animation
  showWeakDamageAnimation(outcome.enemyDamage || 0, {
    setBattleAnim,
    timerManager,
    vibrate
  });

  // Apply combo guard or reset combo
  applyComboGuardOrReset(player, setPlayer, setQuizCombo, addToast);

  // Enemy counter-attack
  enemyStrike();
}
