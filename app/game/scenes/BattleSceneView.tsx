import React, { useState } from 'react';
import { Player, BattleState } from '../../lib/gameTypes';
import { BattleAnimState } from '../types';
import { effATK, effDEF } from '../../lib/battle/stats';
import { nextExpFor } from '../../lib/battle/xp';
import { learnedWithUltimate } from '../../lib/skills';
import { Settings } from '../../lib/settings';
import EncounterView from '../../components/EncounterView';
import BattleLog from '../../components/BattleLog';
import BrainQuizPane from '../../components/BrainQuizPane';
import CommandBar from '../../components/CommandBar';

interface BattleSceneViewProps {
  battle: BattleState;
  player: Player;
  settings: Settings;
  battleAnim: BattleAnimState | null;
  enemyImageError: boolean;
  battlePanelBgStyle: React.CSSProperties;
  enemyPanelRef: React.RefObject<HTMLDivElement>;
  onLogClick: () => void;
  onEnemyImageError: () => void;
  handleQuizResult: (ok: boolean, pack: 'attack' | 'run' | 'fire' | 'heal', power: number) => void;
  setBattle: (battle: BattleState | null | ((prev: BattleState | null) => BattleState | null)) => void;
  doAttack: () => void;
  doRun: () => void;
  activateSkillOrMagic: (s: { key: string; name: string; rank: number; mp?: number; type: 'skill'|'fire'|'heal'; power: number }) => void;
  handleUseItem: (idx: number) => void;
  advanceLog: () => void;
}

/**
 * Maps battle mode to CommandBar mode
 */
function getCommandBarMode(battleMode: BattleState['mode']): 'select' | 'selectSkill' | 'selectFireList' | 'selectHealList' | 'selectItem' | 'queue' | 'victory' | 'other' {
  if (battleMode === 'select') return 'select';
  if (battleMode === 'selectSkill') return 'selectSkill';
  if (battleMode === 'selectFireList') return 'selectFireList';
  if (battleMode === 'selectHealList') return 'selectHealList';
  if (battleMode === 'selectItem') return 'selectItem';
  if (battleMode === 'queue') return 'queue';
  if (battleMode === 'victory') return 'victory';
  return 'other';
}

/**
 * Gets learned abilities for the player
 */
function getLearnedAbilities(player: Player) {
  return learnedWithUltimate(
    player.lv,
    player.flags?.ultimateUnlocked,
    player.flags?.ultimateMagicUnlocked,
    player.flags?.ultimateSkillPlus || 0,
    player.flags?.ultimateMagicPlus || 0
  );
}

export default function BattleSceneView({
  battle,
  player,
  settings,
  battleAnim,
  enemyImageError,
  battlePanelBgStyle,
  enemyPanelRef,
  onLogClick,
  onEnemyImageError,
  handleQuizResult,
  setBattle,
  doAttack,
  doRun,
  activateSkillOrMagic,
  handleUseItem,
  advanceLog
}: BattleSceneViewProps) {
  // State for collapsible player details
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Quiz result handler wrapper
  const handleQuizComplete = (ok: boolean) => {
    const q = battle.quiz!;
    handleQuizResult(ok, q.pack, q.power);
    setBattle(b => ({ ...b!, mode: "select", quiz: null }));
  };

  // Get learned abilities once
  const abilities = getLearnedAbilities(player);

  return (
    <div className="battle">
      <EncounterView
        enemy={battle.enemy}
        battleMode={battle.mode}
        battleAnim={battleAnim}
        enemyImageError={enemyImageError}
        battlePanelBgStyle={battlePanelBgStyle}
        enemyPanelRef={enemyPanelRef}
        onLogClick={onLogClick}
        onEnemyImageError={onEnemyImageError}
      />
      <div className="plStat">
        <div>{player.avatar} {player.name} Lv{player.lv}</div>
        <div>HP {player.hp}/{player.maxHP} / MP {player.mp}/{player.maxMP}</div>
        <div
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {detailsExpanded ? '▲' : '▼'} 詳細
        </div>
        {detailsExpanded && (
          <>
            <div>ATK {effATK(player)}（{player.equip.weapon.name}） / DEF {effDEF(player)}（{player.equip.armor.name}）</div>
            <div>EXP {player.exp}/{nextExpFor(player.lv)} / G {player.gold}</div>
            <div>所持品：{player.items.map(i => `${i.name}×${i.qty}`).join("、") || "なし"}</div>
          </>
        )}
      </div>

      <BattleLog log={battle.log} queueLength={battle.queue.length} />

      {battle.mode === "quiz" && battle.quiz ? (
        <BrainQuizPane
          quiz={battle.quiz.quiz}
          timeMax={battle.quiz.timeMax}
          timeStart={battle.quiz.timeStart!}
          onTimeout={() => handleQuizComplete(false)}
          onSubmit={handleQuizComplete}
          onGiveup={() => handleQuizComplete(false)}
          settings={settings}
        />
      ) : (
        <CommandBar
          mode={getCommandBarMode(battle.mode)}
          player={player}
          skills={abilities.skill}
          fireList={abilities.fire}
          healList={abilities.heal}
          onAttack={doAttack}
          onRun={doRun}
          onSelectMode={(mode) => setBattle(b => b ? { ...b, mode } : b)}
          onActivateSkillOrMagic={activateSkillOrMagic}
          onUseItem={handleUseItem}
          onLogClick={onLogClick}
          onAdvanceLog={advanceLog}
        />
      )}
    </div>
  );
}
