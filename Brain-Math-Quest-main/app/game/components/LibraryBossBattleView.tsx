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

interface LibraryBossBattleViewProps {
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
}

/**
 * Library mode boss battle specialized UI.
 * Focuses on two primary actions: challenge (next quiz) and run away.
 * Reuses existing battle logic/handlers; rendering only differs from the generic battle view.
 */
export default function LibraryBossBattleView({
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
}: LibraryBossBattleViewProps) {
    const [detailsExpanded, setDetailsExpanded] = useState(false);

    const handleQuizComplete = (ok: boolean) => {
        const q = battle.quiz!;
        handleQuizResult(ok, q.pack, q.power);
        setBattle(b => ({ ...b!, mode: 'select', quiz: null }));
    };

    const abilities = learnedWithUltimate(
        player.lv,
        player.flags?.ultimateUnlocked,
        player.flags?.ultimateMagicUnlocked,
        player.flags?.ultimateSkillPlus || 0,
        player.flags?.ultimateMagicPlus || 0
    );

    return (
        <div className="battle" role="region" aria-label="ボス戦 (数の異世界)" aria-live="polite">
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

            <div className="plStat" role="group" aria-label="プレイヤーステータス">
                <div aria-label="プレイヤー名とレベル">{player.avatar} {player.name} Lv{player.lv}</div>
                <div aria-label="体力と魔力">HP {player.hp}/{player.maxHP} / MP {player.mp}/{player.maxMP}</div>
                <button
                    type="button"
                    onClick={() => setDetailsExpanded(!detailsExpanded)}
                    aria-expanded={detailsExpanded}
                    aria-controls="player-detail-panel"
                    style={{ cursor: 'pointer', userSelect: 'none', background: 'transparent', border: 'none', padding: 0, font: 'inherit', color: 'inherit' }}
                >
                    {detailsExpanded ? '▲ 詳細を閉じる' : '▼ 詳細を開く'}
                </button>
                {detailsExpanded && (
                    <div id="player-detail-panel" style={{ marginTop: 4 }}>
                        <div aria-label="攻撃力と防御力">ATK {effATK(player)}（{player.equip.weapon.name}） / DEF {effDEF(player)}（{player.equip.armor.name}）</div>
                        <div aria-label="経験値とゴールド">EXP {player.exp}/{nextExpFor(player.lv)} / G {player.gold}</div>
                        <div aria-label="所持品一覧">所持品：{player.items.map(i => `${i.name}×${i.qty}`).join('、') || 'なし'}</div>
                        <div aria-label="習得済みスキルと魔法">習得: 技 {abilities.skill.length} / 火 {abilities.fire.length} / 回復 {abilities.heal.length}</div>
                    </div>
                )}
            </div>

            <BattleLog log={battle.log} queueLength={battle.queue.length} />

            {battle.mode === 'quiz' && battle.quiz ? (
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
                <div
                    className="gBtns"
                    role="group"
                    aria-label="ボス戦の操作"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                        marginTop: 8,
                    }}
                >
                    <button
                        onClick={doAttack}
                        autoFocus
                        aria-label="次の問題に挑戦する"
                        aria-keyshortcuts="Enter"
                        title="次の問題に挑戦する"
                        style={{ padding: '12px 10px', minHeight: 44, fontWeight: 600 }}
                    >
                        🧠 次の問題に挑む
                    </button>
                    <button
                        className="ghost"
                        onClick={doRun}
                        aria-label="戦闘から離脱する"
                        aria-keyshortcuts="Escape"
                        title="戦闘から離脱する"
                        style={{ padding: '12px 10px', minHeight: 44 }}
                    >
                        🏃‍♂️ 逃げる
                    </button>
                </div>
            )}
        </div>
    );
}
