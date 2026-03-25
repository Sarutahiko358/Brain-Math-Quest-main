/**
 * Boss encounter utilities
 */

import { pick } from '../rng.js';

export function getKirinIntroLines(attempt, variant, enemy) {
    const base = `${enemy.emoji} ${enemy.name} が あらわれた！`;
    const a = Math.min(Math.max(1, Math.floor(attempt || 1)), 999);

    if (a === 1) {
        return [base, '「万雷轟く――我が尾は九つ、試練を越えし者のみ、その背を許す！」'];
    }

    if (a === 2) {
        return [
            base,
            variant === 'rush'
                ? '「雷鳴はなお止まず。よかろう、二度目の審判を与えよう。」'
                : '「再び来たか。雷の道は、一歩ごとに険しさを増す。」'
        ];
    }

    if (a === 3) {
        return [
            base,
            variant === 'rush'
                ? '「三たび挑むか。汝の覚悟、九つの尾で見極めよう。」'
                : '「三たび雷庭へ。ならば更なる高みを望むと知れ。」'
        ];
    }

    if (a === 4) {
        return [
            base,
            variant === 'rush'
                ? '「四度目の雷槌──いざ、天を裂く覚悟はあるか。」'
                : '「四度、天光きらめく──汝の器、いまこそ示せ。」'
        ];
    }

    const poolCommon = [
        '「何度でもよい。磨け、心技体──雷は弱き者を選ばぬ。」',
        '「幾度でも相まみえよう。我は試練の守り手なり。」',
        '「その執念、雷光の如し──よかろう、さらなる試練を。」',
        '「尾は九つ、試練に終わりなし。汝の歩みを見届けよう。」',
        '「雷は鍛える者にのみ微笑む──来るがよい。」'
    ];

    const line = pick(poolCommon);
    return [base, line || poolCommon[0]];
}

export function getBossIntroLines(enemy, isEndless, floor) {
    if (isEndless && floor) {
        return [`💀 第${floor}階層 フロアボス\n${enemy.emoji} ${enemy.name} が あらわれた！`];
    }
    return [`${enemy.emoji} ${enemy.name} が あらわれた！`];
}

export function getGuardianIntroLines(enemy) {
    return [`${enemy.emoji} ${enemy.name} が 試練を与える！`];
}

export function getEncounterIntroLines(enemy, context) {
    const { isKirin, isEndless, isBossRush, floor, kirinAttempt } = context;

    if (isKirin && kirinAttempt !== undefined) {
        const attempt = kirinAttempt;
        const variant = isBossRush ? 'rush' : 'boss';
        return getKirinIntroLines(attempt, variant, enemy);
    }

    if (isEndless) {
        return [`💀 第${floor || 1}階層\n${enemy.emoji} ${enemy.name} が あらわれた！`];
    }

    return [`${enemy.emoji} ${enemy.name} が あらわれた！`];
}
