import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * CI環境専用のVitest設定
 * 
 * CI環境ではリソースが限られているため、以下の最適化を適用：
 * - より短いタイムアウト（問題を早期発見）
 * - 少ない並列実行（メモリ節約）
 * - 早期終了（1つ失敗したら停止）
 * - 詳細なログ出力
 */
export default defineConfig({
    ...baseConfig,
    test: {
        ...baseConfig.test,

        // 明示的に forks プールを使用（ワーカースレッドの終了待ちで固まる事象を回避）
        pool: 'forks',

        // タイムアウト（短すぎると誤検知するためやや余裕）
        testTimeout: 12000,
        hookTimeout: 12000,
        teardownTimeout: 5000,

        // 並列実行を完全停止（ハング特定のため1ワーカー固定）
        poolOptions: {
            forks: {
                maxForks: 1,
                minForks: 1,
            },
        },

        // 失敗しても止めずに最後の進行位置をログで把握
        bail: 0,

        // どのテストで止まっているか可視化するため verbose
        reporters: ['verbose'],

        // ワーカーも1固定
        maxConcurrency: 1,
        minWorkers: 1,
        maxWorkers: 1,

        // 実行順を固定化（非決定性の揺れを低減）
        sequence: {
            concurrent: false,
            shuffle: false,
        },
    },
});
