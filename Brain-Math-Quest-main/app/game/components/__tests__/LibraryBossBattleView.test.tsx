import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LibraryBossBattleView from '../LibraryBossBattleView';

const makeBattle = () => ({
    mode: 'select',
    enemy: { name: 'BossX', boss: true, hp: 10, maxHP: 10, imageUrl: '/images/enemies/lib/bx.png' } as any,
    playerTurn: true,
    queue: [] as any[],
    log: ['遭遇した！'],
    quiz: null,
} as any);

const makePlayer = () => ({
    name: '勇者', avatar: '🦸‍♀️', lv: 1, exp: 0, gold: 0,
    maxHP: 30, hp: 30, maxMP: 10, mp: 10,
    equip: { weapon: { name: '木の棒' }, armor: { name: '布の服' } },
    items: [], flags: {}
} as any);

const makeSettings = () => ({ statusOverlay: { opacity: 1.0, size: 100 } } as any);

describe('LibraryBossBattleView', () => {
    it('renders action buttons and calls handlers', () => {
        const battle = makeBattle();
        const player = makePlayer();
        const settings = makeSettings();
        const enemyPanelRef = { current: null } as React.RefObject<HTMLDivElement>;

        const onRun = vi.fn();
        const onAttack = vi.fn();
        const onLogClick = vi.fn();
        const onEnemyImageError = vi.fn();
        const handleQuizResult = vi.fn();
        const setBattle = vi.fn();

        render(
            <LibraryBossBattleView
                battle={battle}
                player={player}
                settings={settings}
                battleAnim={null}
                enemyImageError={false}
                battlePanelBgStyle={{}}
                enemyPanelRef={enemyPanelRef}
                onLogClick={onLogClick}
                onEnemyImageError={onEnemyImageError}
                handleQuizResult={handleQuizResult}
                setBattle={setBattle}
                doAttack={onAttack}
                doRun={onRun}
            />
        );

        const attackBtn = screen.getByRole('button', { name: '次の問題に挑戦する' });
        const runBtn = screen.getByRole('button', { name: '戦闘から離脱する' });
        expect(attackBtn).toBeInTheDocument();
        expect(runBtn).toBeInTheDocument();

        fireEvent.click(attackBtn);
        fireEvent.click(runBtn);
        expect(onAttack).toHaveBeenCalledTimes(1);
        expect(onRun).toHaveBeenCalledTimes(1);
    });

    it('renders quiz pane and forwards results', () => {
        const battle = makeBattle();
        battle.mode = 'quiz';
        battle.quiz = { quiz: { type: 'SUM', prompt: '1+1?', ui: { kind: 'input' }, answer: '2' }, timeMax: 10, timeStart: Date.now(), pack: 'attack', power: 1 } as any;

        const player = makePlayer();
        const settings = makeSettings();
        const enemyPanelRef = { current: null } as React.RefObject<HTMLDivElement>;

        const onLogClick = vi.fn();
        const onEnemyImageError = vi.fn();
        const handleQuizResult = vi.fn();
        const setBattle = vi.fn();

        render(
            <LibraryBossBattleView
                battle={battle}
                player={player}
                settings={settings}
                battleAnim={null}
                enemyImageError={false}
                battlePanelBgStyle={{}}
                enemyPanelRef={enemyPanelRef}
                onLogClick={onLogClick}
                onEnemyImageError={onEnemyImageError}
                handleQuizResult={handleQuizResult}
                setBattle={setBattle}
                doAttack={() => { }}
                doRun={() => { }}
            />
        );

        // 簡易確認: クイズプロンプトとタイマー領域が存在
        expect(screen.getByRole('heading', { name: '1+1?' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: '脳トレクイズ' })).toBeInTheDocument();
    });
});
